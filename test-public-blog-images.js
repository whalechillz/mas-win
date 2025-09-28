const { chromium } = require('playwright');

(async () => {
  console.log('🚀 공개 블로그 이미지 표시 테스트 시작...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 1. 공개 블로그 페이지로 이동
    console.log('📝 공개 블로그 페이지로 이동...');
    await page.goto('http://localhost:3000/blog/');
    await page.waitForLoadState('networkidle');

    // 2. 페이지 로딩 확인
    console.log('⏳ 페이지 로딩 대기...');
    await page.waitForTimeout(3000);

    // 3. 이미지 표시 확인
    console.log('🖼️ 이미지 표시 확인...');
    
    // "No Image" 플레이스홀더 확인
    const noImageElements = await page.locator('text=No Image').count();
    console.log(`📊 "No Image" 플레이스홀더 개수: ${noImageElements}개`);
    
    // 실제 이미지 확인
    const images = await page.locator('img').count();
    console.log(`🖼️ 전체 이미지 개수: ${images}개`);
    
    // 이미지 로드 상태 확인
    const loadedImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      let loaded = 0;
      let failed = 0;
      
      imgs.forEach(img => {
        if (img.complete && img.naturalHeight !== 0) {
          loaded++;
        } else if (img.src.includes('placeholder-image.svg')) {
          failed++;
        }
      });
      
      return { loaded, failed };
    });
    
    console.log(`✅ 로드된 이미지: ${loadedImages.loaded}개`);
    console.log(`❌ 로드 실패한 이미지: ${loadedImages.failed}개`);

    // 4. 첫 번째 게시물 클릭하여 개별 포스트 페이지 확인
    console.log('🔗 첫 번째 게시물 클릭...');
    const firstPost = await page.locator('article').first();
    if (await firstPost.count() > 0) {
      await firstPost.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // 개별 포스트 페이지에서 이미지 확인
      const postImages = await page.locator('img').count();
      console.log(`📄 개별 포스트 페이지 이미지 개수: ${postImages}개`);
      
      // 대표 이미지 확인
      const featuredImage = await page.locator('img').first();
      if (await featuredImage.count() > 0) {
        const src = await featuredImage.getAttribute('src');
        console.log(`🖼️ 대표 이미지 URL: ${src}`);
        
        if (src.includes('image-proxy')) {
          console.log('✅ 이미지 프록시 사용 중');
        } else if (src.includes('placeholder-image.svg')) {
          console.log('❌ 플레이스홀더 이미지 표시 중');
        } else {
          console.log('⚠️ 직접 이미지 URL 사용 중');
        }
      }
    }

    // 5. 스크린샷 촬영
    console.log('📸 최종 결과 스크린샷 촬영...');
    await page.screenshot({ path: 'test-public-blog-images-result.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: test-public-blog-images-result.png');

    await browser.close();
    console.log('✅ 공개 블로그 이미지 표시 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    await browser.close();
  }
})();
