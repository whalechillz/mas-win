const { chromium } = require('playwright');

(async () => {
  console.log('🚀 콘솔 디버깅 테스트 시작...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 1. 콘솔 메시지 수집
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // 2. 공개 블로그 페이지로 이동
    console.log('📝 공개 블로그 페이지로 이동...');
    await page.goto('http://localhost:3000/blog/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 3. 콘솔 메시지 출력
    console.log('📝 콘솔 메시지:');
    consoleMessages.forEach(msg => {
      if (msg.text.includes('이미지') || msg.text.includes('featured_image') || msg.text.includes('placeholder')) {
        console.log(`  ${msg.type}: ${msg.text}`);
      }
    });

    // 4. JavaScript로 직접 확인
    console.log('🔍 JavaScript로 직접 확인...');
    const debugInfo = await page.evaluate(() => {
      const posts = window.__NEXT_DATA__?.props?.pageProps?.posts || [];
      const firstPost = posts[0];
      
      return {
        postsCount: posts.length,
        firstPostFeaturedImage: firstPost?.featured_image,
        firstPostTitle: firstPost?.title,
        allFeaturedImages: posts.map(p => p.featured_image).slice(0, 3)
      };
    });
    
    console.log('📊 디버그 정보:', debugInfo);

    // 5. 이미지 요소 직접 확인
    const imageInfo = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      return Array.from(images).slice(0, 3).map(img => ({
        src: img.src,
        alt: img.alt,
        complete: img.complete,
        naturalHeight: img.naturalHeight
      }));
    });
    
    console.log('🖼️ 이미지 정보:', imageInfo);

    await browser.close();
    console.log('✅ 콘솔 디버깅 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    await browser.close();
  }
})();
