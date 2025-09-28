const { chromium } = require('playwright');

(async () => {
  console.log('🚀 이미지 프록시 직접 테스트 시작...');
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

    // 3. 페이지 새로고침하여 이미지 로드 확인
    console.log('🔄 페이지 새로고침...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log(`📊 총 이미지 프록시 요청: ${requests.length}개`);

    // 4. 첫 번째 이미지의 src 속성 확인
    console.log('🖼️ 첫 번째 이미지 src 확인...');
    const firstImage = await page.locator('img').first();
    if (await firstImage.count() > 0) {
      const src = await firstImage.getAttribute('src');
      console.log(`📄 첫 번째 이미지 src: ${src}`);
      
      if (src.includes('image-proxy')) {
        console.log('✅ 이미지 프록시 사용 중');
      } else if (src.includes('supabase.co')) {
        console.log('❌ 직접 Supabase URL 사용 중 (프록시 미사용)');
      } else if (src.includes('placeholder-image.svg')) {
        console.log('❌ 플레이스홀더 이미지 표시 중');
      } else {
        console.log('⚠️ 다른 이미지 URL 사용 중');
      }
    }

    // 5. 이미지 프록시 API 직접 테스트
    console.log('🧪 이미지 프록시 API 직접 테스트...');
    const testUrl = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/masgoo-golf-driver-golf-club-senior-golfer-golf-general-2025-1759073050357';
    const proxyUrl = `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(testUrl)}`;
    
    try {
      const response = await page.goto(proxyUrl);
      console.log(`📡 프록시 API 응답 상태: ${response.status()}`);
      
      if (response.status() === 200) {
        console.log('✅ 이미지 프록시 API 정상 작동');
      } else {
        console.log('❌ 이미지 프록시 API 오류');
      }
    } catch (error) {
      console.log('❌ 이미지 프록시 API 테스트 실패:', error.message);
    }

    // 6. 스크린샷 촬영
    console.log('📸 최종 결과 스크린샷 촬영...');
    await page.screenshot({ path: 'test-image-proxy-direct-result.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: test-image-proxy-direct-result.png');

    await browser.close();
    console.log('✅ 이미지 프록시 직접 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    await browser.close();
  }
})();
