const { chromium } = require('playwright');

async function testStealthMode() {
  console.log('🔍 Playwright 스텔스 모드 테스트 시작...');
  
  try {
    // Chromium Tip of Tree로 스텔스 모드 실행
    const browser = await chromium.launch({
      channel: 'chromium-tip-of-tree', // 최신 Chromium 사용
      headless: false, // GUI 모드로 실행
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled', // 자동화 감지 방지
        '--disable-extensions-except',
        '--disable-plugins-discovery',
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
        '--disable-default-apps',
        '--mute-audio',
        '--no-default-browser-check',
        '--autoplay-policy=user-gesture-required',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-domain-reliability',
        '--disable-extensions',
        '--disable-features=TranslateUI',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--safebrowsing-disable-auto-update',
        '--enable-automation',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      permissions: ['geolocation'],
      geolocation: { latitude: 37.5665, longitude: 126.9780 }, // 서울
      extraHTTPHeaders: {
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'Cache-Control': 'max-age=0'
      }
    });

    const page = await context.newPage();

    // 자동화 감지 방지를 위한 스크립트 추가
    await page.addInitScript(() => {
      // webdriver 속성 제거
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // chrome 객체 수정
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };

      // plugins 배열 수정
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // languages 속성 수정
      Object.defineProperty(navigator, 'languages', {
        get: () => ['ko-KR', 'ko', 'en-US', 'en'],
      });

      // permissions API 수정
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    console.log('✅ 스텔스 모드 브라우저 실행 완료');
    console.log('🌐 브라우저가 열렸습니다. 대기 중...');

    // Google Ads API Center로 이동
    await page.goto('https://ads.google.com/aw/apicenter');
    
    console.log('📊 Google Ads API Center 페이지 로드 완료');
    console.log('⏳ 브라우저 대기 중... (Ctrl+C로 종료)');

    // 브라우저를 열어둔 상태로 대기
    await new Promise(() => {}); // 무한 대기

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

testStealthMode();
