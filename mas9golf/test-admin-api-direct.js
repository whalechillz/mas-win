const { chromium } = require('playwright');

(async () => {
  console.log('🔍 관리자 API 직접 테스트...');
  
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
    
    // API 직접 호출
    console.log('🧪 API 직접 호출...');
    const apiResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/admin/blog', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const text = await response.text();
        console.log('Raw response:', text);
        
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { raw: text, parseError: e.message };
        }
        
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: data
        };
      } catch (error) {
        return {
          error: error.message,
          stack: error.stack
        };
      }
    });
    
    console.log('API 결과:', JSON.stringify(apiResult, null, 2));
    
    // 페이지에서 게시물 목록 확인
    console.log('\n📝 페이지에서 게시물 확인...');
    const posts = await page.evaluate(() => {
      const postElements = document.querySelectorAll('.border.border-gray-200, .blog-post-card, [data-testid="blog-post-card"]');
      const posts = [];
      
      postElements.forEach((element, index) => {
        const title = element.querySelector('h3, .text-lg, .font-semibold')?.textContent?.trim();
        const id = element.querySelector('[data-testid="post-id"]')?.textContent?.trim();
        posts.push({ index, title, id, element: element.outerHTML.substring(0, 200) });
      });
      
      return posts;
    });
    
    console.log('발견된 게시물:', posts);
    
    // 빈 상태 메시지 확인
    const emptyState = await page.evaluate(() => {
      const emptyMessages = document.querySelectorAll('text=게시물이 없습니다, text=No posts found, text=로딩 중');
      return Array.from(emptyMessages).map(msg => msg.textContent);
    });
    
    if (emptyState.length > 0) {
      console.log('빈 상태 메시지:', emptyState);
    }
    
    // 스크린샷
    await page.screenshot({ path: 'admin-api-test.png', fullPage: true });
    console.log('📸 스크린샷 저장됨');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
    await page.screenshot({ path: 'admin-api-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
