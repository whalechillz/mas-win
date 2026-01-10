const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Playwright 브라우저로 고객 관리 페이지 데이터 로딩 문제 재현 및 원인 파악\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 디버깅을 위해 느리게 실행
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    // Playwright 브라우저 감지를 위한 User-Agent 유지
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  
  const page = await context.newPage();
  
  // 네트워크 요청 추적
  const networkRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('/auth/')) {
      networkRequests.push({
        method: request.method(),
        url: url,
        headers: request.headers(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // 네트워크 응답 추적
  const networkResponses = [];
  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('/auth/')) {
      networkResponses.push({
        url: url,
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // 콘솔 메시지 추적
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('error') || text.includes('Error') || text.includes('401') || text.includes('Unauthorized') || text.includes('REDIRECT')) {
      consoleMessages.push({
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  try {
    console.log('📋 1단계: 로그인 페이지 접속');
    await page.goto('http://localhost:3000/admin/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log(`   ✅ 현재 URL: ${page.url()}\n`);
    
    // 로그인 전 쿠키 확인
    const cookiesBeforeLogin = await context.cookies();
    console.log(`   로그인 전 쿠키 개수: ${cookiesBeforeLogin.length}개`);
    const sessionCookiesBefore = cookiesBeforeLogin.filter(c => c.name.includes('session-token') || c.name.includes('next-auth'));
    console.log(`   로그인 전 세션 쿠키: ${sessionCookiesBefore.length}개\n`);
    
    console.log('📋 2단계: 로그인 정보 입력');
    await page.fill('input[name="login"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    console.log('   ✅ 로그인 정보 입력 완료\n');
    
    console.log('📋 3단계: 로그인 버튼 클릭');
    await page.click('button[type="submit"]');
    console.log('   ✅ 로그인 버튼 클릭 완료\n');
    
    // 로그인 후 리다이렉트 대기
    console.log('📋 4단계: 로그인 후 리다이렉트 대기');
    try {
      await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });
      console.log(`   ✅ 대시보드로 리다이렉트됨: ${page.url()}\n`);
    } catch (e) {
      console.log(`   ⚠️ 대시보드 리다이렉트 실패, 현재 URL: ${page.url()}\n`);
    }
    
    // 로그인 후 쿠키 확인
    await page.waitForTimeout(2000); // 쿠키 설정 대기
    const cookiesAfterLogin = await context.cookies();
    console.log(`   로그인 후 쿠키 개수: ${cookiesAfterLogin.length}개`);
    const sessionCookiesAfter = cookiesAfterLogin.filter(c => 
      c.name.includes('next-auth.session-token') || 
      c.name.includes('__Secure-next-auth.session-token') ||
      c.name.includes('__Host-next-auth.session-token')
    );
    console.log(`   로그인 후 세션 쿠키: ${sessionCookiesAfter.length}개`);
    if (sessionCookiesAfter.length > 0) {
      sessionCookiesAfter.forEach(cookie => {
        console.log(`      - ${cookie.name}: ${cookie.value.substring(0, 30)}... (domain: ${cookie.domain || 'none'}, path: ${cookie.path}, httpOnly: ${cookie.httpOnly}, secure: ${cookie.secure}, sameSite: ${cookie.sameSite})`);
      });
    } else {
      console.log('      ⚠️ 세션 쿠키가 없습니다!');
    }
    console.log('');
    
    console.log('📋 5단계: 고객 관리 페이지 접속');
    await page.goto('http://localhost:3000/admin/customers', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log(`   ✅ 현재 URL: ${page.url()}\n`);
    
    // 페이지 로드 대기
    await page.waitForTimeout(3000);
    
    // API 호출 확인
    console.log('📋 6단계: API 호출 상태 확인');
    const apiCalls = networkResponses.filter(r => r.url.includes('/api/admin/customers') || r.url.includes('/api/auth/session'));
    console.log(`   API 호출 개수: ${apiCalls.length}개`);
    apiCalls.forEach(call => {
      const status = call.status;
      const statusIcon = status === 200 ? '✅' : status === 401 ? '❌' : '⚠️';
      console.log(`   ${statusIcon} ${call.url}`);
      console.log(`      Status: ${status} ${call.statusText}`);
      if (status === 401) {
        console.log(`      ⚠️ 인증 실패 - 쿠키가 전송되지 않았거나 유효하지 않음`);
      }
    });
    console.log('');
    
    // 콘솔 에러 확인
    console.log('📋 7단계: 브라우저 콘솔 에러 확인');
    if (consoleMessages.length > 0) {
      console.log(`   콘솔 에러 개수: ${consoleMessages.length}개`);
      consoleMessages.slice(0, 10).forEach(msg => {
        console.log(`   ${msg.type.toUpperCase()}: ${msg.text.substring(0, 100)}`);
      });
    } else {
      console.log('   ✅ 콘솔 에러 없음');
    }
    console.log('');
    
    // 페이지 내용 확인
    console.log('📋 8단계: 페이지 내용 확인');
    const pageContent = await page.content();
    const hasNoData = pageContent.includes('데이터 없음') || pageContent.includes('No data');
    const hasLoading = pageContent.includes('로딩') || pageContent.includes('Loading');
    console.log(`   "데이터 없음" 표시: ${hasNoData ? '❌ 예' : '✅ 아니오'}`);
    console.log(`   "로딩" 표시: ${hasLoading ? '⚠️ 예' : '✅ 아니오'}`);
    console.log('');
    
    // 최종 쿠키 상태 확인
    console.log('📋 9단계: 최종 쿠키 상태 확인');
    const finalCookies = await context.cookies();
    const finalSessionCookies = finalCookies.filter(c => 
      c.name.includes('next-auth.session-token') || 
      c.name.includes('__Secure-next-auth.session-token') ||
      c.name.includes('__Host-next-auth.session-token')
    );
    console.log(`   최종 세션 쿠키 개수: ${finalSessionCookies.length}개`);
    if (finalSessionCookies.length === 0) {
      console.log('   ❌ 문제 발견: 세션 쿠키가 없습니다!');
      console.log('   원인: 로그인 후 쿠키가 설정되지 않았거나, 쿠키가 삭제되었습니다.');
    } else {
      finalSessionCookies.forEach(cookie => {
        console.log(`   ✅ ${cookie.name}: domain=${cookie.domain || 'none'}, path=${cookie.path}, httpOnly=${cookie.httpOnly}, secure=${cookie.secure}, sameSite=${cookie.sameSite}`);
      });
    }
    console.log('');
    
    // 요청 헤더 확인
    console.log('📋 10단계: API 요청 헤더 확인');
    const customerApiRequests = networkRequests.filter(r => r.url.includes('/api/admin/customers'));
    if (customerApiRequests.length > 0) {
      const lastRequest = customerApiRequests[customerApiRequests.length - 1];
      console.log(`   마지막 /api/admin/customers 요청 헤더:`);
      const cookieHeader = lastRequest.headers['cookie'] || lastRequest.headers['Cookie'] || '없음';
      console.log(`      Cookie 헤더: ${cookieHeader.substring(0, 200)}${cookieHeader.length > 200 ? '...' : ''}`);
      if (!cookieHeader.includes('next-auth.session-token')) {
        console.log('   ❌ 문제 발견: 요청에 세션 쿠키가 포함되지 않았습니다!');
      } else {
        console.log('   ✅ 요청에 세션 쿠키가 포함되어 있습니다.');
      }
    }
    console.log('');
    
    // 스크린샷 저장
    await page.screenshot({ path: 'scripts/playwright-customer-debug.png', fullPage: true });
    console.log('📸 스크린샷이 scripts/playwright-customer-debug.png에 저장되었습니다.\n');
    
    // 결과 요약
    console.log('📊 결과 요약:');
    console.log('─'.repeat(50));
    if (finalSessionCookies.length === 0) {
      console.log('❌ 주요 문제: 세션 쿠키가 설정되지 않았습니다.');
      console.log('   해결 방법:');
      console.log('   1. NextAuth 쿠키 설정 확인 (domain, path, sameSite)');
      console.log('   2. Playwright 브라우저 컨텍스트 설정 확인');
    } else {
      const has401 = apiCalls.some(call => call.status === 401);
      if (has401) {
        console.log('❌ 주요 문제: API 요청이 401 Unauthorized를 반환합니다.');
        console.log('   원인:');
        console.log('   1. 쿠키는 있지만 미들웨어에서 인증 실패');
        console.log('   2. 쿠키가 요청 헤더에 포함되지 않음');
        console.log('   3. 쿠키 도메인/경로 불일치');
      } else {
        console.log('✅ 세션 쿠키는 정상적으로 설정되어 있습니다.');
      }
    }
    console.log('─'.repeat(50));
    
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    await page.screenshot({ path: 'scripts/playwright-customer-error.png', fullPage: true });
  } finally {
    console.log('\n⏸️ 브라우저를 10초간 열어둡니다. 확인 후 자동으로 닫힙니다...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();
