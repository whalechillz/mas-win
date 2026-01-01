const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🧪 로그아웃 및 세션 테스트 시작\n');

  try {
    // 1단계: 로그인 페이지 접속
    console.log('📋 1단계: 로그인 페이지 접속');
    await page.goto('https://www.masgolf.co.kr/admin/login', { waitUntil: 'networkidle' });
    console.log('✅ 현재 URL:', page.url());
    console.log('✅ 로그인 페이지 로드 완료\n');

    // 2단계: 로그인
    console.log('📋 2단계: 로그인 시도');
    await page.fill('input[name="login"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 후 리다이렉트 대기
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });
    console.log('✅ 로그인 성공, 현재 URL:', page.url());
    
    // 쿠키 확인
    const cookies = await context.cookies();
    const sessionCookies = cookies.filter(c => c.name.includes('session-token'));
    console.log('✅ 세션 쿠키:', sessionCookies.map(c => c.name));
    console.log('');

    // 3단계: 대시보드에서 세션 확인
    console.log('📋 3단계: 대시보드에서 세션 상태 확인');
    await page.waitForTimeout(2000);
    
    // 사용자 정보 표시 확인
    const userInfo = await page.locator('text=관리자').first();
    if (await userInfo.isVisible()) {
      console.log('✅ 사용자 정보 표시됨');
    } else {
      console.log('⚠️  사용자 정보가 표시되지 않음');
    }
    console.log('');

    // 4단계: 계정 관리 페이지로 이동
    console.log('📋 4단계: 계정 관리 페이지로 이동');
    await page.goto('https://www.masgolf.co.kr/admin/team', { waitUntil: 'networkidle' });
    console.log('✅ 현재 URL:', page.url());
    
    // 내 프로필 탭 확인
    await page.waitForTimeout(3000);
    
    // 세션 정보 로딩 상태 확인
    const loadingText = await page.locator('text=세션 정보를 불러오는 중...');
    const profileContent = await page.locator('text=이름').first();
    
    if (await loadingText.isVisible()) {
      console.log('⚠️  "세션 정보를 불러오는 중..." 메시지가 계속 표시됨');
    } else if (await profileContent.isVisible()) {
      console.log('✅ 프로필 정보가 정상적으로 표시됨');
    } else {
      console.log('⚠️  프로필 정보가 표시되지 않음');
    }
    console.log('');

    // 5단계: 로그아웃 버튼 클릭
    console.log('📋 5단계: 로그아웃 버튼 클릭');
    
    // 로그아웃 버튼 찾기
    const logoutButton = await page.locator('button:has-text("로그아웃")').first();
    
    if (await logoutButton.isVisible()) {
      console.log('✅ 로그아웃 버튼 발견');
      
      // 로그아웃 전 쿠키 확인
      const cookiesBefore = await context.cookies();
      const sessionCookiesBefore = cookiesBefore.filter(c => c.name.includes('session-token'));
      console.log('📋 로그아웃 전 세션 쿠키:', sessionCookiesBefore.map(c => c.name));
      
      // 로그아웃 버튼 클릭
      await logoutButton.click();
      console.log('✅ 로그아웃 버튼 클릭 완료');
      
      // 리다이렉트 대기 (최대 10초)
      try {
        await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
        console.log('✅ 로그인 페이지로 리다이렉트됨, 현재 URL:', page.url());
        
        // 로그아웃 후 쿠키 확인
        await page.waitForTimeout(2000);
        const cookiesAfter = await context.cookies();
        const sessionCookiesAfter = cookiesAfter.filter(c => c.name.includes('session-token'));
        console.log('📋 로그아웃 후 세션 쿠키:', sessionCookiesAfter.map(c => c.name));
        
        if (sessionCookiesAfter.length === 0) {
          console.log('✅ 세션 쿠키가 정상적으로 삭제됨');
        } else {
          console.log('⚠️  세션 쿠키가 여전히 존재함:', sessionCookiesAfter.map(c => c.name));
        }
        
        // 6단계: 다시 로그인 시도 (자동 로그인 확인)
        console.log('\n📋 6단계: 자동 로그인 여부 확인');
        await page.waitForTimeout(2000);
        
        // 로그인 페이지에서 자동으로 대시보드로 리다이렉트되는지 확인
        const currentUrl = page.url();
        console.log('📋 현재 URL:', currentUrl);
        
        if (currentUrl.includes('/admin/dashboard')) {
          console.log('⚠️  자동으로 로그인되어 대시보드로 리다이렉트됨 (세션 삭제 실패)');
        } else if (currentUrl.includes('/admin/login')) {
          console.log('✅ 로그인 페이지에 정상적으로 머물러 있음 (세션 삭제 성공)');
        }
        
      } catch (error) {
        console.log('⚠️  로그인 페이지로 리다이렉트되지 않음:', error.message);
        console.log('📋 현재 URL:', page.url());
      }
      
    } else {
      console.log('⚠️  로그아웃 버튼을 찾을 수 없음');
    }
    
    // 7단계: /admin 경로 확인
    console.log('\n📋 7단계: /admin 경로 동작 확인');
    await page.goto('https://www.masgolf.co.kr/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✅ /admin 접속 후 URL:', page.url());
    
    if (page.url().includes('/admin/login')) {
      console.log('✅ /admin → /admin/login 리다이렉트 정상');
    } else if (page.url().includes('/admin/dashboard')) {
      console.log('✅ /admin → /admin/dashboard 리다이렉트 정상 (세션 있음)');
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    console.log('\n📋 테스트 완료');
    await page.screenshot({ path: 'e2e-test/logout-session-test-result.png', fullPage: true });
    await browser.close();
  }
})();









