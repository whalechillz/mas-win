const { chromium } = require('playwright');

async function stealthSlackSetup() {
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome',
    args: [
      '--incognito', // 시크릿 모드
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--disable-background-networking',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-domain-reliability',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-sync-preferences',
      '--metrics-recording-only',
      '--no-default-browser-check',
      '--no-pings',
      '--password-store=basic',
      '--use-mock-keychain'
    ]
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🕵️ 스텔스 모드로 Slack 설정 시작...');
    
    // Slack API 페이지로 이동
    console.log('📱 https://api.slack.com/apps 로드 중...');
    await page.goto('https://api.slack.com/apps', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('\n=== 로그인 대기 중 ===');
    console.log('브라우저에서 Slack에 로그인해주세요.');
    console.log('로그인 완료 후 자동으로 설정을 계속합니다.');
    console.log('========================\n');
    
    // 로그인 완료까지 대기 (최대 5분)
    console.log('⏳ 로그인 완료 대기 중... (최대 5분)');
    
    // 로그인 완료를 확인하는 로직
    let loginCompleted = false;
    let attempts = 0;
    const maxAttempts = 60; // 5분 (5초 * 60)
    
    while (!loginCompleted && attempts < maxAttempts) {
      await page.waitForTimeout(5000); // 5초 대기
      attempts++;
      
      // 현재 URL 확인
      const currentUrl = page.url();
      console.log(`🔄 시도 ${attempts}/${maxAttempts} - 현재 URL: ${currentUrl}`);
      
      // 로그인이 완료되었는지 확인
      if (currentUrl.includes('api.slack.com/apps') && !currentUrl.includes('signin')) {
        console.log('✅ 로그인 완료 감지!');
        loginCompleted = true;
        break;
      }
      
      // 로그인 페이지에 있는지 확인
      if (currentUrl.includes('signin') || currentUrl.includes('oauth')) {
        console.log('⏳ 로그인 진행 중...');
        continue;
      }
    }
    
    if (!loginCompleted) {
      console.log('⏰ 로그인 대기 시간 초과. 수동으로 진행해주세요.');
      console.log('브라우저를 열어두고 수동으로 설정을 완료해주세요.');
      await page.waitForTimeout(300000); // 5분 더 대기
      return;
    }
    
    // 로그인 완료 후 자동 설정 계속
    console.log('🚀 자동 설정 계속...');
    
    // 기존 앱이 있는지 확인
    const existingApp = page.locator('text=MASLABS 업무봇').first();
    if (await existingApp.isVisible()) {
      console.log('✅ 기존 MASLABS 업무봇 앱 발견');
      await existingApp.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('🆕 새 앱 생성 중...');
      // Create an App 버튼 클릭
      const createButton = page.locator('text=Create an App').first();
      await createButton.click();
      await page.waitForTimeout(2000);
      
      // From scratch 선택
      const fromScratch = page.locator('text=From scratch').first();
      await fromScratch.click();
      await page.waitForTimeout(2000);
      
      // 앱 이름 입력
      const appNameInput = page.locator('input[name="app_name"]').first();
      await appNameInput.fill('MASLABS 업무봇');
      await page.waitForTimeout(1000);
      
      // Create App 버튼 클릭
      const createAppButton = page.locator('button:has-text("Create App")').first();
      await createAppButton.click();
      await page.waitForTimeout(3000);
    }
    
    // Incoming Webhooks 메뉴 클릭
    console.log('🔗 Incoming Webhooks 설정 중...');
    const webhooksMenu = page.locator('text=Incoming Webhooks').first();
    await webhooksMenu.click();
    await page.waitForTimeout(2000);
    
    // Activate Incoming Webhooks 토글 ON
    const toggle = page.locator('input[type="checkbox"]').first();
    const isChecked = await toggle.isChecked();
    if (!isChecked) {
      await toggle.check();
      console.log('✅ Incoming Webhooks 활성화');
      await page.waitForTimeout(2000);
    }
    
    // Add New Webhook to Workspace 버튼 클릭
    const addWebhookButton = page.locator('text=Add New Webhook to Workspace').first();
    if (await addWebhookButton.isVisible()) {
      await addWebhookButton.click();
      console.log('🔗 Webhook 추가 중...');
      await page.waitForTimeout(3000);
      
      // 채널 선택 팝업에서 채널 선택
      const targetChannel = page.locator('text=#31-gg-업무전달-매장관리-환경개선').first();
      if (await targetChannel.isVisible()) {
        await targetChannel.click();
        console.log('✅ 타겟 채널 선택');
      } else {
        // 대안으로 #general 채널 선택
        const generalChannel = page.locator('text=#general').first();
        if (await generalChannel.isVisible()) {
          await generalChannel.click();
          console.log('✅ #general 채널 선택 (대안)');
        }
      }
      
      await page.waitForTimeout(2000);
      
      // Allow 버튼 클릭
      const allowButton = page.locator('button:has-text("Allow")').first();
      if (await allowButton.isVisible()) {
        await allowButton.click();
        console.log('✅ 권한 허용');
        await page.waitForTimeout(3000);
      }
    }
    
    // Webhook URL 확인
    const webhookInput = page.locator('input[readonly]').first();
    if (await webhookInput.isVisible()) {
      const webhookUrl = await webhookInput.inputValue();
      console.log('🎉 Webhook URL 생성 성공!');
      console.log('📋 Webhook URL:', webhookUrl);
      
      // URL을 파일에 저장
      const fs = require('fs');
      fs.writeFileSync('new-webhook-url.txt', webhookUrl);
      console.log('💾 Webhook URL이 new-webhook-url.txt 파일에 저장되었습니다.');
      
      // Vercel 환경 변수 업데이트 명령어 출력
      console.log('\n=== Vercel 환경 변수 업데이트 ===');
      console.log('다음 명령어를 실행하세요:');
      console.log(`vercel env rm SLACK_WEBHOOK_URL production`);
      console.log(`printf "${webhookUrl}\\n" | vercel env add SLACK_WEBHOOK_URL production`);
      console.log('================================\n');
      
    } else {
      console.log('❌ Webhook URL을 찾을 수 없습니다.');
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'slack-stealth-setup-result.png' });
    console.log('📸 스크린샷 저장: slack-stealth-setup-result.png');
    
    console.log('\n⏳ 10초 대기 후 브라우저 종료...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 스텔스 설정 중 오류 발생:', error);
    await page.screenshot({ path: 'slack-stealth-setup-error.png' });
  } finally {
    await browser.close();
  }
}

stealthSlackSetup();
