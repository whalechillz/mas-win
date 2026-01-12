const { chromium } = require('playwright');

async function testLoginWithStealth() {
  console.log('🔍 스텔스 모드 강화 로그인 테스트 시작...\n');
  
  let browser;
  let page;
  
  try {
    // 스텔스 모드 강화 설정
    browser = await chromium.launch({
      headless: false, // GUI 모드로 실행하여 디버깅
      channel: 'chrome', // Chrome 사용
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled', // 자동화 감지 방지
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-field-trial-config',
        '--disable-back-forward-cache',
        '--disable-ipc-flooding-protection',
        '--enable-features=NetworkService,NetworkServiceLogging',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--use-mock-keychain',
        '--disable-component-extensions-with-background-pages',
        '--mute-audio',
        '--no-default-browser-check',
        '--autoplay-policy=user-gesture-required',
        '--disable-background-networking',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-domain-reliability',
        '--disable-features=TranslateUI',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--safebrowsing-disable-auto-update',
        '--password-store=basic',
        '--disable-infobars', // "Chrome is being controlled by automated test software" 메시지 제거
        '--disable-notifications',
        '--disable-permissions-api',
        '--disable-session-crashed-bubble',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-first-run',
        '--no-default-browser-check',
        '--no-pings',
        '--no-zygote',
        '--use-gl=swiftshader',
        '--window-size=1920,1080'
      ]
    });

    // 스텔스 모드 강화 컨텍스트 설정
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      permissions: ['geolocation'],
      geolocation: { latitude: 37.5665, longitude: 126.9780 }, // 서울
      colorScheme: 'light',
      // 추가 스텔스 설정
      extraHTTPHeaders: {
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    });

    page = await context.newPage();

    // 자동화 감지 방지를 위한 스크립트 주입
    await page.addInitScript(() => {
      // navigator.webdriver 제거
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // chrome 객체 추가
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };

      // permissions API 모킹
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // plugins 배열 모킹
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // languages 배열 모킹
      Object.defineProperty(navigator, 'languages', {
        get: () => ['ko-KR', 'ko', 'en-US', 'en'],
      });

      // 플랫폼 모킹
      Object.defineProperty(navigator, 'platform', {
        get: () => 'MacIntel',
      });

      // 하드웨어 동시성 모킹
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 8,
      });

      // 디바이스 메모리 모킹
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
      });
    });

    // 콘솔 로그 수집
    const consoleLogs = [];
    const consoleErrors = [];
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.log('   ❌ 콘솔 에러:', text);
      } else {
        consoleLogs.push(text);
      }
    });

    // 네트워크 요청/응답 모니터링
    const networkRequests = [];
    const networkErrors = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });

    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`   ⚠️ 네트워크 에러: ${response.status()} ${response.url()}`);
      }
    });

    // 페이지 에러 수집
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
      console.log('   ❌ 페이지 에러:', error.message);
    });

    // 1. 로그인 페이지 접속
    console.log('📄 1. 로그인 페이지 접속 중...');
    await page.goto('http://localhost:3000/admin/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ 로그인 페이지 로드 완료');
    console.log('   URL:', page.url());
    console.log('   제목:', await page.title());

    // 페이지 로드 대기
    await page.waitForTimeout(2000);

    // 2. 로그인 폼 확인
    console.log('\n🔍 2. 로그인 폼 확인 중...');
    
    // 입력 필드 확인
    const loginInput = await page.locator('input[type="text"], input[placeholder*="아이디"], input[placeholder*="전화번호"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button:has-text("로그인"), button[type="submit"]').first();

    if (await loginInput.count() === 0) {
      throw new Error('로그인 입력 필드를 찾을 수 없습니다.');
    }
    if (await passwordInput.count() === 0) {
      throw new Error('비밀번호 입력 필드를 찾을 수 없습니다.');
    }
    if (await loginButton.count() === 0) {
      throw new Error('로그인 버튼을 찾을 수 없습니다.');
    }

    console.log('✅ 로그인 폼 요소 확인 완료');

    // 3. 로그인 정보 입력
    console.log('\n🔐 3. 로그인 정보 입력 중...');
    
    const loginId = process.env.ADMIN_LOGIN_ID || '010-3243-3099';
    const loginPassword = process.env.ADMIN_LOGIN_PASSWORD || '32433099';

    // 자연스러운 타이핑 (사람처럼)
    await loginInput.click({ delay: 100 });
    await page.waitForTimeout(300);
    await loginInput.fill('');
    await page.waitForTimeout(200);
    await loginInput.type(loginId, { delay: 100 + Math.random() * 50 });

    await page.waitForTimeout(500);

    await passwordInput.click({ delay: 100 });
    await page.waitForTimeout(300);
    await passwordInput.fill('');
    await page.waitForTimeout(200);
    await passwordInput.type(loginPassword, { delay: 100 + Math.random() * 50 });

    console.log('✅ 로그인 정보 입력 완료');

    // 4. 로그인 버튼 클릭
    console.log('\n🚀 4. 로그인 버튼 클릭 중...');
    
    await page.waitForTimeout(500);
    await loginButton.click({ delay: 200 });

    // 5. 로그인 결과 대기 및 확인
    console.log('\n⏳ 5. 로그인 결과 대기 중...');
    
    try {
      // 대시보드로 리다이렉트되거나 에러 메시지가 나타날 때까지 대기
      await Promise.race([
        page.waitForURL('**/admin/dashboard**', { timeout: 10000 }),
        page.waitForURL('**/admin/**', { timeout: 10000 }),
        page.waitForSelector('text=/로그인.*실패|에러|오류/', { timeout: 5000 }).catch(() => null)
      ]);
    } catch (e) {
      console.log('   ⚠️ URL 변경 대기 시간 초과');
    }

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('   현재 URL:', currentUrl);

    // 6. 로그인 성공 여부 확인
    console.log('\n✅ 6. 로그인 결과 확인 중...');
    
    const isLoggedIn = currentUrl.includes('/admin/dashboard') || 
                      currentUrl.includes('/admin/') && !currentUrl.includes('/login');

    if (isLoggedIn) {
      console.log('✅ 로그인 성공!');
      
      // 세션 정보 확인
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('next-auth'));
      
      if (sessionCookie) {
        console.log('   ✅ 세션 쿠키 발견:', sessionCookie.name);
      } else {
        console.log('   ⚠️ 세션 쿠키를 찾을 수 없습니다.');
      }

      // 대시보드 내용 확인
      const pageTitle = await page.title();
      console.log('   페이지 제목:', pageTitle);

      // 사용자 정보 확인
      const userInfo = await page.locator('text=/김탁수|관리자|총관리자/').first().textContent().catch(() => null);
      if (userInfo) {
        console.log('   사용자 정보:', userInfo);
      }

    } else {
      console.log('❌ 로그인 실패 또는 리다이렉트되지 않음');
      
      // 에러 메시지 확인
      const errorMessage = await page.locator('text=/실패|에러|오류|잘못/').first().textContent().catch(() => null);
      if (errorMessage) {
        console.log('   에러 메시지:', errorMessage);
      }
    }

    // 7. 에러 요약
    console.log('\n📊 7. 에러 요약:');
    console.log(`   콘솔 에러: ${consoleErrors.length}개`);
    console.log(`   네트워크 에러: ${networkErrors.length}개`);
    console.log(`   페이지 에러: ${pageErrors.length}개`);

    if (consoleErrors.length > 0) {
      console.log('\n   주요 콘솔 에러:');
      consoleErrors.slice(0, 5).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.substring(0, 100)}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log('\n   주요 네트워크 에러:');
      networkErrors.slice(0, 5).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.status} ${err.url.substring(0, 80)}`);
      });
    }

    // 8. 스크린샷 저장
    console.log('\n📸 8. 스크린샷 저장 중...');
    await page.screenshot({ 
      path: 'playwright-login-test-result.png',
      fullPage: true 
    });
    console.log('   ✅ 스크린샷 저장: playwright-login-test-result.png');

    // 브라우저를 열어둠 (수동 확인용)
    console.log('\n⏸️ 브라우저를 30초간 열어둡니다. 확인 후 자동으로 닫힙니다...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ 테스트 중 에러 발생:', error);
    
    if (page) {
      try {
        await page.screenshot({ 
          path: 'playwright-login-test-error.png',
          fullPage: true 
        });
        console.log('   에러 스크린샷 저장: playwright-login-test-error.png');
      } catch (e) {
        console.error('   스크린샷 저장 실패:', e);
      }
    }
    
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n✅ 브라우저 종료 완료');
    }
  }
}

// 실행
testLoginWithStealth()
  .then(() => {
    console.log('\n✅ 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  });
