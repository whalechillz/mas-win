const { chromium } = require('playwright');

(async () => {
  console.log('Debugging save issue...');
  
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
    
    // 현재 블로그 포스트 목록 확인
    console.log('Checking current blog posts...');
    const existingPosts = await page.$$('[data-testid="blog-post-card"], .blog-post-card, .post-item');
    console.log(`Found ${existingPosts.length} existing blog posts`);
    
    // 새 게시물 작성 버튼 클릭
    console.log('Clicking new post button...');
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(2000);
    
    // 폼 상태 확인
    console.log('Checking form state...');
    
    // 제목 입력
    const title = "테스트 저장 문제 진단 - " + new Date().toLocaleString();
    const titleInput = page.locator('input').first();
    await titleInput.fill(title);
    console.log('✓ Title entered:', title);
    
    // 브랜드 전략 설정
    const selects = await page.$$('select');
    if (selects.length >= 6) {
      await selects[0].selectOption('information');
      await selects[1].selectOption('warm');
      await selects[2].selectOption('medium');
      await selects[3].selectOption('local_customers');
      await selects[4].selectOption('competitive_maintainer');
      await selects[5].selectOption('distance');
      console.log('✓ Brand strategy set');
    }
    
    // AI 콘텐츠 생성
    console.log('Generating AI content...');
    await page.click('button:has-text("🤖 AI 요약")');
    await page.waitForTimeout(3000);
    
    await page.click('button:has-text("🤖 AI 본문")');
    await page.waitForTimeout(5000);
    
    await page.click('button:has-text("🤖 AI 메타")');
    await page.waitForTimeout(3000);
    
    // 저장 버튼 클릭 전 상태 스크린샷
    await page.screenshot({ path: 'before-save-debug.png', fullPage: true });
    console.log('📸 Before save screenshot taken');
    
    // 저장 버튼 클릭
    console.log('Attempting to save...');
    await page.click('button:has-text("저장")');
    
    // 저장 후 대기 및 상태 확인
    await page.waitForTimeout(3000);
    
    // 저장 후 상태 스크린샷
    await page.screenshot({ path: 'after-save-debug.png', fullPage: true });
    console.log('📸 After save screenshot taken');
    
    // 네트워크 요청 확인
    console.log('Checking for network errors...');
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
    
    // 페이지 새로고침하여 저장된 포스트 확인
    console.log('Refreshing page to check saved posts...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 저장된 포스트 확인
    const postsAfterSave = await page.$$('[data-testid="blog-post-card"], .blog-post-card, .post-item');
    console.log(`Posts after save attempt: ${postsAfterSave.length}`);
    
    // 네트워크 응답 로그
    console.log('Network responses:');
    responses.forEach(resp => {
      console.log(`  ${resp.status} ${resp.statusText}: ${resp.url}`);
    });
    
    // 최종 상태 스크린샷
    await page.screenshot({ path: 'final-debug-state.png', fullPage: true });
    console.log('📸 Final state screenshot taken');
    
  } catch (error) {
    console.error('Error during debug:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
