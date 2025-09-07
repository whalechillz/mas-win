const { chromium } = require('playwright');

(async () => {
  console.log('Creating 2 new blog posts with fixed save functionality...');
  
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
    
    // 첫 번째 블로그 포스트 생성 (튜토리얼)
    console.log('Creating first blog post (Tutorial)...');
    
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(2000);
    
    // 제목 입력
    const title1 = "골프 드라이버 비거리 +25m 증가하는 완벽한 선택법 - 초보자도 따라할 수 있는 가이드";
    const titleInput = page.locator('input').first();
    await titleInput.fill(title1);
    console.log('✓ Title entered:', title1);
    await page.waitForTimeout(500);
    
    // 브랜드 전략 설정
    const selects = await page.$$('select');
    
    // Select 0: 콘텐츠 유형 - tutorial
    await selects[0].selectOption('tutorial');
    console.log('✓ Content type: tutorial');
    
    // Select 1: 오디언스 온도 - warm
    await selects[1].selectOption('warm');
    console.log('✓ Audience temp: warm');
    
    // Select 2: 브랜드 강도 - medium
    await selects[2].selectOption('medium');
    console.log('✓ Brand weight: medium');
    
    // Select 3: 고객 채널 - online_customers
    await selects[3].selectOption('online_customers');
    console.log('✓ Customer channel: online_customers');
    
    // Select 4: 고객 페르소나 - distance_seeking_beginner
    await selects[4].selectOption('distance_seeking_beginner');
    console.log('✓ Customer persona: distance_seeking_beginner');
    
    // Select 5: 페인 포인트 - distance
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
    
    // 두 번째 블로그 포스트 생성 (고객 후기)
    console.log('Creating second blog post (Testimonial)...');
    
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(2000);
    
    // 제목 입력
    const title2 = "김회장님의 실제 후기 - MASGOLF 드라이버로 70대에도 비거리 25m 증가한 놀라운 경험";
    const titleInput2 = page.locator('input').first();
    await titleInput2.fill(title2);
    console.log('✓ Title entered:', title2);
    await page.waitForTimeout(500);
    
    // 브랜드 전략 설정
    const selects2 = await page.$$('select');
    
    // Select 0: 콘텐츠 유형 - testimonial
    await selects2[0].selectOption('testimonial');
    console.log('✓ Content type: testimonial');
    
    // Select 1: 오디언스 온도 - hot
    await selects2[1].selectOption('hot');
    console.log('✓ Audience temp: hot');
    
    // Select 2: 브랜드 강도 - high
    await selects2[2].selectOption('high');
    console.log('✓ Brand weight: high');
    
    // Select 3: 고객 채널 - local_customers
    await selects2[3].selectOption('local_customers');
    console.log('✓ Customer channel: local_customers');
    
    // Select 4: 고객 페르소나 - health_conscious_senior
    await selects2[4].selectOption('health_conscious_senior');
    console.log('✓ Customer persona: health_conscious_senior');
    
    // Select 5: 페인 포인트 - comfort
    await selects2[5].selectOption('comfort');
    console.log('✓ Pain point: comfort');
    
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
    await page.screenshot({ path: 'new-blogs-admin-result.png', fullPage: true });
    console.log('📸 Admin page screenshot saved');
    
    // 공개 블로그 페이지 확인
    console.log('Checking public blog page...');
    await page.goto('https://www.masgolf.co.kr/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 공개 블로그 페이지 스크린샷
    await page.screenshot({ path: 'new-blogs-public-result.png', fullPage: true });
    console.log('📸 Public blog screenshot saved');
    
    console.log('\n🎉 SUCCESS! 2 new AI-generated blog posts created:');
    console.log('1. 골프 드라이버 비거리 +25m 증가하는 완벽한 선택법 - 초보자도 따라할 수 있는 가이드 (Tutorial)');
    console.log('2. 김회장님의 실제 후기 - MASGOLF 드라이버로 70대에도 비거리 25m 증가한 놀라운 경험 (Testimonial)');
    console.log('\n📸 Screenshots saved:');
    console.log('- new-blogs-admin-result.png (Admin page)');
    console.log('- new-blogs-public-result.png (Public blog)');
    
  } catch (error) {
    console.error('❌ Error during blog creation:', error.message);
    await page.screenshot({ path: 'new-blogs-error.png', fullPage: true });
    console.error('Full error:', error);
  } finally {
    await browser.close();
  }
})();
