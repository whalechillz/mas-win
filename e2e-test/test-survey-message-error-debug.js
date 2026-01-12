const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';
const ADMIN_LOGIN = '010-6669-9000';
const ADMIN_PASSWORD = '66699000';

(async () => {
  console.log('🚀 Playwright 테스트 시작: 설문 조사 메시지 발송 오류 재현');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 로그 수집
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (text.includes('[발송]') || text.includes('No valid session') || text.includes('error') || text.includes('Error')) {
      console.log(`[브라우저 콘솔 ${type}]:`, text);
    }
  });
  
  // 네트워크 요청/응답 로깅
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/admin/surveys/send-messages') || 
        url.includes('/api/channels/sms/save') || 
        url.includes('/api/channels/sms/send')) {
      console.log(`\n📤 [요청] ${request.method()} ${url}`);
      console.log('   Headers:', JSON.stringify(request.headers(), null, 2));
      if (request.postData()) {
        try {
          const body = JSON.parse(request.postData());
          console.log('   Body:', JSON.stringify({
            ...body,
            messageText: body.messageText ? body.messageText.substring(0, 100) + '...' : undefined,
            recipientNumbers: body.recipientNumbers
          }, null, 2));
        } catch (e) {
          console.log('   Body (raw):', request.postData().substring(0, 200));
        }
      }
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/admin/surveys/send-messages') || 
        url.includes('/api/channels/sms/save') || 
        url.includes('/api/channels/sms/send')) {
      console.log(`\n📥 [응답] ${response.status()} ${response.statusText()} ${url}`);
      try {
        const json = await response.json();
        console.log('   Response:', JSON.stringify({
          success: json.success,
          message: json.message,
          data: json.data ? {
            sent: json.data.sent,
            failed: json.data.failed,
            errors: json.data.errors?.slice(0, 3)
          } : undefined,
          result: json.result ? {
            groupIds: json.result.groupIds,
            successCount: json.result.successCount,
            failCount: json.result.failCount
          } : undefined,
          authError: json.authError,
          error: json.error
        }, null, 2));
      } catch (e) {
        const text = await response.text();
        console.log('   Response (text):', text.substring(0, 500));
      }
    }
  });
  
  try {
    // 1. 로그인
    console.log('\n1️⃣ 로그인 중...');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForSelector('input[type="text"], input[name="login"]', { timeout: 10000 });
    await page.fill('input[type="text"], input[name="login"]', ADMIN_LOGIN);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // 로그인 완료 대기
    await page.waitForTimeout(3000); // 페이지 로드 대기
    const currentUrl = page.url();
    console.log(`   현재 URL: ${currentUrl}`);
    if (currentUrl.includes('/admin/login')) {
      throw new Error('로그인 실패: 여전히 로그인 페이지에 있습니다.');
    }
    console.log('✅ 로그인 완료');
    
    // 2. 설문 조사 관리 페이지로 이동
    console.log('\n2️⃣ 설문 조사 관리 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/surveys`);
    await page.waitForSelector('table', { timeout: 10000 });
    console.log('✅ 설문 조사 관리 페이지 로드 완료');
    
    // 3. 첫 번째 설문의 "감사 메시지" 버튼 찾기
    console.log('\n3️⃣ "감사 메시지" 버튼 찾기...');
    await page.waitForTimeout(2000); // 테이블 로드 대기
    
    // "감사 메시지" 버튼 찾기 (여러 방법 시도)
    const thankYouButton = await page.locator('button:has-text("감사 메시지")').first();
    const buttonCount = await page.locator('button:has-text("감사 메시지")').count();
    console.log(`   발견된 "감사 메시지" 버튼 개수: ${buttonCount}`);
    
    if (buttonCount === 0) {
      console.error('❌ "감사 메시지" 버튼을 찾을 수 없습니다.');
      await page.screenshot({ path: 'error-no-button.png' });
      await browser.close();
      return;
    }
    
    console.log('✅ "감사 메시지" 버튼 발견');
    
    // 4. 버튼 클릭
    console.log('\n4️⃣ "감사 메시지" 버튼 클릭...');
    
    // API 응답 대기 (미리보기 모달이 열리기 전에 API 호출이 있을 수 있음)
    const previewResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/admin/surveys/send-messages') && response.request().method() === 'GET',
      { timeout: 10000 }
    ).catch(() => null);
    
    await thankYouButton.click();
    console.log('   버튼 클릭 완료');
    
    // 모달이 나타날 때까지 대기 (여러 선택자 시도)
    try {
      await page.waitForSelector('[role="dialog"], .modal, [class*="modal"], [class*="Modal"], div[class*="fixed"]', { timeout: 5000 });
      console.log('✅ 메시지 미리보기 모달 열림');
    } catch (e) {
      console.log('   ⚠️ 모달 선택자를 찾지 못했지만 계속 진행...');
      await page.waitForTimeout(2000); // 모달 로드 대기
    }
    
    // 미리보기 API 응답 확인
    const previewResponse = await previewResponsePromise;
    if (previewResponse) {
      console.log('   ✅ 미리보기 API 응답 수신');
    }
    
    // 5. "발송하기" 버튼 클릭
    console.log('\n5️⃣ "발송하기" 버튼 클릭...');
    await page.waitForTimeout(1000); // 모달 완전 로드 대기
    
    const sendButton = await page.locator('button:has-text("발송하기")').first();
    if (await sendButton.count() === 0) {
      console.error('❌ "발송하기" 버튼을 찾을 수 없습니다.');
      await page.screenshot({ path: 'error-no-send-button.png' });
      await browser.close();
      return;
    }
    
    console.log('✅ "발송하기" 버튼 발견, 클릭 중...');
    
    // API 응답 대기
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/admin/surveys/send-messages') && response.request().method() === 'POST',
      { timeout: 30000 }
    );
    
    await sendButton.click();
    console.log('✅ "발송하기" 버튼 클릭 완료, API 응답 대기 중...');
    
    // 6. API 응답 확인
    try {
      const response = await responsePromise;
      console.log('\n6️⃣ API 응답 수신:');
      console.log(`   Status: ${response.status()} ${response.statusText()}`);
      
      const responseData = await response.json();
      console.log('\n📊 최종 응답 데이터:');
      console.log(JSON.stringify(responseData, null, 2));
      
      if (responseData.data?.errors) {
        console.log('\n❌ 오류 목록:');
        responseData.data.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
      
      // "No valid session" 오류 확인
      const errorText = JSON.stringify(responseData);
      if (errorText.includes('No valid session') || errorText.includes('인증')) {
        console.log('\n🔴 "No valid session" 오류 감지!');
        console.log('   원인: 내부 API 호출 시 세션 쿠키가 전달되지 않았을 가능성이 높습니다.');
      }
      
    } catch (e) {
      console.error('\n❌ API 응답 대기 중 오류:', e.message);
    }
    
    // 7. 추가 대기 (콘솔 로그 수집)
    console.log('\n7️⃣ 추가 로그 수집 중 (5초 대기)...');
    await page.waitForTimeout(5000);
    
    // 8. 스크린샷 저장
    await page.screenshot({ path: 'test-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-result.png');
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    console.log('\n⏸️ 브라우저 종료 대기 (10초)...');
    await page.waitForTimeout(10000);
    await browser.close();
    console.log('✅ 테스트 완료');
  }
})();
