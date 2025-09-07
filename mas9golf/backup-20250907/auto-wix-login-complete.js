const { chromium } = require('playwright');
const fs = require('fs').promises;

async function autoWixLoginComplete() {
  console.log('🚀 Wix 완전 자동 로그인 시작! (Chrome Canary 사용)');
  
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
    userDataDir: '/tmp/playwright_user_data_complete_login'
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
      console.log('❌ Google 로그인 버튼을 찾을 수 없습니다. 수동으로 클릭 시도...');
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
    
    // 이메일 입력
    console.log('📧 이메일 입력 중...');
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
    
    // 비밀번호 입력
    console.log('🔑 비밀번호 입력 중...');
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
      console.log('🔑 비밀번호 입력: Zoo100MAS!!');
      await passwordInput.fill('Zoo100MAS!!');
      await page.waitForTimeout(1000);
      
      // 로그인 버튼 클릭
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
    
    // 로그인 성공 후 백업 스크립트 자동 실행
    console.log('🚀 백업 스크립트 자동 실행...');
    
    // 사이트 목록 수집
    console.log('📋 Wix 사이트 목록 수집...');
    await page.waitForTimeout(3000);
    
    const sites = await page.evaluate(() => {
      const siteElements = document.querySelectorAll('[data-testid="site-card"], .site-card, [class*="site-card"]');
      const sites = [];
      
      siteElements.forEach((element, index) => {
        try {
          const titleElement = element.querySelector('h3, .site-title, [class*="title"]');
          const linkElement = element.querySelector('a[href*="editor.wix.com"]');
          
          if (titleElement && linkElement) {
            sites.push({
              title: titleElement.textContent.trim(),
              editorUrl: linkElement.href,
              index: index
            });
          }
        } catch (e) {
          console.log('사이트 요소 파싱 오류:', e);
        }
      });
      
      return sites;
    });
    
    console.log(`📊 발견된 사이트: ${sites.length}개`);
    sites.forEach((site, index) => {
      console.log(`   ${index + 1}. ${site.title}`);
    });
    
    // mas9golf 사이트 찾기
    const mas9golfSite = sites.find(site => 
      site.title.toLowerCase().includes('mas9golf') || 
      site.title.toLowerCase().includes('mas golf') ||
      site.editorUrl.includes('mas9golf')
    );
    
    if (!mas9golfSite) {
      console.log('❌ mas9golf 사이트를 찾을 수 없습니다. 첫 번째 사이트를 사용합니다.');
      if (sites.length > 0) {
        mas9golfSite = sites[0];
      } else {
        throw new Error('사이트를 찾을 수 없습니다.');
      }
    }
    
    console.log(`🎯 선택된 사이트: ${mas9golfSite.title}`);
    console.log(`🔗 에디터 URL: ${mas9golfSite.editorUrl}`);
    
    // 에디터로 이동
    console.log('📝 Wix 에디터로 이동...');
    await page.goto(mas9golfSite.editorUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // 사이트 정보 수집
    console.log('⚙️ 사이트 정보 수집...');
    const siteInfo = await page.evaluate(() => {
      const info = {
        title: document.title,
        url: window.location.href,
        domain: window.location.hostname,
        collectedAt: new Date().toISOString()
      };
      
      // 메타 정보 수집
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          info[`meta_${name}`] = content;
        }
      });
      
      return info;
    });
    
    console.log('📄 사이트 정보 수집 완료');
    
    // 블로그/게시판 수집
    console.log('📝 블로그/게시판 수집...');
    
    // 블로그 섹션으로 이동
    try {
      await page.goto('https://www.mas9golf.com/blog', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      const blogPosts = await page.evaluate(() => {
        const posts = [];
        const postElements = document.querySelectorAll('article, .blog-post, [class*="post"], [class*="blog"]');
        
        postElements.forEach((element, index) => {
          try {
            const titleElement = element.querySelector('h1, h2, h3, .title, [class*="title"]');
            const linkElement = element.querySelector('a[href]');
            const dateElement = element.querySelector('.date, [class*="date"], time');
            const contentElement = element.querySelector('.content, [class*="content"], p');
            
            if (titleElement) {
              posts.push({
                title: titleElement.textContent.trim(),
                url: linkElement ? linkElement.href : '',
                date: dateElement ? dateElement.textContent.trim() : '',
                content: contentElement ? contentElement.textContent.trim().substring(0, 500) : '',
                index: index
              });
            }
          } catch (e) {
            console.log('게시글 요소 파싱 오류:', e);
          }
        });
        
        return posts;
      });
      
      console.log(`📝 발견된 게시글: ${blogPosts.length}개`);
      
    } catch (e) {
      console.log('블로그 수집 오류:', e.message);
    }
    
    // 데이터 저장
    console.log('💾 데이터 저장 중...');
    
    // 디렉토리 생성
    await fs.mkdir('mas9golf/admin', { recursive: true });
    await fs.mkdir('mas9golf/blog', { recursive: true });
    await fs.mkdir('mas9golf/settings', { recursive: true });
    
    // 사이트 정보 저장
    await fs.writeFile(
      'mas9golf/admin/site-info.json',
      JSON.stringify(siteInfo, null, 2),
      'utf8'
    );
    
    // 사이트 목록 저장
    await fs.writeFile(
      'mas9golf/admin/sites-list.json',
      JSON.stringify(sites, null, 2),
      'utf8'
    );
    
    // 블로그 게시글 저장
    if (blogPosts && blogPosts.length > 0) {
      await fs.writeFile(
        'mas9golf/blog/posts.json',
        JSON.stringify(blogPosts, null, 2),
        'utf8'
      );
    }
    
    // 요약 보고서 생성
    const summary = {
      crawledAt: new Date().toISOString(),
      totalSites: sites.length,
      selectedSite: mas9golfSite.title,
      blogPosts: blogPosts ? blogPosts.length : 0,
      siteInfo: siteInfo,
      status: 'completed'
    };
    
    await fs.writeFile(
      'mas9golf/admin/crawl-summary.json',
      JSON.stringify(summary, null, 2),
      'utf8'
    );
    
    console.log(`🎉 Wix 완전 백업 완료!`);
    console.log(`📊 결과:`);
    console.log(`   - 총 사이트: ${sites.length}개`);
    console.log(`   - 선택된 사이트: ${mas9golfSite.title}`);
    console.log(`   - 블로그 게시글: ${blogPosts ? blogPosts.length : 0}개`);
    console.log(`📁 저장 위치: mas9golf/admin/ 폴더`);
    
    // 브라우저를 열어둔 상태로 유지
    console.log('🌐 브라우저를 열어둡니다. 추가 작업이 필요하면 알려주세요!');
    
    // 무한 대기 (사용자가 수동으로 종료할 때까지)
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ 자동 로그인 및 백업 중 오류 발생:', error);
    await browser.close();
  }
}

autoWixLoginComplete().catch(console.error);
