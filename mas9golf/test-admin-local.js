const { chromium } = require('playwright');

async function testAdminLocal() {
  console.log('🚀 Chrome Canary로 로컬 관리자 페이지 테스트...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // 로컬 관리자 페이지로 이동
    console.log('📱 로컬 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog/', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(3000);
    
    // 게시물 목록 확인
    const postCards = await page.locator('.border.border-gray-200.rounded-lg.p-4').count();
    console.log(`📝 게시물 카드 개수: ${postCards}`);
    
    if (postCards > 0) {
      console.log('✅ 게시물이 정상적으로 로드되었습니다!');
      
      // 첫 번째 게시물 정보 확인
      const firstPost = page.locator('.border.border-gray-200.rounded-lg.p-4').first();
      const postTitle = await firstPost.locator('h3').textContent().catch(() => '제목 없음');
      console.log(`📄 첫 번째 게시물 제목: ${postTitle}`);
      
      // 수정 버튼 클릭
      console.log('🖱️ 수정 버튼 클릭...');
      const editButton = firstPost.locator('button:has-text("수정")');
      await editButton.click();
      await page.waitForTimeout(2000);
      
      // 폼 표시 확인
      const formVisible = await page.locator('form').isVisible().catch(() => false);
      console.log(`📋 수정 폼 표시: ${formVisible ? '성공' : '실패'}`);
      
      if (formVisible) {
        // 제목 필드 확인
        const titleInput = page.locator('input[type="text"]').first();
        const titleValue = await titleInput.inputValue().catch(() => '값 없음');
        console.log(`📝 현재 제목: ${titleValue}`);
        
        // AI 슬러그 생성 버튼 확인
        const aiButton = page.locator('button:has-text("🤖 AI")');
        const hasAIButton = await aiButton.isVisible().catch(() => false);
        console.log(`🤖 AI 버튼: ${hasAIButton ? '있음' : '없음'}`);
        
        if (hasAIButton) {
          console.log('🖱️ AI 슬러그 생성 버튼 클릭...');
          await aiButton.click();
          await page.waitForTimeout(3000);
          
          // 슬러그 필드 값 확인
          const slugInput = page.locator('input[value*="hot-summer"]');
          const slugValue = await slugInput.inputValue().catch(() => '값 없음');
          console.log(`📝 생성된 슬러그: ${slugValue}`);
        }
      }
    } else {
      console.log('❌ 게시물이 로드되지 않았습니다.');
      
      // 로딩 상태 확인
      const loadingText = await page.locator('text=로딩 중').isVisible().catch(() => false);
      console.log(`⏳ 로딩 중: ${loadingText ? '예' : '아니오'}`);
      
      // 콘솔 에러 확인
      const consoleMessages = [];
      page.on('console', msg => {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text()
        });
      });
      
      await page.waitForTimeout(5000);
      
      console.log('\n📋 콘솔 메시지:');
      consoleMessages.forEach(msg => {
        console.log(`   [${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }
    
    // 추가 대기 시간
    console.log('\n⏳ 추가 확인을 위해 10초 더 대기합니다...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 브라우저를 종료합니다.');
  }
}

// 스크립트 실행
testAdminLocal().catch(console.error);
