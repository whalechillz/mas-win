const { chromium } = require('playwright');

async function testStorytellingBlogCreation() {
  console.log('🎭 강력한 스토리텔링 시스템으로 블로그 생성 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 관리자 페이지 접속
    console.log('📝 관리자 페이지 접속 중...');
    await page.goto('https://www.masgolf.co.kr/admin/blog');
    await page.waitForLoadState('networkidle');
    
    // 2. 새 게시물 작성 버튼 클릭
    console.log('➕ 새 게시물 작성 폼 열기...');
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(2000);
    
    // 3. 고객 스토리 블로그 작성
    console.log('📖 고객 스토리 블로그 작성 시작...');
    
    // 제목 입력
    await page.fill('input[name="title"]', '60대 김씨의 골프 인생이 바뀐 이야기 - MASGOLF 드라이버로 찾은 자신감');
    
    // 브랜드 전략 설정
    console.log('🎯 브랜드 전략 설정...');
    
    // 콘텐츠 유형: 고객 스토리
    await page.selectOption('select:has(option[value="customer_story"])', 'customer_story');
    
    // 오디언스 온도: 따뜻한 오디언스
    await page.selectOption('select:has(option[value="warm"])', 'warm');
    
    // 브랜드 강도: 높음
    await page.selectOption('select:has(option[value="high"])', 'high');
    
    // 고객 채널: 내방고객
    await page.selectOption('select:has(option[value="local_customers"])', 'local_customers');
    
    // 고객 페르소나: 60대 이상 골퍼
    await page.selectOption('select:has(option[value="returning_60plus"])', 'returning_60plus');
    
    // 페인 포인트: 비거리 부족
    await page.selectOption('select:has(option[value="distance"])', 'distance');
    
    await page.waitForTimeout(2000);
    
    // 4. AI 요약 생성
    console.log('🤖 AI 요약 생성...');
    await page.click('button:has-text("🤖 AI 요약")');
    await page.waitForTimeout(5000);
    
    // 요약 확인
    const excerptValue = await page.inputValue('textarea[name="excerpt"]');
    console.log('✅ 생성된 요약:', excerptValue);
    
    // 5. AI 본문 생성
    console.log('🤖 AI 본문 생성...');
    await page.click('button:has-text("🤖 AI 본문")');
    await page.waitForTimeout(8000);
    
    // 본문 확인
    const contentValue = await page.inputValue('textarea[name="content"]');
    console.log('✅ 생성된 본문 길이:', contentValue ? contentValue.length : 0, '자');
    
    // 6. 대표 이미지 설정
    console.log('🖼️ 대표 이미지 설정...');
    await page.fill('input[name="featured_image"]', '/blog/images/customer-story-60s-golfer.jpg');
    
    // 7. 게시물 저장
    console.log('💾 게시물 저장...');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(3000);
    
    // 8. 두 번째 블로그 작성 - 이벤트 글
    console.log('🎉 두 번째 블로그 작성 - 이벤트 글...');
    
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(2000);
    
    // 제목 입력
    await page.fill('input[name="title"]', '🔥 한정 특가! 초고반발 드라이버로 비거리 +25m 증가 이벤트');
    
    // 브랜드 전략 설정
    await page.selectOption('select:has(option[value="event"])', 'event');
    await page.selectOption('select:has(option[value="hot"])', 'hot');
    await page.selectOption('select:has(option[value="high"])', 'high');
    await page.selectOption('select:has(option[value="local_customers"])', 'local_customers');
    await page.selectOption('select:has(option[value="high_rebound_enthusiast"])', 'high_rebound_enthusiast');
    await page.selectOption('select:has(option[value="distance"])', 'distance');
    
    await page.waitForTimeout(2000);
    
    // AI 콘텐츠 생성
    await page.click('button:has-text("🤖 AI 요약")');
    await page.waitForTimeout(5000);
    
    await page.click('button:has-text("🤖 AI 본문")');
    await page.waitForTimeout(8000);
    
    // 대표 이미지 설정
    await page.fill('input[name="featured_image"]', '/blog/images/event-summer-special.jpg');
    
    // 게시물 저장
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(3000);
    
    // 9. 세 번째 블로그 작성 - 튜토리얼 글
    console.log('📚 세 번째 블로그 작성 - 튜토리얼 글...');
    
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(2000);
    
    // 제목 입력
    await page.fill('input[name="title"]', '드라이버 비거리 향상을 위한 5가지 과학적 방법');
    
    // 브랜드 전략 설정
    await page.selectOption('select:has(option[value="tutorial"])', 'tutorial');
    await page.selectOption('select:has(option[value="warm"])', 'warm');
    await page.selectOption('select:has(option[value="medium"])', 'medium');
    await page.selectOption('select:has(option[value="online_customers"])', 'online_customers');
    await page.selectOption('select:has(option[value="distance_seeking_beginner"])', 'distance_seeking_beginner');
    await page.selectOption('select:has(option[value="accuracy"])', 'accuracy');
    
    await page.waitForTimeout(2000);
    
    // AI 콘텐츠 생성
    await page.click('button:has-text("🤖 AI 요약")');
    await page.waitForTimeout(5000);
    
    await page.click('button:has-text("🤖 AI 본문")');
    await page.waitForTimeout(8000);
    
    // 대표 이미지 설정
    await page.fill('input[name="featured_image"]', '/blog/images/tutorial-distance-improvement.jpg');
    
    // 게시물 저장
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(3000);
    
    // 10. 블로그 목록 확인
    console.log('📋 블로그 목록 확인...');
    await page.goto('https://www.masgolf.co.kr/blog');
    await page.waitForLoadState('networkidle');
    
    // 생성된 블로그 포스트들 확인
    const blogPosts = await page.$$('.blog-post-card, .post-card, [class*="post"]');
    console.log('✅ 생성된 블로그 포스트 수:', blogPosts.length);
    
    // 11. 첫 번째 블로그 포스트 클릭하여 상세 페이지 확인
    if (blogPosts.length > 0) {
      console.log('🔍 첫 번째 블로그 포스트 상세 페이지 확인...');
      await blogPosts[0].click();
      await page.waitForLoadState('networkidle');
      
      // 페이지 제목 확인
      const pageTitle = await page.title();
      console.log('✅ 페이지 제목:', pageTitle);
      
      // 콘텐츠 확인
      const content = await page.textContent('main, article, [class*="content"]');
      console.log('✅ 콘텐츠 길이:', content ? content.length : 0, '자');
    }
    
    console.log('🎉 강력한 스토리텔링 시스템으로 블로그 생성 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testStorytellingBlogCreation();
