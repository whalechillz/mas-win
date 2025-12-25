const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const goodsDir = path.join(process.cwd(), 'public/main/products/goods');

console.log('🔄 굿즈 제품 이미지 PNG → WebP 변환 시작...\n');
console.log(`📁 대상 폴더: ${goodsDir}\n`);

// goods 폴더의 모든 PNG 파일 찾기
const files = fs.readdirSync(goodsDir).filter(file => 
  file.endsWith('.png') && !file.includes('.DS_Store')
);

if (files.length === 0) {
  console.log('⚠️ 변환할 PNG 파일이 없습니다.');
  process.exit(0);
}

console.log(`📸 발견된 PNG 파일: ${files.length}개\n`);

async function convertToWebP() {
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const inputPath = path.join(goodsDir, file);
    const outputFile = file.replace(/\.png$/i, '.webp');
    const outputPath = path.join(goodsDir, outputFile);

    // 이미 WebP 파일이 있으면 스킵
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  ${file} → 이미 WebP 존재 (${outputFile})`);
      skippedCount++;
      continue;
    }

    try {
      const inputStats = fs.statSync(inputPath);
      const inputSize = inputStats.size;

      await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(outputPath);

      const outputStats = fs.statSync(outputPath);
      const outputSize = outputStats.size;
      const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);

      console.log(`✅ ${file} → ${outputFile} (${reduction}% 감소)`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${file} 변환 실패:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 변환 완료:`);
  console.log(`   ✅ 성공: ${successCount}개`);
  console.log(`   ⏭️  스킵: ${skippedCount}개 (이미 WebP 존재)`);
  console.log(`   ❌ 실패: ${errorCount}개`);
  
  if (successCount > 0) {
    console.log(`\n💡 변환된 WebP 파일들이 생성되었습니다.`);
    console.log(`   이제 이미지가 정상적으로 표시됩니다.`);
  }
}

convertToWebP().catch(error => {
  console.error('❌ 변환 중 오류 발생:', error);
  process.exit(1);
});

