const { chromium } = require('playwright');

async function createRealBlogsToday() {
  console.log('📝 오늘 작성할 실제 블로그 2개 생성 시작...');
  
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
    
    // ===== 첫 번째 블로그: 고객 스토리 =====
    console.log('📖 첫 번째 블로그: 고객 스토리 작성...');
    
    // 새 게시물 작성 버튼 클릭
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(3000);
    
    // 제목 입력
    const firstInput = await page.$('input[type="text"]');
    if (firstInput) {
      await firstInput.fill('70대 박회장님의 골프 인생 2막 - MASGOLF 드라이버로 되찾은 자신감');
    }
    
    // 슬러그 입력
    const secondInput = await page.$$('input[type="text"]');
    if (secondInput[1]) {
      await secondInput[1].fill('70s-chairman-golf-life-second-act-masgolf-driver-confidence');
    }
    
    // 브랜드 전략 설정
    const contentTypeSelect = await page.$('select');
    if (contentTypeSelect) {
      await contentTypeSelect.selectOption('customer_story');
    }
    
    // 오디언스 온도: 따뜻한 오디언스
    const audienceTempSelect = await page.$$('select');
    if (audienceTempSelect[1]) {
      await audienceTempSelect[1].selectOption('warm');
    }
    
    // 브랜드 강도: 높음
    if (audienceTempSelect[2]) {
      await audienceTempSelect[2].selectOption('high');
    }
    
    // 고객 채널: 내방고객
    if (audienceTempSelect[3]) {
      await audienceTempSelect[3].selectOption('local_customers');
    }
    
    // 고객 페르소나: 60대 이상 골퍼
    if (audienceTempSelect[4]) {
      await audienceTempSelect[4].selectOption('returning_60plus');
    }
    
    // 페인 포인트: 비거리 부족
    if (audienceTempSelect[5]) {
      await audienceTempSelect[5].selectOption('distance');
    }
    
    await page.waitForTimeout(2000);
    
    // AI 요약 생성
    console.log('🤖 AI 요약 생성...');
    const aiSummaryButton = await page.$('button:has-text("🤖 AI 요약")');
    if (aiSummaryButton) {
      await aiSummaryButton.click();
      await page.waitForTimeout(5000);
    }
    
    // AI 본문 생성
    console.log('🤖 AI 본문 생성...');
    const aiContentButton = await page.$('button:has-text("🤖 AI 본문")');
    if (aiContentButton) {
      await aiContentButton.click();
      await page.waitForTimeout(8000);
    }
    
    // 대표 이미지 URL 입력
    const imageInput = await page.$('input[type="url"]');
    if (imageInput) {
      await imageInput.fill('/blog/images/70s-chairman-golf-story.jpg');
    }
    
    // 저장
    console.log('💾 첫 번째 블로그 저장...');
    const saveButton = await page.$('button:has-text("저장")');
    if (saveButton) {
      await saveButton.click();
      await page.waitForTimeout(3000);
    }
    
    // ===== 두 번째 블로그: 이벤트 글 =====
    console.log('🎉 두 번째 블로그: 이벤트 글 작성...');
    
    // 새 게시물 작성 버튼 클릭
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(3000);
    
    // 제목 입력
    const firstInput2 = await page.$('input[type="text"]');
    if (firstInput2) {
      await firstInput2.fill('9월 가을 골프 시즌 맞이! 초고반발 드라이버 특별 할인 이벤트');
    }
    
    // 슬러그 입력
    const secondInput2 = await page.$$('input[type="text"]');
    if (secondInput2[1]) {
      await secondInput2[1].fill('september-fall-golf-season-high-rebound-driver-special-discount-event');
    }
    
    // 브랜드 전략 설정
    const contentTypeSelect2 = await page.$('select');
    if (contentTypeSelect2) {
      await contentTypeSelect2.selectOption('event');
    }
    
    // 오디언스 온도: 뜨거운 오디언스
    const audienceTempSelect2 = await page.$$('select');
    if (audienceTempSelect2[1]) {
      await audienceTempSelect2[1].selectOption('hot');
    }
    
    // 브랜드 강도: 높음
    if (audienceTempSelect2[2]) {
      await audienceTempSelect2[2].selectOption('high');
    }
    
    // 고객 채널: 온라인고객
    if (audienceTempSelect2[3]) {
      await audienceTempSelect2[3].selectOption('online_customers');
    }
    
    // 고객 페르소나: 고반발 드라이버 선호 상급 골퍼
    if (audienceTempSelect2[4]) {
      await audienceTempSelect2[4].selectOption('high_rebound_enthusiast');
    }
    
    // 페인 포인트: 비거리 부족
    if (audienceTempSelect2[5]) {
      await audienceTempSelect2[5].selectOption('distance');
    }
    
    await page.waitForTimeout(2000);
    
    // AI 요약 생성
    console.log('🤖 AI 요약 생성...');
    const aiSummaryButton2 = await page.$('button:has-text("🤖 AI 요약")');
    if (aiSummaryButton2) {
      await aiSummaryButton2.click();
      await page.waitForTimeout(5000);
    }
    
    // AI 본문 생성
    console.log('🤖 AI 본문 생성...');
    const aiContentButton2 = await page.$('button:has-text("🤖 AI 본문")');
    if (aiContentButton2) {
      await aiContentButton2.click();
      await page.waitForTimeout(8000);
    }
    
    // 대표 이미지 URL 입력
    const imageInput2 = await page.$('input[type="url"]');
    if (imageInput2) {
      await imageInput2.fill('/blog/images/september-fall-golf-event.jpg');
    }
    
    // 저장
    console.log('💾 두 번째 블로그 저장...');
    const saveButton2 = await page.$('button:has-text("저장")');
    if (saveButton2) {
      await saveButton2.click();
      await page.waitForTimeout(3000);
    }
    
    // ===== 결과 확인 =====
    console.log('📋 생성된 블로그 확인...');
    await page.goto('https://www.masgolf.co.kr/blog', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // 블로그 포스트 확인
    const blogPosts = await page.$$('[class*="post"], [class*="blog"], article, .blog-post-card');
    console.log('✅ 총 생성된 블로그 포스트 수:', blogPosts.length);
    
    // 각 포스트 제목 확인
    for (let i = 0; i < Math.min(blogPosts.length, 5); i++) {
      const postTitle = await blogPosts[i].textContent();
      console.log(`📝 포스트 ${i + 1}: ${postTitle?.substring(0, 50)}...`);
    }
    
    // 첫 번째 포스트 클릭하여 상세 페이지 확인
    if (blogPosts.length > 0) {
      console.log('🔍 첫 번째 블로그 포스트 상세 페이지 확인...');
      await blogPosts[0].click();
      await page.waitForTimeout(3000);
      
      const pageTitle = await page.title();
      console.log('✅ 페이지 제목:', pageTitle);
      
      // 콘텐츠 길이 확인
      const content = await page.textContent('main, article, [class*="content"]');
      console.log('✅ 콘텐츠 길이:', content ? content.length : 0, '자');
    }
    
    // 최종 스크린샷
    await page.screenshot({ path: 'today-blogs-creation-result.png' });
    console.log('✅ 오늘 작성한 블로그 결과 스크린샷 저장됨');
    
    console.log('🎉 오늘 작성할 실제 블로그 2개 생성 완료!');
    console.log('');
    console.log('📝 생성된 블로그:');
    console.log('1. 70대 박회장님의 골프 인생 2막 - MASGOLF 드라이버로 되찾은 자신감');
    console.log('2. 9월 가을 골프 시즌 맞이! 초고반발 드라이버 특별 할인 이벤트');
    console.log('');
    console.log('🌐 확인 방법:');
    console.log('https://www.masgolf.co.kr/blog');
    
  } catch (error) {
    console.error('❌ 블로그 생성 중 오류 발생:', error);
    await page.screenshot({ path: 'today-blogs-error.png' });
    console.log('❌ 오류 스크린샷 저장됨');
  } finally {
    await browser.close();
  }
}

createRealBlogsToday();
