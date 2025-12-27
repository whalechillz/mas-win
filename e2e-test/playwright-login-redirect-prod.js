const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🔍 프로덕션 환경 로그인 리다이렉트 디버깅 테스트 시작...\n');
  console.log('   대상 URL: https://www.masgolf.co.kr/admin/login\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 디버깅을 위해 느리게 실행
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // 결과 저장용
  const testResults = {
    startTime: new Date().toISOString(),
    environment: 'production',
    baseUrl: 'https://www.masgolf.co.kr',
    redirectChain: [],
    urlHistory: [],
    cookies: [],
    networkRequests: [],
    errors: [],
    consoleErrors: [],
    responseHeaders: [],
    finalState: {}
  };
  
  // URL 변경 추적
  let urlHistory = [];
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      const url = frame.url();
      const timestamp = new Date().toISOString();
      urlHistory.push({ url, timestamp });
      testResults.urlHistory.push({ url, timestamp });
      console.log(`   🔄 [${new Date().toLocaleTimeString()}] URL 변경: ${url}`);
    }
  });
  
  // 콘솔 오류 추적
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const errorText = msg.text();
      testResults.consoleErrors.push({ text: errorText, timestamp: new Date().toISOString() });
      console.log(`   ❌ 콘솔 오류: ${errorText}`);
    }
  });
  
  // 네트워크 요청 추적
  const networkRequests = [];
  page.on('request', request => {
    const requestData = {
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString(),
      redirectedFrom: request.redirectedFrom()?.url() || null
    };
    
    if (request.redirectedFrom()) {
      testResults.redirectChain.push({
        from: request.redirectedFrom()?.url(),
        to: request.url(),
        timestamp: new Date().toISOString()
      });
      console.log(`   🔄 리다이렉트: ${request.redirectedFrom()?.url()} → ${request.url()}`);
    }
    
    networkRequests.push(requestData);
    testResults.networkRequests.push(requestData);
  });
  
  // 네트워크 오류 추적
  page.on('requestfailed', request => {
    const error = {
      url: request.url(),
      failure: request.failure(),
      timestamp: new Date().toISOString()
    };
    testResults.errors.push(error);
    const errorText = request.failure()?.errorText || 'Unknown error';
    console.log(`   ❌ 요청 실패: ${request.url()}`);
    console.log(`      오류: ${errorText}`);
    
    if (errorText.includes('ERR_TOO_MANY_REDIRECTS')) {
      console.log(`   ⚠️  ERR_TOO_MANY_REDIRECTS 감지!`);
    }
  });
  
  // 응답 추적 (특히 리다이렉트)
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    
    // 리다이렉트 응답 추적
    if (status >= 300 && status < 400) {
      const location = response.headers()['location'];
      console.log(`   🔄 리다이렉트 응답 [${status}]: ${url}`);
      if (location) {
        console.log(`      → ${location}`);
      }
      
      testResults.responseHeaders.push({
        url,
        status,
        location,
        headers: response.headers(),
        timestamp: new Date().toISOString()
      });
    }
    
    // 오류 응답 추적
    if (status >= 400) {
      console.log(`   ⚠️  응답 오류 [${status}]: ${url}`);
    }
    
    // /api/auth/session 응답 추적
    if (url.includes('/api/auth/session')) {
      const headers = response.headers();
      console.log(`   🔐 세션 API 응답 [${status}]:`);
      console.log(`      Set-Cookie: ${headers['set-cookie'] ? '있음' : '없음'}`);
      testResults.responseHeaders.push({
        url,
        status,
        headers: response.headers(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  try {
    // 1단계: 로그인 페이지 접속
    console.log('\n📋 1단계: 로그인 페이지 접속');
    console.log('   URL: https://www.masgolf.co.kr/admin/login');
    
    await page.goto('https://www.masgolf.co.kr/admin/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    const loginPageUrl = page.url();
    console.log(`   ✅ 현재 URL: ${loginPageUrl}`);
    
    // 페이지 내용 확인
    const pageContent = await page.content().catch(() => '');
    const hasRedirecting = pageContent.includes('리다이렉트 중') || pageContent.includes('Redirecting');
    const hasLoading = pageContent.includes('로딩 중') || pageContent.includes('Loading');
    
    console.log(`   "리다이렉트 중" 표시: ${hasRedirecting ? '⚠️ 예' : '✅ 아니오'}`);
    console.log(`   "로딩 중" 표시: ${hasLoading ? '⚠️ 예' : '✅ 아니오'}`);
    
    // 쿠키 확인
    const initialCookies = await context.cookies();
    console.log(`   쿠키 개수: ${initialCookies.length}개`);
    testResults.cookies.push({
      stage: 'before_login',
      cookies: initialCookies
    });
    
    // 2단계: 로그인 폼 확인
    console.log('\n📋 2단계: 로그인 폼 확인');
    const loginInput = await page.$('input[name="login"]').catch(() => null);
    const passwordInput = await page.$('input[name="password"]').catch(() => null);
    const submitButton = await page.$('button[type="submit"]').catch(() => null);
    
    if (!loginInput || !passwordInput || !submitButton) {
      console.log('   ❌ 로그인 폼 요소를 찾을 수 없음');
      console.log(`      loginInput: ${loginInput ? '✅' : '❌'}`);
      console.log(`      passwordInput: ${passwordInput ? '✅' : '❌'}`);
      console.log(`      submitButton: ${submitButton ? '✅' : '❌'}`);
      
      // 스크린샷 저장
      await page.screenshot({ path: 'test-results/login-form-not-found-prod.png', fullPage: true });
      
      // 페이지 HTML 일부 저장
      const html = await page.content();
      fs.writeFileSync('test-results/login-page-html-prod.html', html);
      console.log('   ✅ 페이지 HTML 저장: test-results/login-page-html-prod.html');
      
      throw new Error('로그인 폼 요소를 찾을 수 없음');
    }
    
    console.log('   ✅ 로그인 폼 요소 모두 발견');
    
    // 3단계: 로그인 정보 입력
    console.log('\n📋 3단계: 로그인 정보 입력');
    const ADMIN_LOGIN = '010-6669-9000';
    const ADMIN_PASSWORD = '66699000';
    
    await loginInput.fill(ADMIN_LOGIN);
    await passwordInput.fill(ADMIN_PASSWORD);
    console.log(`   ✅ 아이디: ${ADMIN_LOGIN}`);
    console.log(`   ✅ 비밀번호: ${'*'.repeat(ADMIN_PASSWORD.length)}`);
    
    // 4단계: 로그인 전 상태 확인
    console.log('\n📋 4단계: 로그인 전 상태 확인');
    const beforeLoginUrl = page.url();
    const beforeLoginCookies = await context.cookies();
    const beforeLoginSessionCookies = beforeLoginCookies.filter(c => 
      c.name.includes('session') || c.name.includes('next-auth')
    );
    
    console.log(`   현재 URL: ${beforeLoginUrl}`);
    console.log(`   전체 쿠키: ${beforeLoginCookies.length}개`);
    console.log(`   세션 쿠키: ${beforeLoginSessionCookies.length}개`);
    if (beforeLoginSessionCookies.length > 0) {
      beforeLoginSessionCookies.forEach(c => {
        console.log(`      - ${c.name}: ${c.value.substring(0, 30)}... (domain: ${c.domain})`);
      });
    }
    
    // 5단계: 로그인 버튼 클릭
    console.log('\n📋 5단계: 로그인 버튼 클릭');
    console.log('   로그인 버튼 클릭 중...');
    
    await submitButton.click();
    console.log('   ✅ 로그인 버튼 클릭 완료');
    
    // 6단계: 로그인 후 대기 및 상태 확인 (리다이렉트 루프 감지)
    console.log('\n📋 6단계: 로그인 후 상태 확인 (리다이렉트 루프 감지)');
    
    // 최대 20초 대기 (리다이렉트 루프 감지)
    let waitTime = 0;
    const maxWaitTime = 20000;
    const checkInterval = 1000;
    
    let redirectLoopDetected = false;
    let lastUrl = '';
    let urlRepeatCount = 0;
    
    while (waitTime < maxWaitTime) {
      await page.waitForTimeout(checkInterval);
      waitTime += checkInterval;
      
      const currentUrl = page.url();
      const pageContent = await page.content().catch(() => '');
      const hasRedirecting = pageContent.includes('리다이렉트 중') || pageContent.includes('Redirecting');
      const hasLoading = pageContent.includes('로딩 중') || pageContent.includes('Loading');
      const isDashboard = currentUrl.includes('/admin/dashboard');
      const isLogin = currentUrl.includes('/admin/login');
      
      // 같은 URL 반복 체크
      if (currentUrl === lastUrl) {
        urlRepeatCount++;
      } else {
        urlRepeatCount = 0;
        lastUrl = currentUrl;
      }
      
      console.log(`   [${waitTime}ms] URL: ${currentUrl}`);
      console.log(`      리다이렉트 중: ${hasRedirecting ? '⚠️ 예' : '✅ 아니오'}`);
      console.log(`      로딩 중: ${hasLoading ? '⚠️ 예' : '✅ 아니오'}`);
      console.log(`      대시보드: ${isDashboard ? '✅ 예' : '❌ 아니오'}`);
      console.log(`      로그인 페이지: ${isLogin ? '⚠️ 예' : '❌ 아니오'}`);
      console.log(`      같은 URL 반복: ${urlRepeatCount}회`);
      
      // 리다이렉트 루프 감지 조건
      if (urlRepeatCount >= 3) {
        console.log('   ⚠️  같은 URL이 3회 이상 반복 - 리다이렉트 루프 감지!');
        redirectLoopDetected = true;
        break;
      }
      
      // 로그인 후 다시 로그인 페이지로 돌아옴
      if (isLogin && waitTime > 5000) {
        console.log('   ⚠️  로그인 후 다시 로그인 페이지로 돌아옴 - 리다이렉트 루프 가능성');
        redirectLoopDetected = true;
        break;
      }
      
      // 대시보드 도달 확인
      if (isDashboard && !hasRedirecting && !hasLoading) {
        console.log('   ✅ 대시보드 도달 완료');
        break;
      }
      
      // 계속 리다이렉트 중인 경우
      if (hasRedirecting && waitTime > 10000) {
        console.log('   ⚠️  "리다이렉트 중" 메시지가 10초 이상 지속됨');
        redirectLoopDetected = true;
        break;
      }
    }
    
    // 7단계: 최종 상태 확인
    console.log('\n📋 7단계: 최종 상태 확인');
    const finalUrl = page.url();
    const finalCookies = await context.cookies();
    const finalSessionCookies = finalCookies.filter(c => 
      c.name.includes('session') || c.name.includes('next-auth')
    );
    const finalPageContent = await page.content().catch(() => '');
    
    const finalState = {
      url: finalUrl,
      isDashboard: finalUrl.includes('/admin/dashboard'),
      isLogin: finalUrl.includes('/admin/login'),
      hasRedirecting: finalPageContent.includes('리다이렉트 중') || finalPageContent.includes('Redirecting'),
      hasLoading: finalPageContent.includes('로딩 중') || finalPageContent.includes('Loading'),
      cookiesCount: finalCookies.length,
      sessionCookiesCount: finalSessionCookies.length,
      urlHistoryCount: urlHistory.length,
      redirectChainCount: testResults.redirectChain.length,
      redirectLoopDetected
    };
    
    testResults.finalState = finalState;
    testResults.cookies.push({
      stage: 'after_login',
      cookies: finalCookies
    });
    
    console.log(`   최종 URL: ${finalUrl}`);
    console.log(`   대시보드 도달: ${finalState.isDashboard ? '✅ 예' : '❌ 아니오'}`);
    console.log(`   로그인 페이지: ${finalState.isLogin ? '⚠️ 예' : '❌ 아니오'}`);
    console.log(`   리다이렉트 중 표시: ${finalState.hasRedirecting ? '⚠️ 예' : '✅ 아니오'}`);
    console.log(`   로딩 중 표시: ${finalState.hasLoading ? '⚠️ 예' : '✅ 아니오'}`);
    console.log(`   리다이렉트 루프 감지: ${redirectLoopDetected ? '⚠️ 예' : '✅ 아니오'}`);
    console.log(`   전체 쿠키: ${finalCookies.length}개`);
    console.log(`   세션 쿠키: ${finalSessionCookies.length}개`);
    if (finalSessionCookies.length > 0) {
      finalSessionCookies.forEach(c => {
        console.log(`      - ${c.name}: ${c.value.substring(0, 30)}... (domain: ${c.domain}, path: ${c.path})`);
      });
    } else {
      console.log('      ⚠️  세션 쿠키가 없습니다!');
    }
    console.log(`   URL 변경 횟수: ${urlHistory.length}회`);
    console.log(`   리다이렉트 체인: ${testResults.redirectChain.length}개`);
    
    // 8단계: 리다이렉트 체인 분석
    console.log('\n📋 8단계: 리다이렉트 체인 분석');
    if (testResults.redirectChain.length > 0) {
      console.log('   리다이렉트 체인:');
      testResults.redirectChain.forEach((redirect, idx) => {
        console.log(`      ${idx + 1}. ${redirect.from}`);
        console.log(`         → ${redirect.to}`);
      });
      
      // 루프 감지
      const redirectUrls = testResults.redirectChain.map(r => r.to);
      const uniqueRedirects = new Set(redirectUrls);
      if (redirectUrls.length > uniqueRedirects.size) {
        console.log('   ⚠️  중복 리다이렉트 감지 - 루프 가능성');
      }
    } else {
      console.log('   리다이렉트 체인 없음');
    }
    
    // 9단계: 문제점 분석
    console.log('\n📋 9단계: 문제점 분석');
    const issues = [];
    
    if (redirectLoopDetected) {
      issues.push('리다이렉트 루프 감지됨');
    }
    
    if (finalState.isLogin && !finalState.isDashboard) {
      issues.push('로그인 후에도 로그인 페이지에 머물러 있음');
    }
    
    if (finalState.hasRedirecting) {
      issues.push('"리다이렉트 중" 메시지가 계속 표시됨');
    }
    
    if (finalState.sessionCookiesCount === 0) {
      issues.push('세션 쿠키가 설정되지 않음 (인증 실패 가능성)');
    }
    
    if (urlHistory.length > 15) {
      issues.push(`URL 변경이 너무 많음 (${urlHistory.length}회) - 리다이렉트 루프 가능성`);
    }
    
    if (testResults.errors.some(e => e.failure?.errorText?.includes('ERR_TOO_MANY_REDIRECTS'))) {
      issues.push('ERR_TOO_MANY_REDIRECTS 오류 발생');
    }
    
    // 세션 쿠키 도메인 확인
    if (finalSessionCookies.length > 0) {
      const cookieDomains = finalSessionCookies.map(c => c.domain);
      const hasCorrectDomain = cookieDomains.some(d => d.includes('masgolf.co.kr'));
      if (!hasCorrectDomain) {
        issues.push(`세션 쿠키 도메인이 올바르지 않음: ${cookieDomains.join(', ')}`);
      }
    }
    
    if (issues.length > 0) {
      console.log('   ⚠️  발견된 문제점:');
      issues.forEach((issue, idx) => {
        console.log(`      ${idx + 1}. ${issue}`);
      });
    } else {
      console.log('   ✅ 문제점 없음');
    }
    
    // 10단계: 스크린샷 및 결과 저장
    console.log('\n📋 10단계: 스크린샷 및 결과 저장');
    const screenshotPath = 'test-results/login-redirect-debug-prod.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   ✅ 스크린샷 저장: ${screenshotPath}`);
    
    // 결과 JSON 저장
    testResults.endTime = new Date().toISOString();
    testResults.issues = issues;
    testResults.success = finalState.isDashboard && !finalState.hasRedirecting && !finalState.hasLoading && !redirectLoopDetected;
    
    const resultsDir = 'test-results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const resultsPath = path.join(resultsDir, 'login-redirect-debug-prod-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`   ✅ 결과 저장: ${resultsPath}`);
    
    // 최종 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과 요약');
    console.log('='.repeat(60));
    console.log(`   환경: 프로덕션 (${testResults.baseUrl})`);
    console.log(`   성공: ${testResults.success ? '✅ 예' : '❌ 아니오'}`);
    console.log(`   최종 URL: ${finalUrl}`);
    console.log(`   문제점 개수: ${issues.length}개`);
    console.log(`   URL 변경 횟수: ${urlHistory.length}회`);
    console.log(`   리다이렉트 체인: ${testResults.redirectChain.length}개`);
    console.log(`   세션 쿠키: ${finalSessionCookies.length}개`);
    console.log(`   리다이렉트 루프: ${redirectLoopDetected ? '⚠️ 감지됨' : '✅ 없음'}`);
    console.log('='.repeat(60));
    
    if (!testResults.success) {
      console.log('\n❌ 테스트 실패: 리다이렉트 문제가 발견되었습니다.');
      console.log('\n📝 다음 단계:');
      console.log('   1. test-results/login-redirect-debug-prod-results.json 파일 확인');
      console.log('   2. test-results/login-redirect-debug-prod.png 스크린샷 확인');
      console.log('   3. 발견된 문제점을 기반으로 코드 수정');
      process.exit(1);
    } else {
      console.log('\n✅ 테스트 성공: 정상적으로 로그인 및 리다이렉트되었습니다.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ 
      path: 'test-results/login-redirect-debug-prod-error.png',
      fullPage: true 
    });
    
    testResults.error = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    const resultsPath = path.join('test-results', 'login-redirect-debug-prod-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    
    process.exit(1);
  } finally {
    // 브라우저는 수동으로 닫도록 (디버깅을 위해)
    console.log('\n⚠️  브라우저를 수동으로 닫아주세요 (디버깅을 위해 자동 종료하지 않음)');
    // await browser.close();
  }
})();


