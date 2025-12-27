const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🧪 로그아웃 테스트 시작');
    
    // 1단계: 로그인 페이지로 이동
    console.log('📋 1단계: 로그인 페이지로 이동');
    await page.goto('https://www.masgolf.co.kr/admin/login', { waitUntil: 'networkidle' });
    console.log('✅ 로그인 페이지 로드 완료, 현재 URL:', page.url());

    // 2단계: 로그인 정보 입력
    console.log('📋 2단계: 로그인 정보 입력');
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    console.log('✅ 로그인 정보 입력 완료');

    // 3단계: 로그인 버튼 클릭
    console.log('📋 3단계: 로그인 버튼 클릭');
    const submitButton = await page.locator('button[type="submit"]').first();
    await submitButton.click();
    console.log('✅ 로그인 버튼 클릭 완료');

    // 4단계: 로그인 후 대시보드로 리다이렉트 대기
    console.log('📋 4단계: 로그인 후 대시보드로 리다이렉트 대기');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    console.log('✅ 대시보드로 리다이렉트됨, 현재 URL:', page.url());

    // 5단계: 로그인 후 세션 쿠키 확인
    const cookiesAfterLogin = await context.cookies();
    const sessionCookiesAfterLogin = cookiesAfterLogin.filter(cookie =>
      cookie.name.includes('next-auth.session-token') ||
      cookie.name.includes('__Secure-next-auth.session-token') ||
      cookie.name.includes('__Host-next-auth.session-token')
    );
    console.log('📋 로그인 후 세션 쿠키:', sessionCookiesAfterLogin.map(c => c.name));
    if (sessionCookiesAfterLogin.length > 0) {
      console.log('✅ 세션 쿠키가 정상적으로 설정됨');
    } else {
      console.log('⚠️  세션 쿠키가 없음');
    }

    // 6단계: 대시보드가 로드될 때까지 대기
    console.log('📋 6단계: 대시보드 콘텐츠 로드 대기');
    // 로딩 스피너가 사라질 때까지 대기
    try {
      await page.waitForSelector('text=로딩 중...', { timeout: 2000, state: 'hidden' });
    } catch (e) {
      // 로딩 스피너가 없으면 무시
    }
    // 대시보드 콘텐츠가 나타날 때까지 대기 (여러 선택자 시도)
    try {
      await Promise.race([
        page.waitForSelector('text=메뉴 검색', { timeout: 15000 }),
        page.waitForSelector('input[placeholder*="메뉴 검색"]', { timeout: 15000 }),
        page.waitForSelector('text=허브 시스템', { timeout: 15000 }),
        page.waitForSelector('text=블로그 관리', { timeout: 15000 })
      ]);
      console.log('✅ 대시보드 콘텐츠 로드 완료');
    } catch (e) {
      console.log('⚠️  대시보드 콘텐츠 로드 대기 시간 초과, 계속 진행');
    }

    // 7단계: 사용자 프로필 드롭다운 찾기 및 클릭
    console.log('📋 7단계: 사용자 프로필 드롭다운 찾기');
    await page.waitForTimeout(2000); // 페이지 완전 로드 대기
    
    // 여러 방법으로 프로필 버튼 찾기
    let profileButton = null;
    const profileSelectors = [
      'button:has-text("관리자")',
      'button:has-text("편집자")',
      '[aria-label*="프로필"]',
      'button[class*="profile"]',
      'div[class*="profile"] button',
      'nav button:last-child'
    ];
    
    for (const selector of profileSelectors) {
      const buttons = await page.locator(selector).all();
      if (buttons.length > 0) {
        profileButton = buttons[0];
        console.log(`✅ 프로필 버튼 찾음 (${selector})`);
        break;
      }
    }
    
    if (!profileButton) {
      // 네비게이션 바의 모든 버튼 확인
      const navButtons = await page.locator('nav button, header button').all();
      console.log(`📋 네비게이션 버튼 개수: ${navButtons.length}`);
      if (navButtons.length > 0) {
        profileButton = navButtons[navButtons.length - 1]; // 마지막 버튼이 프로필일 가능성
        console.log('✅ 네비게이션의 마지막 버튼을 프로필 버튼으로 사용');
      }
    }
    
    if (profileButton) {
      await profileButton.click();
      console.log('✅ 프로필 드롭다운 클릭 완료');
      await page.waitForTimeout(1000); // 드롭다운 메뉴가 나타날 시간
    } else {
      console.log('⚠️  프로필 버튼을 찾을 수 없음, 직접 로그아웃 버튼 찾기 시도');
    }

    // 8단계: 로그아웃 버튼 찾기 및 클릭
    console.log('📋 8단계: 로그아웃 버튼 찾기 및 클릭');
    let logoutButton = null;
    const logoutSelectors = [
      'button:has-text("로그아웃")',
      'a:has-text("로그아웃")',
      '[aria-label*="로그아웃"]',
      'text=로그아웃'
    ];
    
    for (const selector of logoutSelectors) {
      const buttons = await page.locator(selector).all();
      if (buttons.length > 0) {
        logoutButton = buttons[0];
        console.log(`✅ 로그아웃 버튼 찾음 (${selector})`);
        break;
      }
    }
    
    if (!logoutButton && profileButton) {
      // 드롭다운이 열려있지 않으면 다시 클릭
      await profileButton.click();
      await page.waitForTimeout(1000);
      for (const selector of logoutSelectors) {
        const buttons = await page.locator(selector).all();
        if (buttons.length > 0) {
          logoutButton = buttons[0];
          console.log(`✅ 로그아웃 버튼 찾음 (재시도, ${selector})`);
          break;
        }
      }
    }

    if (logoutButton) {
      console.log('✅ 로그아웃 버튼 클릭 시도');
      await logoutButton.click();
      console.log('✅ 로그아웃 버튼 클릭 완료');
    } else {
      console.log('❌ 로그아웃 버튼을 찾을 수 없음');
      // 페이지의 모든 버튼과 링크 출력
      const allButtons = await page.locator('button, a').all();
      console.log('📋 페이지의 모든 버튼/링크:', await Promise.all(allButtons.slice(0, 20).map(async btn => {
        try {
          const text = await btn.textContent();
          return text?.trim() || 'N/A';
        } catch {
          return 'N/A';
        }
      })));
      throw new Error('로그아웃 버튼을 찾을 수 없습니다.');
    }

    // 9단계: 로그아웃 후 로그인 페이지로 리다이렉트 대기
    console.log('📋 9단계: 로그아웃 후 로그인 페이지로 리다이렉트 대기');
    try {
      await page.waitForURL('**/admin/login**', { timeout: 10000 });
      console.log('✅ 로그인 페이지로 리다이렉트됨, 현재 URL:', page.url());
    } catch (e) {
      console.log('⚠️  로그인 페이지로 리다이렉트되지 않음, 현재 URL:', page.url());
      // 현재 URL 확인
      const currentUrl = page.url();
      if (!currentUrl.includes('/admin/login')) {
        console.log('❌ 로그아웃 실패: 로그인 페이지로 리다이렉트되지 않음');
        throw new Error('로그아웃 후 로그인 페이지로 리다이렉트되지 않았습니다.');
      }
    }

    // 10단계: 로그아웃 후 세션 쿠키 확인
    console.log('📋 10단계: 로그아웃 후 세션 쿠키 확인');
    await page.waitForTimeout(2000); // 쿠키 삭제 대기
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
      console.log('❌ 세션 쿠키 삭제 실패:', sessionCookiesAfterLogout.map(c => `${c.name}=${c.value.substring(0, 20)}...`));
    }

    // 11단계: 로그인 페이지에서 다시 로그인 시도 (세션이 완전히 삭제되었는지 확인)
    console.log('📋 11단계: 로그인 페이지에서 다시 로그인 시도');
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });
    const loginInputs = await page.locator('input[type="text"]').count();
    const passwordInputs = await page.locator('input[type="password"]').count();
    console.log('✅ 로그인 페이지 요소 확인:', { loginInputs, passwordInputs });

    // 12단계: 대시보드로 직접 접근 시도 (세션이 없으면 로그인 페이지로 리다이렉트되어야 함)
    console.log('📋 12단계: 대시보드로 직접 접근 시도 (세션 없음 확인)');
    await page.goto('https://www.masgolf.co.kr/admin/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    console.log('✅ 최종 URL:', finalUrl);
    
    if (finalUrl.includes('/admin/login')) {
      console.log('✅ 세션이 완전히 삭제되어 대시보드 접근 시 로그인 페이지로 리다이렉트됨');
    } else if (finalUrl.includes('/admin/dashboard')) {
      console.log('❌ 세션이 여전히 유효하여 대시보드에 접근 가능 (로그아웃 실패)');
      throw new Error('로그아웃이 완전히 되지 않았습니다. 세션이 여전히 유효합니다.');
    } else {
      console.log('⚠️  예상치 못한 URL:', finalUrl);
    }

    console.log('✅ 로그아웃 테스트 완료');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.error('스택 트레이스:', error.stack);
    
    // 스크린샷 저장
    await page.screenshot({ path: 'e2e-test/logout-test-error.png', fullPage: true });
    console.log('📸 에러 스크린샷 저장: e2e-test/logout-test-error.png');
    
    // 현재 페이지 HTML 일부 저장
    const html = await page.content();
    require('fs').writeFileSync('e2e-test/logout-test-error.html', html);
    console.log('📄 에러 HTML 저장: e2e-test/logout-test-error.html');
    
    throw error;
  } finally {
    await browser.close();
  }
})();

