const { chromium } = require('playwright');

async function checkGoogleAdsStatus() {
  console.log('🔍 Google Ads API Center 상태 확인 시작...');
  
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
    console.log('🌐 Google Ads API Center로 이동...');

    await page.goto('https://ads.google.com/aw/apicenter');
    
    console.log('⏳ 페이지 로드 대기...');
    await page.waitForLoadState('networkidle');
    
    console.log('📊 페이지 스크린샷 저장...');
    await page.screenshot({ path: 'google-ads-api-center.png', fullPage: true });
    
    console.log('🔍 API Center 상태 확인...');
    
    // 액세스 수준 확인
    try {
      const accessLevel = await page.textContent('[data-testid="access-level"]');
      console.log('📈 액세스 수준:', accessLevel);
    } catch (e) {
      console.log('⚠️ 액세스 수준 요소를 찾을 수 없습니다.');
    }
    
    // 계정 정지 상태 확인
    try {
      const suspendedAccounts = await page.textContent('[data-testid="suspended-accounts"]');
      console.log('🚫 정지된 계정:', suspendedAccounts);
    } catch (e) {
      console.log('⚠️ 정지된 계정 요소를 찾을 수 없습니다.');
    }
    
    // Developer Token 확인
    try {
      const developerToken = await page.textContent('[data-testid="developer-token"]');
      console.log('🔑 Developer Token:', developerToken);
    } catch (e) {
      console.log('⚠️ Developer Token 요소를 찾을 수 없습니다.');
    }
    
    // 페이지 내용 전체 확인
    console.log('📄 페이지 제목:', await page.title());
    
    // 경고 메시지 확인
    const warnings = await page.$$eval('.warning, .alert, .error', elements => 
      elements.map(el => el.textContent.trim())
    );
    
    if (warnings.length > 0) {
      console.log('⚠️ 발견된 경고/오류:');
      warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }
    
    // 상태 정보 수집
    const statusInfo = {
      title: await page.title(),
      url: page.url(),
      warnings: warnings,
      timestamp: new Date().toISOString()
    };
    
    console.log('📋 상태 정보:', JSON.stringify(statusInfo, null, 2));
    
    console.log('✅ 상태 확인 완료!');
    console.log('⏳ 브라우저 대기 중... (Ctrl+C로 종료)');

    await new Promise(() => {});

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

checkGoogleAdsStatus();
