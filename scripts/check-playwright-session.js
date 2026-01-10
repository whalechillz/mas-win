const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Playwright 브라우저 세션 상태 확인\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📋 1단계: 로그인 페이지 접속');
    await page.goto('http://localhost:3000/admin/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log(`   ✅ 현재 URL: ${page.url()}\n`);
    
    console.log('📋 2단계: 로그인 정보 입력');
    await page.fill('input[name="login"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    console.log('   ✅ 로그인 정보 입력 완료\n');
    
    console.log('📋 3단계: 로그인 버튼 클릭');
    await page.click('button[type="submit"]');
    console.log('   ✅ 로그인 버튼 클릭 완료\n');
    
    console.log('📋 4단계: 로그인 후 리다이렉트 대기');
    try {
      await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });
      console.log(`   ✅ 대시보드로 리다이렉트됨: ${page.url()}\n`);
    } catch (e) {
      console.log(`   ⚠️ 대시보드 리다이렉트 실패, 현재 URL: ${page.url()}\n`);
    }
    
    // 로그인 후 쿠키 확인
    await page.waitForTimeout(3000);
    const cookiesAfterLogin = await context.cookies();
    console.log(`📋 5단계: 로그인 후 쿠키 확인`);
    console.log(`   전체 쿠키 개수: ${cookiesAfterLogin.length}개`);
    const sessionCookies = cookiesAfterLogin.filter(c => 
      c.name.includes('next-auth.session-token') || 
      c.name.includes('__Secure-next-auth.session-token') ||
      c.name.includes('__Host-next-auth.session-token')
    );
    console.log(`   세션 쿠키 개수: ${sessionCookies.length}개`);
    if (sessionCookies.length > 0) {
      sessionCookies.forEach(cookie => {
        console.log(`   ✅ ${cookie.name}:`);
        console.log(`      domain: ${cookie.domain || 'none'}`);
        console.log(`      path: ${cookie.path}`);
        console.log(`      httpOnly: ${cookie.httpOnly}`);
        console.log(`      secure: ${cookie.secure}`);
        console.log(`      sameSite: ${cookie.sameSite}`);
        console.log(`      value: ${cookie.value.substring(0, 50)}...`);
      });
    } else {
      console.log('   ❌ 세션 쿠키가 없습니다!');
    }
    console.log('');
    
    console.log('📋 6단계: API 호출 테스트');
    const testApis = [
      '/api/admin/customers?q=&page=1&pageSize=100',
      '/api/admin/kakao?sortBy=sent_at&sortOrder=desc',
      '/api/admin/product-composition?category=driver&active=true',
    ];
    
    for (const apiPath of testApis) {
      console.log(`   테스트: ${apiPath}`);
      try {
        const response = await page.request.get(`http://localhost:3000${apiPath}`);
        const status = response.status();
        const statusIcon = status === 200 ? '✅' : status === 401 ? '❌' : '⚠️';
        console.log(`   ${statusIcon} Status: ${status}`);
        
        if (status === 401) {
          const body = await response.text();
          console.log(`   응답: ${body.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`   ❌ 요청 실패: ${error.message}`);
      }
      console.log('');
    }
    
    console.log('📋 7단계: 고객 관리 페이지 접속');
    await page.goto('http://localhost:3000/admin/customers', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log(`   ✅ 현재 URL: ${page.url()}\n`);
    
    await page.waitForTimeout(3000);
    
    // 최종 쿠키 상태 확인
    const finalCookies = await context.cookies();
    const finalSessionCookies = finalCookies.filter(c => 
      c.name.includes('next-auth.session-token') || 
      c.name.includes('__Secure-next-auth.session-token') ||
      c.name.includes('__Host-next-auth.session-token')
    );
    console.log(`📋 8단계: 최종 쿠키 상태`);
    console.log(`   최종 세션 쿠키 개수: ${finalSessionCookies.length}개`);
    if (finalSessionCookies.length === 0) {
      console.log('   ❌ 문제 발견: 세션 쿠키가 사라졌습니다!');
    }
    console.log('');
    
    // 스크린샷 저장
    await page.screenshot({ path: 'scripts/playwright-session-check.png', fullPage: true });
    console.log('📸 스크린샷이 scripts/playwright-session-check.png에 저장되었습니다.\n');
    
    console.log('⏸️ 브라우저를 10초간 열어둡니다. 확인 후 자동으로 닫힙니다...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    await page.screenshot({ path: 'scripts/playwright-session-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
