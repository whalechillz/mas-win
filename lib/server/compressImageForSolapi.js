/**
 * Solapi MMS 발송용 이미지 압축 함수
 * 200KB 이하로 압축하여 Solapi 제한에 맞춤
 */

export async function compressImageForSolapi(imageBuffer, maxSize = 200 * 1024) {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (importError) {
    console.error('❌ Sharp 모듈 import 실패:', importError.message);
    throw new Error(`Sharp 모듈을 로드할 수 없습니다: ${importError.message}`);
  }
  
  // 1단계: 메타데이터 추출
  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = metadata;
  
  // 2단계: 초기 리사이즈 크기 설정 (최대 1200x800, 비율 유지)
  const calculateTargetSize = (maxW, maxH, origW, origH) => {
    let targetW = Math.min(origW, maxW);
    let targetH = Math.min(origH, maxH);
    
    // 비율 유지
    if (origW / origH > targetW / targetH) {
      targetH = Math.round((targetW * origH) / origW);
    } else {
      targetW = Math.round((targetH * origW) / origH);
    }
    
    return { targetWidth: targetW, targetHeight: targetH };
  };
  
  // 3단계: 품질 조정 (85% → 70% → 60%)
  const qualityLevels = [85, 70, 60];
  
  // 4단계: 추가 다운스케일 크기 목록 (1200x800 → 1000x700 → 800x600 → ...)
  const downscaleSizes = [
    { maxWidth: 1200, maxHeight: 800 },
    { maxWidth: 1000, maxHeight: 700 },
    { maxWidth: 800, maxHeight: 600 },
    { maxWidth: 600, maxHeight: 400 },
    { maxWidth: 400, maxHeight: 300 },
    { maxWidth: 300, maxHeight: 200 }
  ];
  
  // 각 크기별로 품질 레벨 시도
  for (const size of downscaleSizes) {
    const { targetWidth, targetHeight } = calculateTargetSize(size.maxWidth, size.maxHeight, width, height);
    
    // 각 품질 레벨 시도
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
        console.log(`✅ 압축 성공: ${(imageBuffer.length / 1024).toFixed(2)}KB → ${(compressed.length / 1024).toFixed(2)}KB (크기: ${targetWidth}x${targetHeight}, 품질: ${quality}%)`);
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
  }
  
  // 5단계: 모든 시도 실패 시 최소 크기(300x200) + 최소 품질(60%) 사용
  const finalSize = calculateTargetSize(300, 200, width, height);
  const finalCompressed = await sharp(imageBuffer)
    .resize(finalSize.targetWidth, finalSize.targetHeight, {
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
  
  console.warn(`⚠️ 압축 후에도 ${(finalCompressed.length / 1024).toFixed(2)}KB (목표: ${(maxSize / 1024).toFixed(2)}KB, 크기: ${finalSize.targetWidth}x${finalSize.targetHeight})`);
  
  return {
    buffer: finalCompressed,
    quality: 60,
    width: finalSize.targetWidth,
    height: finalSize.targetHeight,
    originalWidth: width,
    originalHeight: height,
    originalSize: imageBuffer.length,
    compressedSize: finalCompressed.length,
    warning: finalCompressed.length > maxSize ? '압축 후에도 크기 제한을 초과합니다.' : null
  };
}


