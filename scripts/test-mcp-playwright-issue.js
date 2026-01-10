const { chromium } = require('playwright');

(async () => {
  console.log('🔍 MCP Playwright 이슈 재현 테스트 시작\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    // MCP Playwright와 유사한 환경 설정
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  
  const page = await context.newPage();
  
  // 네트워크 요청 모니터링
  const networkLogs = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      networkLogs.push({
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      const log = networkLogs.find(l => l.url === response.url());
      if (log) {
        log.status = response.status();
        log.statusText = response.statusText();
      }
    }
  });
  
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
    await page.waitForTimeout(2000);
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
      sessionCookies.forEach(c => {
        console.log(`   - ${c.name}: domain=${c.domain}, path=${c.path}, httpOnly=${c.httpOnly}, secure=${c.secure}`);
      });
    } else {
      console.log(`   ⚠️ 세션 쿠키가 없습니다!`);
    }
    console.log('');
    
    // 여러 페이지 테스트
    const testPages = [
      { name: '고객 관리', path: '/admin/customers' },
      { name: '갤러리 관리', path: '/admin/gallery' },
      { name: '블로그 관리', path: '/admin/blog' },
      { name: '허브 시스템', path: '/admin/content-calendar-hub' },
    ];
    
    for (const testPage of testPages) {
      console.log(`📋 ${testPage.name} 페이지 테스트: ${testPage.path}`);
      networkLogs.length = 0; // 로그 초기화
      
      try {
        await page.goto(`http://localhost:3000${testPage.path}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        await page.waitForTimeout(3000);
        
        // 콘솔 에러 확인
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        
        // 네트워크 에러 확인
        const apiErrors = networkLogs.filter(log => 
          log.status >= 400 || 
          log.url.includes('/api/auth/session') && log.status === 308
        );
        
        if (apiErrors.length > 0) {
          console.log(`   ❌ API 에러 발견:`);
          apiErrors.forEach(err => {
            console.log(`      - ${err.method} ${err.url}: ${err.status} ${err.statusText}`);
          });
        } else {
          console.log(`   ✅ API 요청 정상`);
        }
        
        // 페이지 내용 확인
        const pageContent = await page.content();
        const hasData = !pageContent.includes('데이터 없음') || 
                       !pageContent.includes('Unauthorized') ||
                       !pageContent.includes('Error');
        
        if (hasData) {
          console.log(`   ✅ 페이지 로드 성공`);
        } else {
          console.log(`   ⚠️ 페이지에 데이터가 없거나 에러가 있습니다`);
        }
        
        console.log(`   현재 URL: ${page.url()}\n`);
        
      } catch (error) {
        console.log(`   ❌ 페이지 로드 실패: ${error.message}\n`);
      }
    }
    
    // 최종 네트워크 로그 요약
    console.log('\n📊 네트워크 요청 요약:');
    const sessionRequests = networkLogs.filter(log => log.url.includes('/api/auth/session'));
    const adminRequests = networkLogs.filter(log => log.url.includes('/api/admin'));
    
    console.log(`   /api/auth/session 요청: ${sessionRequests.length}개`);
    sessionRequests.forEach(req => {
      console.log(`      - ${req.status || 'pending'}: ${req.url}`);
    });
    
    console.log(`   /api/admin 요청: ${adminRequests.length}개`);
    adminRequests.forEach(req => {
      console.log(`      - ${req.status || 'pending'}: ${req.url}`);
    });
    
  } catch (error) {
    console.error('❌ 테스트 중 에러 발생:', error.message);
    console.error(error.stack);
  } finally {
    console.log('\n📋 브라우저 종료');
    await browser.close();
  }
})();
