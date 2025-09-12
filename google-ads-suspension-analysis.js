const { chromium } = require('playwright');

async function analyzeGoogleAdsSuspension() {
  console.log('🔍 Google Ads 계정 정지 원인 분석 시작...');
  
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
    console.log('🌐 Google Ads 계정 페이지로 이동...');

    // Google Ads 계정 페이지로 이동
    await page.goto('https://ads.google.com/aw/overview');
    
    console.log('⏳ 페이지 로드 대기...');
    await page.waitForLoadState('networkidle');
    
    console.log('📊 계정 상태 스크린샷 저장...');
    await page.screenshot({ path: 'google-ads-account-status.png', fullPage: true });
    
    console.log('🔍 계정 정지 상태 분석...');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    // URL 확인
    const url = page.url();
    console.log('🌐 현재 URL:', url);
    
    // 정지 관련 텍스트 찾기
    const suspensionTexts = await page.$$eval('*', elements => {
      return elements
        .map(el => el.textContent)
        .filter(text => text && (
          text.includes('정지') || 
          text.includes('suspended') || 
          text.includes('계정') ||
          text.includes('account') ||
          text.includes('비활성') ||
          text.includes('inactive') ||
          text.includes('경고') ||
          text.includes('warning') ||
          text.includes('오류') ||
          text.includes('error')
        ))
        .slice(0, 20);
    });
    
    if (suspensionTexts.length > 0) {
      console.log('🚫 정지 관련 텍스트 발견:');
      suspensionTexts.forEach((text, index) => {
        console.log(`  ${index + 1}. ${text.trim()}`);
      });
    }
    
    // 경고 메시지 확인
    const warnings = await page.$$eval('.warning, .alert, .error, [class*="warning"], [class*="alert"], [class*="error"], [class*="suspended"], [class*="inactive"]', elements => 
      elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
    );
    
    if (warnings.length > 0) {
      console.log('⚠️ 발견된 경고/오류:');
      warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }
    
    // 계정 정보 확인
    const accountInfo = await page.$$eval('*', elements => {
      return elements
        .map(el => el.textContent)
        .filter(text => text && (
          text.includes('계정') || 
          text.includes('Account') || 
          text.includes('ID') ||
          text.includes('상태') ||
          text.includes('Status')
        ))
        .slice(0, 15);
    });
    
    if (accountInfo.length > 0) {
      console.log('📋 계정 정보:');
      accountInfo.forEach((info, index) => {
        console.log(`  ${index + 1}. ${info.trim()}`);
      });
    }
    
    // Google Ads API Center로 이동하여 API 상태 확인
    console.log('🌐 Google Ads API Center로 이동...');
    await page.goto('https://ads.google.com/aw/apicenter');
    
    console.log('⏳ API Center 페이지 로드 대기...');
    await page.waitForLoadState('networkidle');
    
    console.log('📊 API Center 스크린샷 저장...');
    await page.screenshot({ path: 'google-ads-api-center-status.png', fullPage: true });
    
    // API 관련 상태 확인
    const apiStatusTexts = await page.$$eval('*', elements => {
      return elements
        .map(el => el.textContent)
        .filter(text => text && (
          text.includes('API') || 
          text.includes('Developer') || 
          text.includes('Token') ||
          text.includes('액세스') ||
          text.includes('Access') ||
          text.includes('Standard') ||
          text.includes('일반')
        ))
        .slice(0, 15);
    });
    
    if (apiStatusTexts.length > 0) {
      console.log('🔑 API 상태 관련 텍스트:');
      apiStatusTexts.forEach((text, index) => {
        console.log(`  ${index + 1}. ${text.trim()}`);
      });
    }
    
    // 상태 정보 수집
    const analysisResult = {
      timestamp: new Date().toISOString(),
      accountPage: {
        title: title,
        url: url,
        suspensionTexts: suspensionTexts,
        warnings: warnings,
        accountInfo: accountInfo
      },
      apiCenter: {
        apiStatusTexts: apiStatusTexts
      }
    };
    
    console.log('📋 분석 결과:', JSON.stringify(analysisResult, null, 2));
    
    console.log('✅ 계정 정지 원인 분석 완료!');
    console.log('⏳ 브라우저 대기 중... (Ctrl+C로 종료)');

    await new Promise(() => {});

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('스택 트레이스:', error.stack);
  }
}

analyzeGoogleAdsSuspension();
