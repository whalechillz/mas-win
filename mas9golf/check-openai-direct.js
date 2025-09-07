const { chromium } = require('playwright');

async function checkOpenAIDirect() {
  console.log('🚀 Chrome Canary로 OpenAI 직접 접속...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // 직접 로그인 페이지로 이동
    console.log('📱 OpenAI 로그인 페이지로 직접 이동...');
    await page.goto('https://auth0.openai.com/u/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(3000);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('📍 현재 URL:', currentUrl);
    
    // 로그인 폼 확인
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const usernameInput = page.locator('input[name="username"]');
    
    const hasEmailInput = await emailInput.isVisible().catch(() => false);
    const hasPasswordInput = await passwordInput.isVisible().catch(() => false);
    const hasUsernameInput = await usernameInput.isVisible().catch(() => false);
    
    console.log(`📧 이메일 입력 필드: ${hasEmailInput ? '있음' : '없음'}`);
    console.log(`🔒 비밀번호 입력 필드: ${hasPasswordInput ? '있음' : '없음'}`);
    console.log(`👤 사용자명 입력 필드: ${hasUsernameInput ? '있음' : '없음'}`);
    
    if (hasEmailInput || hasUsernameInput) {
      console.log('✅ 로그인 폼을 찾았습니다!');
      console.log('💡 수동으로 로그인해주세요...');
      console.log('   이메일/사용자명과 비밀번호를 입력하고 로그인 버튼을 클릭하세요.');
      
      // 로그인 완료 대기 (90초)
      console.log('\n⏳ 로그인 완료를 기다립니다... (90초)');
      await page.waitForTimeout(90000);
      
      // API Keys 페이지로 이동
      console.log('🔑 API Keys 페이지로 이동합니다...');
      await page.goto('https://platform.openai.com/api-keys', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      await page.waitForTimeout(3000);
      
      // API 키 목록 확인
      const apiKeys = await page.locator('[data-testid="api-key-row"]').count();
      console.log(`🔐 발견된 API 키 개수: ${apiKeys}`);
      
      if (apiKeys > 0) {
        console.log('📋 API 키 목록:');
        for (let i = 0; i < apiKeys; i++) {
          const keyRow = page.locator('[data-testid="api-key-row"]').nth(i);
          const keyName = await keyRow.locator('[data-testid="api-key-name"]').textContent().catch(() => '이름 없음');
          const keyPrefix = await keyRow.locator('[data-testid="api-key-prefix"]').textContent().catch(() => '접두사 없음');
          const keyStatus = await keyRow.locator('[data-testid="api-key-status"]').textContent().catch(() => '상태 없음');
          
          console.log(`   ${i + 1}. 이름: ${keyName}`);
          console.log(`      접두사: ${keyPrefix}`);
          console.log(`      상태: ${keyStatus}`);
        }
        
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
      console.log('❌ 로그인 폼을 찾을 수 없습니다.');
      console.log('💡 수동으로 https://platform.openai.com/ 접속하여 로그인해주세요.');
    }
    
    // 추가 대기 시간
    console.log('\n⏳ 추가 확인을 위해 30초 더 대기합니다...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 브라우저를 종료합니다.');
  }
}

// 스크립트 실행
checkOpenAIDirect().catch(console.error);
