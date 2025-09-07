const { chromium } = require('playwright');

(async () => {
  console.log('Starting AI blog creation with correct selectors...');
  
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
    
    // 첫 번째 블로그 포스트 생성
    console.log('Creating first blog post...');
    
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(2000);
    
    // 제목 입력 - 더 구체적인 선택자 사용
    const title1 = "박사장님의 골프 인생 2막 - MASGOLF 드라이버로 되찾은 자신감";
    
    // 첫 번째 input 요소에 제목 입력
    const titleInput = page.locator('input').first();
    await titleInput.fill(title1);
    console.log('Title entered:', title1);
    await page.waitForTimeout(500);
    
    // 브랜드 전략 설정 - select 요소들을 순서대로 찾아서 설정
    const selects = await page.$$('select');
    console.log(`Found ${selects.length} select elements`);
    
    if (selects.length >= 6) {
      await selects[0].selectOption('customer_story'); // 콘텐츠 유형
      await selects[1].selectOption('warm'); // 오디언스 온도
      await selects[2].selectOption('high'); // 브랜드 강도
      await selects[3].selectOption('local_customers'); // 고객 채널
      await selects[4].selectOption('distance'); // 페인 포인트
      await selects[5].selectOption('returning_60plus'); // 고객 페르소나
      console.log('Brand strategy settings applied');
    }
    
    await page.waitForTimeout(1000);
    
    // AI 요약 생성
    console.log('Generating AI summary...');
    await page.click('button:has-text("🤖 AI 요약")');
    await page.waitForTimeout(4000);
    
    // AI 본문 생성
    console.log('Generating AI content...');
    await page.click('button:has-text("🤖 AI 본문")');
    await page.waitForTimeout(6000);
    
    // AI 메타 생성
    console.log('Generating AI meta...');
    await page.click('button:has-text("🤖 AI 메타")');
    await page.waitForTimeout(4000);
    
    // 저장
    console.log('Saving first blog post...');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(3000);
    
    // 두 번째 블로그 포스트 생성
    console.log('Creating second blog post...');
    
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(2000);
    
    // 제목 입력
    const title2 = "🔥 2월 한정! 초고반발 드라이버 비거리 +25m 체험 이벤트";
    const titleInput2 = page.locator('input').first();
    await titleInput2.fill(title2);
    console.log('Title entered:', title2);
    await page.waitForTimeout(500);
    
    // 브랜드 전략 설정
    const selects2 = await page.$$('select');
    if (selects2.length >= 6) {
      await selects2[0].selectOption('event'); // 콘텐츠 유형
      await selects2[1].selectOption('hot'); // 오디언스 온도
      await selects2[2].selectOption('high'); // 브랜드 강도
      await selects2[3].selectOption('online_customers'); // 고객 채널
      await selects2[4].selectOption('cost'); // 페인 포인트
      await selects2[5].selectOption('high_rebound_enthusiast'); // 고객 페르소나
      console.log('Brand strategy settings applied for second post');
    }
    
    await page.waitForTimeout(1000);
    
    // AI 요약 생성
    console.log('Generating AI summary for second post...');
    await page.click('button:has-text("🤖 AI 요약")');
    await page.waitForTimeout(4000);
    
    // AI 본문 생성
    console.log('Generating AI content for second post...');
    await page.click('button:has-text("🤖 AI 본문")');
    await page.waitForTimeout(6000);
    
    // AI 메타 생성
    console.log('Generating AI meta for second post...');
    await page.click('button:has-text("🤖 AI 메타")');
    await page.waitForTimeout(4000);
    
    // 저장
    console.log('Saving second blog post...');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(3000);
    
    // 결과 확인
    console.log('Checking results...');
    await page.goto('https://www.masgolf.co.kr/admin/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 스크린샷 저장
    await page.screenshot({ path: 'ai-blogs-success-result.png', fullPage: true });
    
    console.log('✅ Successfully created 2 AI-generated blog posts!');
    console.log('📸 Screenshot saved as ai-blogs-success-result.png');
    
    // 공개 블로그 페이지 확인
    console.log('Checking public blog page...');
    await page.goto('https://www.masgolf.co.kr/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'public-blog-final-result.png', fullPage: true });
    console.log('📸 Public blog screenshot saved as public-blog-final-result.png');
    
  } catch (error) {
    console.error('Error during blog creation:', error.message);
    await page.screenshot({ path: 'ai-blogs-error.png', fullPage: true });
    console.error('Error details:', error);
  } finally {
    await browser.close();
  }
})();
