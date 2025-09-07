const { chromium } = require('playwright');

async function testAIButtonDebug() {
  console.log('🚀 Chrome Canary로 AI 버튼 디버깅 시작...');
  
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
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('📍 현재 URL:', currentUrl);
    
    // 제목 입력 필드 찾기
    const titleInput = page.locator('input[type="text"]').first();
    const hasTitleInput = await titleInput.isVisible().catch(() => false);
    console.log(`📝 제목 입력 필드: ${hasTitleInput ? '있음' : '없음'}`);
    
    if (hasTitleInput) {
      // 제목 입력
      console.log('✏️ 제목 입력 중...');
      await titleInput.fill('뜨거운 여름, 완벽한 스윙 로얄살루트 증정');
      await page.waitForTimeout(1000);
      
      // AI 버튼 찾기
      const aiButton = page.locator('button:has-text("🤖 AI")');
      const hasAIButton = await aiButton.isVisible().catch(() => false);
      console.log(`🤖 AI 버튼: ${hasAIButton ? '있음' : '없음'}`);
      
      if (hasAIButton) {
        console.log('🔍 AI 버튼 클릭 전 콘솔 메시지 확인...');
        
        // 콘솔 메시지 수집 시작
        const consoleMessages = [];
        page.on('console', msg => {
          consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
          });
        });
        
        // 네트워크 요청 수집 시작
        const networkRequests = [];
        page.on('request', request => {
          networkRequests.push({
            url: request.url(),
            method: request.method(),
            timestamp: new Date().toISOString()
          });
        });
        
        // AI 버튼 클릭
        console.log('🖱️ AI 버튼 클릭...');
        await aiButton.click();
        await page.waitForTimeout(3000);
        
        // 콘솔 메시지 출력
        console.log('\n📋 콘솔 메시지:');
        consoleMessages.forEach(msg => {
          console.log(`   [${msg.type.toUpperCase()}] ${msg.text}`);
        });
        
        // 네트워크 요청 출력
        console.log('\n🌐 네트워크 요청:');
        networkRequests.forEach(req => {
          console.log(`   [${req.method}] ${req.url}`);
        });
        
        // 슬러그 필드 값 확인
        const slugInput = page.locator('input[value*="hot-summer"]');
        const slugValue = await slugInput.inputValue().catch(() => '값 없음');
        console.log(`\n📝 슬러그 필드 값: ${slugValue}`);
        
        // 에러 메시지 확인
        const errorMessage = page.locator('text=에러').first();
        const hasError = await errorMessage.isVisible().catch(() => false);
        console.log(`❌ 에러 메시지: ${hasError ? '있음' : '없음'}`);
        
        if (hasError) {
          const errorText = await errorMessage.textContent().catch(() => '');
          console.log(`   에러 내용: ${errorText}`);
        }
        
      } else {
        console.log('❌ AI 버튼을 찾을 수 없습니다.');
        
        // 모든 버튼 찾기
        const allButtons = await page.locator('button').count();
        console.log(`🔍 총 버튼 개수: ${allButtons}`);
        
        for (let i = 0; i < allButtons; i++) {
          const button = page.locator('button').nth(i);
          const buttonText = await button.textContent().catch(() => '');
          console.log(`   버튼 ${i + 1}: "${buttonText}"`);
        }
      }
    } else {
      console.log('❌ 제목 입력 필드를 찾을 수 없습니다.');
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
testAIButtonDebug().catch(console.error);
