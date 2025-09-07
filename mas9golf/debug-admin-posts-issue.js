const { chromium } = require('playwright');

(async () => {
  console.log('🔍 관리자 페이지에서 기존 글 문제 진단...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('📱 관리자 페이지 접속...');
    await page.goto('https://www.masgolf.co.kr/admin/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // 네트워크 요청 모니터링
    const apiResponses = [];
    page.on('response', response => {
      if (response.url().includes('/api/admin/blog')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // 콘솔 에러 모니터링
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    console.log('🔍 페이지 상태 확인...');
    
    // 로딩 상태 확인
    const loadingElements = await page.$$('.animate-spin, [data-testid="loading"]');
    if (loadingElements.length > 0) {
      console.log('⏳ 페이지가 로딩 중입니다...');
      await page.waitForTimeout(10000);
    }
    
    // 게시물 목록 확인
    const postElements = await page.$$('.border.border-gray-200, .blog-post-card, [data-testid="blog-post-card"]');
    console.log(`📝 발견된 게시물 요소: ${postElements.length}개`);
    
    // 빈 상태 메시지 확인
    const emptyMessages = await page.$$('text=게시물이 없습니다, text=No posts found, text=로딩 중');
    if (emptyMessages.length > 0) {
      console.log('⚠️ 빈 상태 메시지 발견');
    }
    
    // API 응답 확인
    console.log('\n🌐 API 응답:');
    apiResponses.forEach(resp => {
      console.log(`  ${resp.status} ${resp.statusText}: ${resp.url}`);
    });
    
    // 콘솔 에러 확인
    if (consoleErrors.length > 0) {
      console.log('\n❌ 콘솔 에러:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    // 페이지 소스에서 게시물 데이터 확인
    const pageContent = await page.content();
    if (pageContent.includes('게시물이 없습니다')) {
      console.log('⚠️ 페이지에 "게시물이 없습니다" 메시지 포함');
    }
    
    if (pageContent.includes('로딩 중')) {
      console.log('⚠️ 페이지에 "로딩 중" 메시지 포함');
    }
    
    // 수동으로 API 호출 테스트
    console.log('\n🧪 수동 API 호출 테스트...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/admin/blog');
        const data = await response.json();
        return {
          status: response.status,
          statusText: response.statusText,
          data: data
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });
    
    console.log('API 응답 결과:', JSON.stringify(apiResponse, null, 2));
    
    // 스크린샷 저장
    await page.screenshot({ path: 'admin-posts-debug.png', fullPage: true });
    console.log('📸 디버그 스크린샷 저장됨');
    
    // 페이지 새로고침 후 재확인
    console.log('\n🔄 페이지 새로고침...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const postElementsAfter = await page.$$('.border.border-gray-200, .blog-post-card, [data-testid="blog-post-card"]');
    console.log(`새로고침 후 게시물 요소: ${postElementsAfter.length}개`);
    
  } catch (error) {
    console.error('❌ 진단 중 오류:', error.message);
    await page.screenshot({ path: 'admin-debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
