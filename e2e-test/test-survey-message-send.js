const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

(async () => {
  console.log('🚀 설문 조사 관리 - 감사 메시지 발송 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // 각 동작 사이 1초 대기
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 콘솔 로그 수집
  const consoleLogs = [];
  const consoleErrors = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      consoleErrors.push(text);
      console.log('   ❌ 콘솔 오류:', text);
    } else if (text.includes('발송') || text.includes('API') || text.includes('send-messages')) {
      // 발송 관련 로그는 모두 출력
      console.log(`   📝 [${msg.type()}]`, text);
    }
  });
  
  // 네트워크 요청/응답 수집
  const networkRequests = [];
  const networkResponses = [];
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      const reqInfo = {
        method: request.method(),
        url: url,
        timestamp: new Date().toISOString()
      };
      networkRequests.push(reqInfo);
      console.log(`   📤 [요청] ${request.method()} ${url}`);
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      const url = response.url();
      const status = response.status();
      let responseBody = null;
      
      try {
        responseBody = await response.json().catch(() => null);
      } catch (e) {
        responseBody = await response.text().catch(() => null);
      }
      
      networkResponses.push({
        url,
        status,
        body: responseBody,
        timestamp: new Date().toISOString()
      });
      
      // send-messages API 응답 상세 로깅
      if (url.includes('/api/admin/surveys/send-messages')) {
        console.log('\n📡 [send-messages] API 응답:');
        console.log('   URL:', url);
        console.log('   Status:', status);
        console.log('   Body:', JSON.stringify(responseBody, null, 2));
      }
      
      // channels/sms/send API 응답 상세 로깅
      if (url.includes('/api/channels/sms/send')) {
        console.log('\n📡 [sms/send] API 응답:');
        console.log('   URL:', url);
        console.log('   Status:', status);
        console.log('   Body:', JSON.stringify(responseBody, null, 2));
      }
    }
  });
  
  try {
    // 1. 로그인 페이지 접속
    console.log('📄 1. 로그인 페이지 접속 중...');
    await page.goto(`${BASE_URL}/admin/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    console.log('✅ 로그인 페이지 로드 완료');
    await page.waitForTimeout(2000);
    
    // 2. 로그인
    console.log('\n🔐 2. 로그인 시도...');
    const loginInput = await page.locator('input[name="login"], input[type="text"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const submitButton = await page.locator('button[type="submit"]').first();
    
    if (await loginInput.isVisible()) {
      await loginInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      await submitButton.click();
      
      // 로그인 완료 대기
      await page.waitForURL(url => !url.includes('/admin/login'), { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(3000);
      console.log('✅ 로그인 완료');
    } else {
      console.log('✅ 이미 로그인되어 있습니다.');
    }
    
    // 3. 설문 조사 관리 페이지로 이동
    console.log('\n📋 3. 설문 조사 관리 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/surveys`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('✅ 설문 조사 관리 페이지 로드 완료');
    await page.waitForTimeout(3000);
    
    // 4. 첫 번째 설문의 "감사 메시지" 버튼 찾기
    console.log('\n🔍 4. 감사 메시지 버튼 찾기...');
    
    // 테이블이 로드될 때까지 대기
    await page.waitForSelector('table', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // "감사 메시지" 또는 "감사메시지" 버튼 찾기
    const thankYouButtons = page.locator('button:has-text("감사"), button:has-text("감사 메시지"), button:has-text("감사메시지")');
    const buttonCount = await thankYouButtons.count();
    
    console.log(`   발견된 감사 메시지 버튼: ${buttonCount}개`);
    
    if (buttonCount === 0) {
      console.log('❌ 감사 메시지 버튼을 찾을 수 없습니다.');
      console.log('   페이지 스크린샷 저장 중...');
      await page.screenshot({ path: 'test-survey-no-button.png', fullPage: true });
      return;
    }
    
    // 첫 번째 설문의 ID 가져오기
    console.log('\n🔍 5. 첫 번째 설문 정보 확인...');
    
    // 테이블에서 첫 번째 설문 행 찾기
    const firstRow = page.locator('table tbody tr').first();
    const rowText = await firstRow.textContent();
    console.log('   첫 번째 행 텍스트:', rowText?.substring(0, 200));
    
    // 버튼 정보 확인
    const firstButton = thankYouButtons.first();
    const buttonText = await firstButton.textContent();
    const buttonIsVisible = await firstButton.isVisible();
    const buttonIsEnabled = await firstButton.isEnabled();
    
    console.log('   버튼 텍스트:', buttonText);
    console.log('   버튼 표시 여부:', buttonIsVisible);
    console.log('   버튼 활성화 여부:', buttonIsEnabled);
    
    // 버튼 클릭 전 상태
    console.log('\n👆 6. 감사 메시지 버튼 클릭 시도...');
    
    // API 요청/응답 초기화 (버튼 클릭 직전)
    const requestCountBefore = networkRequests.length;
    const responseCountBefore = networkResponses.length;
    console.log(`   클릭 전 요청 수: ${requestCountBefore}, 응답 수: ${responseCountBefore}`);
    
    // 새로운 요청만 추적하기 위한 타임스탬프
    const clickStartTime = new Date().toISOString();
    console.log('   네트워크 요청 모니터링 시작 (타임스탬프:', clickStartTime, ')...');
    
    // 버튼 클릭 (여러 방법 시도)
    let clickSuccess = false;
    
    try {
      // 방법 1: 일반 클릭
      await firstButton.click();
      clickSuccess = true;
      console.log('   ✅ 일반 클릭 완료');
    } catch (e1) {
      console.log('   ⚠️ 일반 클릭 실패:', e1.message);
      try {
        // 방법 2: force 클릭
        await firstButton.click({ force: true });
        clickSuccess = true;
        console.log('   ✅ Force 클릭 완료');
      } catch (e2) {
        console.log('   ⚠️ Force 클릭 실패:', e2.message);
        try {
          // 방법 3: JavaScript로 클릭 이벤트 발생
          await page.evaluate((button) => {
            if (button && button.click) {
              button.click();
            }
          }, await firstButton.elementHandle());
          clickSuccess = true;
          console.log('   ✅ JavaScript 클릭 완료');
        } catch (e3) {
          console.log('   ❌ 모든 클릭 방법 실패:', e3.message);
        }
      }
    }
    
    if (!clickSuccess) {
      console.log('   ❌ 버튼 클릭에 실패했습니다.');
      await page.screenshot({ path: 'test-survey-click-failed.png', fullPage: true });
      return;
    }
    
    // 클릭 후 대기 (더 긴 시간)
    console.log('   클릭 후 5초 대기 중...');
    await page.waitForTimeout(5000);
    
    // 클릭 후 발생한 새로운 요청 확인
    console.log('\n⏳ 클릭 후 API 요청 대기 중...');
    await page.waitForTimeout(5000);
    
    const requestCountAfter = networkRequests.length;
    const responseCountAfter = networkResponses.length;
    const newRequests = networkRequests.slice(requestCountBefore);
    const newResponses = networkResponses.slice(responseCountBefore);
    
    console.log(`   클릭 후 요청 수: ${requestCountAfter} (새로운 요청: ${newRequests.length}개)`);
    console.log(`   클릭 후 응답 수: ${responseCountAfter} (새로운 응답: ${newResponses.length}개)`);
    
    // 새로운 요청 출력
    if (newRequests.length > 0) {
      console.log('\n   📡 클릭 후 발생한 새로운 API 요청:');
      newRequests.forEach(req => {
        console.log(`      - ${req.method} ${req.url}`);
      });
    } else {
      console.log('   ⚠️ 클릭 후 새로운 API 요청이 발생하지 않았습니다.');
    }
    
    // send-messages API 요청 확인
    const sendMessagesRequest = newRequests.find(r => r.url.includes('/api/admin/surveys/send-messages'));
    const sendMessagesResponse = newResponses.find(r => r.url.includes('/api/admin/surveys/send-messages'));
    
    if (sendMessagesRequest) {
      console.log('   ✅ send-messages API 요청 발견!');
      if (sendMessagesResponse) {
        console.log('   ✅ send-messages API 응답 발견!');
      } else {
        console.log('   ⚠️ send-messages API 응답이 아직 없습니다. 추가 대기...');
        await page.waitForTimeout(5000);
        // 다시 확인
        const latestResponses = networkResponses.slice(responseCountBefore);
        const latestSendMessagesResponse = latestResponses.find(r => r.url.includes('/api/admin/surveys/send-messages'));
        if (latestSendMessagesResponse) {
          console.log('   ✅ send-messages API 응답 발견!');
        }
      }
    }
    
    // 모달이 열릴 때까지 대기 (최대 5초)
    console.log('\n📱 6. 메시지 미리보기 모달 확인...');
    await page.waitForTimeout(2000);
    
    // 여러 선택자로 모달 찾기
    const modalSelectors = [
      '[role="dialog"]',
      '.modal',
      '[class*="modal"]',
      '[class*="Modal"]',
      'div:has-text("고객 정보")',
      'div:has-text("메시지 내용")',
      'div:has-text("감사 메시지 미리보기")'
    ];
    
    let modal = null;
    let modalVisible = false;
    
    for (const selector of modalSelectors) {
      try {
        const foundModal = page.locator(selector).first();
        if (await foundModal.isVisible({ timeout: 2000 }).catch(() => false)) {
          modal = foundModal;
          modalVisible = true;
          console.log(`   ✅ 모달 발견: ${selector}`);
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }
    
    if (!modalVisible) {
      // API 응답 확인
      const sendMessagesResponse = networkResponses.find(r => r.url.includes('/api/admin/surveys/send-messages'));
      if (sendMessagesResponse) {
        console.log('\n   📡 [send-messages] GET API 응답:');
        console.log('      Status:', sendMessagesResponse.status);
        console.log('      Body:', JSON.stringify(sendMessagesResponse.body, null, 2));
        
        if (sendMessagesResponse.status !== 200 || !sendMessagesResponse.body?.success) {
          console.log('   ❌ API 요청 실패로 인해 모달이 열리지 않았습니다.');
          if (sendMessagesResponse.body?.message) {
            console.log('      오류 메시지:', sendMessagesResponse.body.message);
          }
        }
      } else {
        console.log('   ❌ API 요청이 완료되지 않았습니다.');
      }
      
      // 페이지 전체 텍스트 확인
      const pageText = await page.textContent('body');
      console.log('   페이지 텍스트 일부:', pageText?.substring(0, 500));
      
      // 모든 모달 관련 요소 찾기
      const allModals = await page.locator('div[class*="modal"], div[class*="Modal"], [role="dialog"]').all();
      console.log(`   발견된 모달 후보: ${allModals.length}개`);
      
      // alert 확인
      page.on('dialog', async dialog => {
        console.log('   💬 Alert 발견:', dialog.message());
        await dialog.accept();
      });
    }
    
    if (modalVisible) {
      console.log('✅ 메시지 미리보기 모달이 열렸습니다.');
      
      // 모달 내용 확인
      const modalText = await modal.first().textContent();
      console.log('   모달 내용 일부:', modalText?.substring(0, 200));
      
      // 7. 발송 버튼 클릭
      console.log('\n📤 7. 메시지 발송 버튼 클릭...');
      const sendButton = modal.locator('button:has-text("발송"), button:has-text("확인"), button:has-text("발송 중")').first();
      
      if (await sendButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // 발송 버튼 클릭 전 네트워크 요청 초기화
        networkRequests.length = 0;
        networkResponses.length = 0;
        consoleErrors.length = 0;
        
        console.log('   발송 버튼 클릭 전 상태 초기화 완료');
        await sendButton.click();
        console.log('✅ 발송 버튼 클릭 완료');
        
        // 발송 완료 대기 (최대 15초)
        console.log('\n⏳ 발송 완료 대기 중...');
        await page.waitForTimeout(15000);
        
        // 8. 오류 확인
        console.log('\n🔍 8. 오류 확인...');
        
        // 콘솔 오류 확인
        const relevantErrors = consoleErrors.filter(err => 
          err.includes('No valid session') || 
          err.includes('발송 실패') || 
          err.includes('error') ||
          err.includes('Error') ||
          err.includes('실패')
        );
        
        if (relevantErrors.length > 0) {
          console.log('❌ 발견된 오류:');
          relevantErrors.forEach(err => console.log('   -', err));
        } else {
          console.log('✅ 콘솔에 관련 오류가 없습니다.');
        }
        
        // 네트워크 요청 확인
        console.log('\n📡 API 요청/응답 상세:');
        networkRequests.forEach(req => {
          console.log(`   요청: ${req.method} ${req.url}`);
        });
        
        networkResponses.forEach(res => {
          console.log(`\n   응답: ${res.status} ${res.url}`);
          if (res.body) {
            if (typeof res.body === 'object') {
              console.log('   Body:', JSON.stringify(res.body, null, 2));
            } else {
              console.log('   Body:', res.body.substring(0, 500));
            }
          }
        });
        
        // send-messages API 응답 분석
        const sendMessagesResponse = networkResponses.find(r => r.url.includes('/api/admin/surveys/send-messages'));
        if (sendMessagesResponse) {
          console.log('\n🔍 [send-messages] API 응답 분석:');
          console.log('   Status:', sendMessagesResponse.status);
          if (sendMessagesResponse.body) {
            console.log('   Success:', sendMessagesResponse.body.success);
            console.log('   Message:', sendMessagesResponse.body.message);
            if (sendMessagesResponse.body.data) {
              console.log('   Sent:', sendMessagesResponse.body.data.sent);
              console.log('   Failed:', sendMessagesResponse.body.data.failed);
              if (sendMessagesResponse.body.data.errors) {
                console.log('   Errors:', sendMessagesResponse.body.data.errors);
              }
            }
          }
        }
        
        // sms/send API 응답 분석
        const smsSendResponse = networkResponses.find(r => r.url.includes('/api/channels/sms/send'));
        if (smsSendResponse) {
          console.log('\n🔍 [sms/send] API 응답 분석:');
          console.log('   Status:', smsSendResponse.status);
          if (smsSendResponse.body) {
            console.log('   Success:', smsSendResponse.body.success);
            console.log('   Message:', smsSendResponse.body.message);
            if (smsSendResponse.body.result) {
              console.log('   SuccessCount:', smsSendResponse.body.result.successCount);
              console.log('   FailCount:', smsSendResponse.body.result.failCount);
            }
            if (smsSendResponse.body.authError) {
              console.log('   ⚠️ 인증 오류 감지!');
            }
          }
        }
        
        // 알림/다이얼로그 확인
        console.log('\n💬 9. 알림 메시지 확인...');
        await page.waitForTimeout(2000);
        
        // 페이지 스크린샷 저장
        await page.screenshot({ path: 'test-survey-message-result.png', fullPage: true });
        console.log('✅ 스크린샷 저장: test-survey-message-result.png');
        
      } else {
        console.log('❌ 발송 버튼을 찾을 수 없습니다.');
        await page.screenshot({ path: 'test-survey-no-send-button.png', fullPage: true });
      }
    } else {
      console.log('❌ 메시지 미리보기 모달이 열리지 않았습니다.');
      await page.screenshot({ path: 'test-survey-no-modal.png', fullPage: true });
    }
    
    // 최종 결과 요약
    console.log('\n📊 테스트 결과 요약:');
    console.log(`   콘솔 오류: ${consoleErrors.length}개`);
    console.log(`   API 요청: ${networkRequests.length}개`);
    console.log(`   API 응답: ${networkResponses.length}개`);
    
    const noValidSessionError = consoleErrors.some(err => err.includes('No valid session'));
    const apiAuthError = networkResponses.some(res => res.body && res.body.authError);
    
    if (noValidSessionError || apiAuthError) {
      console.log('\n❌ "No valid session" 오류가 발견되었습니다!');
      console.log('   원인: Solapi API 인증 문제');
      console.log('   해결: 환경 변수 SOLAPI_API_KEY, SOLAPI_API_SECRET 확인 필요');
      
      // 상세 오류 정보 출력
      if (noValidSessionError) {
        const error = consoleErrors.find(err => err.includes('No valid session'));
        console.log('   콘솔 오류:', error);
      }
      if (apiAuthError) {
        const errorResponse = networkResponses.find(res => res.body && res.body.authError);
        console.log('   API 오류:', JSON.stringify(errorResponse.body, null, 2));
      }
    } else {
      console.log('\n✅ "No valid session" 오류가 발견되지 않았습니다.');
    }
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    console.error('   Stack:', error.stack);
    await page.screenshot({ path: 'test-survey-error.png', fullPage: true });
    console.log('✅ 오류 스크린샷 저장: test-survey-error.png');
  } finally {
    console.log('\n⏸️  5초 후 브라우저를 닫습니다...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();
