const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 변환할 제품 폴더들
const productFolders = [
  'public/main/products/pro3',
  'public/main/products/v3',
  'public/main/products/black-weapon',
  'public/main/products/gold-weapon4',
];

async function convertToWebP(folderPath) {
  const files = fs.readdirSync(folderPath);
  const imageFiles = files.filter(file => 
    /\.(jpg|jpeg|png)$/i.test(file) && !file.includes('.DS_Store')
  );

  console.log(`\n📁 ${folderPath} 처리 중...`);
  console.log(`   발견된 이미지: ${imageFiles.length}개`);

  for (const file of imageFiles) {
    const inputPath = path.join(folderPath, file);
    const outputPath = path.join(folderPath, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));

    // 이미 WebP 파일이 있으면 스킵
    if (fs.existsSync(outputPath)) {
      console.log(`   ⏭️  ${file} → 이미 WebP 존재`);
      continue;
    }

    try {
      await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(outputPath);
      
      const inputSize = fs.statSync(inputPath).size;
      const outputSize = fs.statSync(outputPath).size;
      const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);
      
      console.log(`   ✅ ${file} → ${path.basename(outputPath)} (${reduction}% 감소)`);
    } catch (error) {
      console.error(`   ❌ ${file} 변환 실패:`, error.message);
    }
  }
}

async function main() {
  console.log('🔄 이미지를 WebP로 변환 시작...\n');

  for (const folder of productFolders) {
    if (fs.existsSync(folder)) {
      await convertToWebP(folder);
    } else {
      console.log(`⚠️  폴더 없음: ${folder}`);
    }
  }

  console.log('\n✅ 변환 완료!');
}

main().catch(console.error);

