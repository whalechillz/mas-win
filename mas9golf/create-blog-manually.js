const { chromium } = require('playwright');

async function createBlogManually() {
  console.log('📝 수동으로 블로그 생성 시작...');
  
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
    
    // 2. 새 게시물 작성 버튼 클릭
    console.log('➕ 새 게시물 작성 버튼 클릭...');
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(3000);
    
    // 3. 첫 번째 입력 필드에 제목 입력 (name 속성 없이)
    console.log('📝 제목 입력...');
    const firstInput = await page.$('input[type="text"]');
    if (firstInput) {
      await firstInput.fill('60대 김씨의 골프 인생이 바뀐 이야기 - MASGOLF 드라이버로 찾은 자신감');
      console.log('✅ 제목 입력 완료');
    }
    
    // 4. 두 번째 입력 필드에 슬러그 입력
    console.log('🔗 슬러그 입력...');
    const secondInput = await page.$$('input[type="text"]');
    if (secondInput[1]) {
      await secondInput[1].fill('60s-golfer-life-changed-story-masgolf-driver');
      console.log('✅ 슬러그 입력 완료');
    }
    
    // 5. 브랜드 전략 설정
    console.log('🎯 브랜드 전략 설정...');
    
    // 콘텐츠 유형 선택
    const contentTypeSelect = await page.$('select');
    if (contentTypeSelect) {
      await contentTypeSelect.selectOption('customer_story');
      console.log('✅ 콘텐츠 유형: 고객 스토리 선택');
    }
    
    // 6. AI 요약 생성
    console.log('🤖 AI 요약 생성...');
    const aiSummaryButton = await page.$('button:has-text("🤖 AI 요약")');
    if (aiSummaryButton) {
      await aiSummaryButton.click();
      await page.waitForTimeout(5000);
      console.log('✅ AI 요약 생성 완료');
    }
    
    // 7. AI 본문 생성
    console.log('🤖 AI 본문 생성...');
    const aiContentButton = await page.$('button:has-text("🤖 AI 본문")');
    if (aiContentButton) {
      await aiContentButton.click();
      await page.waitForTimeout(8000);
      console.log('✅ AI 본문 생성 완료');
    }
    
    // 8. 대표 이미지 URL 입력
    console.log('🖼️ 대표 이미지 URL 입력...');
    const imageInput = await page.$('input[type="url"]');
    if (imageInput) {
      await imageInput.fill('/blog/images/customer-story-60s-golfer.jpg');
      console.log('✅ 대표 이미지 URL 입력 완료');
    }
    
    // 9. 저장 버튼 클릭
    console.log('💾 게시물 저장...');
    const saveButton = await page.$('button:has-text("저장")');
    if (saveButton) {
      await saveButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ 게시물 저장 완료');
    }
    
    // 10. 두 번째 블로그 작성 - 이벤트 글
    console.log('🎉 두 번째 블로그 작성 - 이벤트 글...');
    
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(3000);
    
    // 제목 입력
    const firstInput2 = await page.$('input[type="text"]');
    if (firstInput2) {
      await firstInput2.fill('🔥 한정 특가! 초고반발 드라이버로 비거리 +25m 증가 이벤트');
    }
    
    // 슬러그 입력
    const secondInput2 = await page.$$('input[type="text"]');
    if (secondInput2[1]) {
      await secondInput2[1].fill('limited-special-high-rebound-driver-distance-25m-increase-event');
    }
    
    // 콘텐츠 유형: 이벤트
    const contentTypeSelect2 = await page.$('select');
    if (contentTypeSelect2) {
      await contentTypeSelect2.selectOption('event');
    }
    
    // AI 콘텐츠 생성
    const aiSummaryButton2 = await page.$('button:has-text("🤖 AI 요약")');
    if (aiSummaryButton2) {
      await aiSummaryButton2.click();
      await page.waitForTimeout(5000);
    }
    
    const aiContentButton2 = await page.$('button:has-text("🤖 AI 본문")');
    if (aiContentButton2) {
      await aiContentButton2.click();
      await page.waitForTimeout(8000);
    }
    
    // 대표 이미지
    const imageInput2 = await page.$('input[type="url"]');
    if (imageInput2) {
      await imageInput2.fill('/blog/images/event-summer-special.jpg');
    }
    
    // 저장
    const saveButton2 = await page.$('button:has-text("저장")');
    if (saveButton2) {
      await saveButton2.click();
      await page.waitForTimeout(3000);
    }
    
    // 11. 블로그 목록 확인
    console.log('📋 블로그 목록 확인...');
    await page.goto('https://www.masgolf.co.kr/blog', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // 블로그 포스트 확인
    const blogPosts = await page.$$('[class*="post"], [class*="blog"], article, .blog-post-card');
    console.log('✅ 생성된 블로그 포스트 수:', blogPosts.length);
    
    // 첫 번째 포스트 클릭
    if (blogPosts.length > 0) {
      console.log('🔍 첫 번째 블로그 포스트 상세 페이지 확인...');
      await blogPosts[0].click();
      await page.waitForTimeout(3000);
      
      const pageTitle = await page.title();
      console.log('✅ 페이지 제목:', pageTitle);
    }
    
    // 최종 스크린샷
    await page.screenshot({ path: 'final-blog-result.png' });
    console.log('✅ 최종 결과 스크린샷 저장됨');
    
    console.log('🎉 수동 블로그 생성 완료!');
    
  } catch (error) {
    console.error('❌ 블로그 생성 중 오류 발생:', error);
    await page.screenshot({ path: 'blog-creation-error.png' });
    console.log('❌ 오류 스크린샷 저장됨');
  } finally {
    await browser.close();
  }
}

createBlogManually();
