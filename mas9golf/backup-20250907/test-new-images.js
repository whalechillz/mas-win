const { chromium } = require('playwright');

async function testNewImages() {
  let browser;
  try {
    console.log('🚀 새로운 이미지 테스트 시작...');
    
    // Chrome Canary 연결
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();
    
    console.log('✅ Chrome Canary 연결 완료');
    
    // 마이그레이션된 게시물 테스트
    const postUrl = 'http://localhost:3000/blog/new-year-special-premium-golf-driver-accessories-30-people';
    console.log(`\n📝 게시물 테스트: ${postUrl}`);
    
    await page.goto(postUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);
    
    // 이미지 로딩 상태 확인
    console.log('\n🖼️ 이미지 로딩 상태 확인...');
    const images = await page.$$('img');
    console.log(`📊 총 이미지 개수: ${images.length}개`);
    
    let loadedImages = 0;
    let failedImages = 0;
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt') || 'No alt text';
      
      try {
        const isLoaded = await img.evaluate((el) => {
          return el.complete && el.naturalHeight !== 0;
        });
        
        if (isLoaded) {
          loadedImages++;
          console.log(`  ✅ 이미지 ${i + 1}: ${src.substring(0, 60)}... (로딩 성공)`);
        } else {
          failedImages++;
          console.log(`  ❌ 이미지 ${i + 1}: ${src.substring(0, 60)}... (로딩 실패)`);
        }
      } catch (error) {
        failedImages++;
        console.log(`  ❌ 이미지 ${i + 1}: ${src.substring(0, 60)}... (오류: ${error.message})`);
      }
    }
    
    console.log(`\n📊 이미지 로딩 결과:`);
    console.log(`  ✅ 성공: ${loadedImages}개`);
    console.log(`  ❌ 실패: ${failedImages}개`);
    
    // 스크린샷 촬영
    console.log('\n📸 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'mas9golf/new-images-test-screenshot.png', 
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: mas9golf/new-images-test-screenshot.png');
    
    console.log('\n🎉 새로운 이미지 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    if (browser) {
      console.log('✨ 브라우저 연결 유지');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  testNewImages()
    .then(() => {
      console.log('\n🚀 새로운 이미지 테스트 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { testNewImages };
