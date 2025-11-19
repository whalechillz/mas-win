const { chromium } = require('playwright');

(async () => {
  console.log('🚀 로그인 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 디버깅을 위해 느리게 실행
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // 1. 로그인 페이지 접속
    console.log('📄 1. 로그인 페이지 접속 중...');
    await page.goto('http://localhost:3000/admin/login', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    console.log('✅ 로그인 페이지 로드 완료');
    console.log('   URL:', page.url());
    
    // 2. 페이지 로드 대기
    await page.waitForTimeout(2000);
    
    // 3. 콘솔 오류 확인
    console.log('\n🔍 2. 콘솔 오류 확인 중...');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('   ❌ 콘솔 오류:', msg.text());
      }
    });
    
    // 4. 네트워크 오류 확인
    console.log('\n🌐 3. 네트워크 요청 확인 중...');
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()
      });
      console.log('   ❌ 요청 실패:', request.url(), request.failure()?.errorText);
    });
    
    // 5. 리다이렉트 확인
    console.log('\n🔄 4. 리다이렉트 확인 중...');
    const redirects = [];
    page.on('request', request => {
      if (request.redirectedFrom()) {
        redirects.push({
          from: request.redirectedFrom()?.url(),
          to: request.url()
        });
        console.log('   🔄 리다이렉트:', request.redirectedFrom()?.url(), '→', request.url());
      }
    });
    
    // 6. /api/auth/session 요청 확인
    console.log('\n🔐 5. NextAuth 세션 요청 확인 중...');
    await page.waitForTimeout(3000); // 세션 요청 대기
    
    // 7. 로그인 폼 확인
    console.log('\n📝 6. 로그인 폼 확인 중...');
    const loginInput = await page.$('input[name="login"]').catch(() => null);
    const passwordInput = await page.$('input[name="password"]').catch(() => null);
    const submitButton = await page.$('button[type="submit"]').catch(() => null);
    
    if (loginInput) {
      console.log('   ✅ 로그인 입력 필드 발견');
    } else {
      console.log('   ❌ 로그인 입력 필드를 찾을 수 없음');
    }
    
    if (passwordInput) {
      console.log('   ✅ 비밀번호 입력 필드 발견');
    } else {
      console.log('   ❌ 비밀번호 입력 필드를 찾을 수 없음');
    }
    
    if (submitButton) {
      console.log('   ✅ 로그인 버튼 발견');
    } else {
      console.log('   ❌ 로그인 버튼을 찾을 수 없음');
    }
    
    // 8. ERR_TOO_MANY_REDIRECTS 오류 확인
    console.log('\n⚠️  7. 리다이렉트 루프 확인 중...');
    const hasRedirectLoop = failedRequests.some(req => 
      req.failure?.errorText?.includes('ERR_TOO_MANY_REDIRECTS') ||
      req.url.includes('/api/auth/session')
    );
    
    if (hasRedirectLoop) {
      console.log('   ❌ 리다이렉트 루프 감지됨!');
      console.log('   실패한 요청:', failedRequests.filter(req => 
        req.failure?.errorText?.includes('ERR_TOO_MANY_REDIRECTS')
      ));
    } else {
      console.log('   ✅ 리다이렉트 루프 없음');
    }
    
    // 9. 오류 메시지 확인
    console.log('\n💬 8. 페이지 오류 메시지 확인 중...');
    const errorMessage = await page.$('.bg-red-50, .text-red-700, [class*="error"]').catch(() => null);
    if (errorMessage) {
      const errorText = await errorMessage.textContent();
      console.log('   오류 메시지:', errorText);
    } else {
      console.log('   오류 메시지 없음');
    }
    
    // 10. 최종 상태 확인
    console.log('\n📊 9. 최종 상태 요약:');
    console.log('   현재 URL:', page.url());
    console.log('   콘솔 오류 개수:', errors.length);
    console.log('   실패한 요청 개수:', failedRequests.length);
    console.log('   리다이렉트 개수:', redirects.length);
    
    if (errors.length > 0) {
      console.log('\n   콘솔 오류 목록:');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err}`);
      });
    }
    
    if (failedRequests.length > 0) {
      console.log('\n   실패한 요청 목록:');
      failedRequests.forEach((req, idx) => {
        console.log(`   ${idx + 1}. ${req.url}`);
        if (req.failure) {
          console.log(`      오류: ${req.failure.errorText}`);
        }
      });
    }
    
    // 11. 스크린샷 저장
    console.log('\n📸 10. 스크린샷 저장 중...');
    await page.screenshot({ 
      path: 'playwright-login-test.png',
      fullPage: true 
    });
    console.log('   ✅ 스크린샷 저장: playwright-login-test.png');
    
    // 11. 실제 로그인 시도 (선택사항)
    if (loginInput && passwordInput && submitButton) {
      console.log('\n🔐 11. 실제 로그인 시도 중...');
      const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';
      
      try {
        await loginInput.fill(ADMIN_LOGIN);
        await passwordInput.fill(ADMIN_PASSWORD);
        await page.waitForTimeout(1000);
        
        // 로그인 버튼 클릭 전 오류 초기화
        errors.length = 0;
        failedRequests.length = 0;
        redirects.length = 0;
        
        await submitButton.click();
        await page.waitForTimeout(5000); // 로그인 처리 대기
        
        // 로그인 후 오류 확인
        const loginErrors = errors.filter(err => 
          err.includes('ERR_TOO_MANY_REDIRECTS') || 
          err.includes('CLIENT_FETCH_ERROR') ||
          err.includes('Failed to fetch')
        );
        
        const loginFailedRequests = failedRequests.filter(req => 
          req.failure?.errorText?.includes('ERR_TOO_MANY_REDIRECTS') ||
          req.url.includes('/api/auth/session')
        );
        
        if (loginErrors.length > 0 || loginFailedRequests.length > 0) {
          console.log('   ❌ 로그인 시도 중 오류 발생:');
          loginErrors.forEach(err => console.log('      -', err));
          loginFailedRequests.forEach(req => console.log('      -', req.url, req.failure?.errorText));
        } else {
          console.log('   ✅ 로그인 시도 완료 (오류 없음)');
          console.log('   현재 URL:', page.url());
        }
      } catch (loginError) {
        console.log('   ⚠️  로그인 시도 중 예외 발생:', loginError.message);
      }
    }
    
    // 12. 테스트 결과
    console.log('\n' + '='.repeat(50));
    if (hasRedirectLoop || failedRequests.length > 0) {
      console.log('❌ 테스트 실패: 로그인 오류가 감지되었습니다.');
      process.exit(1);
    } else {
      console.log('✅ 테스트 성공: 로그인 페이지가 정상적으로 로드되었습니다.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ 
      path: 'playwright-login-test-error.png',
      fullPage: true 
    });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

