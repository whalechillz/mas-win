const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../public/main/products/goods/good-reviews');
const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.png'));

console.log(`📸 ${files.length}개의 PNG 파일을 WebP로 변환 중...`);

async function convertToWebP() {
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    try {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(inputDir, file.replace('.png', '.webp'));

      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);

      console.log(`✅ ${file} → ${file.replace('.png', '.webp')}`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${file} 변환 실패:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 변환 완료: 성공 ${successCount}개, 실패 ${errorCount}개`);
}

convertToWebP().catch(console.error);

