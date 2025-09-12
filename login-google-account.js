const { chromium } = require('playwright');

async function loginGoogleAccount() {
  console.log('🔍 Google 계정 로그인 시작...');
  
  try {
    const browser = await chromium.launch({
      channel: 'chromium-tip-of-tree',
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
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
        '--enable-automation',
        '--password-store=basic'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul'
    });

    const page = await context.newPage();

    // 다이얼로그 자동 처리
    page.on('dialog', async dialog => {
      console.log('다이얼로그 감지:', dialog.message());
      await dialog.dismiss();
    });

    console.log('✅ 브라우저 실행 완료');
    console.log('🌐 Google 로그인 페이지로 이동...');

    await page.goto('https://accounts.google.com/signin');
    
    console.log('📧 이메일 입력 중...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'taksoo.kim@gmail.com');
    
    console.log('➡️ 다음 버튼 클릭...');
    await page.click('button[type="submit"]');
    
    console.log('⏳ 비밀번호 입력 페이지 대기...');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    console.log('🔒 비밀번호 입력 중...');
    await page.fill('input[type="password"]', 'Zoo100MAS!!');
    
    console.log('➡️ 로그인 버튼 클릭...');
    await page.click('button[type="submit"]');
    
    console.log('⏳ 로그인 완료 대기...');
    await page.waitForNavigation({ timeout: 30000 });
    
    console.log('✅ 로그인 완료!');
    console.log('🌐 Google Ads API Center로 이동...');
    
    await page.goto('https://ads.google.com/aw/apicenter');
    
    console.log('📊 Google Ads API Center 페이지 로드 완료');
    console.log('⏳ 브라우저 대기 중... (Ctrl+C로 종료)');

    await new Promise(() => {});

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

loginGoogleAccount();
