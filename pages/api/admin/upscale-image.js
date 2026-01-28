import { createClient } from '@supabase/supabase-js';
import { logFALAIUsage } from '../../../lib/ai-usage-logger';
import { generateStandardFileName, determineStorageLocationForAI, detectLocation, extractProductName } from '../../../lib/filename-generator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 타임아웃 설정 (최대 3분)
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ 
        success: false, 
        error: '업스케일링 요청 시간 초과 (3분 제한)' 
      });
    }
  }, 180000); // 3분

  try {
    // FAL AI API 키 확인
    if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) {
      return res.status(400).json({ 
        success: false, 
        error: 'FAL AI API 키가 설정되지 않았습니다. 환경 변수 FAL_KEY 또는 FAL_API_KEY를 확인해주세요.' 
      });
    }

    const { 
      imageUrl,
      model = 'fal', // 'fal' | 'replicate'
      scale = 2, // 2 | 4 (업스케일 배율)
      preserveExif = true // EXIF 보존 여부
    } = req.body;

    console.log('⬆️ 이미지 업스케일링 시작...');
    console.log('원본 이미지:', imageUrl);
    console.log('모델:', model);
    console.log('배율:', scale);

    const falApiKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    const startTime = Date.now();

    // 원본 이미지에서 EXIF 추출 (보존을 위해)
    let originalExif = null;
    if (preserveExif) {
      try {
        const exifResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/admin/extract-exif`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicUrl: imageUrl })
        });
        if (exifResponse.ok) {
          const exifData = await exifResponse.json();
          originalExif = exifData.meta || null;
          console.log('✅ 원본 EXIF 추출 완료:', originalExif);
        }
      } catch (exifError) {
        console.warn('⚠️ EXIF 추출 실패 (계속 진행):', exifError);
      }
    }

    let upscaledImageUrl = null;

    // Replicate 업스케일링 전용 모델 사용 (계획 문서에 따르면 Replicate에 업스케일링 전용 모델이 있음)
    // 1순위: nightmareai/real-esrgan (Real-ESRGAN 기반, 고품질) - 업스케일링 전용
    // 2순위: stability-ai/stable-diffusion-x4-upscaler (Stable Diffusion 기반) - 업스케일링 전용
    // FAL AI는 업스케일링 전용 엔드포인트가 없을 수 있으므로 Replicate의 업스케일링 전용 모델을 직접 사용
    if (model === 'replicate' || model === 'fal') {
      // Replicate 업스케일링 전용 모델 사용
      if (!process.env.REPLICATE_API_TOKEN) {
        throw new Error('Replicate API 토큰이 설정되지 않았습니다.');
      }
      
      console.log('🔄 Replicate 업스케일링 전용 모델 사용 (nightmareai/real-esrgan)...');

      const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
          input: {
            image: imageUrl,
            scale: scale
          }
        })
      });

      if (!replicateResponse.ok) {
        const errorText = await replicateResponse.text();
        throw new Error(`Replicate API 오류: ${replicateResponse.status} - ${errorText}`);
      }

      const replicateResult = await replicateResponse.json();
      
      // 폴링 로직
      let finalResult = replicateResult;
      while (finalResult.status === 'starting' || finalResult.status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${finalResult.id}`, {
          headers: {
            'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          }
        });
        
        if (!statusResponse.ok) {
          throw new Error(`Replicate 상태 확인 실패: ${statusResponse.status}`);
        }
        
        finalResult = await statusResponse.json();
      }

      if (finalResult.status !== 'succeeded' || !finalResult.output) {
        throw new Error(`Replicate 업스케일링 실패: ${finalResult.error || '알 수 없는 오류'}`);
      }

      upscaledImageUrl = finalResult.output;
      console.log('✅ Replicate 업스케일링 완료');
    }

    if (!upscaledImageUrl) {
      throw new Error('업스케일링 실패: 이미지 URL을 받지 못했습니다.');
    }

    // 업스케일된 이미지를 Supabase에 저장
    console.log('🔄 업스케일된 이미지 Supabase 저장 시작...');
    
    try {
      // 외부 이미지 URL에서 이미지 데이터 다운로드
      const imageFetchResponse = await fetch(upscaledImageUrl);
      if (!imageFetchResponse.ok) {
        throw new Error(`Failed to fetch upscaled image: ${imageFetchResponse.status}`);
      }
      
      const imageBuffer = await imageFetchResponse.arrayBuffer();
      
      // 저장 위치 결정 (원본 이미지의 폴더 위치 확인)
      const storageLocation = await determineStorageLocationForAI(imageUrl, 'replicate');
      
      let targetFolderPath;
      let location = 'ai-generated';
      let productName = 'none';
      
      if (storageLocation.location === 'current-folder' && storageLocation.folderPath) {
        // 원본과 동일한 폴더에 저장
        targetFolderPath = storageLocation.folderPath;
        
        // 위치 감지
        location = detectLocation(targetFolderPath);
        
        // 제품명 추출
        if (storageLocation.productName) {
          productName = storageLocation.productName;
        } else {
          const extractedProductName = await extractProductName(imageUrl);
          if (extractedProductName) {
            productName = extractedProductName;
          }
        }
        
        console.log('✅ 원본 폴더 위치 사용:', {
          targetFolderPath,
          location,
          productName
        });
      } else {
        // ai-generated 폴더에 저장
        const dateStr = new Date().toISOString().slice(0, 10);
        targetFolderPath = `originals/ai-generated/${dateStr}`;
        location = 'ai-generated';
        
        // 제품명 추출 시도
        const extractedProductName = await extractProductName(imageUrl);
        if (extractedProductName) {
          productName = extractedProductName;
        }
        
        console.log('✅ AI 생성 폴더 사용:', {
          targetFolderPath,
          location,
          productName
        });
      }
      
      // 표준 파일명 생성
      const fileName = await generateStandardFileName({
        location: location,
        productName: productName,
        compositionProgram: 'replicate',
        compositionFunction: 'upscale',
        creationDate: new Date(),
        extension: 'png'
      });
      
      const objectPath = `${targetFolderPath}/${fileName}`;
      
      console.log('✅ 표준 파일명 생성 완료:', {
        location,
        productName,
        fileName,
        objectPath
      });
      
      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(objectPath, imageBuffer, {
          contentType: 'image/png',
          upsert: false
        });
      
      if (uploadError) {
        throw new Error(`Supabase 업로드 실패: ${uploadError.message}`);
      }
      
      // 공개 URL 생성
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(objectPath);
      
      console.log('✅ Supabase 저장 완료:', publicUrl);

      // 원본 이미지의 메타데이터 복사 (image_assets 형식)
      let metadataToSave = {
        cdn_url: publicUrl,
        file_path: objectPath,
        file_size: imageBuffer.byteLength,
        upload_source: 'upscale', // 업스케일로 생성된 이미지 표시
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        // ⚠️ image_assets에는 다음 필드들이 없음: folder_path, date_folder, english_filename, original_filename
      };

      // 원본 이미지의 메타데이터 조회
      try {
        const { data: originalMetadata, error: metadataError } = await supabase
          .from('image_assets')
          .select('*')
          .eq('cdn_url', imageUrl)
          .maybeSingle();

        if (!metadataError && originalMetadata) {
          console.log('📋 원본 메타데이터 발견, 복사 중...', {
            originalUrl: imageUrl,
            newUrl: publicUrl
          });

          // 원본 메타데이터 복사 (image_assets 형식)
          metadataToSave = {
            ...metadataToSave,
            alt_text: originalMetadata.alt_text || null,
            title: originalMetadata.title || null,
            description: originalMetadata.description || null,
            ai_tags: originalMetadata.ai_tags || originalMetadata.tags || null,
            width: originalExif?.width ? originalExif.width * scale : (originalMetadata.width ? originalMetadata.width * scale : null),
            height: originalExif?.height ? originalExif.height * scale : (originalMetadata.height ? originalMetadata.height * scale : null),
            format: 'png',
            status: originalMetadata.status || 'active'
            // ⚠️ image_assets에는 다음 필드들이 없음: prompt, category_id, story_scene, image_type, customer_name_en, customer_initials, date_folder, original_filename
          };

          // EXIF 데이터가 있으면 추가
          if (originalExif) {
            if (originalExif.gps_lat) metadataToSave.gps_lat = originalExif.gps_lat;
            if (originalExif.gps_lng) metadataToSave.gps_lng = originalExif.gps_lng;
            if (originalExif.taken_at) metadataToSave.taken_at = originalExif.taken_at;
          } else if (originalMetadata.gps_lat || originalMetadata.gps_lng) {
            // 원본 메타데이터에서 GPS 정보 복사
            if (originalMetadata.gps_lat) metadataToSave.gps_lat = originalMetadata.gps_lat;
            if (originalMetadata.gps_lng) metadataToSave.gps_lng = originalMetadata.gps_lng;
            if (originalMetadata.taken_at) metadataToSave.taken_at = originalMetadata.taken_at;
          }
        } else {
          // 원본 메타데이터가 없으면 EXIF만 사용
          metadataToSave.width = originalExif?.width ? originalExif.width * scale : null;
          metadataToSave.height = originalExif?.height ? originalExif.height * scale : null;
          if (originalExif) {
            if (originalExif.gps_lat) metadataToSave.gps_lat = originalExif.gps_lat;
            if (originalExif.gps_lng) metadataToSave.gps_lng = originalExif.gps_lng;
            if (originalExif.taken_at) metadataToSave.taken_at = originalExif.taken_at;
          }
        }
      } catch (metadataCopyError) {
        console.warn('⚠️ 메타데이터 복사 중 오류 (계속 진행):', metadataCopyError);
        // 기본 메타데이터만 저장
        metadataToSave.width = originalExif?.width ? originalExif.width * scale : null;
        metadataToSave.height = originalExif?.height ? originalExif.height * scale : null;
      }

      // 메타데이터 저장 (upsert 사용)
      const { error: saveError } = await supabase
        .from('image_assets')
        .upsert(metadataToSave, {
          onConflict: 'cdn_url',
          ignoreDuplicates: false
        });

      if (saveError) {
        console.warn('⚠️ 메타데이터 저장 실패:', saveError);
      } else {
        console.log('✅ 메타데이터 저장 완료');
      }

      // EXIF 백필 비동기 실행
      fetch(`${req.headers.origin || 'http://localhost:3000'}/api/admin/backfill-exif`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: [objectPath] })
      }).catch(err => console.error('EXIF 백필 오류:', err));

      res.status(200).json({
        success: true,
        imageUrl: publicUrl,
        originalUrl: imageUrl,
        fileName: fileName,
        scale: scale,
        width: metadataToSave.width,
        height: metadataToSave.height,
        metadata: {
          preserved: !!originalExif,
          gps: originalExif?.gps_lat && originalExif?.gps_lng ? {
            lat: originalExif.gps_lat,
            lng: originalExif.gps_lng
          } : null
        }
      });

    } catch (saveError) {
      console.error('❌ Supabase 저장 실패:', saveError);
      // 저장 실패해도 원본 URL 반환
      res.status(200).json({
        success: true,
        imageUrl: upscaledImageUrl,
        originalUrl: imageUrl,
        fileName: null,
        scale: scale,
        warning: 'Supabase 저장 실패, 원본 URL 사용'
      });
    }

  } catch (error) {
    clearTimeout(timeout);
    console.error('❌ 이미지 업스케일링 에러:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: '이미지 업스케일링 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }
}

