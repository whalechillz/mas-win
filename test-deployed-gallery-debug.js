const { chromium } = require('playwright');

async function testDeployedGallery() {
  console.log('🔍 배포 환경 갤러리 디버깅 시작...');
  console.log('URL: https://www.masgolf.co.kr/admin/gallery\n');
  
  const browser = await chromium.launch({ 
    headless: false, // 개발자 모드로 실행
    slowMo: 500 // 동작을 천천히 보기 위해
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    // 실제 브라우저처럼 보이도록
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // 네트워크 요청 모니터링
  const networkRequests = [];
  const networkErrors = [];
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/admin/') || url.includes('supabase')) {
      networkRequests.push({
        url,
        method: request.method(),
        timestamp: Date.now(),
        status: 'pending'
      });
      console.log(`📤 요청: ${request.method()} ${url.substring(0, 100)}...`);
    }
  });
  
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('/api/admin/') || url.includes('supabase')) {
      const request = networkRequests.find(r => r.url === url && r.status === 'pending');
      if (request) {
        request.status = status;
        request.responseTime = Date.now() - request.timestamp;
      }
      
      if (status >= 400) {
        networkErrors.push({
          url,
          status,
          timestamp: Date.now()
        });
        console.log(`❌ 에러 응답: ${status} ${url.substring(0, 100)}...`);
      } else {
        console.log(`✅ 응답: ${status} ${url.substring(0, 100)}... (${Date.now() - (request?.timestamp || Date.now())}ms)`);
      }
    }
  });
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error' || text.includes('504') || text.includes('timeout') || text.includes('에러')) {
      console.log(`🔴 콘솔 [${type}]: ${text}`);
    } else if (text.includes('이미지') || text.includes('갤러리') || text.includes('API')) {
      console.log(`📝 콘솔 [${type}]: ${text}`);
    }
  });
  
  // 페이지 에러 캡처
  page.on('pageerror', error => {
    console.log(`💥 페이지 에러: ${error.message}`);
  });
  
  try {
    console.log('🌐 배포 환경 페이지 로딩 중...');
    await page.goto('https://www.masgolf.co.kr/admin/gallery', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('⏳ 페이지 로딩 완료, 5초 대기...');
    await page.waitForTimeout(5000);
    
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
    
    // 갤러리 페이지 요소 확인
    console.log('\n📊 페이지 상태 확인 중...');
    
    // 이미지 개수 확인
    const imageCountText = await page.locator('text=/\\d+개 표시/').first().textContent().catch(() => null);
    console.log(`📸 이미지 개수 표시: ${imageCountText || '없음'}`);
    
    // 에러 메시지 확인
    const errorMessage = await page.locator('text=이미지가 없습니다, text=에러, text=timeout, text=504').first().textContent().catch(() => null);
    if (errorMessage) {
      console.log(`⚠️ 에러 메시지 발견: ${errorMessage}`);
    }
    
    // API 응답 확인을 위해 네트워크 탭 스냅샷
    console.log('\n📡 네트워크 요청 분석...');
    await page.waitForTimeout(10000); // 추가 10초 대기 (API 응답 대기)
    
    // all-images API 응답 확인
    const allImagesResponse = networkRequests.find(r => r.url.includes('/api/admin/all-images'));
    if (allImagesResponse) {
      console.log(`\n📊 all-images API 상태:`);
      console.log(`   URL: ${allImagesResponse.url}`);
      console.log(`   상태: ${allImagesResponse.status}`);
      console.log(`   응답 시간: ${allImagesResponse.responseTime}ms`);
      
      if (allImagesResponse.status >= 400) {
        // 에러 응답 내용 확인
        try {
          const response = await page.request.get(allImagesResponse.url);
          const body = await response.text();
          console.log(`   에러 내용: ${body.substring(0, 500)}`);
        } catch (e) {
          console.log(`   에러 내용 확인 실패: ${e.message}`);
        }
      }
    }
    
    // folders API 응답 확인
    const foldersResponse = networkRequests.find(r => r.url.includes('/api/admin/folders'));
    if (foldersResponse) {
      console.log(`\n📊 folders API 상태:`);
      console.log(`   URL: ${foldersResponse.url}`);
      console.log(`   상태: ${foldersResponse.status}`);
      console.log(`   응답 시간: ${foldersResponse.responseTime}ms`);
    }
    
    // 전체 네트워크 에러 요약
    if (networkErrors.length > 0) {
      console.log(`\n❌ 네트워크 에러 요약 (${networkErrors.length}개):`);
      networkErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.status} - ${error.url.substring(0, 80)}...`);
      });
    }
    
    // 스크린샷 저장
    console.log('\n📸 스크린샷 저장 중...');
    await page.screenshot({ 
      path: 'test-results/deployed-gallery-debug.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장 완료: test-results/deployed-gallery-debug.png');
    
    // 네트워크 요청 로그 저장
    const fs = require('fs');
    const path = require('path');
    const resultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(resultsDir, 'deployed-gallery-network.json'),
      JSON.stringify({
        requests: networkRequests,
        errors: networkErrors,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
    console.log('✅ 네트워크 로그 저장 완료: test-results/deployed-gallery-network.json');
    
    console.log('\n⏳ 10초 더 대기 후 종료...');
    await page.waitForTimeout(10000);
    
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

testDeployedGallery().catch(console.error);

