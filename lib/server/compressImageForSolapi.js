/**
 * Solapi MMS 발송용 이미지 압축 함수
 * 200KB 이하로 압축하여 Solapi 제한에 맞춤
 */

export async function compressImageForSolapi(imageBuffer, maxSize = 200 * 1024) {
  const sharp = (await import('sharp')).default;
  
  // 1단계: 메타데이터 추출
  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = metadata;
  
  // 2단계: 리사이즈 (최대 1200x800, 비율 유지)
  let targetWidth = Math.min(width, 1200);
  let targetHeight = Math.min(height, 800);
  
  // 비율 유지
  if (width / height > targetWidth / targetHeight) {
    targetHeight = Math.round((targetWidth * height) / width);
  } else {
    targetWidth = Math.round((targetHeight * width) / height);
  }
  
  // 3단계: 품질 조정 (85% → 70% → 60%)
  const qualityLevels = [85, 70, 60];
  
  for (const quality of qualityLevels) {
    const compressed = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .rotate() // EXIF 회전 정보 자동 적용
      .jpeg({
        quality: quality,
        progressive: true,
        mozjpeg: true // 더 나은 JPEG 압축
      })
      .toBuffer();
    
    if (compressed.length <= maxSize) {
      console.log(`✅ 압축 성공: ${(imageBuffer.length / 1024).toFixed(2)}KB → ${(compressed.length / 1024).toFixed(2)}KB (품질: ${quality}%)`);
      return {
        buffer: compressed,
        quality: quality,
        width: targetWidth,
        height: targetHeight,
        originalWidth: width,
        originalHeight: height,
        originalSize: imageBuffer.length,
        compressedSize: compressed.length
      };
    }
  }
  
  // 4단계: 모든 품질 레벨에서 실패 시 최소 품질(60%) 사용
  const finalCompressed = await sharp(imageBuffer)
    .resize(targetWidth, targetHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .rotate()
    .jpeg({
      quality: 60,
      progressive: true,
      mozjpeg: true
    })
    .toBuffer();
  
  console.warn(`⚠️ 압축 후에도 ${(finalCompressed.length / 1024).toFixed(2)}KB (목표: ${(maxSize / 1024).toFixed(2)}KB)`);
  
  return {
    buffer: finalCompressed,
    quality: 60,
    width: targetWidth,
    height: targetHeight,
    originalWidth: width,
    originalHeight: height,
    originalSize: imageBuffer.length,
    compressedSize: finalCompressed.length,
    warning: finalCompressed.length > maxSize ? '압축 후에도 크기 제한을 초과합니다.' : null
  };
}


