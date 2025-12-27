const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🧪 로그아웃 디버깅 테스트 시작\n');
    
    // 1단계: 로그인
    console.log('📋 1단계: 로그인');
    await page.goto('https://www.masgolf.co.kr/admin/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    console.log('✅ 로그인 완료, 현재 URL:', page.url());
    
    // 로그인 후 세션 쿠키 확인
    const cookiesAfterLogin = await context.cookies();
    const sessionCookiesAfterLogin = cookiesAfterLogin.filter(cookie =>
      cookie.name.includes('next-auth.session-token') ||
      cookie.name.includes('__Secure-next-auth.session-token') ||
      cookie.name.includes('__Host-next-auth.session-token')
    );
    console.log('📋 로그인 후 세션 쿠키:', sessionCookiesAfterLogin.map(c => `${c.name}=${c.value.substring(0, 20)}...`));
    console.log('');

    // 2단계: 대시보드 로드 대기
    console.log('📋 2단계: 대시보드 로드 대기');
    await page.waitForTimeout(3000);
    console.log('✅ 대시보드 로드 완료\n');

    // 3단계: 프로필 드롭다운 열기
    console.log('📋 3단계: 프로필 드롭다운 열기');
    const profileSelectors = [
      'button:has-text("관리자")',
      'button:has-text("편집자")',
      'button:has-text("김")',
      'button[class*="profile"]',
      'nav button:last-child'
    ];
    
    let profileButton = null;
    for (const selector of profileSelectors) {
      const buttons = await page.locator(selector).all();
      if (buttons.length > 0) {
        profileButton = buttons[0];
        console.log(`✅ 프로필 버튼 찾음: ${selector}`);
        break;
      }
    }
    
    if (!profileButton) {
      // 네비게이션 바의 모든 버튼 확인
      const navButtons = await page.locator('nav button, header button').all();
      if (navButtons.length > 0) {
        profileButton = navButtons[navButtons.length - 1];
        console.log('✅ 네비게이션의 마지막 버튼을 프로필 버튼으로 사용');
      }
    }
    
    if (profileButton) {
      await profileButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ 프로필 드롭다운 열기 완료');
    } else {
      console.log('❌ 프로필 버튼을 찾을 수 없음');
      throw new Error('프로필 버튼을 찾을 수 없습니다.');
    }
    console.log('');

    // 4단계: 로그아웃 버튼 찾기 및 클릭
    console.log('📋 4단계: 로그아웃 버튼 찾기 및 클릭');
    const logoutSelectors = [
      'button:has-text("로그아웃")',
      'a:has-text("로그아웃")',
      '[aria-label*="로그아웃"]',
      'text=로그아웃'
    ];
    
    let logoutButton = null;
    for (const selector of logoutSelectors) {
      const buttons = await page.locator(selector).all();
      if (buttons.length > 0) {
        for (const btn of buttons) {
          const isVisible = await btn.isVisible();
          if (isVisible) {
            logoutButton = btn;
            console.log(`✅ 로그아웃 버튼 찾음: ${selector}`);
            break;
          }
        }
        if (logoutButton) break;
      }
    }
    
    if (!logoutButton && profileButton) {
      // 드롭다운이 열려있지 않으면 다시 클릭
      await profileButton.click();
      await page.waitForTimeout(1000);
      for (const selector of logoutSelectors) {
        const buttons = await page.locator(selector).all();
        if (buttons.length > 0) {
          for (const btn of buttons) {
            const isVisible = await btn.isVisible();
            if (isVisible) {
              logoutButton = btn;
              console.log(`✅ 로그아웃 버튼 찾음 (재시도): ${selector}`);
              break;
            }
          }
          if (logoutButton) break;
        }
      }
    }

    if (!logoutButton) {
      console.log('❌ 로그아웃 버튼을 찾을 수 없음');
      // 드롭다운 내용 확인
      const dropdownText = await page.locator('[class*="dropdown"], [class*="menu"]').first().textContent();
      console.log('📋 드롭다운 내용:', dropdownText);
      throw new Error('로그아웃 버튼을 찾을 수 없습니다.');
    }

    // 로그아웃 전 쿠키 확인
    const cookiesBeforeLogout = await context.cookies();
    const sessionCookiesBeforeLogout = cookiesBeforeLogout.filter(cookie =>
      cookie.name.includes('next-auth.session-token') ||
      cookie.name.includes('__Secure-next-auth.session-token') ||
      cookie.name.includes('__Host-next-auth.session-token')
    );
    console.log('📋 로그아웃 전 세션 쿠키:', sessionCookiesBeforeLogout.map(c => c.name));
    console.log('');

    // 로그아웃 버튼 클릭
    console.log('📋 5단계: 로그아웃 버튼 클릭');
    const currentUrlBeforeLogout = page.url();
    console.log('📋 로그아웃 전 URL:', currentUrlBeforeLogout);
    
    // 네트워크 요청 모니터링
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/auth/logout') || request.url().includes('/api/auth/signout')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/auth/logout') || response.url().includes('/api/auth/signout')) {
        networkRequests.push({
          url: response.url(),
          status: response.status(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    await logoutButton.click();
    console.log('✅ 로그아웃 버튼 클릭 완료');
    console.log('');

    // 6단계: 로그아웃 후 상태 확인
    console.log('📋 6단계: 로그아웃 후 상태 확인');
    
    // URL 변경 대기 (최대 10초)
    try {
      await page.waitForURL('**/admin/login**', { timeout: 10000 });
      console.log('✅ 로그인 페이지로 리다이렉트됨, 현재 URL:', page.url());
    } catch (e) {
      const currentUrl = page.url();
      console.log('⚠️  로그인 페이지로 리다이렉트되지 않음');
      console.log('📋 현재 URL:', currentUrl);
      
      if (currentUrl.includes('/admin/dashboard')) {
        console.log('❌ 여전히 대시보드에 있음 - 로그아웃 실패');
      }
    }
    
    // 네트워크 요청 확인
    await page.waitForTimeout(2000);
    if (networkRequests.length > 0) {
      console.log('📋 네트워크 요청:');
      networkRequests.forEach((req, idx) => {
        console.log(`  ${idx + 1}. ${req.method || 'RESPONSE'} ${req.url} ${req.status || ''}`);
      });
    } else {
      console.log('⚠️  로그아웃 API 호출이 감지되지 않음');
    }
    console.log('');

    // 7단계: 로그아웃 후 쿠키 확인
    console.log('📋 7단계: 로그아웃 후 쿠키 확인');
    await page.waitForTimeout(2000);
    const cookiesAfterLogout = await context.cookies();
    const sessionCookiesAfterLogout = cookiesAfterLogout.filter(cookie =>
      cookie.name.includes('next-auth.session-token') ||
      cookie.name.includes('__Secure-next-auth.session-token') ||
      cookie.name.includes('__Host-next-auth.session-token')
    );
    console.log('📋 로그아웃 후 세션 쿠키:', sessionCookiesAfterLogout.map(c => c.name));
    
    if (sessionCookiesAfterLogout.length === 0) {
      console.log('✅ 세션 쿠키가 정상적으로 삭제됨');
    } else {
      console.log('❌ 세션 쿠키가 여전히 존재함:', sessionCookiesAfterLogout.map(c => `${c.name}=${c.value.substring(0, 20)}...`));
    }
    console.log('');

    // 8단계: 대시보드로 직접 접근 시도
    console.log('📋 8단계: 대시보드로 직접 접근 시도 (세션 없음 확인)');
    await page.goto('https://www.masgolf.co.kr/admin/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    console.log('📋 최종 URL:', finalUrl);
    
    if (finalUrl.includes('/admin/login')) {
      console.log('✅ 세션이 완전히 삭제되어 대시보드 접근 시 로그인 페이지로 리다이렉트됨');
    } else if (finalUrl.includes('/admin/dashboard')) {
      console.log('❌ 세션이 여전히 유효하여 대시보드에 접근 가능 (로그아웃 실패)');
    }
    console.log('');

    // 9단계: 콘솔 로그 확인
    console.log('📋 9단계: 브라우저 콘솔 로그 확인');
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('로그아웃') || text.includes('logout') || text.includes('세션') || text.includes('session')) {
        consoleMessages.push({ type: msg.type(), text });
      }
    });

    await page.waitForTimeout(2000);
    
    if (consoleMessages.length > 0) {
      console.log('📋 관련 콘솔 메시지:');
      consoleMessages.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. [${msg.type}] ${msg.text}`);
      });
    }
    console.log('');

    // 10단계: 스크린샷 저장
    console.log('📋 10단계: 스크린샷 저장');
    await page.screenshot({ path: 'e2e-test/logout-debug-test-result.png', fullPage: true });
    console.log('✅ 스크린샷 저장: e2e-test/logout-debug-test-result.png\n');

    // 11단계: 요약
    console.log('📊 테스트 결과 요약:');
    console.log(`  - 로그아웃 버튼 클릭: ✅`);
    console.log(`  - 로그인 페이지 리다이렉트: ${page.url().includes('/admin/login') ? '✅' : '❌'}`);
    console.log(`  - 세션 쿠키 삭제: ${sessionCookiesAfterLogout.length === 0 ? '✅' : '❌'}`);
    console.log(`  - 대시보드 접근 차단: ${finalUrl.includes('/admin/login') ? '✅' : '❌'}`);
    
    if (!page.url().includes('/admin/login') || sessionCookiesAfterLogout.length > 0) {
      console.log('\n❌ 로그아웃이 제대로 작동하지 않습니다.');
      console.log('   원인 분석을 위해 스크린샷과 콘솔 로그를 확인하세요.');
    } else {
      console.log('\n✅ 로그아웃이 정상적으로 작동합니다.');
    }

    console.log('\n✅ 로그아웃 디버깅 테스트 완료');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.error('스택 트레이스:', error.stack);
    
    await page.screenshot({ path: 'e2e-test/logout-debug-test-error.png', fullPage: true });
    console.log('📸 에러 스크린샷 저장: e2e-test/logout-debug-test-error.png');
    
    throw error;
  } finally {
    await browser.close();
  }
})();

