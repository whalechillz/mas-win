const { chromium } = require('playwright');

async function debugLoginRedirectDetailed() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();

  // URL 변경 추적
  let currentUrl = '';
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      const newUrl = frame.url();
      if (newUrl !== currentUrl) {
        console.log(`   🔄 URL 변경: ${currentUrl} → ${newUrl}`);
        currentUrl = newUrl;
      }
    }
  });

  console.log('🔍 상세 로그인 리다이렉트 디버깅 시작\n');

  try {
    // 1. 로그인 페이지 접속
    console.log('📋 1단계: 로그인 페이지 접속');
    await page.goto('https://www.masgolf.co.kr/admin/login?callbackUrl=%2Fadmin%2Fdashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    currentUrl = page.url();
    console.log(`   현재 URL: ${currentUrl}\n`);

    // 2. 로그인 폼 확인 및 입력
    console.log('📋 2단계: 로그인 정보 입력');
    const loginInput = await page.$('input[name="login"]');
    const passwordInput = await page.$('input[name="password"]');
    const submitButton = await page.$('button[type="submit"]');

    if (!loginInput || !passwordInput || !submitButton) {
      console.log('   ❌ 로그인 폼 요소를 찾을 수 없음');
      return;
    }

    await loginInput.fill('010-6669-9000');
    await passwordInput.fill('66699000');
    console.log('   ✅ 로그인 정보 입력 완료\n');

    // 3. 로그인 전 상태 확인
    console.log('📋 3단계: 로그인 전 상태 확인');
    const beforeCookies = await context.cookies();
    const beforeSessionCookies = beforeCookies.filter(c => 
      c.name.includes('session') || c.name.includes('next-auth')
    );
    console.log(`   쿠키 개수: ${beforeCookies.length}개`);
    console.log(`   세션 쿠키: ${beforeSessionCookies.length}개`);
    console.log(`   현재 URL: ${page.url()}\n`);

    // 4. 로그인 버튼 클릭
    console.log('📋 4단계: 로그인 버튼 클릭');
    await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/api/auth/callback/credentials'),
        { timeout: 10000 }
      ).catch(() => null),
      submitButton.click()
    ]);

    // 5. 로그인 응답 대기
    console.log('   로그인 요청 전송 완료, 응답 대기 중...\n');
    await page.waitForTimeout(2000);

    // 6. 로그인 후 즉시 상태 확인
    console.log('📋 5단계: 로그인 후 즉시 상태 확인');
    const afterCookies = await context.cookies();
    const afterSessionCookies = afterCookies.filter(c => 
      c.name.includes('session') || c.name.includes('next-auth')
    );
    console.log(`   쿠키 개수: ${afterCookies.length}개`);
    console.log(`   세션 쿠키: ${afterSessionCookies.length}개`);
    console.log(`   현재 URL: ${page.url()}`);
    
    // 새로 생성된 세션 쿠키 확인
    const newSessionCookies = afterSessionCookies.filter(
      after => !beforeSessionCookies.some(before => before.name === after.name)
    );
    if (newSessionCookies.length > 0) {
      console.log(`   ✅ 새 세션 쿠키 생성: ${newSessionCookies.map(c => c.name).join(', ')}`);
    } else {
      console.log(`   ⚠️ 새 세션 쿠키 없음`);
    }
    console.log('');

    // 7. 세션 API 호출로 세션 확인
    console.log('📋 6단계: 세션 API 호출로 세션 확인');
    const sessionResponse = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session');
      return {
        status: response.status,
        data: await response.json()
      };
    });
    console.log(`   세션 API 상태: ${sessionResponse.status}`);
    console.log(`   세션 데이터:`, JSON.stringify(sessionResponse.data, null, 2));
    console.log('');

    // 8. URL 변경 대기 (최대 10초)
    console.log('📋 7단계: URL 변경 대기 (최대 10초)');
    const startTime = Date.now();
    const timeout = 10000;
    let urlChanged = false;

    while (Date.now() - startTime < timeout) {
      const currentUrlCheck = page.url();
      if (currentUrlCheck !== currentUrl && currentUrlCheck.includes('/admin/dashboard')) {
        urlChanged = true;
        console.log(`   ✅ 대시보드로 리다이렉트됨: ${currentUrlCheck}`);
        break;
      }
      await page.waitForTimeout(500);
    }

    if (!urlChanged) {
      console.log(`   ⚠️ URL 변경 없음 (현재: ${page.url()})`);
    }
    console.log('');

    // 9. 최종 상태 확인
    console.log('📋 8단계: 최종 상태 확인');
    const finalUrl = page.url();
    const finalCookies = await context.cookies();
    const finalSessionCookies = finalCookies.filter(c => 
      c.name.includes('session') || c.name.includes('next-auth')
    );
    
    console.log(`   최종 URL: ${finalUrl}`);
    console.log(`   최종 쿠키 개수: ${finalCookies.length}개`);
    console.log(`   최종 세션 쿠키: ${finalSessionCookies.length}개`);
    
    // 페이지 내용 확인
    const pageContent = await page.content();
    const hasRedirecting = pageContent.includes('리다이렉트 중');
    const hasLoading = pageContent.includes('로딩 중');
    const hasDashboard = pageContent.includes('대시보드') || 
                        pageContent.includes('Dashboard') ||
                        finalUrl.includes('/admin/dashboard');
    const hasLoginForm = pageContent.includes('아이디 또는 전화번호') || 
                        pageContent.includes('비밀번호');

    console.log(`   "리다이렉트 중" 표시: ${hasRedirecting ? '⚠️ 있음' : '✅ 없음'}`);
    console.log(`   "로딩 중" 표시: ${hasLoading ? '⚠️ 있음' : '✅ 없음'}`);
    console.log(`   대시보드 표시: ${hasDashboard ? '✅ 있음' : '❌ 없음'}`);
    console.log(`   로그인 폼: ${hasLoginForm ? '⚠️ 있음 (여전히 로그인 페이지)' : '✅ 없음'}`);
    console.log('');

    // 10. 문제 진단
    console.log('📋 9단계: 문제 진단');
    if (hasDashboard) {
      console.log('   ✅ 로그인 및 리다이렉트 성공!');
    } else if (hasLoginForm && sessionResponse.data?.user) {
      console.log('   ⚠️ 로그인은 성공했지만 리다이렉트가 실행되지 않음');
      console.log('   원인: router.push()가 실행되지 않았거나, 대시보드에서 다시 로그인 페이지로 리다이렉트됨');
    } else if (hasLoginForm && !sessionResponse.data?.user) {
      console.log('   ❌ 로그인 실패: 세션이 생성되지 않음');
    } else if (hasRedirecting || hasLoading) {
      console.log('   ⚠️ 리다이렉트 루프 발생 가능성');
    }
    console.log('');

    // 11. 스크린샷 저장
    const screenshotPath = 'test-results/debug-login-redirect-detailed.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`📸 스크린샷 저장: ${screenshotPath}`);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('스택:', error.stack);
    
    await page.screenshot({ 
      path: 'test-results/debug-login-redirect-detailed-error.png',
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

console.log('🚀 상세 로그인 리다이렉트 디버깅 시작\n');
debugLoginRedirectDetailed().catch(console.error);

