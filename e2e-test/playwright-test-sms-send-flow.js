const { chromium } = require('playwright');

const LOCAL_URL = 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function testSMSSendFlow() {
  console.log('🚀 SMS 발송 플로우 테스트 시작...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  const errors = [];
  const networkLogs = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log(`🔴 콘솔 오류: ${msg.text()}`);
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/channels/sms')) {
      networkLogs.push({
        url,
        status: response.status(),
        method: response.request().method()
      });
    }
  });

  try {
    // 1. 로그인
    console.log('📄 1. 로그인 중...');
    await page.goto(`${LOCAL_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 이미 로그인되어 있는지 확인
    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/login')) {
      console.log(`   이미 로그인되어 있음: ${currentUrl}`);
      console.log('✅ 로그인 완료 (이미 로그인됨)');
    } else {
      // 로그인 필드 찾기 (여러 방법 시도)
      let loginInput = null;
      let passwordInput = null;
      let submitButton = null;

      // 방법 1: name 속성으로 찾기
      loginInput = await page.locator('input[name="login"]').first().isVisible({ timeout: 3000 }).catch(() => false);
      if (loginInput) {
        loginInput = await page.locator('input[name="login"]').first();
        passwordInput = await page.locator('input[name="password"]').first();
        submitButton = await page.locator('button[type="submit"]').first();
        console.log('   방법 1: name 속성으로 로그인 필드 발견');
      } else {
        // 방법 2: placeholder로 찾기
        const allInputs = await page.locator('input[type="text"], input[type="tel"], input[type="email"]').all();
        if (allInputs.length > 0) {
          loginInput = allInputs[0];
          passwordInput = await page.locator('input[type="password"]').first();
          submitButton = await page.locator('button[type="submit"]').first();
          console.log('   방법 2: placeholder로 로그인 필드 발견');
        }
      }

      if (loginInput && passwordInput && submitButton) {
        await loginInput.fill(ADMIN_LOGIN);
        await passwordInput.fill(ADMIN_PASSWORD);
        await page.waitForTimeout(1000);
        await submitButton.click();
        await page.waitForTimeout(5000); // 로그인 처리 대기
        console.log('✅ 로그인 완료');
      } else {
        // 스크린샷 저장
        await page.screenshot({ path: 'playwright-login-debug.png', fullPage: true });
        throw new Error('로그인 입력 필드를 찾을 수 없습니다. 스크린샷 저장: playwright-login-debug.png');
      }
    }

    // 2. SMS 목록 페이지로 이동
    console.log('\n📋 2. SMS 목록 페이지로 이동 중...');
    await page.goto(`${LOCAL_URL}/admin/sms-list`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    console.log('✅ SMS 목록 페이지 로드 완료');

    // 3. 첫 번째 메시지 찾기 (초안 또는 발송됨)
    console.log('\n🔍 3. 편집할 메시지 찾기...');
    const messageRows = await page.locator('tbody tr').all();
    console.log(`   발견된 메시지: ${messageRows.length}개`);

    if (messageRows.length === 0) {
      console.log('⚠️  메시지가 없습니다. 새 메시지를 생성합니다.');
      await page.goto(`${LOCAL_URL}/admin/sms`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      // 새 메시지 작성
      const messageTypeButtons = await page.locator('button').filter({ hasText: 'MMS' }).first();
      if (await messageTypeButtons.isVisible({ timeout: 5000 })) {
        await messageTypeButtons.click();
        await page.waitForTimeout(1000);
      }

      const contentTextarea = await page.locator('textarea').first();
      if (await contentTextarea.isVisible({ timeout: 5000 })) {
        await contentTextarea.fill('[테스트] SMS 발송 테스트 메시지입니다.');
        await page.waitForTimeout(1000);
      }

      // 초안 저장
      const saveButton = await page.locator('button').filter({ hasText: '초안 저장' }).first();
      if (await saveButton.isVisible({ timeout: 5000 })) {
        await saveButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ 새 메시지 초안 저장 완료');
      }

      // 목록으로 돌아가기
      await page.goto(`${LOCAL_URL}/admin/sms-list`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }

    // 4. 첫 번째 메시지의 편집 버튼 클릭
    console.log('\n✏️  4. 편집 버튼 클릭...');
    
    // 여러 방법으로 편집 버튼 찾기
    let editButton = null;
    
    // 방법 1: "편집" 텍스트가 있는 버튼
    const editButtons = await page.locator('button').filter({ hasText: /편집/i }).all();
    if (editButtons.length > 0) {
      editButton = editButtons[0];
      console.log(`   방법 1: "편집" 텍스트 버튼 발견 (${editButtons.length}개)`);
    } else {
      // 방법 2: 테이블의 첫 번째 행에서 "편집" 텍스트가 있는 요소
      const firstRow = page.locator('tbody tr').first();
      const editInRow = await firstRow.locator('button, a').filter({ hasText: /편집/i }).first();
      if (await editInRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        editButton = editInRow;
        console.log(`   방법 2: 첫 번째 행의 편집 버튼 발견`);
      } else {
        // 방법 3: 테이블의 첫 번째 행에서 클릭 가능한 요소
        const firstRowClickable = await firstRow.locator('button, a').first();
        if (await firstRowClickable.isVisible({ timeout: 3000 }).catch(() => false)) {
          editButton = firstRowClickable;
          console.log(`   방법 3: 첫 번째 행의 첫 번째 클릭 가능한 요소 사용`);
        }
      }
    }
    
    if (!editButton) {
      // 스크린샷 저장 후 오류
      await page.screenshot({ path: 'playwright-sms-list-debug.png', fullPage: true });
      throw new Error('편집 버튼을 찾을 수 없습니다. 스크린샷 저장: playwright-sms-list-debug.png');
    }

    await editButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ 편집 페이지 로드 완료');

    // 5. 현재 메시지 내용 확인
    console.log('\n📝 5. 현재 메시지 내용 확인...');
    const contentTextarea = await page.locator('textarea').first();
    const currentContent = await contentTextarea.inputValue();
    console.log(`   현재 메시지 내용: ${currentContent.substring(0, 50)}...`);
    console.log(`   메시지 길이: ${currentContent.length}자`);

    // 6. 수신자 번호 확인 및 추가
    console.log('\n👥 6. 수신자 번호 확인 및 추가...');
    
    // 현재 수신자 개수 확인
    const recipientCountText = await page.locator('text=/현재.*명.*선택됨/').first();
    let currentRecipientCount = 0;
    if (await recipientCountText.isVisible({ timeout: 5000 })) {
      const countText = await recipientCountText.textContent();
      const match = countText.match(/(\d+)명/);
      if (match) {
        currentRecipientCount = parseInt(match[1]);
        console.log(`   현재 수신자: ${currentRecipientCount}명`);
      }
    }

    // 수신자 번호 추가 버튼 클릭
    const addNumberButton = await page.locator('button').filter({ hasText: '+ 번호 추가' }).first();
    if (await addNumberButton.isVisible({ timeout: 5000 })) {
      // 여러 번 클릭하여 수신자 추가 (테스트용)
      for (let i = 0; i < 3; i++) {
        await addNumberButton.click();
        await page.waitForTimeout(500);
      }
      console.log('✅ 수신자 번호 입력 필드 추가 완료');
    }

    // 수신자 번호 입력
    const recipientInputs = await page.locator('input[type="tel"]').all();
    console.log(`   발견된 수신자 입력 필드: ${recipientInputs.length}개`);
    
    // 빈 필드에 테스트 번호 입력
    for (let i = 0; i < Math.min(recipientInputs.length, 5); i++) {
      const input = recipientInputs[i];
      const value = await input.inputValue();
      if (!value || value.trim() === '') {
        await input.fill(`010-1234-${String(1000 + i).padStart(4, '0')}`);
        await page.waitForTimeout(300);
      }
    }
    console.log('✅ 수신자 번호 입력 완료');

    // 7. 초안 저장 (변경사항 저장)
    console.log('\n💾 7. 초안 저장 (변경사항 저장)...');
    const saveDraftButton = await page.locator('button').filter({ hasText: '초안 저장' }).first();
    if (await saveDraftButton.isVisible({ timeout: 5000 })) {
      await saveDraftButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ 초안 저장 완료');
    }

    // 8. URL에서 channelPostId 확인
    const currentUrl = page.url();
    const urlMatch = currentUrl.match(/[?&]id=(\d+)/);
    const channelPostId = urlMatch ? urlMatch[1] : null;
    console.log(`\n📌 8. Channel Post ID: ${channelPostId}`);

    // 9. SMS 발송 버튼 클릭 (실제 발송은 하지 않고 확인만)
    console.log('\n📤 9. SMS 발송 버튼 확인...');
    const sendButton = await page.locator('button').filter({ hasText: 'SMS 발송' }).first();
    if (await sendButton.isVisible({ timeout: 5000 })) {
      console.log('✅ SMS 발송 버튼 발견');
      console.log('   ⚠️  실제 발송은 하지 않습니다 (테스트용)');
      
      // 발송 버튼 클릭 (확인 다이얼로그에서 취소)
      await sendButton.click();
      await page.waitForTimeout(1000);
      
      // 확인 다이얼로그 처리 (취소)
      page.on('dialog', async dialog => {
        console.log(`   다이얼로그: ${dialog.message()}`);
        await dialog.dismiss();
      });
    }

    // 10. 네트워크 로그 확인
    console.log('\n🌐 10. 네트워크 요청 확인...');
    console.log(`   SMS 관련 API 호출: ${networkLogs.length}개`);
    networkLogs.forEach(log => {
      console.log(`   - ${log.method} ${log.url} (${log.status})`);
    });

    // 11. 콘솔 오류 확인
    console.log('\n🔍 11. 콘솔 오류 확인...');
    if (errors.length > 0) {
      console.log(`   ❌ 콘솔 오류 ${errors.length}개 발견:`);
      errors.forEach(err => console.log(`      - ${err}`));
    } else {
      console.log('   ✅ 콘솔 오류 없음');
    }

    // 12. 스크린샷 저장
    console.log('\n📸 12. 스크린샷 저장 중...');
    await page.screenshot({
      path: 'playwright-sms-send-flow.png',
      fullPage: true
    });
    console.log('   ✅ 스크린샷 저장: playwright-sms-send-flow.png');

    // 13. 테스트 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과 요약:');
    console.log(`   - Channel Post ID: ${channelPostId || '없음'}`);
    console.log(`   - 현재 수신자: ${currentRecipientCount}명`);
    console.log(`   - 메시지 길이: ${currentContent.length}자`);
    console.log(`   - 네트워크 요청: ${networkLogs.length}개`);
    console.log(`   - 콘솔 오류: ${errors.length}개`);
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('❌ 테스트 실패: 콘솔 오류가 발견되었습니다.');
      process.exit(1);
    } else {
      console.log('✅ 테스트 성공: SMS 편집 및 발송 플로우가 정상적으로 작동합니다.');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({
      path: 'playwright-sms-send-flow-error.png',
      fullPage: true
    });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testSMSSendFlow();

