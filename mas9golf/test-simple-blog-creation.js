const { chromium } = require('playwright');

async function testSimpleBlogCreation() {
  console.log('🎭 간단한 블로그 생성 테스트 시작...');
  
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
    await page.waitForTimeout(3000);
    
    // 페이지 스크린샷
    await page.screenshot({ path: 'admin-page.png' });
    console.log('✅ 관리자 페이지 스크린샷 저장됨');
    
    // 2. 새 게시물 작성 버튼 찾기 및 클릭
    console.log('➕ 새 게시물 작성 버튼 찾는 중...');
    
    // 버튼이 보이는지 확인
    const newPostButton = await page.$('button:has-text("새 게시물 작성")');
    if (newPostButton) {
      console.log('✅ 새 게시물 작성 버튼 발견');
      await newPostButton.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('❌ 새 게시물 작성 버튼을 찾을 수 없음');
      // 페이지의 모든 버튼 확인
      const buttons = await page.$$('button');
      console.log('페이지의 버튼 수:', buttons.length);
      for (let i = 0; i < buttons.length; i++) {
        const text = await buttons[i].textContent();
        console.log(`버튼 ${i}: "${text}"`);
      }
    }
    
    // 3. 폼이 나타났는지 확인
    const titleInput = await page.$('input[name="title"]');
    if (titleInput) {
      console.log('✅ 제목 입력 필드 발견');
      
      // 제목 입력
      await titleInput.fill('테스트 블로그 포스트 - MASGOLF 드라이버');
      console.log('✅ 제목 입력 완료');
      
      // 브랜드 전략 섹션 확인
      const brandStrategySection = await page.$('.bg-blue-50');
      if (brandStrategySection) {
        console.log('✅ 마쓰구 브랜드 전략 섹션 발견');
        
        // 콘텐츠 유형 선택
        const contentTypeSelect = await page.$('select:has(option[value="customer_story"])');
        if (contentTypeSelect) {
          await contentTypeSelect.selectOption('customer_story');
          console.log('✅ 콘텐츠 유형: 고객 스토리 선택');
        }
        
        // AI 요약 버튼 클릭
        const aiSummaryButton = await page.$('button:has-text("🤖 AI 요약")');
        if (aiSummaryButton) {
          console.log('✅ AI 요약 버튼 발견');
          await aiSummaryButton.click();
          await page.waitForTimeout(5000);
          
          // 요약 필드 확인
          const excerptField = await page.$('textarea[name="excerpt"]');
          if (excerptField) {
            const excerptValue = await excerptField.inputValue();
            console.log('✅ AI 요약 생성됨:', excerptValue);
          }
        }
        
        // AI 본문 버튼 클릭
        const aiContentButton = await page.$('button:has-text("🤖 AI 본문")');
        if (aiContentButton) {
          console.log('✅ AI 본문 버튼 발견');
          await aiContentButton.click();
          await page.waitForTimeout(8000);
          
          // 본문 필드 확인
          const contentField = await page.$('textarea[name="content"]');
          if (contentField) {
            const contentValue = await contentField.inputValue();
            console.log('✅ AI 본문 생성됨, 길이:', contentValue ? contentValue.length : 0, '자');
          }
        }
      } else {
        console.log('❌ 마쓰구 브랜드 전략 섹션을 찾을 수 없음');
      }
      
      // 저장 버튼 클릭
      const saveButton = await page.$('button:has-text("저장")');
      if (saveButton) {
        console.log('✅ 저장 버튼 발견');
        await saveButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ 게시물 저장 완료');
      }
      
    } else {
      console.log('❌ 제목 입력 필드를 찾을 수 없음');
    }
    
    // 4. 블로그 목록 페이지 확인
    console.log('📋 블로그 목록 페이지 확인...');
    await page.goto('https://www.masgolf.co.kr/blog', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // 블로그 포스트 확인
    const blogPosts = await page.$$('[class*="post"], [class*="blog"], article');
    console.log('✅ 블로그 포스트 수:', blogPosts.length);
    
    // 페이지 스크린샷
    await page.screenshot({ path: 'blog-list.png' });
    console.log('✅ 블로그 목록 스크린샷 저장됨');
    
    console.log('🎉 간단한 블로그 생성 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('❌ 오류 스크린샷 저장됨');
  } finally {
    await browser.close();
  }
}

testSimpleBlogCreation();
