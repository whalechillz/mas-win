const { chromium } = require('playwright');

async function checkOpenAIAPIKeyV2() {
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
    // OpenAI 메인 페이지로 이동
    console.log('📱 OpenAI 메인 페이지로 이동...');
    await page.goto('https://platform.openai.com/', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(3000);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('📍 현재 URL:', currentUrl);
    
    // 로그인 버튼 찾기
    const loginButton = page.locator('text=Log in').first();
    const signInButton = page.locator('text=Sign in').first();
    const getStartedButton = page.locator('text=Get started').first();
    
    const hasLoginButton = await loginButton.isVisible().catch(() => false);
    const hasSignInButton = await signInButton.isVisible().catch(() => false);
    const hasGetStartedButton = await getStartedButton.isVisible().catch(() => false);
    
    console.log(`🔐 로그인 버튼: ${hasLoginButton ? '있음' : '없음'}`);
    console.log(`📝 Sign in 버튼: ${hasSignInButton ? '있음' : '없음'}`);
    console.log(`🚀 Get started 버튼: ${hasGetStartedButton ? '있음' : '없음'}`);
    
    if (hasLoginButton) {
      console.log('🔑 로그인 버튼을 클릭합니다...');
      await loginButton.click();
      await page.waitForTimeout(3000);
    } else if (hasSignInButton) {
      console.log('🔑 Sign in 버튼을 클릭합니다...');
      await signInButton.click();
      await page.waitForTimeout(3000);
    } else if (hasGetStartedButton) {
      console.log('🔑 Get started 버튼을 클릭합니다...');
      await getStartedButton.click();
      await page.waitForTimeout(3000);
    }
    
    // 현재 URL 다시 확인
    const newUrl = page.url();
    console.log('📍 새로운 URL:', newUrl);
    
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
      console.log('💡 수동으로 로그인해주세요...');
      console.log('   이메일/사용자명과 비밀번호를 입력하고 로그인 버튼을 클릭하세요.');
      console.log('   로그인 후 API Keys 페이지로 이동합니다.');
      
      // 로그인 완료 대기 (60초)
      console.log('\n⏳ 로그인 완료를 기다립니다... (60초)');
      await page.waitForTimeout(60000);
      
      // API Keys 페이지로 이동 시도
      const finalUrl = page.url();
      console.log('📍 최종 URL:', finalUrl);
      
      if (finalUrl.includes('platform.openai.com')) {
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
      }
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
checkOpenAIAPIKeyV2().catch(console.error);
