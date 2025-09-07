const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// 고품질 이미지 다운로드 스크립트
async function downloadHighQualityImages() {
  let browser;
  try {
    console.log('🖼️ 고품질 이미지 다운로드 시작...');
    
    // Chrome Canary 연결
    console.log('🔗 Chrome Canary 연결 중...');
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();
    
    // User-Agent 설정
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    console.log('✅ Chrome Canary 연결 완료');
    
    // 원본 게시물 URL
    const originalUrl = 'https://www.mas9golf.com/post/hot-summer-perfect-swing-royal-salute-gift-event';
    console.log(`\n📄 원본 게시물로 이동: ${originalUrl}`);
    
    await page.goto(originalUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 고품질 이미지 추출
    console.log('🔍 고품질 이미지 추출 중...');
    
    const highQualityImages = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt || '',
        width: img.naturalWidth,
        height: img.naturalHeight,
        className: img.className || ''
      })).filter(img => {
        // 고품질 이미지만 필터링
        return img.src && 
               !img.src.includes('logo') && 
               !img.src.includes('icon') &&
               !img.alt.toLowerCase().includes('logo') &&
               img.width > 400 && 
               img.height > 300 &&
               !img.src.includes('data:image') &&
               img.src.includes('wixstatic.com/media');
      })
    );
    
    console.log(`🖼️ 고품질 이미지 수: ${highQualityImages.length}개`);
    
    // 이미지 다운로드
    const imagesDir = path.join(__dirname, 'migrated-posts', 'images');
    
    for (let i = 0; i < Math.min(highQualityImages.length, 3); i++) {
      const img = highQualityImages[i];
      const imageName = `post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-${i + 1}.png`;
      const imagePath = path.join(imagesDir, imageName);
      
      console.log(`\n📸 이미지 ${i + 1} 다운로드 중...`);
      console.log(`  📁 원본: ${img.src}`);
      console.log(`  📏 크기: ${img.width}x${img.height}`);
      
      try {
        const response = await page.goto(img.src);
        const buffer = await response.body();
        await fs.writeFile(imagePath, buffer);
        
        console.log(`  ✅ 다운로드 완료: ${imageName}`);
        
      } catch (error) {
        console.log(`  ❌ 다운로드 실패: ${error.message}`);
      }
    }
    
    // public 디렉토리로 복사
    console.log('\n📁 public 디렉토리로 이미지 복사 중...');
    const publicImagesDir = path.join(__dirname, '../public/mas9golf/blog/images');
    
    const imageFiles = await fs.readdir(imagesDir);
    const newImages = imageFiles.filter(file => file.includes('gallery') && file.endsWith('.png'));
    
    for (const imageFile of newImages) {
      const srcPath = path.join(imagesDir, imageFile);
      const destPath = path.join(publicImagesDir, imageFile);
      
      try {
        await fs.copyFile(srcPath, destPath);
        console.log(`  ✅ 복사 완료: ${imageFile}`);
      } catch (error) {
        console.log(`  ❌ 복사 실패: ${imageFile} - ${error.message}`);
      }
    }
    
    console.log('\n🎉 고품질 이미지 다운로드 완료!');
    
  } catch (error) {
    console.error('❌ 이미지 다운로드 중 오류 발생:', error);
  } finally {
    if (browser) {
      console.log('✨ 브라우저 연결 유지 (수동 확인 가능)');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  downloadHighQualityImages()
    .then(() => {
      console.log('\n🚀 고품질 이미지 다운로드 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { downloadHighQualityImages };
