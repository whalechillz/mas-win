const { chromium } = require('playwright');

async function testAdminLogin() {
  console.log('🚀 Chrome Canary로 관리자 로그인 테스트...');
  
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
    
    // 페이지 제목 확인
    const pageTitle = await page.title();
    console.log('📄 페이지 제목:', pageTitle);
    
    // 로그인 폼 확인
    const loginForm = page.locator('form');
    const hasLoginForm = await loginForm.isVisible().catch(() => false);
    console.log(`🔐 로그인 폼: ${hasLoginForm ? '있음' : '없음'}`);
    
    if (hasLoginForm) {
      console.log('🔑 로그인 필요합니다.');
      
      // 로그인 필드 찾기
      const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
      const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
      
      const hasUsername = await usernameInput.isVisible().catch(() => false);
      const hasPassword = await passwordInput.isVisible().catch(() => false);
      
      console.log(`👤 사용자명 필드: ${hasUsername ? '있음' : '없음'}`);
      console.log(`🔒 비밀번호 필드: ${hasPassword ? '있음' : '없음'}`);
      
      if (hasUsername && hasPassword) {
        console.log('💡 수동으로 로그인해주세요...');
        console.log('   사용자명: admin');
        console.log('   비밀번호: 1234');
        
        // 로그인 완료 대기
        console.log('\n⏳ 로그인 완료를 기다립니다... (30초)');
        await page.waitForTimeout(30000);
        
        // 로그인 후 페이지 확인
        const newUrl = page.url();
        console.log('📍 로그인 후 URL:', newUrl);
        
        if (newUrl.includes('/admin/blog')) {
          console.log('✅ 로그인 성공! 블로그 관리 페이지로 이동했습니다.');
          
          // 제목 입력 필드 다시 확인
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
              console.log('🖱️ AI 버튼 클릭...');
              await aiButton.click();
              await page.waitForTimeout(3000);
              
              // 슬러그 필드 값 확인
              const slugInput = page.locator('input[value*="hot-summer"]');
              const slugValue = await slugInput.inputValue().catch(() => '값 없음');
              console.log(`📝 슬러그 필드 값: ${slugValue}`);
            }
          }
        }
      }
    } else {
      console.log('✅ 이미 로그인되어 있거나 로그인이 필요하지 않습니다.');
      
      // 제목 입력 필드 확인
      const titleInput = page.locator('input[type="text"]').first();
      const hasTitleInput = await titleInput.isVisible().catch(() => false);
      console.log(`📝 제목 입력 필드: ${hasTitleInput ? '있음' : '없음'}`);
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
testAdminLogin().catch(console.error);
