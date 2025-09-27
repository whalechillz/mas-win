const { chromium } = require('playwright');

async function checkBlogPostImages() {
  let browser;
  try {
    console.log('🚀 블로그 포스트 이미지 확인 시작...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 1. 블로그 포스트 페이지 접속
    console.log('📝 1. 블로그 포스트 페이지 접속...');
    await page.goto('http://localhost:3000/blog/golf-beginner-complete-guide-massgoo-driver-starting-golf-life');

    console.log('✅ 블로그 포스트 페이지 로드 완료');
    await page.waitForTimeout(3000);
    
    // 2. 페이지의 모든 이미지 찾기
    console.log('🖼️ 2. 페이지의 모든 이미지 찾기...');
    
    const images = await page.locator('img').all();
    console.log(`📊 발견된 이미지 개수: ${images.length}개`);
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      const className = await img.getAttribute('class');
      
      console.log(`\n이미지 ${i + 1}:`);
      console.log(`  - src: ${src}`);
      console.log(`  - alt: ${alt}`);
      console.log(`  - class: ${className}`);
      
      // 이미지가 실제로 로드되는지 확인
      try {
        const isVisible = await img.isVisible();
        console.log(`  - 보이는가: ${isVisible}`);
      } catch (error) {
        console.log(`  - 보이는가: 확인 불가 (${error.message})`);
      }
    }
    
    // 3. 특정 이미지 찾기 (웨지, 잔디 관련)
    console.log('\n🔍 3. 웨지/잔디 관련 이미지 찾기...');
    
    const wedgeImages = await page.locator('img[alt*="웨지"], img[alt*="wedge"], img[alt*="잔디"], img[alt*="grass"]').all();
    console.log(`📊 웨지/잔디 관련 이미지: ${wedgeImages.length}개`);
    
    for (let i = 0; i < wedgeImages.length; i++) {
      const img = wedgeImages[i];
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      console.log(`  ${i + 1}. ${alt} - ${src}`);
    }
    
    // 4. 페이지 소스에서 이미지 URL 찾기
    console.log('\n📄 4. 페이지 소스에서 이미지 URL 찾기...');
    const pageContent = await page.content();
    
    // Unsplash 이미지 URL 찾기
    const unsplashMatches = pageContent.match(/https:\/\/images\.unsplash\.com\/[^\s"']+/g);
    if (unsplashMatches) {
      console.log('Unsplash 이미지들:');
      unsplashMatches.forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`);
      });
    }
    
    // Supabase 이미지 URL 찾기
    const supabaseMatches = pageContent.match(/https:\/\/[^\/]*\.supabase\.co\/[^\s"']+/g);
    if (supabaseMatches) {
      console.log('Supabase 이미지들:');
      supabaseMatches.forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`);
      });
    }
    
    // 5. 스크린샷 촬영
    console.log('\n📸 5. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'blog-post-images-check.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: blog-post-images-check.png');
    
  } catch (error) {
    console.error('❌ 확인 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'blog-post-images-check-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: blog-post-images-check-error.png');
    }
  } finally {
    console.log('\n🔚 6. 브라우저 종료...');
    await browser.close();
    console.log('✅ 블로그 포스트 이미지 확인 완료');
  }
}

// 확인 실행
checkBlogPostImages().catch(console.error);
