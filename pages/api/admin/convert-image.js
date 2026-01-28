import { createClient } from '@supabase/supabase-js';
import { generateConvertFileName, detectLocation, extractProductName } from '../../../lib/filename-generator';
// Sharp는 동적 import로 로드 (Vercel 환경 호환성)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Sharp만 동적 import (upload-image-supabase.js와 동일한 방식)
    const sharp = (await import('sharp')).default;
    const { 
      imageUrl, 
      format, // 'webp' | 'jpg' | 'png'
      quality = 85, 
      maxWidth, 
      maxHeight, 
      folderPath, 
      fileName,
      originalImageUrl // 원본 이미지 URL (메타데이터 복사용)
    } = req.body;
    
    if (!imageUrl || !format) {
      return res.status(400).json({ error: 'imageUrl과 format이 필요합니다' });
    }

    const validFormats = ['webp', 'jpg', 'jpeg', 'png'];
    if (!validFormats.includes(format.toLowerCase())) {
      return res.status(400).json({ error: '지원하지 않는 포맷입니다 (webp, jpg, png만 지원)' });
    }

    console.log('🎨 이미지 변환 시작:', { imageUrl, format, quality });

    // 이미지 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // 원본 메타데이터 확인
    const originalMetadata = await sharp(imageBuffer).metadata();
    const hasAlpha = originalMetadata.hasAlpha || false;

    console.log('📊 원본 메타데이터:', {
      format: originalMetadata.format,
      hasAlpha,
      width: originalMetadata.width,
      height: originalMetadata.height
    });

    // Sharp 인스턴스 생성
    let image = sharp(imageBuffer);

    // 리사이징 (선택사항)
    if (maxWidth || maxHeight) {
      image = image.resize(maxWidth || null, maxHeight || null, {
        fit: 'inside',
        withoutEnlargement: true
      });
      console.log('📐 리사이징 적용:', { maxWidth, maxHeight });
    }

    // 포맷 변환
    let processedBuffer;
    let contentType;
    let fileExtension;

    if (format === 'webp') {
      processedBuffer = await image
        .webp({ quality, effort: 4 })
        .toBuffer();
      contentType = 'image/webp';
      fileExtension = 'webp';
    } else if (format === 'png') {
      processedBuffer = await image
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();
      contentType = 'image/png';
      fileExtension = 'png';
    } else if (format === 'jpg' || format === 'jpeg') {
      // JPG는 투명도가 있으면 흰색 배경으로 변환
      if (hasAlpha) {
        image = image.flatten({ background: { r: 255, g: 255, b: 255 } });
        console.log('🔄 투명도 제거 (흰색 배경으로 변환)');
      }
      processedBuffer = await image
        .jpeg({ 
          quality, 
          progressive: true, 
          mozjpeg: true 
        })
        .toBuffer();
      contentType = 'image/jpeg';
      fileExtension = 'jpg';
    }

    // 원본 이미지 메타데이터 조회 (위치 및 제품명 추출용)
    let location = 'uploaded';
    let productName = 'none';
    
    try {
      const sourceImageUrl = originalImageUrl || imageUrl;
      const { data: originalMetadata } = await supabase
        .from('image_assets')
        .select('file_path, ai_tags')
        .eq('cdn_url', sourceImageUrl)
        .maybeSingle();

      if (originalMetadata && originalMetadata.file_path) {
        const metadataFolderPath = originalMetadata.file_path.substring(0, originalMetadata.file_path.lastIndexOf('/'));
        location = detectLocation(metadataFolderPath);
        
        // 제품명 추출
        const extractedProductName = await extractProductName(sourceImageUrl);
        if (extractedProductName) {
          productName = extractedProductName;
        }
      }
    } catch (metadataError) {
      console.warn('⚠️ 원본 메타데이터 조회 실패 (기본값 사용):', metadataError);
    }

    // 표준 변환 파일명 생성
    const newFileName = await generateConvertFileName({
      location: location,
      productName: productName,
      tool: 'sharp',
      format: format,
      quality: quality,
      creationDate: new Date(),
      extension: fileExtension
    });

    // 원본과 같은 폴더에 저장 (folderPath가 있으면 사용, 없으면 원본 메타데이터에서 추출)
    const bucket = 'blog-images';
    let finalFolderPath = folderPath;
    
    if (!finalFolderPath) {
      try {
        const sourceImageUrl = originalImageUrl || imageUrl;
        const { data: originalMetadata } = await supabase
          .from('image_assets')
          .select('file_path')
          .eq('cdn_url', sourceImageUrl)
          .maybeSingle();
        
        if (originalMetadata && originalMetadata.file_path) {
          finalFolderPath = originalMetadata.file_path.substring(0, originalMetadata.file_path.lastIndexOf('/'));
        }
      } catch (error) {
        console.warn('⚠️ 폴더 경로 추출 실패:', error);
      }
    }
    
    const uploadPath = finalFolderPath ? `${finalFolderPath}/${newFileName}` : newFileName;
    
    console.log('✅ 표준 변환 파일명 생성 완료:', {
      location,
      productName,
      newFileName,
      uploadPath
    });

    console.log('💾 Supabase Storage에 업로드 중:', uploadPath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(uploadPath, processedBuffer, {
        contentType,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase 업로드 오류:', uploadError);
      throw uploadError;
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadPath);

    // 메타데이터 추출 (메타데이터 복사 전에 필요)
    const metadata = await sharp(processedBuffer).metadata();

    // 원본 이미지의 메타데이터 복사
    if (originalImageUrl || imageUrl) {
      try {
        const sourceImageUrl = originalImageUrl || imageUrl;
        // 원본 이미지의 메타데이터 조회
        const { data: originalMetadata, error: metadataError } = await supabase
          .from('image_assets')
          .select('*')
          .eq('cdn_url', sourceImageUrl)
          .maybeSingle();

        if (!metadataError && originalMetadata) {
          console.log('📋 원본 메타데이터 발견, 복사 중...', {
            originalUrl: sourceImageUrl,
            newUrl: urlData.publicUrl
          });

          // 새 메타데이터 생성 (image_assets 형식)
          const newMetadata = {
            cdn_url: urlData.publicUrl,
            file_path: uploadPath,
            // 원본 메타데이터 복사
            alt_text: originalMetadata.alt_text || null,
            title: originalMetadata.title || null,
            description: originalMetadata.description || null,
            ai_tags: originalMetadata.ai_tags || originalMetadata.tags || null,
            file_size: processedBuffer.length,
            width: metadata.width || null,
            height: metadata.height || null,
            format: fileExtension,
            upload_source: 'conversion', // 변환으로 생성된 이미지 표시
            status: originalMetadata.status || 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
            // ⚠️ image_assets에는 다음 필드들이 없음: folder_path, prompt, category_id, story_scene, image_type, customer_name_en, customer_initials, date_folder, english_filename, original_filename
          };

          // 메타데이터 저장 (upsert 사용)
          const { error: saveError } = await supabase
            .from('image_assets')
            .upsert(newMetadata, {
              onConflict: 'cdn_url',
              ignoreDuplicates: false
            });

          if (saveError) {
            console.warn('⚠️ 메타데이터 저장 실패 (계속 진행):', saveError);
          } else {
            console.log('✅ 메타데이터 복사 완료');
          }
        } else {
          console.log('ℹ️ 원본 메타데이터를 찾을 수 없습니다:', sourceImageUrl);
        }
      } catch (metadataCopyError) {
        console.warn('⚠️ 메타데이터 복사 중 오류 (계속 진행):', metadataCopyError);
      }
    }

    const originalSize = imageBuffer.length;
    const newSize = processedBuffer.length;
    const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);

    console.log('✅ 이미지 변환 완료:', {
      fileName: newFileName,
      width: metadata.width,
      height: metadata.height,
      originalSize: `${(originalSize / 1024).toFixed(2)}KB`,
      newSize: `${(newSize / 1024).toFixed(2)}KB`,
      reduction: `${reduction}%`,
      format: fileExtension
    });

    res.json({
      success: true,
      imageUrl: urlData.publicUrl,
      fileName: newFileName,
      width: metadata.width,
      height: metadata.height,
      size: processedBuffer.length,
      originalSize: originalSize,
      reduction: parseFloat(reduction),
      format: fileExtension,
      quality,
      hasAlpha: metadata.hasAlpha || false
    });

  } catch (error) {
    console.error('❌ 이미지 변환 오류:', error);
    // 에러 응답을 확실히 전송 (이미 전송되지 않은 경우에만)
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: error.message || '이미지 변환 중 오류가 발생했습니다.' 
      });
    }
  }
}

