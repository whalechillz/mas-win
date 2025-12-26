const { chromium } = require('playwright');

async function debugAdminLoginRedirect() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 각 액션 사이에 500ms 지연
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    // 쿠키 추적을 위해 활성화
    recordVideo: {
      dir: 'test-results/videos/',
      size: { width: 1280, height: 720 }
    }
  });
  
  const page = await context.newPage();

  // 모든 네트워크 요청 추적
  const requests = [];
  const responses = [];
  const failedRequests = [];
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()?.errorText,
      timestamp: new Date().toISOString()
    });
  });

  // 콘솔 메시지 추적
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });

  // 페이지 에러 추적
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  // 리다이렉트 추적
  const redirects = [];
  page.on('request', request => {
    if (request.redirectedFrom()) {
      redirects.push({
        from: request.redirectedFrom()?.url(),
        to: request.url(),
        timestamp: new Date().toISOString()
      });
    }
  });

  console.log('🔍 관리자 로그인 및 리다이렉트 디버깅 시작\n');

  try {
    // 1. masgolf.co.kr/admin/dashboard 접속
    console.log('📋 1단계: masgolf.co.kr/admin/dashboard 접속');
    console.log('   URL: https://masgolf.co.kr/admin/dashboard\n');
    
    await page.goto('https://masgolf.co.kr/admin/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log(`   현재 URL: ${page.url()}`);
    console.log(`   페이지 제목: ${await page.title()}\n`);

    // 리다이렉트 체인 출력
    if (redirects.length > 0) {
      console.log('   🔄 리다이렉트 체인:');
      redirects.forEach((redirect, index) => {
        console.log(`      ${index + 1}. ${redirect.from}`);
        console.log(`         → ${redirect.to}`);
      });
      console.log('');
    }

    // 2. 최종 페이지 확인
    const finalUrl = page.url();
    console.log('📋 2단계: 최종 페이지 확인');
    console.log(`   최종 URL: ${finalUrl}\n`);

    // 3. 페이지 내용 확인
    const pageContent = await page.content();
    const hasRedirecting = pageContent.includes('리다이렉트 중');
    const hasLoading = pageContent.includes('로딩 중');
    const hasLoginForm = pageContent.includes('아이디 또는 전화번호') || 
                        pageContent.includes('비밀번호') ||
                        pageContent.includes('로그인');

    console.log('📋 3단계: 페이지 상태 확인');
    console.log(`   "리다이렉트 중" 표시: ${hasRedirecting ? '✅ 있음' : '❌ 없음'}`);
    console.log(`   "로딩 중" 표시: ${hasLoading ? '✅ 있음' : '❌ 없음'}`);
    console.log(`   로그인 폼: ${hasLoginForm ? '✅ 있음' : '❌ 없음'}\n`);

    // 4. 쿠키 확인
    console.log('📋 4단계: 쿠키 확인');
    const cookies = await context.cookies();
    const sessionCookies = cookies.filter(c => 
      c.name.includes('session') || 
      c.name.includes('next-auth') ||
      c.name.includes('auth')
    );
    
    if (sessionCookies.length > 0) {
      console.log(`   ✅ 세션 쿠키 발견: ${sessionCookies.length}개`);
      sessionCookies.forEach(cookie => {
        console.log(`      - ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
        console.log(`        도메인: ${cookie.domain}`);
        console.log(`        경로: ${cookie.path}`);
        console.log(`        Secure: ${cookie.secure}`);
        console.log(`        SameSite: ${cookie.sameSite}`);
      });
    } else {
      console.log('   ❌ 세션 쿠키 없음');
    }
    console.log('');

    // 5. 로그인 페이지로 리다이렉트되었는지 확인
    if (finalUrl.includes('/admin/login')) {
      console.log('📋 5단계: 로그인 페이지에서 로그인 시도');
      console.log('   로그인 페이지 확인됨\n');

      // 로그인 폼 요소 확인
      const loginInput = await page.$('input[name="login"]').catch(() => null);
      const passwordInput = await page.$('input[name="password"]').catch(() => null);
      const submitButton = await page.$('button[type="submit"]').catch(() => null);

      if (loginInput && passwordInput && submitButton) {
        console.log('   ✅ 로그인 폼 요소 발견');
        
        // 로그인 정보 입력
        const testLogin = '010-6669-9000';
        const testPassword = '66699000'; // 실제 비밀번호
        
        console.log(`   로그인 시도: ${testLogin}`);
        await loginInput.fill(testLogin);
        await passwordInput.fill(testPassword);
        
        // 폼 제출 전 상태 저장
        const beforeSubmitUrl = page.url();
        const beforeSubmitCookies = await context.cookies();
        
        console.log('   로그인 버튼 클릭...\n');
        await submitButton.click();
        
        // 로그인 후 대기
        await page.waitForTimeout(3000);
        
        // 로그인 후 상태 확인
        const afterSubmitUrl = page.url();
        const afterSubmitCookies = await context.cookies();
        
        console.log('📋 6단계: 로그인 후 상태 확인');
        console.log(`   제출 전 URL: ${beforeSubmitUrl}`);
        console.log(`   제출 후 URL: ${afterSubmitUrl}`);
        console.log(`   URL 변경: ${beforeSubmitUrl !== afterSubmitUrl ? '✅ 변경됨' : '❌ 변경 안됨'}`);
        console.log(`   제출 전 쿠키: ${beforeSubmitCookies.length}개`);
        console.log(`   제출 후 쿠키: ${afterSubmitCookies.length}개`);
        console.log(`   쿠키 변경: ${beforeSubmitCookies.length !== afterSubmitCookies.length ? '✅ 변경됨' : '❌ 변경 안됨'}\n`);

        // 최종 페이지 상태 확인
        const finalPageContent = await page.content();
        const stillRedirecting = finalPageContent.includes('리다이렉트 중');
        const stillLoading = finalPageContent.includes('로딩 중');
        const hasDashboard = finalPageContent.includes('대시보드') || 
                            finalPageContent.includes('Dashboard') ||
                            afterSubmitUrl.includes('/admin/dashboard');

        console.log('📋 7단계: 최종 페이지 상태');
        console.log(`   "리다이렉트 중" 표시: ${stillRedirecting ? '⚠️ 여전히 있음' : '✅ 없음'}`);
        console.log(`   "로딩 중" 표시: ${stillLoading ? '⚠️ 여전히 있음' : '✅ 없음'}`);
        console.log(`   대시보드 표시: ${hasDashboard ? '✅ 있음' : '❌ 없음'}`);
        console.log(`   최종 URL: ${afterSubmitUrl}\n`);

        // 리다이렉트 루프 확인
        if (stillRedirecting || stillLoading) {
          console.log('⚠️ 리다이렉트 루프 감지! 추가 대기...\n');
          await page.waitForTimeout(5000);
          
          const loopCheckUrl = page.url();
          const loopCheckContent = await page.content();
          const stillInLoop = loopCheckContent.includes('리다이렉트 중') || 
                             loopCheckContent.includes('로딩 중');
          
          console.log('📋 8단계: 리다이렉트 루프 재확인');
          console.log(`   여전히 리다이렉트 중: ${stillInLoop ? '⚠️ 예' : '✅ 아니오'}`);
          console.log(`   현재 URL: ${loopCheckUrl}\n`);
        }
      } else {
        console.log('   ❌ 로그인 폼 요소를 찾을 수 없음');
        console.log(`      loginInput: ${loginInput ? '✅' : '❌'}`);
        console.log(`      passwordInput: ${passwordInput ? '✅' : '❌'}`);
        console.log(`      submitButton: ${submitButton ? '✅' : '❌'}\n`);
      }
    } else if (hasRedirecting || hasLoading) {
      console.log('⚠️ 로그인 페이지로 리다이렉트되지 않았지만 "리다이렉트 중" 표시됨');
      console.log('   추가 대기 중...\n');
      
      await page.waitForTimeout(5000);
      
      const waitCheckUrl = page.url();
      const waitCheckContent = await page.content();
      const stillRedirecting = waitCheckContent.includes('리다이렉트 중') || 
                               waitCheckContent.includes('로딩 중');
      
      console.log('📋 추가 확인:');
      console.log(`   여전히 리다이렉트 중: ${stillRedirecting ? '⚠️ 예' : '✅ 아니오'}`);
      console.log(`   현재 URL: ${waitCheckUrl}\n`);
    }

    // 6. 네트워크 요청 요약
    console.log('📋 네트워크 요청 요약:');
    console.log(`   총 요청: ${requests.length}개`);
    console.log(`   총 응답: ${responses.length}개`);
    console.log(`   실패한 요청: ${failedRequests.length}개`);
    
    if (failedRequests.length > 0) {
      console.log('\n   ❌ 실패한 요청:');
      failedRequests.forEach(req => {
        console.log(`      - ${req.url}`);
        console.log(`        에러: ${req.failure}`);
      });
    }
    
    // 세션 관련 요청 확인
    const sessionRequests = requests.filter(r => 
      r.url.includes('/api/auth') || 
      r.url.includes('session') ||
      r.url.includes('login')
    );
    
    if (sessionRequests.length > 0) {
      console.log(`\n   🔐 세션 관련 요청: ${sessionRequests.length}개`);
      sessionRequests.forEach(req => {
        const response = responses.find(r => r.url === req.url);
        console.log(`      - ${req.method} ${req.url}`);
        if (response) {
          console.log(`        상태: ${response.status} ${response.statusText}`);
        }
      });
    }
    console.log('');

    // 7. 콘솔 메시지 확인
    if (consoleMessages.length > 0) {
      console.log('📋 콘솔 메시지:');
      const errorMessages = consoleMessages.filter(m => m.type === 'error');
      const warnMessages = consoleMessages.filter(m => m.type === 'warning');
      
      if (errorMessages.length > 0) {
        console.log(`   ❌ 에러: ${errorMessages.length}개`);
        errorMessages.forEach(msg => {
          console.log(`      - ${msg.text}`);
        });
      }
      
      if (warnMessages.length > 0) {
        console.log(`   ⚠️ 경고: ${warnMessages.length}개`);
        warnMessages.forEach(msg => {
          console.log(`      - ${msg.text}`);
        });
      }
      console.log('');
    }

    // 8. 페이지 에러 확인
    if (pageErrors.length > 0) {
      console.log('📋 페이지 에러:');
      pageErrors.forEach(error => {
        console.log(`   ❌ ${error.message}`);
        if (error.stack) {
          console.log(`      스택: ${error.stack.substring(0, 200)}...`);
        }
      });
      console.log('');
    }

    // 9. 스크린샷 저장
    const screenshotPath = 'test-results/debug-admin-login-redirect.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`📸 스크린샷 저장: ${screenshotPath}`);

    // 10. 요청/응답 로그 저장
    const fs = require('fs');
    const path = require('path');
    const logDir = path.join(__dirname, '..', 'test-results');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logData = {
      timestamp: new Date().toISOString(),
      finalUrl: page.url(),
      redirects,
      requests: requests.slice(0, 50), // 처음 50개만 저장
      responses: responses.slice(0, 50),
      failedRequests,
      consoleMessages: consoleMessages.slice(0, 50),
      pageErrors,
      cookies: await context.cookies()
    };
    
    fs.writeFileSync(
      path.join(logDir, 'debug-admin-login-redirect.json'),
      JSON.stringify(logData, null, 2)
    );
    console.log('📝 상세 로그 저장: test-results/debug-admin-login-redirect.json\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('스택:', error.stack);
    
    // 에러 발생 시에도 스크린샷 저장
    await page.screenshot({ 
      path: 'test-results/debug-admin-login-redirect-error.png',
      fullPage: true 
    });
  } finally {
    await context.close();
    await browser.close();
  }
}

// test-results 폴더 생성
const fs = require('fs');
const path = require('path');
const testResultsDir = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}
const videosDir = path.join(testResultsDir, 'videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

console.log('🚀 관리자 로그인 및 리다이렉트 디버깅 시작\n');
debugAdminLoginRedirect().catch(console.error);

