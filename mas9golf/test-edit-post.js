const { chromium } = require('playwright');

async function testEditPost() {
  console.log('🚀 Chrome Canary로 게시물 수정 테스트...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // 관리자 페이지로 이동
    console.log('📱 관리자 페이지로 이동...');
    await page.goto('https://masgolf.co.kr/admin/blog/', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(3000);
    
    // 게시물 목록 확인
    const postCards = await page.locator('.border.border-gray-200.rounded-lg.p-4').count();
    console.log(`📝 게시물 카드 개수: ${postCards}`);
    
    if (postCards > 0) {
      // 첫 번째 게시물의 수정 버튼 클릭
      console.log('🖱️ 첫 번째 게시물의 수정 버튼 클릭...');
      const editButton = page.locator('button:has-text("수정")').first();
      await editButton.click();
      await page.waitForTimeout(2000);
      
      // 폼이 표시되는지 확인
      const formVisible = await page.locator('form').isVisible().catch(() => false);
      console.log(`📋 수정 폼 표시: ${formVisible ? '성공' : '실패'}`);
      
      if (formVisible) {
        // 제목 필드 확인
        const titleInput = page.locator('input[type="text"]').first();
        const titleValue = await titleInput.inputValue().catch(() => '값 없음');
        console.log(`📝 현재 제목: ${titleValue}`);
        
        // 제목 수정
        console.log('✏️ 제목 수정 중...');
        await titleInput.fill('뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사 (수정됨)');
        await page.waitForTimeout(1000);
        
        // AI 슬러그 생성 버튼 클릭
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
        
        // 저장 버튼 클릭
        const saveButton = page.locator('button:has-text("수정")').last();
        const hasSaveButton = await saveButton.isVisible().catch(() => false);
        console.log(`💾 저장 버튼: ${hasSaveButton ? '있음' : '없음'}`);
        
        if (hasSaveButton) {
          console.log('💾 수정 저장 중...');
          await saveButton.click();
          await page.waitForTimeout(3000);
          
          // 성공 메시지 확인
          const successMessage = page.locator('text=성공').first();
          const hasSuccess = await successMessage.isVisible().catch(() => false);
          console.log(`✅ 저장 성공: ${hasSuccess ? '성공' : '실패'}`);
        }
        
      } else {
        console.log('❌ 수정 폼이 표시되지 않았습니다.');
      }
    } else {
      console.log('❌ 게시물이 없습니다.');
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
testEditPost().catch(console.error);
