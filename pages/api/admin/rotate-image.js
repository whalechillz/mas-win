import { createClient } from '@supabase/supabase-js';
import { generateRotationFileName, detectLocation, extractProductName } from '../../../lib/filename-generator';
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
      rotation, 
      folderPath, 
      fileName,
      format = 'auto' // 'auto' | 'webp' | 'jpg' | 'png'
    } = req.body;
    
    if (!imageUrl || !rotation) {
      return res.status(400).json({ error: 'imageUrl과 rotation이 필요합니다' });
    }

    const validRotations = [90, -90, 180, 270];
    if (!validRotations.includes(rotation)) {
      return res.status(400).json({ error: '유효하지 않은 회전 각도입니다' });
    }

    console.log('🔄 이미지 회전 시작:', { imageUrl, rotation, format });

    // 이미지 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // 원본 메타데이터 확인 (투명도 체크)
    const originalMetadata = await sharp(imageBuffer).metadata();
    const hasAlpha = originalMetadata.hasAlpha || false;

    console.log('📊 원본 메타데이터:', {
      format: originalMetadata.format,
      hasAlpha,
      width: originalMetadata.width,
      height: originalMetadata.height
    });

    // 포맷 결정: 원본 확장자 우선 유지
    let targetFormat = format;
    if (format === 'auto') {
      // 원본 파일명에서 확장자 추출
      const originalExtension = fileName?.split('.').pop()?.toLowerCase() || originalMetadata.format || 'jpg';
      
      if (originalExtension === 'webp') {
        targetFormat = 'webp';
      } else if (originalExtension === 'png') {
        targetFormat = 'png';
      } else if (originalExtension === 'jpg' || originalExtension === 'jpeg') {
        targetFormat = 'jpg';
      } else if (originalExtension === 'gif') {
        // GIF는 첫 프레임만 회전 (애니메이션 손실)
        targetFormat = 'gif';
      } else {
        // 기타 확장자는 투명도에 따라 결정
        targetFormat = hasAlpha ? 'webp' : (originalMetadata.format || 'jpg');
      }
    }

    // 회전 적용 (EXIF orientation 자동 처리)
    let processedImage = sharp(imageBuffer).rotate(rotation);

    // 포맷 변환 (품질 90%로 상향)
    let processedBuffer;
    let contentType;
    let fileExtension;

    if (targetFormat === 'webp') {
      processedBuffer = await processedImage
        .webp({ quality: 90, effort: 4 })  // 85 → 90
        .toBuffer();
      contentType = 'image/webp';
      fileExtension = 'webp';
    } else if (targetFormat === 'png') {
      processedBuffer = await processedImage
        .png({ compressionLevel: 9, adaptiveFiltering: true })  // 무손실
        .toBuffer();
      contentType = 'image/png';
      fileExtension = 'png';
    } else if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
      // JPG는 투명도가 있으면 흰색 배경으로 변환
      if (hasAlpha) {
        processedImage = processedImage.flatten({ background: { r: 255, g: 255, b: 255 } });
      }
      processedBuffer = await processedImage
        .jpeg({ quality: 90, progressive: true, mozjpeg: true })  // 85 → 90
        .toBuffer();
      contentType = 'image/jpeg';
      fileExtension = 'jpg';
    } else if (targetFormat === 'gif') {
      // GIF는 첫 프레임만 회전 (애니메이션 손실)
      // Sharp는 GIF의 첫 프레임만 처리
      processedBuffer = await processedImage
        .gif()  // GIF 형식 유지 (압축 없음)
        .toBuffer();
      contentType = 'image/gif';
      fileExtension = 'gif';
    } else {
      // 원본 포맷 유지 (압축 없음)
      processedBuffer = await processedImage.toBuffer();
      contentType = `image/${originalMetadata.format}`;
      fileExtension = originalMetadata.format || 'jpg';
    }

    // 원본 이미지 메타데이터 조회 (위치 및 제품명 추출용)
    let location = 'uploaded';
    let productName = 'none';
    
    try {
      const { data: originalMetadata } = await supabase
        .from('image_assets')
        .select('file_path, ai_tags')
        .eq('cdn_url', imageUrl)
        .maybeSingle();

      if (originalMetadata && originalMetadata.file_path) {
        const metadataFolderPath = originalMetadata.file_path.substring(0, originalMetadata.file_path.lastIndexOf('/'));
        location = detectLocation(metadataFolderPath);
        
        // 제품명 추출
        const extractedProductName = await extractProductName(imageUrl);
        if (extractedProductName) {
          productName = extractedProductName;
        }
      }
    } catch (metadataError) {
      console.warn('⚠️ 원본 메타데이터 조회 실패 (기본값 사용):', metadataError);
    }

    // 표준 회전 파일명 생성
    const quality = targetFormat === 'webp' ? 90 : (targetFormat === 'jpg' ? 90 : undefined);
    const newFileName = await generateRotationFileName({
      location: location,
      productName: productName,
      rotation: Math.abs(rotation),
      format: targetFormat,
      quality: quality,
      creationDate: new Date(),
      extension: fileExtension
    });

    // 원본과 같은 폴더에 저장 (folderPath가 있으면 사용, 없으면 원본 메타데이터에서 추출)
    const bucket = 'blog-images';
    let finalFolderPath = folderPath;
    
    if (!finalFolderPath) {
      try {
        const { data: originalMetadata } = await supabase
          .from('image_assets')
          .select('file_path')
          .eq('cdn_url', imageUrl)
          .maybeSingle();
        
        if (originalMetadata && originalMetadata.file_path) {
          finalFolderPath = originalMetadata.file_path.substring(0, originalMetadata.file_path.lastIndexOf('/'));
        }
      } catch (error) {
        console.warn('⚠️ 폴더 경로 추출 실패:', error);
      }
    }
    
    const uploadPath = finalFolderPath ? `${finalFolderPath}/${newFileName}` : newFileName;
    
    console.log('✅ 표준 회전 파일명 생성 완료:', {
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

    // 메타데이터 추출
    const metadata = await sharp(processedBuffer).metadata();

    console.log('✅ 이미지 회전 완료:', {
      fileName: newFileName,
      width: metadata.width,
      height: metadata.height,
      size: processedBuffer.length,
      format: fileExtension
    });

    res.json({
      success: true,
      imageUrl: urlData.publicUrl,
      fileName: newFileName,
      width: metadata.width,
      height: metadata.height,
      size: processedBuffer.length,
      format: fileExtension,
      hasAlpha: metadata.hasAlpha || false
    });

  } catch (error) {
    console.error('❌ 이미지 회전 오류:', error);
    // 에러 응답을 확실히 전송 (이미 전송되지 않은 경우에만)
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: error.message || '이미지 회전 중 오류가 발생했습니다.' 
      });
    }
  }
}

