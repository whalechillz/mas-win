const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 에러 확인 테스트 시작...\n');

    // 1. 메인 페이지 접속
    console.log('1. 메인 페이지 접속 중...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('✅ 메인 페이지 로드 완료\n');

    // 2. 예약 페이지 접속 시도
    console.log('2. 예약 페이지 접속 시도...');
    try {
      await page.goto('http://localhost:3000/booking', { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(2000);
      
      // 에러 메시지 확인
      const errorText = await page.textContent('body');
      if (errorText.includes('Failed to compile') || errorText.includes('Module not found')) {
        console.log('❌ 컴파일 에러 발견!');
        console.log('에러 내용:', errorText.substring(0, 500));
        
        // 스크린샷 저장
        await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
        console.log('📸 에러 스크린샷 저장: error-screenshot.png');
      } else {
        console.log('✅ 예약 페이지 정상 로드');
      }
    } catch (error) {
      console.log('❌ 예약 페이지 접속 실패:', error.message);
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    }

    // 3. 콘솔 에러 확인
    console.log('\n3. 콘솔 에러 확인...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('   콘솔 에러:', msg.text());
      }
    });

    // 4. 네트워크 에러 확인
    console.log('\n4. 네트워크 에러 확인...');
    const networkErrors = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`   네트워크 에러: ${response.status()} - ${response.url()}`);
      }
    });

    await page.waitForTimeout(3000);

    // 결과 요약
    console.log('\n📊 테스트 결과 요약:');
    console.log(`   - 콘솔 에러: ${consoleErrors.length}개`);
    console.log(`   - 네트워크 에러: ${networkErrors.length}개`);

    if (consoleErrors.length > 0 || networkErrors.length > 0) {
      console.log('\n❌ 에러가 발견되었습니다.');
    } else {
      console.log('\n✅ 에러가 없습니다.');
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();


