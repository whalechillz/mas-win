const { chromium } = require('playwright');

async function setupSlackApp() {
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome'
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Slack 앱 설정 시작...');
    
    // Slack API 페이지로 이동
    console.log('📱 https://api.slack.com/apps 로드 중...');
    await page.goto('https://api.slack.com/apps', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 스크린샷 저장
    await page.screenshot({ path: 'slack-apps-page.png' });
    console.log('📸 스크린샷 저장: slack-apps-page.png');
    
    console.log('\n=== Slack 앱 설정 가이드 ===');
    console.log('브라우저가 열렸습니다. 다음 단계를 진행해주세요:');
    console.log('1. "Create an App" 버튼 클릭');
    console.log('2. "From scratch" 선택');
    console.log('3. 앱 이름: "MASLABS 업무봇"');
    console.log('4. Workspace 선택');
    console.log('5. "Create App" 버튼 클릭');
    console.log('6. 왼쪽 메뉴에서 "Incoming Webhooks" 클릭');
    console.log('7. "Activate Incoming Webhooks" ON');
    console.log('8. "Add New Webhook to Workspace" 클릭');
    console.log('9. 채널 "#31-gg-업무전달-매장관리-환경개선" 선택');
    console.log('10. "Allow" 버튼 클릭');
    console.log('11. 생성된 Webhook URL 복사');
    console.log('========================\n');
    
    // 사용자 입력 대기
    console.log('설정이 완료되면 Enter를 눌러주세요...');
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
    
    // Webhook URL 확인
    const webhookInput = page.locator('input[readonly]').first();
    if (await webhookInput.isVisible()) {
      const webhookUrl = await webhookInput.inputValue();
      console.log('✅ 발견된 Webhook URL:', webhookUrl);
      
      // URL을 파일에 저장
      const fs = require('fs');
      fs.writeFileSync('new-slack-webhook-url.txt', webhookUrl);
      console.log('💾 Webhook URL이 new-slack-webhook-url.txt 파일에 저장되었습니다.');
      
      // Vercel 환경 변수 업데이트 안내
      console.log('\n=== Vercel 환경 변수 업데이트 ===');
      console.log('다음 명령어로 Vercel 환경 변수를 업데이트하세요:');
      console.log(`vercel env rm SLACK_WEBHOOK_URL production`);
      console.log(`printf "${webhookUrl}\\n" | vercel env add SLACK_WEBHOOK_URL production`);
      console.log('================================\n');
      
    } else {
      console.log('❌ Webhook URL을 찾을 수 없습니다. 페이지를 다시 확인해주세요.');
    }
    
    // 최종 스크린샷
    await page.screenshot({ path: 'slack-app-final-setup.png' });
    console.log('📸 최종 스크린샷 저장: slack-app-final-setup.png');
    
  } catch (error) {
    console.error('❌ 설정 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

setupSlackApp();
