const { chromium } = require('playwright');
const fs = require('fs').promises;

async function autoWixLogin() {
  console.log('🚀 Wix 자동 로그인 시작! (Chrome Canary 사용)');
  
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    args: [
      '--lang=ko-KR',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-extensions',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--disable-popup-blocking',
      '--disable-sync',
      '--disable-features=Translate',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-cloud-import',
      '--disable-component-update',
      '--disable-domain-reliability',
      '--disable-field-trial-config',
      '--disable-full-form-autofill-ios',
      '--disable-gesture-requirement-for-media-playback',
      '--disable-infobars',
      '--disable-logging',
      '--disable-low-end-device-mode',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-offer-upload-credits',
      '--disable-print-preview',
      '--disable-setuid-sandbox',
      '--disable-site-specific-hsts-for-testing',
      '--disable-speech-api',
      '--disable-web-security',
      '--enable-automation',
      '--enable-blink-features=IdleDetection',
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--force-color-profile=srgb',
      '--ignore-certificate-errors',
      '--log-level=3',
      '--no-default-browser-check',
      '--no-pings',
      '--no-sandbox',
      '--no-zygote',
      '--password-store=basic',
      '--use-fake-ui-for-media-stream',
      '--use-mock-keychain',
      '--max_old_space_size=4096',
      '--memory-pressure-off'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    userDataDir: '/tmp/playwright_user_data_auto_login'
  });
  
  const page = await context.newPage();
  
  // 자동화 감지 방지
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = { runtime: {}, csi: () => {}, loadTimes: () => {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko'] });
    const originalPermissions = navigator.permissions;
    Object.defineProperty(navigator, 'permissions', {
      get: () => ({
        query: (parameters) =>
          parameters.name === 'notifications'
            ? Promise.resolve({ state: Notification.permission })
            : originalPermissions.query(parameters),
      }),
    });
  });
  
  try {
    console.log('🔐 Wix 로그인 페이지로 이동...');
    await page.goto('https://www.wix.com/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    console.log('🔍 Google 로그인 버튼 찾는 중...');
    
    // Google 로그인 버튼 찾기 (여러 선택자 시도)
    const googleButtonSelectors = [
      'button[data-testid="google-login-button"]',
      'button[aria-label*="Google"]',
      'button[class*="google"]',
      'a[href*="google"]',
      'button:has-text("Google")',
      'a:has-text("Google")',
      '[data-testid*="google"]',
      '[class*="google-login"]',
      'button[type="button"]:has-text("Google")',
      'div[role="button"]:has-text("Google")'
    ];
    
    let googleButton = null;
    for (const selector of googleButtonSelectors) {
      try {
        googleButton = await page.$(selector);
        if (googleButton) {
          console.log(`✅ Google 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }
    
    if (!googleButton) {
      console.log('❌ Google 로그인 버튼을 찾을 수 없습니다. 페이지 구조를 확인합니다...');
      
      // 페이지의 모든 버튼과 링크 확인
      const allButtons = await page.$$('button, a, [role="button"]');
      console.log(`📋 발견된 버튼/링크: ${allButtons.length}개`);
      
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        try {
          const text = await allButtons[i].textContent();
          const href = await allButtons[i].getAttribute('href');
          const className = await allButtons[i].getAttribute('class');
          console.log(`   ${i + 1}. 텍스트: "${text}", href: "${href}", class: "${className}"`);
        } catch (e) {
          console.log(`   ${i + 1}. 요소 정보 가져오기 실패`);
        }
      }
      
      // 수동으로 Google 로그인 버튼 클릭 시도
      console.log('🔄 수동으로 Google 로그인 버튼 클릭 시도...');
      try {
        await page.click('button:has-text("Google"), a:has-text("Google"), [class*="google"]', { timeout: 5000 });
        console.log('✅ Google 로그인 버튼 클릭 성공!');
      } catch (e) {
        console.log('❌ Google 로그인 버튼 클릭 실패:', e.message);
        throw new Error('Google 로그인 버튼을 찾을 수 없습니다.');
      }
    } else {
      console.log('🖱️ Google 로그인 버튼 클릭...');
      await googleButton.click();
      console.log('✅ Google 로그인 버튼 클릭 성공!');
    }
    
    // Google 로그인 페이지로 이동 대기
    console.log('⏳ Google 로그인 페이지 로딩 대기...');
    await page.waitForTimeout(5000);
    
    // Google 계정 선택 또는 이메일 입력
    console.log('📧 Google 계정 입력 중...');
    
    // 이메일 입력 필드 찾기
    const emailSelectors = [
      'input[type="email"]',
      'input[name="identifier"]',
      'input[aria-label*="이메일"]',
      'input[placeholder*="이메일"]',
      'input[placeholder*="email"]',
      '#identifierId',
      'input[autocomplete="username"]'
    ];
    
    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        emailInput = await page.$(selector);
        if (emailInput) {
          console.log(`✅ 이메일 입력 필드 발견: ${selector}`);
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }
    
    if (emailInput) {
      console.log('📝 이메일 입력: taksoo.kim@gmail.com');
      await emailInput.fill('taksoo.kim@gmail.com');
      await page.waitForTimeout(1000);
      
      // 다음 버튼 클릭
      const nextButtonSelectors = [
        'button[type="submit"]',
        'button:has-text("다음")',
        'button:has-text("Next")',
        'button[aria-label*="다음"]',
        '#identifierNext',
        'button[jsname="LgbsSe"]'
      ];
      
      for (const selector of nextButtonSelectors) {
        try {
          const nextButton = await page.$(selector);
          if (nextButton) {
            console.log(`✅ 다음 버튼 발견: ${selector}`);
            await nextButton.click();
            console.log('✅ 다음 버튼 클릭 성공!');
            break;
          }
        } catch (e) {
          // 계속 시도
        }
      }
    } else {
      console.log('❌ 이메일 입력 필드를 찾을 수 없습니다.');
    }
    
    // 비밀번호 입력 대기
    console.log('⏳ 비밀번호 입력 페이지 로딩 대기...');
    await page.waitForTimeout(3000);
    
    // 비밀번호 입력 필드 찾기
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[aria-label*="비밀번호"]',
      'input[placeholder*="비밀번호"]',
      'input[placeholder*="password"]',
      '#password',
      'input[autocomplete="current-password"]'
    ];
    
    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        passwordInput = await page.$(selector);
        if (passwordInput) {
          console.log(`✅ 비밀번호 입력 필드 발견: ${selector}`);
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }
    
    if (passwordInput) {
      console.log('🔑 비밀번호 입력 중...');
      // 실제 비밀번호는 사용자가 입력해야 함
      console.log('⚠️ 비밀번호를 수동으로 입력해주세요!');
      
      // 비밀번호 입력 완료 대기 (30초)
      console.log('⏳ 비밀번호 입력 완료 대기 중... (30초)');
      await page.waitForTimeout(30000);
      
      // 로그인 완료 버튼 클릭
      const loginButtonSelectors = [
        'button[type="submit"]',
        'button:has-text("로그인")',
        'button:has-text("Sign in")',
        'button[aria-label*="로그인"]',
        '#passwordNext',
        'button[jsname="LgbsSe"]'
      ];
      
      for (const selector of loginButtonSelectors) {
        try {
          const loginButton = await page.$(selector);
          if (loginButton) {
            console.log(`✅ 로그인 버튼 발견: ${selector}`);
            await loginButton.click();
            console.log('✅ 로그인 버튼 클릭 성공!');
            break;
          }
        } catch (e) {
          // 계속 시도
        }
      }
    } else {
      console.log('❌ 비밀번호 입력 필드를 찾을 수 없습니다.');
    }
    
    // Wix 대시보드로 이동 대기
    console.log('⏳ Wix 대시보드 로딩 대기...');
    await page.waitForURL(/wix.com\/dashboard|editor.wix.com/, { timeout: 60000 });
    
    console.log('✅ Wix 로그인 완료!');
    console.log('🎉 이제 백업 스크립트를 실행할 수 있습니다!');
    
    // 브라우저를 열어둔 상태로 유지
    console.log('🌐 브라우저를 열어둡니다. 백업 스크립트를 실행하세요!');
    
    // 무한 대기 (사용자가 수동으로 종료할 때까지)
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ 자동 로그인 중 오류 발생:', error);
    await browser.close();
  }
}

autoWixLogin().catch(console.error);
