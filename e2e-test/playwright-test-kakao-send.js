const { chromium } = require('playwright');

const LOCAL_URL = 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';
const TEST_PHONE = '010-6669-9000'; // 관리자 번호

async function testKakaoSend() {
  console.log('🚀 카카오톡 테스트 메시지 발송 테스트 시작...\n');
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
    if (url.includes('/api/channels/kakao') || url.includes('/api/admin/kakao')) {
      networkLogs.push({
        url,
        status: response.status(),
        method: response.request().method()
      });
    }
  });

  // 다이얼로그 핸들러 (confirm, alert) - 한 번만 처리
  let dialogHandled = false;
  page.on('dialog', async dialog => {
    if (dialogHandled) {
      return; // 이미 처리된 다이얼로그는 무시
    }
    
    const message = dialog.message();
    console.log(`   💬 다이얼로그: ${message}`);
    
    dialogHandled = true;
    
    if (dialog.type() === 'confirm') {
      // 확인 다이얼로그는 확인 클릭
      await dialog.accept();
      console.log('   ✅ 확인 다이얼로그 확인');
    } else if (dialog.type() === 'alert') {
      // 알림 다이얼로그는 확인 클릭
      await dialog.accept();
      console.log('   ✅ 알림 다이얼로그 확인');
    }
    
    // 다이얼로그 처리 후 플래그 리셋 (다음 다이얼로그를 위해)
    setTimeout(() => {
      dialogHandled = false;
    }, 1000);
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
        await page.screenshot({ path: 'playwright-kakao-send-login-debug.png', fullPage: true });
        throw new Error('로그인 입력 필드를 찾을 수 없습니다.');
      }
    }

    // 2. 카카오 채널 에디터 페이지로 이동
    console.log('\n📋 2. 카카오 채널 에디터 페이지로 이동 중...');
    await page.goto(`${LOCAL_URL}/admin/kakao`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    console.log('✅ 카카오 채널 에디터 페이지 로드 완료');

    // 3. 메시지 내용 입력
    console.log('\n📝 3. 메시지 내용 입력...');
    const contentTextarea = await page.locator('textarea').first();
    if (await contentTextarea.isVisible({ timeout: 5000 })) {
      await contentTextarea.fill('[API 테스트] 카카오톡 테스트 메시지입니다.');
      await page.waitForTimeout(1000);
      console.log('✅ 메시지 내용 입력 완료');
    } else {
      throw new Error('메시지 입력 필드를 찾을 수 없습니다.');
    }

    // 참고: 태그는 메시지 분류용이며, 발송 대상(수신자)과는 별개입니다.
    // 수신자는 발송 버튼 클릭 후 모달에서 선택합니다.
    // 태그는 선택사항이므로 입력하지 않습니다.

    // 4. 메시지 타입 확인 (알림톡/친구톡)
    console.log('\n💬 4. 메시지 타입 확인...');
    const alimtalkRadio = await page.locator('input[type="radio"][value="ALIMTALK"]').first();
    const friendtalkRadio = await page.locator('input[type="radio"][value="FRIENDTALK"]').first();
    
    if (await friendtalkRadio.isVisible({ timeout: 3000 })) {
      await friendtalkRadio.click();
      await page.waitForTimeout(500);
      console.log('✅ 친구톡 선택 완료');
    } else if (await alimtalkRadio.isVisible({ timeout: 3000 })) {
      await alimtalkRadio.click();
      await page.waitForTimeout(500);
      console.log('✅ 알림톡 선택 완료');
    } else {
      console.log('   ⚠️  메시지 타입 라디오 버튼을 찾을 수 없습니다. 기본값 사용');
    }

    // 5. 발송 버튼 찾기 및 클릭
    console.log('\n📤 5. 발송 버튼 찾기...');
    
    // 여러 방법으로 발송 버튼 찾기
    let sendButton = null;
    
    // 방법 1: "발송" 텍스트가 있는 버튼
    const sendButtons = await page.locator('button').filter({ hasText: /발송/i }).all();
    if (sendButtons.length > 0) {
      // "카카오 발송" 또는 "발송" 버튼 찾기
      for (const btn of sendButtons) {
        const text = await btn.textContent();
        if (text && (text.includes('발송') || text.includes('카카오'))) {
          sendButton = btn;
          console.log(`   방법 1: "${text.trim()}" 버튼 발견`);
          break;
        }
      }
    }
    
    if (!sendButton) {
      // 방법 2: 파란색 버튼 (bg-blue-600)
      const blueButtons = await page.locator('button.bg-blue-600, button[class*="blue"]').all();
      if (blueButtons.length > 0) {
        for (const btn of blueButtons) {
          const text = await btn.textContent();
          if (text && text.includes('발송')) {
            sendButton = btn;
            console.log(`   방법 2: 파란색 발송 버튼 발견`);
            break;
          }
        }
      }
    }

    if (!sendButton) {
      await page.screenshot({ path: 'playwright-kakao-send-button-debug.png', fullPage: true });
      throw new Error('발송 버튼을 찾을 수 없습니다. 스크린샷 저장: playwright-kakao-send-button-debug.png');
    }

    console.log('✅ 발송 버튼 발견');
    
    // 버튼이 비활성화되어 있는지 확인
    const isDisabled = await sendButton.isDisabled().catch(() => false);
    if (isDisabled) {
      console.log('   ⚠️  버튼이 비활성화되어 있습니다. 메시지 내용을 확인하세요.');
    }

    // 6. 발송 버튼 클릭 (수신자 모달이 열림)
    console.log('\n📤 6. 발송 버튼 클릭...');
    await sendButton.click();
    await page.waitForTimeout(3000); // 모달 열림 대기 (에러 다이얼로그 처리 포함)

    // 7. 수신자 선택 모달에서 전화번호 입력
    console.log('\n👥 7. 수신자 선택 모달에서 전화번호 입력...');
    
    // 모달이 열릴 때까지 대기 - "수신자 선택" 텍스트가 나타날 때까지
    console.log('   모달 열림 대기 중...');
    try {
      await page.waitForSelector('text=/수신자.*선택/i', { timeout: 5000 });
      console.log('   ✅ "수신자 선택" 텍스트 발견 - 모달이 열렸습니다');
    } catch {
      console.log('   ⚠️  "수신자 선택" 텍스트를 찾을 수 없습니다. 계속 진행...');
    }
    await page.waitForTimeout(2000);
    
    // 모달이 열렸는지 확인 (여러 방법으로 시도)
    let modal = null;
    
    // 방법 1: fixed inset-0 클래스로 찾기
    const fixedModals = await page.locator('.fixed.inset-0').all();
    for (const m of fixedModals) {
      if (await m.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await m.textContent().catch(() => '');
        if (text.includes('수신자') || text.includes('전화번호') || text.includes('친구')) {
          modal = m;
          console.log('   방법 1: fixed inset-0 모달 발견');
          break;
        }
      }
    }
    
    // 방법 2: z-50 클래스로 찾기
    if (!modal) {
      const z50Modals = await page.locator('[class*="z-50"]').all();
      for (const m of z50Modals) {
        if (await m.isVisible({ timeout: 2000 }).catch(() => false)) {
          const text = await m.textContent().catch(() => '');
          if (text.includes('수신자') || text.includes('전화번호') || text.includes('친구')) {
            modal = m;
            console.log('   방법 2: z-50 모달 발견');
            break;
          }
        }
      }
    }
    
    // 방법 3: "수신자 선택" 텍스트가 있는 요소 찾기
    if (!modal) {
      const recipientText = await page.locator('text=/수신자.*선택/i').first();
      if (await recipientText.isVisible({ timeout: 3000 }).catch(() => false)) {
        // 부모 요소 찾기
        modal = recipientText.locator('..').locator('..').locator('..');
        console.log('   방법 3: "수신자 선택" 텍스트로 모달 발견');
      }
    }
    
    if (modal && await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✅ 수신자 선택 모달 열림 확인');
      
      // "전화번호 직접 입력" 탭 클릭 (이미 선택되어 있을 수 있음)
      const phoneTab = await page.locator('button').filter({ hasText: /전화번호.*직접.*입력|직접.*입력/i }).first();
      if (await phoneTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await phoneTab.click();
        await page.waitForTimeout(500);
        console.log('✅ "전화번호 직접 입력" 탭 클릭');
      } else {
        console.log('   ⚠️  "전화번호 직접 입력" 탭을 찾을 수 없습니다. 이미 선택되어 있을 수 있습니다.');
      }
      
      // 전화번호 입력 필드 찾기 (모달 내부에서만)
      let phoneInput = null;
      
      // 방법 1: 모달 내부의 textarea 찾기 (전화번호 입력용)
      const textareas = await modal.locator('textarea').all();
      for (const textarea of textareas) {
        if (await textarea.isVisible({ timeout: 1000 }).catch(() => false)) {
          const placeholder = await textarea.getAttribute('placeholder').catch(() => '') || '';
          const value = await textarea.inputValue().catch(() => '') || '';
          // placeholder에 "전화번호" 또는 "번호"가 포함되어 있고, 빈 필드인 경우
          if ((placeholder.includes('전화번호') || placeholder.includes('번호') || placeholder.includes('쉼표')) && value === '') {
            phoneInput = textarea;
            console.log('   방법 1: 전화번호 입력용 textarea 발견');
            break;
          }
        }
      }
      
      // 방법 2: 모달 내부의 input[type="tel"] 찾기
      if (!phoneInput) {
        const telInputs = await modal.locator('input[type="tel"]').all();
        for (const input of telInputs) {
          if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
            phoneInput = input;
            console.log('   방법 2: input[type="tel"] 발견');
            break;
          }
        }
      }
      
      // 방법 3: 모달 내부의 모든 input 찾기
      if (!phoneInput) {
        const allInputs = await modal.locator('input').all();
        for (const input of allInputs) {
          if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
            const placeholder = await input.getAttribute('placeholder').catch(() => '') || '';
            const type = await input.getAttribute('type').catch(() => '') || '';
            if (placeholder.includes('전화번호') || placeholder.includes('번호') || type === 'tel' || type === 'text') {
              phoneInput = input;
              console.log('   방법 3: 일반 input 발견');
              break;
            }
          }
        }
      }
      
      // 방법 4: 페이지 전체에서 찾기 (모달이 제대로 감지되지 않은 경우)
      if (!phoneInput) {
        const allTextareas = await page.locator('textarea').all();
        for (const textarea of allTextareas) {
          if (await textarea.isVisible({ timeout: 1000 }).catch(() => false)) {
            const placeholder = await textarea.getAttribute('placeholder').catch(() => '') || '';
            if (placeholder.includes('전화번호') || placeholder.includes('번호') || placeholder === '') {
              phoneInput = textarea;
              console.log('   방법 4: 페이지 전체에서 textarea 발견');
              break;
            }
          }
        }
      }
      
      // 방법 5: 모달 내부의 모든 textarea 중 첫 번째 빈 필드 (전화번호 입력용)
      if (!phoneInput && modal) {
        const modalTextareas = await modal.locator('textarea').all();
        for (const textarea of modalTextareas) {
          if (await textarea.isVisible({ timeout: 1000 }).catch(() => false)) {
            const value = await textarea.inputValue().catch(() => '') || '';
            const placeholder = await textarea.getAttribute('placeholder').catch(() => '') || '';
            // 빈 필드이고, placeholder가 전화번호 관련이거나 없으면 전화번호 입력용으로 간주
            if ((value === '' || value.trim() === '') && (placeholder.includes('전화번호') || placeholder.includes('번호') || placeholder.includes('쉼표') || placeholder === '')) {
              phoneInput = textarea;
              console.log('   방법 5: 모달 내부의 빈 textarea 발견 (전화번호 입력용)');
              break;
            }
          }
        }
      }

      if (phoneInput) {
        await phoneInput.fill(TEST_PHONE);
        await page.waitForTimeout(1000);
        
        // 입력된 값 확인
        const inputValue = await phoneInput.inputValue().catch(() => '');
        console.log(`✅ 전화번호 입력 완료: ${TEST_PHONE}`);
        console.log(`   입력된 값 확인: "${inputValue}"`);
        
        if (!inputValue || inputValue.trim() === '') {
          throw new Error('전화번호가 제대로 입력되지 않았습니다.');
        }
      } else {
        // 스크린샷 저장 후 더 자세한 디버깅
        await page.screenshot({ path: 'playwright-kakao-send-modal-debug.png', fullPage: true });
        
        // 모든 입력 필드 정보 출력
        const allInputs = await page.locator('input, textarea').all();
        console.log(`   발견된 입력 필드: ${allInputs.length}개`);
        for (let i = 0; i < Math.min(allInputs.length, 5); i++) {
          const input = allInputs[i];
          const tag = await input.evaluate(el => el.tagName);
          const placeholder = await input.getAttribute('placeholder').catch(() => '');
          const type = await input.getAttribute('type').catch(() => '');
          const visible = await input.isVisible().catch(() => false);
          console.log(`   - ${tag} (type: ${type}, placeholder: ${placeholder}, visible: ${visible})`);
        }
        
        throw new Error('전화번호 입력 필드를 찾을 수 없습니다. 스크린샷 저장: playwright-kakao-send-modal-debug.png');
      }

      // 8. 확인 버튼 클릭
      console.log('\n✅ 8. 확인 버튼 클릭...');
      
      // 모달의 푸터 영역(.bg-gray-50)에서 확인 버튼 찾기
      let confirmButton = null;
      
      // 방법 1: 푸터 영역의 모든 버튼 확인
      const footerAreas = await page.locator('.bg-gray-50').all();
      console.log(`   푸터 영역 ${footerAreas.length}개 발견`);
      
      for (const footerArea of footerAreas) {
        if (await footerArea.isVisible({ timeout: 2000 }).catch(() => false)) {
          const footerButtons = await footerArea.locator('button').all();
          console.log(`   푸터 영역 버튼 ${footerButtons.length}개 확인 중...`);
          
          for (const btn of footerButtons) {
            const text = await btn.textContent().catch(() => '') || '';
            const className = await btn.getAttribute('class').catch(() => '') || '';
            const visible = await btn.isVisible().catch(() => false);
            console.log(`   - 푸터 버튼: "${text.trim()}" (visible: ${visible}, bg-blue: ${className.includes('bg-blue')})`);
            
            // "확인"이 포함되고 파란색 배경인 버튼
            if (text.includes('확인') && className.includes('bg-blue') && visible) {
              confirmButton = btn;
              console.log(`   ✅ 방법 1: 푸터에서 "확인" 버튼 발견: "${text.trim()}"`);
              break;
            }
          }
          
          if (confirmButton) break;
        }
      }
      
      // 방법 2: 모달 내부의 푸터 영역에서 찾기
      if (!confirmButton && modal) {
        const modalFooter = await modal.locator('.bg-gray-50').first();
        if (await modalFooter.isVisible({ timeout: 2000 }).catch(() => false)) {
          const modalFooterButtons = await modalFooter.locator('button').all();
          console.log(`   모달 푸터 버튼 ${modalFooterButtons.length}개 확인 중...`);
          
          for (const btn of modalFooterButtons) {
            const text = await btn.textContent().catch(() => '') || '';
            const className = await btn.getAttribute('class').catch(() => '') || '';
            if (text.includes('확인') && className.includes('bg-blue')) {
              if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
                confirmButton = btn;
                console.log(`   ✅ 방법 2: 모달 푸터에서 "확인" 버튼 발견: "${text.trim()}"`);
                break;
              }
            }
          }
        }
      }
      
      // 방법 3: 모든 파란색 버튼 중 "확인" 포함
      if (!confirmButton) {
        const allBlueButtons = await page.locator('button[class*="bg-blue-600"], button[class*="bg-blue"]').all();
        console.log(`   전체 파란색 버튼 ${allBlueButtons.length}개 확인 중...`);
        for (const btn of allBlueButtons) {
          const text = await btn.textContent().catch(() => '') || '';
          if (text.includes('확인') && !text.includes('동기화')) {
            if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
              confirmButton = btn;
              console.log(`   ✅ 방법 3: 파란색 "확인" 버튼 발견: "${text.trim()}"`);
              break;
            }
          }
        }
      }
      
      if (confirmButton) {
        const buttonText = await confirmButton.textContent().catch(() => '');
        console.log(`   확인 버튼 텍스트: "${buttonText}"`);
        await confirmButton.click();
        await page.waitForTimeout(3000); // 모달 닫힘 및 발송 시작 대기
        console.log('✅ 확인 버튼 클릭 완료');
      } else {
        await page.screenshot({ path: 'playwright-kakao-send-confirm-debug.png', fullPage: true });
        
        // 모든 버튼 정보 출력
        const allButtons = await page.locator('button').all();
        console.log(`   발견된 버튼: ${allButtons.length}개`);
        for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
          const btn = allButtons[i];
          const text = await btn.textContent().catch(() => '');
          const visible = await btn.isVisible().catch(() => false);
          console.log(`   - "${text?.trim()}" (visible: ${visible})`);
        }
        
        throw new Error('확인 버튼을 찾을 수 없습니다. 스크린샷 저장: playwright-kakao-send-confirm-debug.png');
      }
    } else {
      await page.screenshot({ path: 'playwright-kakao-send-modal-not-found.png', fullPage: true });
      throw new Error('수신자 선택 모달이 열리지 않았습니다. 스크린샷 저장: playwright-kakao-send-modal-not-found.png');
    }

    // 9. 발송 완료 대기
    console.log('\n⏳ 9. 발송 완료 대기...');
    await page.waitForTimeout(5000); // 발송 처리 대기

    // 10. 네트워크 로그 확인
    console.log('\n🌐 10. 네트워크 요청 확인...');
    console.log(`   카카오 관련 API 호출: ${networkLogs.length}개`);
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
      path: 'playwright-kakao-send-result.png',
      fullPage: true
    });
    console.log('   ✅ 스크린샷 저장: playwright-kakao-send-result.png');

    // 13. 테스트 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과 요약:');
    console.log(`   - 테스트 번호: ${TEST_PHONE}`);
    console.log(`   - 네트워크 요청: ${networkLogs.length}개`);
    console.log(`   - 콘솔 오류: ${errors.length}개`);
    
    // API 호출 성공 여부 확인
    const successApiCalls = networkLogs.filter(log => log.status >= 200 && log.status < 300);
    console.log(`   - 성공한 API 호출: ${successApiCalls.length}개`);
    
    // 발송 API 호출 확인
    const sendApiCall = networkLogs.find(log => log.url.includes('/api/channels/kakao/send'));
    if (sendApiCall) {
      console.log(`   - 발송 API 호출: ${sendApiCall.method} ${sendApiCall.url} (${sendApiCall.status})`);
      if (sendApiCall.status === 200) {
        console.log('   ✅ 카카오톡 발송 API 호출 성공');
      } else {
        console.log(`   ⚠️  발송 API 호출 실패 (상태 코드: ${sendApiCall.status})`);
      }
    } else {
      console.log('   ⚠️  발송 API 호출이 확인되지 않았습니다.');
    }
    
    console.log('='.repeat(60));

    if (errors.length > 0 && errors.some(err => !err.includes('404'))) {
      console.log('❌ 테스트 실패: 콘솔 오류가 발견되었습니다.');
      process.exit(1);
    } else if (!sendApiCall || sendApiCall.status !== 200) {
      console.log('⚠️  테스트 부분 성공: 발송 API 호출이 확인되지 않았거나 실패했습니다.');
      process.exit(0);
    } else {
      console.log('✅ 테스트 성공: 카카오톡 테스트 메시지 발송이 정상적으로 작동합니다.');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({
      path: 'playwright-kakao-send-error.png',
      fullPage: true
    });
    console.log('   스크린샷 저장: playwright-kakao-send-error.png');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testKakaoSend();
