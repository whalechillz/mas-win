const { chromium } = require('playwright');

const LOCAL_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

// 테스트 사용자 정보
const TEST_USER = {
  name: '김탁수',
  phone: '010-6669-9000',
  date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 내일
  time: '14:00',
  service_type: '마쓰구 드라이버 시타서비스',
  location: '마쓰구 수원본점'
};

async function testBookingConfirmationFlow() {
  console.log('🚀 예약 확정 플로우 E2E 테스트 시작...\n');
  console.log(`테스트 사용자: ${TEST_USER.name} (${TEST_USER.phone})`);
  console.log(`예약 일시: ${TEST_USER.date} ${TEST_USER.time}\n`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  const errors = [];
  const apiCalls = [];
  let bookingId = null;

  // 네트워크 요청 모니터링
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/bookings') || url.includes('/api/solapi') || url.includes('/notify-customer')) {
      const request = response.request();
      try {
        const body = request.postData() ? JSON.parse(request.postData()) : null;
        apiCalls.push({
          method: request.method(),
          url: url,
          status: response.status(),
          body: body,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        apiCalls.push({
          method: request.method(),
          url: url,
          status: response.status(),
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log(`🔴 콘솔 오류: ${msg.text()}`);
    }
  });

  try {
    // ==========================================
    // 1단계: 로그인
    // ==========================================
    console.log('📄 1단계: 관리자 로그인...');
    await page.goto(`${LOCAL_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/login')) {
      console.log('   ✅ 이미 로그인되어 있음');
    } else {
      const loginInput = await page.locator('input[name="login"]').first();
      const passwordInput = await page.locator('input[name="password"]').first();
      const submitButton = await page.locator('button[type="submit"]').first();

      if (await loginInput.isVisible({ timeout: 3000 })) {
        await loginInput.fill(ADMIN_LOGIN);
        await passwordInput.fill(ADMIN_PASSWORD);
        await page.waitForTimeout(1000);
        await submitButton.click();
        await page.waitForTimeout(3000);
        console.log('   ✅ 로그인 완료');
      } else {
        throw new Error('로그인 입력 필드를 찾을 수 없습니다.');
      }
    }

    // ==========================================
    // 2단계: 예약 생성 (API 직접 호출)
    // ==========================================
    console.log('\n📝 2단계: 예약 생성...');
    const createBookingResponse = await page.evaluate(async (userData) => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          phone: userData.phone,
          date: userData.date,
          time: userData.time,
          service_type: userData.service_type,
          location: userData.location,
          status: 'pending'
        })
      });
      return await response.json();
    }, TEST_USER);

    if (createBookingResponse.id) {
      bookingId = createBookingResponse.id;
      console.log(`   ✅ 예약 생성 성공 (ID: ${bookingId})`);
      console.log(`   - 상태: ${createBookingResponse.status}`);
      console.log(`   - 날짜: ${createBookingResponse.date} ${createBookingResponse.time}`);
    } else {
      throw new Error(`예약 생성 실패: ${JSON.stringify(createBookingResponse)}`);
    }

    // 예약 접수 알림 발송 대기
    console.log('\n⏳ 예약 접수 알림 발송 대기 중...');
    await page.waitForTimeout(5000);

    // ==========================================
    // 3단계: 예약 확정 (API 직접 호출)
    // ==========================================
    console.log('\n✅ 3단계: 예약 상태를 "확정"으로 변경...');
    
    // API로 직접 상태 변경
    const confirmResponse = await page.evaluate(async (id) => {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' })
      });
      return await response.json();
    }, bookingId);
    
    if (confirmResponse.status === 'confirmed') {
      console.log('   ✅ API로 예약 확정 완료');
      console.log(`   - 확정 시간: ${confirmResponse.confirmed_at || 'N/A'}`);
    } else {
      throw new Error(`예약 확정 실패: ${JSON.stringify(confirmResponse)}`);
    }

    // ==========================================
    // 4단계: 예약 확정 알림 발송
    // ==========================================
    console.log('\n📤 4단계: 예약 확정 알림 발송...');
    
    const notifyResponse = await page.evaluate(async (id) => {
      const response = await fetch('/api/bookings/notify-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: id,
          notificationType: 'booking_confirmed'
        })
      });
      return await response.json();
    }, bookingId);
    
    if (notifyResponse.success) {
      console.log(`   ✅ 알림 발송 성공 (채널: ${notifyResponse.channel})`);
      if (notifyResponse.kakao) {
        console.log(`   - 카카오톡: ${notifyResponse.kakao.success ? '성공' : '실패'}`);
        if (notifyResponse.kakao.error) {
          console.log(`     오류: ${notifyResponse.kakao.error}`);
        }
      }
      if (notifyResponse.sms) {
        console.log(`   - SMS: ${notifyResponse.sms.success ? '성공' : '실패'}`);
        if (notifyResponse.sms.error) {
          console.log(`     오류: ${notifyResponse.sms.error}`);
        }
      }
    } else {
      console.log(`   ⚠️  알림 발송 실패: ${notifyResponse.message || '알 수 없는 오류'}`);
    }
    
    await page.waitForTimeout(3000);

    // ==========================================
    // 5단계: API 호출 검증
    // ==========================================
    console.log('\n🔍 5단계: API 호출 검증...');
    const bookingApiCalls = apiCalls.filter(call => 
      call.url.includes('/api/bookings')
    );
    
    console.log(`   발견된 예약 관련 API 호출: ${bookingApiCalls.length}개`);
    bookingApiCalls.forEach(call => {
      console.log(`   - ${call.method} ${call.url} (${call.status})`);
      if (call.body) {
        console.log(`     Body: ${JSON.stringify(call.body).substring(0, 100)}...`);
      }
    });

    // 예약 접수 알림 확인
    const receivedNotification = apiCalls.find(call => 
      call.url.includes('/api/bookings/notify-customer') && 
      call.method === 'POST' &&
      call.body?.notificationType === 'booking_received'
    );
    
    if (receivedNotification) {
      console.log('   ✅ 예약 접수 알림 API 호출 확인');
    } else {
      console.log('   ⚠️  예약 접수 알림 API 호출을 찾을 수 없습니다.');
    }

    // 예약 확정 알림 확인
    const confirmedNotification = apiCalls.find(call => 
      call.url.includes('/api/bookings/notify-customer') && 
      call.method === 'POST' &&
      call.body?.notificationType === 'booking_confirmed'
    );
    
    if (confirmedNotification) {
      console.log('   ✅ 예약 확정 알림 API 호출 확인');
    } else {
      console.log('   ⚠️  예약 확정 알림 API 호출을 찾을 수 없습니다.');
    }

    // ==========================================
    // 6단계: 테스트 결과 요약
    // ==========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과 요약:');
    console.log(`   - 예약 ID: ${bookingId}`);
    console.log(`   - 테스트 사용자: ${TEST_USER.name} (${TEST_USER.phone})`);
    console.log(`   - 예약 일시: ${TEST_USER.date} ${TEST_USER.time}`);
    console.log(`   - API 호출 수: ${apiCalls.length}개`);
    console.log(`   - 콘솔 오류: ${errors.length}개`);
    console.log('='.repeat(60));

    // 스크린샷 저장
    const screenshotPath = 'e2e-test/screenshots/booking-confirmation-flow.png';
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`\n📸 스크린샷 저장: ${screenshotPath}`);

    if (errors.length > 0) {
      console.log('\n❌ 테스트 실패: 콘솔 오류가 발견되었습니다.');
      errors.forEach(err => console.log(`   - ${err}`));
      process.exit(1);
    } else {
      console.log('\n✅ 테스트 성공: 예약 확정 플로우가 정상적으로 작동합니다.');
      console.log('\n📱 다음 단계:');
      console.log('   1. 솔라피 콘솔에서 메시지 발송 내역 확인');
      console.log('   2. 김탁수님의 카카오톡에서 알림 메시지 확인');
      console.log('   3. 템플릿 변수 치환 정확성 확인');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({
      path: 'e2e-test/screenshots/booking-confirmation-flow-error.png',
      fullPage: true
    });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testBookingConfirmationFlow();

