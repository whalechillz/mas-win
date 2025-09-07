const { chromium } = require('playwright');

// 이미지 표시 테스트 스크립트
async function testImageDisplay() {
  let browser;
  try {
    console.log('🧪 이미지 표시 테스트 시작...');
    
    // Chrome Canary 연결
    console.log('🔗 Chrome Canary 연결 중...');
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();
    
    console.log('✅ Chrome Canary 연결 완료');
    
    // 블로그 게시물 페이지로 이동
    const blogUrl = 'http://localhost:3000/blog/hot-summer-perfect-swing-royal-salute-gift-event';
    console.log(`\n📄 블로그 게시물 페이지로 이동: ${blogUrl}`);
    
    await page.goto(blogUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📋 페이지 제목: ${title}`);
    
    // 이미지 요소들 확인
    console.log('\n🖼️ 이미지 요소 확인 중...');
    
    const images = await page.$$('img');
    console.log(`📊 발견된 이미지 요소: ${images.length}개`);
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      const naturalWidth = await img.evaluate(el => el.naturalWidth);
      const naturalHeight = await img.evaluate(el => el.naturalHeight);
      
      console.log(`  🖼️ 이미지 ${i + 1}:`);
      console.log(`    📁 경로: ${src}`);
      console.log(`    📝 Alt: ${alt || '없음'}`);
      console.log(`    📏 크기: ${naturalWidth}x${naturalHeight}`);
      
      if (naturalWidth === 0 || naturalHeight === 0) {
        console.log(`    ❌ 이미지 로드 실패`);
      } else {
        console.log(`    ✅ 이미지 로드 성공`);
      }
    }
    
    // 특정 이미지 경로들 직접 테스트
    console.log('\n🔍 특정 이미지 경로 테스트...');
    
    const imagePaths = [
      '/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-featured.png',
      '/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-1.png',
      '/mas9golf/blog/images/post-1-hot-summer-perfect-swing-royal-salute-gift-event-gallery-2.png'
    ];
    
    for (const imagePath of imagePaths) {
      const fullUrl = `http://localhost:3000${imagePath}`;
      console.log(`  🔗 테스트: ${fullUrl}`);
      
      try {
        const response = await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 10000 });
        const status = response.status();
        
        if (status === 200) {
          console.log(`    ✅ 접근 가능 (${status})`);
        } else {
          console.log(`    ❌ 접근 실패 (${status})`);
        }
      } catch (error) {
        console.log(`    ❌ 오류: ${error.message}`);
      }
    }
    
    // 페이지 스크린샷
    console.log('\n📸 페이지 스크린샷 저장...');
    await page.screenshot({ 
      path: 'mas9golf/blog-image-test-result.png',
      fullPage: true 
    });
    console.log('  ✅ 스크린샷 저장: mas9golf/blog-image-test-result.png');
    
    console.log('\n🎉 이미지 표시 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    if (browser) {
      console.log('✨ 브라우저 연결 유지 (수동 확인 가능)');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  testImageDisplay()
    .then(() => {
      console.log('\n🚀 이미지 표시 테스트 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { testImageDisplay };
