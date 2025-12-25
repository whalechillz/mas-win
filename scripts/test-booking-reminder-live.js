const { chromium } = require('playwright');

async function testBookingReminderLive() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 실제 사이트 접속: https://www.masgolf.co.kr/admin/booking');
    await page.goto('https://www.masgolf.co.kr/admin/booking', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 로그인 페이지인지 확인
    const loginPage = page.locator('text=관리자 로그인, input#login').first();
    if (await loginPage.isVisible({ timeout: 3000 })) {
      console.log('📝 로그인 페이지 감지, 로그인 진행...');
      
      // 전화번호 입력
      const phoneInput = page.locator('input#login, input[name="login"]').first();
      await phoneInput.fill('010-6669-9000');
      await page.waitForTimeout(500);

      // 비밀번호 입력
      const passwordInput = page.locator('input#password, input[name="password"]').first();
      await passwordInput.fill('66699000');
      await page.waitForTimeout(500);

      // 로그인 버튼 클릭
      const loginButton = page.locator('button[type="submit"], button:has-text("로그인")').first();
      await loginButton.click();
      
      // 로그인 완료 대기 (리다이렉트 또는 페이지 변경)
      console.log('⏳ 로그인 처리 대기...');
      await page.waitForTimeout(5000);
      
      // URL이 변경되었는지 확인
      const currentUrl = page.url();
      console.log(`📍 현재 URL: ${currentUrl}`);
    }

    // 예약 관리 페이지로 직접 이동 (로그인 후 리다이렉트가 안 될 수 있음)
    if (!page.url().includes('/admin/booking')) {
      console.log('📋 예약 관리 페이지로 이동...');
      await page.goto('https://www.masgolf.co.kr/admin/booking', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
    }

    // 예약 관리 페이지 로딩 대기
    console.log('📋 예약 관리 페이지 로딩 대기...');
    await page.waitForSelector('text=예약 관리, text=대시보드, text=목록', { timeout: 15000 });

    // API 호출 캡처
    const apiCalls = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/bookings/') && url.includes('/schedule-reminder')) {
        try {
          const data = await response.json();
          const bookingIdMatch = url.match(/\/api\/bookings\/(\d+)\/schedule-reminder/);
          apiCalls.push({
            url,
            status: response.status(),
            data,
            bookingId: bookingIdMatch ? bookingIdMatch[1] : null,
          });
        } catch (e) {
          // JSON 파싱 실패 무시
        }
      }
    });

    // 콘솔 로그 캡처
    const consoleLogs = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[BookingDetailModal]') || text.includes('[schedule-reminder]')) {
        consoleLogs.push({ type: msg.type(), text });
        console.log(`\n[${msg.type()}] ${text}`);
      }
    });

    // 목록 탭 클릭
    console.log('\n📋 목록 탭 클릭...');
    const listTab = page.locator('text=목록').first();
    if (await listTab.isVisible({ timeout: 5000 })) {
      await listTab.click();
      await page.waitForTimeout(2000);
    }

    // 확인할 예약들
    const bookings = ['장용덕', '김정석', '강영길'];
    
    for (const bookingName of bookings) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔍 ${bookingName} 예약 확인...`);

      // 모달 닫기 (열려있을 수 있음)
      try {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } catch (e) {}

      // 검색
      const searchInput = page.locator('input[type="text"]').first();
      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill('');
        await searchInput.fill(bookingName);
        await page.waitForTimeout(1500);
      }

      // 예약 클릭
      try {
        const bookingCell = page.locator(`td:has-text("${bookingName}")`).first();
        if (await bookingCell.isVisible({ timeout: 5000 })) {
          console.log(`✅ ${bookingName} 발견, 클릭...`);
          await bookingCell.click({ force: true });
          await page.waitForTimeout(3000);

          // 모달 확인
          const modal = page.locator('text=예약 상세').first();
          if (await modal.isVisible({ timeout: 5000 })) {
            console.log(`📝 ${bookingName} 모달 열림`);

            // 체크박스 상태
            const checkbox = page.locator('input#reminder-enabled').first();
            if (await checkbox.isVisible({ timeout: 3000 })) {
              const isChecked = await checkbox.isChecked();
              console.log(`   체크박스: ${isChecked ? '✅ 체크됨' : '❌ 체크 안됨'}`);
            }

            // 발송 시간
            const timeInput = page.locator('input[type="datetime-local"]').first();
            if (await timeInput.isVisible({ timeout: 3000 })) {
              const timeValue = await timeInput.inputValue();
              console.log(`   발송 시간: ${timeValue || '(비어있음)'}`);
            }

            // 버튼 텍스트 확인
            const saveButton = page.locator('button:has-text("예약 시간 저장"), button:has-text("저장 중")').first();
            if (await saveButton.isVisible({ timeout: 3000 })) {
              const buttonText = await saveButton.textContent();
              console.log(`   버튼 텍스트: "${buttonText}"`);
            }

            // 모달 닫기
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
          } else {
            console.log(`❌ ${bookingName} 모달을 찾을 수 없음`);
          }
        } else {
          console.log(`❌ ${bookingName} 예약을 찾을 수 없음`);
        }
      } catch (error) {
        console.log(`❌ ${bookingName} 처리 중 오류: ${error.message}`);
      }
    }

    // 결과 요약
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 API 호출 결과:');
    if (apiCalls.length === 0) {
      console.log('❌ API 호출이 감지되지 않았습니다.');
    } else {
      apiCalls.forEach((call, i) => {
        console.log(`\n${i + 1}. 예약 ID: ${call.bookingId}`);
        console.log(`   Status: ${call.status}`);
        if (call.data.success && call.data.reminder) {
          const metadata = typeof call.data.reminder.metadata === 'string' 
            ? JSON.parse(call.data.reminder.metadata) 
            : call.data.reminder.metadata;
          console.log(`   ✅ 메시지 발견:`);
          console.log(`      - 메시지 ID: ${call.data.reminder.id}`);
          console.log(`      - Booking ID: ${metadata?.booking_id}`);
          console.log(`      - Scheduled At: ${call.data.reminder.scheduled_at}`);
          console.log(`      - Note: ${call.data.reminder.note}`);
        } else {
          console.log(`   ❌ 메시지 없음`);
        }
      });
    }

    // 스크린샷
    await page.screenshot({ path: 'booking-reminder-live-test.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: booking-reminder-live-test.png');

    console.log('\n⏳ 5초 후 종료...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ 오류:', error);
    await page.screenshot({ path: 'booking-reminder-live-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testBookingReminderLive().catch(console.error);

