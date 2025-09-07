const { chromium } = require('playwright');

(async () => {
  console.log('Verifying new blog posts on deployed site...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 공개 블로그 페이지 확인
    console.log('Checking public blog page...');
    await page.goto('https://www.masgolf.co.kr/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 블로그 포스트 개수 확인
    const postCards = await page.$$('[data-testid="blog-post-card"], .blog-post-card, .post-item, .blog-post');
    console.log(`Found ${postCards.length} blog post cards`);
    
    // 각 포스트의 제목 확인
    for (let i = 0; i < postCards.length; i++) {
      try {
        const title = await postCards[i].$eval('h2, h3, .post-title, .blog-title', el => el.textContent);
        console.log(`Post ${i + 1}: ${title}`);
      } catch (error) {
        console.log(`Post ${i + 1}: Could not read title`);
      }
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'verify-blog-posts.png', fullPage: true });
    console.log('📸 Blog page screenshot saved');
    
    // 관리자 페이지도 확인
    console.log('Checking admin page...');
    await page.goto('https://www.masgolf.co.kr/admin/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const adminPosts = await page.$$('[data-testid="blog-post-card"], .blog-post-card, .post-item');
    console.log(`Admin page shows ${adminPosts.length} blog posts`);
    
    // 관리자 페이지 스크린샷
    await page.screenshot({ path: 'verify-admin-posts.png', fullPage: true });
    console.log('📸 Admin page screenshot saved');
    
    console.log('\n✅ Verification complete!');
    console.log(`Public blog: ${postCards.length} posts`);
    console.log(`Admin page: ${adminPosts.length} posts`);
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    await page.screenshot({ path: 'verify-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
