const { chromium } = require('playwright');

(async () => {
  console.log('Debugging admin page blog posts issue...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to admin page...');
    await page.goto('https://www.masgolf.co.kr/admin/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 네트워크 요청 모니터링
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // 페이지 상태 확인
    console.log('Checking page content...');
    
    // 로딩 상태 확인
    const loadingElement = await page.$('.animate-spin');
    if (loadingElement) {
      console.log('⚠️ Page is still loading...');
      await page.waitForTimeout(5000);
    }
    
    // 게시물 목록 확인
    const postElements = await page.$$('[data-testid="blog-post-card"], .blog-post-card, .post-item, .border.border-gray-200');
    console.log(`Found ${postElements.length} post elements`);
    
    // 빈 상태 메시지 확인
    const emptyMessage = await page.$('text=게시물이 없습니다');
    if (emptyMessage) {
      console.log('⚠️ Empty state message found');
    }
    
    // API 응답 확인
    console.log('Network responses:');
    responses.forEach(resp => {
      console.log(`  ${resp.status} ${resp.statusText}: ${resp.url}`);
    });
    
    // 콘솔 에러 확인
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    // 페이지 새로고침
    console.log('Refreshing page...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 새로고침 후 상태 확인
    const postElementsAfter = await page.$$('[data-testid="blog-post-card"], .blog-post-card, .post-item, .border.border-gray-200');
    console.log(`After refresh: Found ${postElementsAfter.length} post elements`);
    
    // 스크린샷 저장
    await page.screenshot({ path: 'admin-debug-result.png', fullPage: true });
    console.log('📸 Debug screenshot saved');
    
    // 콘솔 에러 출력
    if (consoleMessages.length > 0) {
      console.log('Console errors:');
      consoleMessages.forEach(error => console.log(`  - ${error}`));
    }
    
    // 페이지 소스 일부 확인
    const pageContent = await page.content();
    if (pageContent.includes('로딩 중')) {
      console.log('⚠️ Page shows loading state');
    }
    
    if (pageContent.includes('게시물이 없습니다')) {
      console.log('⚠️ Page shows no posts message');
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error.message);
    await page.screenshot({ path: 'admin-debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
