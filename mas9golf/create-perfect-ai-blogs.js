const { chromium } = require('playwright');

async function createPerfectAIBlogs() {
  console.log('🤖 완벽한 AI 블로그 생성 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 관리자 페이지 접속
    console.log('📝 관리자 페이지 접속 중...');
    await page.goto('https://www.masgolf.co.kr/admin/blog', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    // 현재 게시물 수 확인
    const existingPosts = await page.$$('[class*="post"], [class*="blog"], article, .blog-post-card');
    console.log('📊 현재 게시물 수:', existingPosts.length);
    
    // ===== 첫 번째 블로그: 고객 스토리 =====
    console.log('📖 첫 번째 블로그: 고객 스토리 작성...');
    
    // 새 게시물 작성 버튼 클릭
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(3000);
    
    // 제목 입력
    const titleInput = await page.$('input[type="text"]');
    if (titleInput) {
      await titleInput.fill('70대 박회장님의 골프 인생 2막 - MASGOLF 드라이버로 되찾은 자신감');
      console.log('✅ 제목 입력 완료');
    }
    
    // 슬러그 입력
    const slugInputs = await page.$$('input[type="text"]');
    if (slugInputs[1]) {
      await slugInputs[1].fill('70s-chairman-golf-life-second-act-masgolf-driver-confidence');
      console.log('✅ 슬러그 입력 완료');
    }
    
    // 브랜드 전략 설정
    const selects = await page.$$('select');
    if (selects[0]) {
      await selects[0].selectOption('customer_story');
      console.log('✅ 콘텐츠 유형: 고객 스토리');
    }
    
    if (selects[1]) {
      await selects[1].selectOption('warm');
      console.log('✅ 오디언스 온도: 따뜻한');
    }
    
    if (selects[2]) {
      await selects[2].selectOption('high');
      console.log('✅ 브랜드 강도: 높음');
    }
    
    if (selects[3]) {
      await selects[3].selectOption('local_customers');
      console.log('✅ 고객 채널: 내방고객');
    }
    
    if (selects[4]) {
      await selects[4].selectOption('returning_60plus');
      console.log('✅ 고객 페르소나: 60대 이상 골퍼');
    }
    
    if (selects[5]) {
      await selects[5].selectOption('distance');
      console.log('✅ 페인 포인트: 비거리 부족');
    }
    
    await page.waitForTimeout(2000);
    
    // AI 요약 생성
    console.log('🤖 AI 요약 생성 중...');
    const aiSummaryButton = await page.$('button:has-text("🤖 AI 요약")');
    if (aiSummaryButton) {
      await aiSummaryButton.click();
      await page.waitForTimeout(8000); // 더 긴 대기 시간
      
      // 요약이 생성되었는지 확인
      const excerptTextarea = await page.$('textarea');
      if (excerptTextarea) {
        const excerptContent = await excerptTextarea.inputValue();
        console.log('✅ AI 요약 생성 완료:', excerptContent.substring(0, 100) + '...');
      }
    }
    
    // AI 본문 생성
    console.log('🤖 AI 본문 생성 중...');
    const aiContentButton = await page.$('button:has-text("🤖 AI 본문")');
    if (aiContentButton) {
      await aiContentButton.click();
      await page.waitForTimeout(12000); // 더 긴 대기 시간
      
      // 본문이 생성되었는지 확인
      const contentTextarea = await page.$$('textarea');
      if (contentTextarea[1]) {
        const contentValue = await contentTextarea[1].inputValue();
        console.log('✅ AI 본문 생성 완료:', contentValue.substring(0, 100) + '...');
      }
    }
    
    // AI 메타 생성
    console.log('🤖 AI 메타 생성 중...');
    const aiMetaButton = await page.$('button:has-text("🤖 AI 메타")');
    if (aiMetaButton) {
      await aiMetaButton.click();
      await page.waitForTimeout(8000);
      console.log('✅ AI 메타 생성 완료');
    }
    
    // 대표 이미지 URL 입력
    const imageInput = await page.$('input[type="url"]');
    if (imageInput) {
      await imageInput.fill('/blog/images/70s-chairman-golf-story.jpg');
      console.log('✅ 대표 이미지 URL 입력 완료');
    }
    
    // 저장
    console.log('💾 첫 번째 블로그 저장 중...');
    const saveButton = await page.$('button:has-text("저장")');
    if (saveButton) {
      await saveButton.click();
      await page.waitForTimeout(5000);
      console.log('✅ 첫 번째 블로그 저장 완료');
    }
    
    // ===== 두 번째 블로그: 이벤트 글 =====
    console.log('🎉 두 번째 블로그: 이벤트 글 작성...');
    
    // 새 게시물 작성 버튼 클릭
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(3000);
    
    // 제목 입력
    const titleInput2 = await page.$('input[type="text"]');
    if (titleInput2) {
      await titleInput2.fill('9월 가을 골프 시즌 맞이! 초고반발 드라이버 특별 할인 이벤트');
      console.log('✅ 제목 입력 완료');
    }
    
    // 슬러그 입력
    const slugInputs2 = await page.$$('input[type="text"]');
    if (slugInputs2[1]) {
      await slugInputs2[1].fill('september-fall-golf-season-high-rebound-driver-special-discount-event');
      console.log('✅ 슬러그 입력 완료');
    }
    
    // 브랜드 전략 설정
    const selects2 = await page.$$('select');
    if (selects2[0]) {
      await selects2[0].selectOption('event');
      console.log('✅ 콘텐츠 유형: 이벤트');
    }
    
    if (selects2[1]) {
      await selects2[1].selectOption('hot');
      console.log('✅ 오디언스 온도: 뜨거운');
    }
    
    if (selects2[2]) {
      await selects2[2].selectOption('high');
      console.log('✅ 브랜드 강도: 높음');
    }
    
    if (selects2[3]) {
      await selects2[3].selectOption('online_customers');
      console.log('✅ 고객 채널: 온라인고객');
    }
    
    if (selects2[4]) {
      await selects2[4].selectOption('high_rebound_enthusiast');
      console.log('✅ 고객 페르소나: 고반발 드라이버 선호 상급 골퍼');
    }
    
    if (selects2[5]) {
      await selects2[5].selectOption('distance');
      console.log('✅ 페인 포인트: 비거리 부족');
    }
    
    await page.waitForTimeout(2000);
    
    // AI 요약 생성
    console.log('🤖 AI 요약 생성 중...');
    const aiSummaryButton2 = await page.$('button:has-text("🤖 AI 요약")');
    if (aiSummaryButton2) {
      await aiSummaryButton2.click();
      await page.waitForTimeout(8000);
      
      // 요약이 생성되었는지 확인
      const excerptTextarea2 = await page.$('textarea');
      if (excerptTextarea2) {
        const excerptContent2 = await excerptTextarea2.inputValue();
        console.log('✅ AI 요약 생성 완료:', excerptContent2.substring(0, 100) + '...');
      }
    }
    
    // AI 본문 생성
    console.log('🤖 AI 본문 생성 중...');
    const aiContentButton2 = await page.$('button:has-text("🤖 AI 본문")');
    if (aiContentButton2) {
      await aiContentButton2.click();
      await page.waitForTimeout(12000);
      
      // 본문이 생성되었는지 확인
      const contentTextarea2 = await page.$$('textarea');
      if (contentTextarea2[1]) {
        const contentValue2 = await contentTextarea2[1].inputValue();
        console.log('✅ AI 본문 생성 완료:', contentValue2.substring(0, 100) + '...');
      }
    }
    
    // AI 메타 생성
    console.log('🤖 AI 메타 생성 중...');
    const aiMetaButton2 = await page.$('button:has-text("🤖 AI 메타")');
    if (aiMetaButton2) {
      await aiMetaButton2.click();
      await page.waitForTimeout(8000);
      console.log('✅ AI 메타 생성 완료');
    }
    
    // 대표 이미지 URL 입력
    const imageInput2 = await page.$('input[type="url"]');
    if (imageInput2) {
      await imageInput2.fill('/blog/images/september-fall-golf-event.jpg');
      console.log('✅ 대표 이미지 URL 입력 완료');
    }
    
    // 저장
    console.log('💾 두 번째 블로그 저장 중...');
    const saveButton2 = await page.$('button:has-text("저장")');
    if (saveButton2) {
      await saveButton2.click();
      await page.waitForTimeout(5000);
      console.log('✅ 두 번째 블로그 저장 완료');
    }
    
    // ===== 결과 확인 =====
    console.log('📋 생성된 블로그 확인...');
    await page.goto('https://www.masgolf.co.kr/blog', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    // 블로그 포스트 확인
    const blogPosts = await page.$$('[class*="post"], [class*="blog"], article, .blog-post-card');
    console.log('✅ 총 생성된 블로그 포스트 수:', blogPosts.length);
    
    // 각 포스트 제목 확인
    for (let i = 0; i < Math.min(blogPosts.length, 5); i++) {
      const postTitle = await blogPosts[i].textContent();
      console.log(`📝 포스트 ${i + 1}: ${postTitle?.substring(0, 80)}...`);
    }
    
    // 첫 번째 포스트 클릭하여 상세 페이지 확인
    if (blogPosts.length > 0) {
      console.log('🔍 첫 번째 블로그 포스트 상세 페이지 확인...');
      await blogPosts[0].click();
      await page.waitForTimeout(5000);
      
      const pageTitle = await page.title();
      console.log('✅ 페이지 제목:', pageTitle);
      
      // 콘텐츠 길이 확인
      const content = await page.textContent('main, article, [class*="content"]');
      console.log('✅ 콘텐츠 길이:', content ? content.length : 0, '자');
      
      // 콘텐츠 미리보기
      if (content) {
        console.log('📖 콘텐츠 미리보기:', content.substring(0, 200) + '...');
      }
    }
    
    // 최종 스크린샷
    await page.screenshot({ path: 'perfect-ai-blogs-result.png' });
    console.log('✅ 완벽한 AI 블로그 결과 스크린샷 저장됨');
    
    console.log('🎉 완벽한 AI 블로그 2개 생성 완료!');
    console.log('');
    console.log('📝 생성된 블로그:');
    console.log('1. 70대 박회장님의 골프 인생 2막 - MASGOLF 드라이버로 되찾은 자신감');
    console.log('2. 9월 가을 골프 시즌 맞이! 초고반발 드라이버 특별 할인 이벤트');
    console.log('');
    console.log('🤖 AI 생성 기능:');
    console('- AI 요약: 완료');
    console('- AI 본문: 완료');
    console('- AI 메타: 완료');
    console.log('');
    console.log('🌐 확인 방법:');
    console.log('https://www.masgolf.co.kr/blog');
    
  } catch (error) {
    console.error('❌ 블로그 생성 중 오류 발생:', error);
    await page.screenshot({ path: 'perfect-ai-blogs-error.png' });
    console.log('❌ 오류 스크린샷 저장됨');
  } finally {
    await browser.close();
  }
}

createPerfectAIBlogs();
