const { chromium } = require('playwright');

(async () => {
  console.log('🚀 강제 새로고침 테스트 시작...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 1. 공개 블로그 페이지로 이동
    console.log('📝 공개 블로그 페이지로 이동...');
    await page.goto('http://localhost:3000/blog/');
    await page.waitForLoadState('networkidle');

    // 2. 네트워크 요청 모니터링 시작
    console.log('🔍 네트워크 요청 모니터링...');
    
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('image-proxy')) {
        console.log('🖼️ 이미지 프록시 요청:', request.url());
        requests.push(request.url());
      }
    });

    // 3. 강제 새로고침 (캐시 무시)
    console.log('🔄 강제 새로고침 (캐시 무시)...');
    await page.goto('http://localhost:3000/blog/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    console.log(`📊 총 이미지 프록시 요청: ${requests.length}개`);

    // 4. 모든 이미지의 src 속성 확인
    console.log('🖼️ 모든 이미지 src 확인...');
    const images = await page.locator('img').all();
    console.log(`📄 총 이미지 개수: ${images.length}개`);
    
    for (let i = 0; i < Math.min(3, images.length); i++) {
      const src = await images[i].getAttribute('src');
      console.log(`📄 이미지 ${i + 1} src: ${src}`);
      
      if (src.includes('image-proxy')) {
        console.log('✅ 이미지 프록시 사용 중');
      } else if (src.includes('placeholder-image.svg')) {
        console.log('❌ 플레이스홀더 이미지 표시 중');
      } else {
        console.log('⚠️ 직접 이미지 URL 사용 중');
      }
    }

    // 5. API 응답 확인
    console.log('🔍 API 응답 확인...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/blog/posts/?page=1&limit=3');
        const data = await response.json();
        return data.posts[0].featured_image;
      } catch (error) {
        return error.message;
      }
    });
    console.log(`📡 API 응답 featured_image: ${apiResponse}`);

    // 6. 스크린샷 촬영
    console.log('📸 최종 결과 스크린샷 촬영...');
    await page.screenshot({ path: 'test-force-refresh-result.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: test-force-refresh-result.png');

    await browser.close();
    console.log('✅ 강제 새로고침 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    await browser.close();
  }
})();
