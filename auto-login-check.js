const { chromium } = require('playwright');

async function autoLoginAndCheck() {
  console.log('🔍 자동 로그인 및 Google Ads API Center 확인 시작...');
  
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

    // Google 로그인 페이지로 이동
    await page.goto('https://accounts.google.com/signin');
    
    console.log('⏳ 로그인 페이지 로드 대기...');
    await page.waitForLoadState('networkidle');
    
    console.log('📧 이메일 입력 중...');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', 'taksoo.kim@gmail.com');
    
    console.log('➡️ 다음 버튼 클릭...');
    await page.click('button[type="submit"]');
    
    console.log('⏳ 비밀번호 입력 페이지 대기...');
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    
    console.log('🔒 비밀번호 입력 중...');
    await page.fill('input[type="password"]', 'Zoo100MAS!!');
    
    console.log('➡️ 로그인 버튼 클릭...');
    await page.click('button[type="submit"]');
    
    console.log('⏳ 로그인 완료 대기...');
    await page.waitForNavigation({ timeout: 30000 });
    
    console.log('✅ 로그인 완료!');
    console.log('🌐 Google Ads API Center로 이동...');
    
    // Google Ads API Center로 이동
    await page.goto('https://ads.google.com/aw/apicenter');
    
    console.log('⏳ API Center 페이지 로드 대기...');
    await page.waitForLoadState('networkidle');
    
    console.log('📊 페이지 스크린샷 저장...');
    await page.screenshot({ path: 'google-ads-api-center-final.png', fullPage: true });
    
    console.log('🔍 API Center 상태 상세 확인...');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    // URL 확인
    const url = page.url();
    console.log('🌐 현재 URL:', url);
    
    // 페이지 내용 전체 확인
    const pageContent = await page.textContent('body');
    console.log('📄 페이지 내용 (처음 500자):', pageContent.substring(0, 500));
    
    // 액세스 수준 관련 텍스트 찾기
    const accessLevelTexts = await page.$$eval('*', elements => {
      return elements
        .map(el => el.textContent)
        .filter(text => text && (
          text.includes('액세스') || 
          text.includes('Access') || 
          text.includes('일반') || 
          text.includes('Standard') ||
          text.includes('General')
        ))
        .slice(0, 10);
    });
    
    if (accessLevelTexts.length > 0) {
      console.log('📈 액세스 수준 관련 텍스트:');
      accessLevelTexts.forEach((text, index) => {
        console.log(`  ${index + 1}. ${text.trim()}`);
      });
    }
    
    // 정지된 계정 관련 텍스트 찾기
    const suspendedTexts = await page.$$eval('*', elements => {
      return elements
        .map(el => el.textContent)
        .filter(text => text && (
          text.includes('정지') || 
          text.includes('suspended') || 
          text.includes('계정') ||
          text.includes('account')
        ))
        .slice(0, 10);
    });
    
    if (suspendedTexts.length > 0) {
      console.log('🚫 정지된 계정 관련 텍스트:');
      suspendedTexts.forEach((text, index) => {
        console.log(`  ${index + 1}. ${text.trim()}`);
      });
    }
    
    // Developer Token 관련 텍스트 찾기
    const tokenTexts = await page.$$eval('*', elements => {
      return elements
        .map(el => el.textContent)
        .filter(text => text && (
          text.includes('SuzbNF-IwuyiXz040NdIIQ') || 
          text.includes('Developer') || 
          text.includes('Token')
        ))
        .slice(0, 10);
    });
    
    if (tokenTexts.length > 0) {
      console.log('🔑 Developer Token 관련 텍스트:');
      tokenTexts.forEach((text, index) => {
        console.log(`  ${index + 1}. ${text.trim()}`);
      });
    }
    
    // 경고 메시지 확인
    const warnings = await page.$$eval('.warning, .alert, .error, [class*="warning"], [class*="alert"], [class*="error"]', elements => 
      elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
    );
    
    if (warnings.length > 0) {
      console.log('⚠️ 발견된 경고/오류:');
      warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }
    
    // 상태 정보 수집
    const statusInfo = {
      title: title,
      url: url,
      accessLevelTexts: accessLevelTexts,
      suspendedTexts: suspendedTexts,
      tokenTexts: tokenTexts,
      warnings: warnings,
      timestamp: new Date().toISOString()
    };
    
    console.log('📋 최종 상태 정보:', JSON.stringify(statusInfo, null, 2));
    
    console.log('✅ 상태 확인 완료!');
    console.log('⏳ 브라우저 대기 중... (Ctrl+C로 종료)');

    await new Promise(() => {});

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('스택 트레이스:', error.stack);
  }
}

autoLoginAndCheck();
