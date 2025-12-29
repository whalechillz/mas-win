export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Sharp와 Supabase 동적 import (Vercel 환경 호환성)
    const sharp = (await import('sharp')).default;
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { 
      imageUrl, 
      format, // 'webp' | 'jpg' | 'png'
      quality = 85, 
      maxWidth, 
      maxHeight, 
      folderPath, 
      fileName 
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

    // 새 파일명 생성
    const baseName = fileName?.replace(/\.[^/.]+$/, '') || `converted-${Date.now()}`;
    const newFileName = `${baseName}.${fileExtension}`;

    // 원본과 같은 폴더에 저장
    const bucket = 'blog-images';
    const uploadPath = folderPath ? `${folderPath}/${newFileName}` : newFileName;

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

