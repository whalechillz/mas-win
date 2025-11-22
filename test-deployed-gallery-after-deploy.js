const { chromium } = require('playwright');

async function testDeployedGalleryAfterDeploy() {
  console.log('🚀 배포 후 갤러리 테스트 시작...');
  console.log('URL: https://www.masgolf.co.kr/admin/gallery\n');
  
  const browser = await chromium.launch({ 
    headless: false, // 개발자 모드로 실행
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // 네트워크 요청 모니터링
  const networkRequests = [];
  const networkErrors = [];
  const apiResponseTimes = [];
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/admin/')) {
      networkRequests.push({
        url,
        method: request.method(),
        timestamp: Date.now(),
        status: 'pending'
      });
    }
  });
  
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('/api/admin/')) {
      const request = networkRequests.find(r => r.url === url && r.status === 'pending');
      if (request) {
        const responseTime = Date.now() - request.timestamp;
        request.status = status;
        request.responseTime = responseTime;
        
        if (url.includes('all-images') || url.includes('folders')) {
          apiResponseTimes.push({
            url: url.substring(0, 80),
            status,
            responseTime
          });
        }
        
        if (status >= 400) {
          networkErrors.push({
            url,
            status,
            timestamp: Date.now()
          });
          console.log(`❌ 에러 응답: ${status} ${url.substring(0, 100)}... (${responseTime}ms)`);
        } else {
          console.log(`✅ 응답: ${status} ${url.substring(0, 100)}... (${responseTime}ms)`);
        }
      }
    }
  });
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error' || text.includes('504') || text.includes('timeout')) {
      console.log(`🔴 콘솔 [${type}]: ${text}`);
    } else if (text.includes('갤러리') || text.includes('초기화')) {
      console.log(`📝 콘솔 [${type}]: ${text}`);
    }
  });
  
  try {
    console.log('🌐 배포 환경 페이지 로딩 중...');
    const startTime = Date.now();
    await page.goto('https://www.masgolf.co.kr/admin/gallery', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('⏳ 페이지 로딩 완료, 로그인 확인 중...');
    await page.waitForTimeout(2000);
    
    // 로그인 필요 여부 확인 및 자동 로그인
    const loginRequired = await page.locator('text=로그인, input[type="email"], input[name="email"]').count() > 0;
    if (loginRequired) {
      console.log('🔐 로그인 페이지 감지, 자동 로그인 시도...');
      
      // 이메일 입력
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      if (await emailInput.count() > 0) {
        await emailInput.fill('01066699000');
        console.log('✅ 이메일 입력 완료');
      }
      
      // 비밀번호 입력
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      if (await passwordInput.count() > 0) {
        await passwordInput.fill('66699000');
        console.log('✅ 비밀번호 입력 완료');
      }
      
      // 로그인 버튼 클릭
      const loginButton = page.locator('button:has-text("로그인"), button[type="submit"]').first();
      if (await loginButton.count() > 0) {
        await loginButton.click();
        console.log('✅ 로그인 버튼 클릭');
        await page.waitForTimeout(3000);
      }
      
      // 로그인 완료 대기
      console.log('⏳ 로그인 완료 대기 중...');
      await page.waitForTimeout(5000);
    }
    
    // 갤러리 페이지 로딩 대기
    console.log('⏳ 갤러리 페이지 로딩 대기 중...');
    await page.waitForTimeout(10000); // API 응답 대기
    
    // 이미지 개수 확인
    const imageCountText = await page.locator('text=/\\d+개 표시/').first().textContent().catch(() => null);
    console.log(`\n📸 이미지 개수 표시: ${imageCountText || '없음'}`);
    
    // 로딩 시간 확인
    const loadingTimeText = await page.locator('text=/⚡ \\d+ms/').first().textContent().catch(() => null);
    if (loadingTimeText) {
      const match = loadingTimeText.match(/⚡ (\d+)ms/);
      if (match) {
        const loadingTime = parseInt(match[1]);
        console.log(`⚡ 로딩 시간: ${loadingTime}ms`);
        
        if (loadingTime < 2000) {
          console.log('✅ 성능 우수! (2초 미만)');
        } else if (loadingTime < 5000) {
          console.log('⚠️ 성능 양호 (5초 미만)');
        } else {
          console.log('❌ 성능 개선 필요 (5초 이상)');
        }
      }
    }
    
    // API 응답 시간 요약
    console.log('\n📊 API 응답 시간 요약:');
    apiResponseTimes.forEach((api, index) => {
      const status = api.status === 200 ? '✅' : '❌';
      console.log(`   ${status} ${api.url}... - ${api.status} (${api.responseTime}ms)`);
    });
    
    // 전체 네트워크 에러 확인
    if (networkErrors.length > 0) {
      console.log(`\n❌ 네트워크 에러 (${networkErrors.length}개):`);
      networkErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.status} - ${error.url.substring(0, 80)}...`);
      });
    } else {
      console.log('\n✅ 네트워크 에러 없음');
    }
    
    // 스크린샷 저장
    console.log('\n📸 스크린샷 저장 중...');
    await page.screenshot({ 
      path: 'test-results/deployed-gallery-after-optimization.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장 완료');
    
    // 결과 요약
    const totalTime = Date.now() - startTime;
    console.log(`\n📊 테스트 완료 (총 소요 시간: ${totalTime}ms)`);
    console.log(`   - API 응답: ${apiResponseTimes.length}개`);
    console.log(`   - 에러: ${networkErrors.length}개`);
    console.log(`   - 성공: ${apiResponseTimes.filter(a => a.status === 200).length}개`);
    
  } catch (error) {
    console.error('❌ 테스트 중 에러 발생:', error);
    await page.screenshot({ 
      path: 'test-results/deployed-gallery-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
    console.log('\n✅ 테스트 완료');
  }
}

// 배포 후 2분 대기
console.log('⏳ 배포 후 2분 대기 중... (120초)');
setTimeout(() => {
  testDeployedGalleryAfterDeploy().catch(console.error);
}, 120000); // 2분 = 120초

