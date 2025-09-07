const { chromium } = require('playwright');

(async () => {
  console.log('Starting Playwright blog creation...');
  
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
    
    // 첫 번째 블로그 포스트 생성 (고객 스토리)
    console.log('Creating first blog post (Customer Story)...');
    
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(1000);
    
    // 제목 입력
    const title1 = "박사장님의 골프 인생 2막 - MASGOLF 드라이버로 되찾은 자신감과 동료들의 부러움";
    await page.fill('input[placeholder="제목을 입력하세요"]', title1);
    await page.waitForTimeout(500);
    
    // 브랜드 전략 설정
    await page.selectOption('select:near(:text("콘텐츠 유형"))', 'customer_story');
    await page.selectOption('select:near(:text("오디언스 온도"))', 'warm');
    await page.selectOption('select:near(:text("브랜드 강도"))', 'high');
    await page.selectOption('select:near(:text("고객 채널"))', 'local_customers');
    await page.selectOption('select:near(:text("페인 포인트"))', 'distance');
    await page.selectOption('select:near(:text("고객 페르소나"))', 'returning_60plus');
    
    // AI 요약 생성
    console.log('Generating AI summary...');
    await page.click('button:has-text("🤖 AI 요약")');
    await page.waitForTimeout(3000);
    
    // AI 본문 생성
    console.log('Generating AI content...');
    await page.click('button:has-text("🤖 AI 본문")');
    await page.waitForTimeout(5000);
    
    // AI 메타 생성
    console.log('Generating AI meta...');
    await page.click('button:has-text("🤖 AI 메타")');
    await page.waitForTimeout(3000);
    
    // 저장
    console.log('Saving first blog post...');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(2000);
    
    // 두 번째 블로그 포스트 생성 (이벤트)
    console.log('Creating second blog post (Event)...');
    
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(1000);
    
    // 제목 입력
    const title2 = "🔥 2월 한정 특가! 초고반발 드라이버로 비거리 +25m 증가 체험하세요";
    await page.fill('input[placeholder="제목을 입력하세요"]', title2);
    await page.waitForTimeout(500);
    
    // 브랜드 전략 설정
    await page.selectOption('select:near(:text("콘텐츠 유형"))', 'event');
    await page.selectOption('select:near(:text("오디언스 온도"))', 'hot');
    await page.selectOption('select:near(:text("브랜드 강도"))', 'high');
    await page.selectOption('select:near(:text("고객 채널"))', 'online_customers');
    await page.selectOption('select:near(:text("페인 포인트"))', 'cost');
    await page.selectOption('select:near(:text("고객 페르소나"))', 'high_rebound_enthusiast');
    
    // AI 요약 생성
    console.log('Generating AI summary for second post...');
    await page.click('button:has-text("🤖 AI 요약")');
    await page.waitForTimeout(3000);
    
    // AI 본문 생성
    console.log('Generating AI content for second post...');
    await page.click('button:has-text("🤖 AI 본문")');
    await page.waitForTimeout(5000);
    
    // AI 메타 생성
    console.log('Generating AI meta for second post...');
    await page.click('button:has-text("🤖 AI 메타")');
    await page.waitForTimeout(3000);
    
    // 저장
    console.log('Saving second blog post...');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(2000);
    
    // 결과 확인
    console.log('Checking results...');
    await page.goto('https://www.masgolf.co.kr/admin/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 스크린샷 저장
    await page.screenshot({ path: 'mas9golf/perfect-ai-blogs-fixed-result.png', fullPage: true });
    
    console.log('✅ Successfully created 2 AI-generated blog posts!');
    console.log('📸 Screenshot saved as perfect-ai-blogs-fixed-result.png');
    
    // 블로그 목록 페이지도 확인
    console.log('Checking public blog page...');
    await page.goto('https://www.masgolf.co.kr/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'mas9golf/public-blog-with-new-posts.png', fullPage: true });
    console.log('📸 Public blog screenshot saved as public-blog-with-new-posts.png');
    
  } catch (error) {
    console.error('Error during blog creation:', error.message);
    await page.screenshot({ path: 'mas9golf/perfect-ai-blogs-fixed-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
