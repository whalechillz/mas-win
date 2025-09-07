const { chromium } = require('playwright');

async function checkOpenAIAPIKey() {
  console.log('🚀 Chrome Canary로 OpenAI 사이트 접속 중...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // OpenAI 로그인 페이지로 이동
    console.log('📱 OpenAI 로그인 페이지로 이동...');
    await page.goto('https://platform.openai.com/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    // 페이지 로딩 대기
    await page.waitForTimeout(3000);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('📍 현재 URL:', currentUrl);
    
    // 로그인 상태 확인
    const isLoggedIn = await page.locator('text=API Keys').isVisible().catch(() => false);
    
    if (isLoggedIn) {
      console.log('✅ 이미 로그인되어 있습니다!');
      
      // API Keys 페이지로 이동
      console.log('🔑 API Keys 페이지로 이동...');
      await page.goto('https://platform.openai.com/api-keys', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      await page.waitForTimeout(3000);
      
      // API 키 목록 확인
      const apiKeys = await page.locator('[data-testid="api-key-row"]').count();
      console.log(`🔐 발견된 API 키 개수: ${apiKeys}`);
      
      if (apiKeys > 0) {
        // 첫 번째 API 키 정보 가져오기
        const firstKey = page.locator('[data-testid="api-key-row"]').first();
        const keyName = await firstKey.locator('[data-testid="api-key-name"]').textContent().catch(() => '이름 없음');
        const keyPrefix = await firstKey.locator('[data-testid="api-key-prefix"]').textContent().catch(() => '접두사 없음');
        const keyStatus = await firstKey.locator('[data-testid="api-key-status"]').textContent().catch(() => '상태 없음');
        
        console.log('📋 첫 번째 API 키 정보:');
        console.log(`   이름: ${keyName}`);
        console.log(`   접두사: ${keyPrefix}`);
        console.log(`   상태: ${keyStatus}`);
        
        // API 키 생성 버튼 확인
        const createButton = page.locator('text=Create new secret key').first();
        const canCreate = await createButton.isVisible().catch(() => false);
        console.log(`🆕 새 API 키 생성 가능: ${canCreate ? '예' : '아니오'}`);
        
      } else {
        console.log('⚠️ API 키가 없습니다. 새로 생성해야 합니다.');
        
        // 새 API 키 생성 버튼 클릭
        const createButton = page.locator('text=Create new secret key').first();
        if (await createButton.isVisible().catch(() => false)) {
          console.log('🆕 새 API 키 생성 버튼을 클릭합니다...');
          await createButton.click();
          await page.waitForTimeout(2000);
        }
      }
      
    } else {
      console.log('🔐 로그인이 필요합니다.');
      
      // 로그인 폼 확인
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      const hasEmailInput = await emailInput.isVisible().catch(() => false);
      const hasPasswordInput = await passwordInput.isVisible().catch(() => false);
      
      console.log(`📧 이메일 입력 필드: ${hasEmailInput ? '있음' : '없음'}`);
      console.log(`🔒 비밀번호 입력 필드: ${hasPasswordInput ? '있음' : '없음'}`);
      
      if (hasEmailInput && hasPasswordInput) {
        console.log('💡 수동으로 로그인해주세요...');
        console.log('   이메일과 비밀번호를 입력하고 로그인 버튼을 클릭하세요.');
      }
    }
    
    // 사용자 입력 대기
    console.log('\n⏳ 사용자 입력을 기다립니다... (30초 후 자동 종료)');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 브라우저를 종료합니다.');
  }
}

// 스크립트 실행
checkOpenAIAPIKey().catch(console.error);
