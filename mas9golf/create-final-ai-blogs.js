const { chromium } = require('playwright');

(async () => {
  console.log('Creating final AI blogs with correct option values...');
  
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
    await page.waitForTimeout(2000);
    
    // 제목 입력
    const title1 = "박사장님의 골프 인생 2막 - MASGOLF 드라이버로 되찾은 자신감";
    const titleInput = page.locator('input').first();
    await titleInput.fill(title1);
    console.log('✓ Title entered:', title1);
    await page.waitForTimeout(500);
    
    // 브랜드 전략 설정 (올바른 순서와 값 사용)
    const selects = await page.$$('select');
    
    // Select 0: 콘텐츠 유형
    await selects[0].selectOption('customer_story');
    console.log('✓ Content type: customer_story');
    
    // Select 1: 오디언스 온도  
    await selects[1].selectOption('warm');
    console.log('✓ Audience temp: warm');
    
    // Select 2: 브랜드 강도
    await selects[2].selectOption('high');
    console.log('✓ Brand weight: high');
    
    // Select 3: 고객 채널
    await selects[3].selectOption('local_customers');
    console.log('✓ Customer channel: local_customers');
    
    // Select 4: 고객 페르소나
    await selects[4].selectOption('returning_60plus');
    console.log('✓ Customer persona: returning_60plus');
    
    // Select 5: 페인 포인트
    await selects[5].selectOption('distance');
    console.log('✓ Pain point: distance');
    
    await page.waitForTimeout(1000);
    
    // AI 요약 생성
    console.log('Generating AI summary...');
    await page.click('button:has-text("🤖 AI 요약")');
    await page.waitForTimeout(5000);
    
    // AI 본문 생성
    console.log('Generating AI content...');
    await page.click('button:has-text("🤖 AI 본문")');
    await page.waitForTimeout(8000);
    
    // AI 메타 생성
    console.log('Generating AI meta...');
    await page.click('button:has-text("🤖 AI 메타")');
    await page.waitForTimeout(5000);
    
    // 저장
    console.log('Saving first blog post...');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(3000);
    
    console.log('✅ First blog post created successfully!');
    
    // 두 번째 블로그 포스트 생성 (이벤트)
    console.log('Creating second blog post (Event)...');
    
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(2000);
    
    // 제목 입력
    const title2 = "🔥 2월 한정! 초고반발 드라이버 비거리 +25m 체험 이벤트";
    const titleInput2 = page.locator('input').first();
    await titleInput2.fill(title2);
    console.log('✓ Title entered:', title2);
    await page.waitForTimeout(500);
    
    // 브랜드 전략 설정
    const selects2 = await page.$$('select');
    
    // Select 0: 콘텐츠 유형
    await selects2[0].selectOption('event');
    console.log('✓ Content type: event');
    
    // Select 1: 오디언스 온도  
    await selects2[1].selectOption('hot');
    console.log('✓ Audience temp: hot');
    
    // Select 2: 브랜드 강도
    await selects2[2].selectOption('high');
    console.log('✓ Brand weight: high');
    
    // Select 3: 고객 채널
    await selects2[3].selectOption('online_customers');
    console.log('✓ Customer channel: online_customers');
    
    // Select 4: 고객 페르소나
    await selects2[4].selectOption('high_rebound_enthusiast');
    console.log('✓ Customer persona: high_rebound_enthusiast');
    
    // Select 5: 페인 포인트
    await selects2[5].selectOption('cost');
    console.log('✓ Pain point: cost');
    
    await page.waitForTimeout(1000);
    
    // AI 요약 생성
    console.log('Generating AI summary for second post...');
    await page.click('button:has-text("🤖 AI 요약")');
    await page.waitForTimeout(5000);
    
    // AI 본문 생성
    console.log('Generating AI content for second post...');
    await page.click('button:has-text("🤖 AI 본문")');
    await page.waitForTimeout(8000);
    
    // AI 메타 생성
    console.log('Generating AI meta for second post...');
    await page.click('button:has-text("🤖 AI 메타")');
    await page.waitForTimeout(5000);
    
    // 저장
    console.log('Saving second blog post...');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(3000);
    
    console.log('✅ Second blog post created successfully!');
    
    // 결과 확인
    console.log('📊 Checking final results...');
    await page.goto('https://www.masgolf.co.kr/admin/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 관리자 페이지 스크린샷
    await page.screenshot({ path: 'final-admin-result.png', fullPage: true });
    console.log('📸 Admin page screenshot saved');
    
    // 공개 블로그 페이지 확인
    console.log('Checking public blog page...');
    await page.goto('https://www.masgolf.co.kr/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 공개 블로그 페이지 스크린샷
    await page.screenshot({ path: 'final-public-blog-result.png', fullPage: true });
    console.log('📸 Public blog screenshot saved');
    
    console.log('\n🎉 SUCCESS! 2 AI-generated blog posts created:');
    console.log('1. 박사장님의 골프 인생 2막 - MASGOLF 드라이버로 되찾은 자신감 (Customer Story)');
    console.log('2. 🔥 2월 한정! 초고반발 드라이버 비거리 +25m 체험 이벤트 (Event)');
    console.log('\n📸 Screenshots saved:');
    console.log('- final-admin-result.png (Admin page)');
    console.log('- final-public-blog-result.png (Public blog)');
    
  } catch (error) {
    console.error('❌ Error during blog creation:', error.message);
    await page.screenshot({ path: 'final-error.png', fullPage: true });
    console.error('Full error:', error);
  } finally {
    await browser.close();
  }
})();
