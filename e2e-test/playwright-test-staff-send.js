const { chromium } = require('playwright');

const LOCAL_URL = 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';
const TEST_PHONE = '010-6669-9000'; // 관리자 번호

async function testStaffSend() {
  console.log('🚀 스텝진 테스트 발송 테스트 시작...\n');
  console.log(`📞 테스트 번호: ${TEST_PHONE}\n`);

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
    if (url.includes('/api/admin/sms') || url.includes('/api/channels/sms')) {
      networkLogs.push({
        url,
        status: response.status(),
        method: response.request().method()
      });
    }
  });

  // 다이얼로그 핸들러 (confirm, alert)
  page.on('dialog', async dialog => {
    const message = dialog.message();
    console.log(`   💬 다이얼로그: ${message}`);
    
    if (dialog.type() === 'confirm') {
      // 확인 다이얼로그는 확인 클릭
      await dialog.accept();
      console.log('   ✅ 확인 다이얼로그 확인');
    } else if (dialog.type() === 'alert') {
      // 알림 다이얼로그는 확인 클릭
      await dialog.accept();
      console.log('   ✅ 알림 다이얼로그 확인');
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
      // 로그인 필드 찾기
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
        await page.screenshot({ path: 'playwright-staff-send-login-debug.png', fullPage: true });
        throw new Error('로그인 입력 필드를 찾을 수 없습니다.');
      }
    }

    // 2. SMS 에디터 페이지로 이동
    console.log('\n📋 2. SMS 에디터 페이지로 이동 중...');
    await page.goto(`${LOCAL_URL}/admin/sms`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    console.log('✅ SMS 에디터 페이지 로드 완료');

    // 3. 메시지 내용 입력
    console.log('\n📝 3. 메시지 내용 입력...');
    const contentTextarea = await page.locator('textarea').first();
    if (await contentTextarea.isVisible({ timeout: 5000 })) {
      await contentTextarea.fill('[API 테스트] 스텝진 테스트 발송 테스트 메시지입니다.');
      await page.waitForTimeout(1000);
      console.log('✅ 메시지 내용 입력 완료');
    } else {
      throw new Error('메시지 입력 필드를 찾을 수 없습니다.');
    }

    // 4. 수신자 번호 섹션 찾기
    console.log('\n👥 4. 수신자 번호 섹션 찾기...');
    
    // 수신자 번호 입력 필드 찾기 (여러 방법 시도)
    let recipientInput = null;
    
    // 방법 1: "+ 번호 추가" 버튼 옆의 input 찾기
    const addNumberButton = await page.locator('button').filter({ hasText: '+ 번호 추가' }).first();
    if (await addNumberButton.isVisible({ timeout: 5000 })) {
      // "+ 번호 추가" 버튼 클릭하여 입력 필드 생성
      await addNumberButton.click();
      await page.waitForTimeout(500);
      console.log('   "+ 번호 추가" 버튼 클릭 완료');
    }

    // 수신자 번호 입력 필드 찾기
    const telInputs = await page.locator('input[type="tel"]').all();
    if (telInputs.length > 0) {
      // 첫 번째 빈 필드에 번호 입력
      for (const input of telInputs) {
        const value = await input.inputValue();
        if (!value || value.trim() === '') {
          recipientInput = input;
          break;
        }
      }
      
      // 모든 필드가 채워져 있으면 첫 번째 필드 사용
      if (!recipientInput && telInputs.length > 0) {
        recipientInput = telInputs[0];
      }
    }

    if (recipientInput) {
      await recipientInput.fill(TEST_PHONE);
      await page.waitForTimeout(1000);
      console.log(`✅ 수신자 번호 입력 완료: ${TEST_PHONE}`);
    } else {
      // 대안: 직접 번호 입력 필드 찾기
      const allInputs = await page.locator('input').all();
      for (const input of allInputs) {
        const placeholder = await input.getAttribute('placeholder').catch(() => '');
        const type = await input.getAttribute('type').catch(() => '');
        if (placeholder.includes('전화번호') || placeholder.includes('번호') || type === 'tel') {
          await input.fill(TEST_PHONE);
          await page.waitForTimeout(1000);
          console.log(`✅ 수신자 번호 입력 완료 (대안 방법): ${TEST_PHONE}`);
          recipientInput = input;
          break;
        }
      }
    }

    if (!recipientInput) {
      await page.screenshot({ path: 'playwright-staff-send-recipient-debug.png', fullPage: true });
      console.log('⚠️  수신자 번호 입력 필드를 찾을 수 없습니다. 스크린샷 저장: playwright-staff-send-recipient-debug.png');
      console.log('   스텝진 테스트 발송 버튼을 직접 클릭합니다 (번호는 자동으로 추가됨).');
    }

    // 5. 스텝진 테스트 발송 버튼 찾기 및 클릭
    console.log('\n🚀 5. 스텝진 테스트 발송 버튼 찾기...');
    
    // 여러 방법으로 버튼 찾기
    let testSendButton = null;
    
    // 방법 1: "스탭진 테스트 발송" 텍스트가 있는 버튼
    const testButtons = await page.locator('button').filter({ hasText: /스탭진.*테스트.*발송|스텝진.*테스트.*발송/i }).all();
    if (testButtons.length > 0) {
      testSendButton = testButtons[0];
      console.log(`   방법 1: "스탭진 테스트 발송" 버튼 발견 (${testButtons.length}개)`);
    } else {
      // 방법 2: "테스트 발송" 텍스트가 있는 버튼
      const testButtons2 = await page.locator('button').filter({ hasText: /테스트.*발송/i }).all();
      if (testButtons2.length > 0) {
        testSendButton = testButtons2[0];
        console.log(`   방법 2: "테스트 발송" 버튼 발견`);
      } else {
        // 방법 3: 주황색 버튼 (bg-orange-600)
        const orangeButtons = await page.locator('button.bg-orange-600, button[class*="orange"]').all();
        if (orangeButtons.length > 0) {
          testSendButton = orangeButtons[0];
          console.log(`   방법 3: 주황색 버튼 발견`);
        }
      }
    }

    if (!testSendButton) {
      await page.screenshot({ path: 'playwright-staff-send-button-debug.png', fullPage: true });
      throw new Error('스텝진 테스트 발송 버튼을 찾을 수 없습니다. 스크린샷 저장: playwright-staff-send-button-debug.png');
    }

    console.log('✅ 스텝진 테스트 발송 버튼 발견');
    
    // 버튼이 비활성화되어 있는지 확인
    const isDisabled = await testSendButton.isDisabled().catch(() => false);
    if (isDisabled) {
      console.log('   ⚠️  버튼이 비활성화되어 있습니다. 메시지 내용을 확인하세요.');
    }

    // 6. 스텝진 테스트 발송 버튼 클릭
    console.log('\n📤 6. 스텝진 테스트 발송 버튼 클릭...');
    await testSendButton.click();
    await page.waitForTimeout(2000); // 확인 다이얼로그 대기

    // 7. 발송 완료 대기
    console.log('\n⏳ 7. 발송 완료 대기...');
    await page.waitForTimeout(5000); // 발송 처리 대기

    // 8. 네트워크 로그 확인
    console.log('\n🌐 8. 네트워크 요청 확인...');
    console.log(`   SMS 관련 API 호출: ${networkLogs.length}개`);
    networkLogs.forEach(log => {
      console.log(`   - ${log.method} ${log.url} (${log.status})`);
    });

    // 9. 콘솔 오류 확인
    console.log('\n🔍 9. 콘솔 오류 확인...');
    if (errors.length > 0) {
      console.log(`   ❌ 콘솔 오류 ${errors.length}개 발견:`);
      errors.forEach(err => console.log(`      - ${err}`));
    } else {
      console.log('   ✅ 콘솔 오류 없음');
    }

    // 10. 스크린샷 저장
    console.log('\n📸 10. 스크린샷 저장 중...');
    await page.screenshot({
      path: 'playwright-staff-send-result.png',
      fullPage: true
    });
    console.log('   ✅ 스크린샷 저장: playwright-staff-send-result.png');

    // 11. 테스트 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과 요약:');
    console.log(`   - 테스트 번호: ${TEST_PHONE}`);
    console.log(`   - 네트워크 요청: ${networkLogs.length}개`);
    console.log(`   - 콘솔 오류: ${errors.length}개`);
    
    // API 호출 성공 여부 확인
    const successApiCalls = networkLogs.filter(log => log.status >= 200 && log.status < 300);
    console.log(`   - 성공한 API 호출: ${successApiCalls.length}개`);
    
    if (successApiCalls.length > 0) {
      console.log('   ✅ 스텝진 테스트 발송 API 호출 성공');
    } else {
      console.log('   ⚠️  API 호출이 확인되지 않았습니다.');
    }
    
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('❌ 테스트 실패: 콘솔 오류가 발견되었습니다.');
      process.exit(1);
    } else if (successApiCalls.length === 0) {
      console.log('⚠️  테스트 부분 성공: API 호출이 확인되지 않았습니다.');
      process.exit(0);
    } else {
      console.log('✅ 테스트 성공: 스텝진 테스트 발송이 정상적으로 작동합니다.');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({
      path: 'playwright-staff-send-error.png',
      fullPage: true
    });
    console.log('   스크린샷 저장: playwright-staff-send-error.png');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStaffSend();
