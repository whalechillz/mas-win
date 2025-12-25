const { chromium } = require('playwright');

async function checkBookingReminderAPI() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 로그인 페이지로 이동
    console.log('🔐 로그인 페이지로 이동...');
    await page.goto('https://masgolf.co.kr/admin/booking');
    await page.waitForTimeout(2000);

    // 로그인 (필요한 경우)
    const loginButton = page.locator('text=로그인').first();
    if (await loginButton.isVisible({ timeout: 3000 })) {
      console.log('📝 로그인 중...');
      await loginButton.click();
      await page.waitForTimeout(2000);
    }

    // 예약 목록 페이지로 이동
    console.log('📋 예약 목록 확인 중...');
    await page.waitForSelector('text=예약 관리', { timeout: 10000 });

    // 콘솔 로그 캡처 설정
    const apiCalls = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/bookings/') && url.includes('/schedule-reminder')) {
        try {
          const data = await response.json();
          apiCalls.push({
            url,
            status: response.status(),
            data,
            bookingId: url.match(/\/api\/bookings\/(\d+)\/schedule-reminder/)?.[1],
          });
        } catch (e) {
          // JSON 파싱 실패 시 무시
        }
      }
    });

    // 브라우저 콘솔 로그 캡처
    const consoleLogs = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[BookingDetailModal]') || text.includes('[schedule-reminder]')) {
        consoleLogs.push({
          type: msg.type(),
          text: text,
        });
      }
    });

    // 예약 목록에서 특정 예약 찾기
    const bookingsToCheck = [
      { name: '장용덕', bookingId: null },
      { name: '김정석', bookingId: null },
      { name: '강영길', bookingId: null },
    ];

    // 목록 탭 클릭
    const listTab = page.locator('text=목록').first();
    if (await listTab.isVisible({ timeout: 3000 })) {
      await listTab.click();
      await page.waitForTimeout(2000);
    }

    // 각 예약 찾기 및 클릭
    for (const booking of bookingsToCheck) {
      console.log(`\n🔍 ${booking.name} 예약 찾는 중...`);
      
      // 예약 이름으로 검색
      const searchInput = page.locator('input[type="text"]').first();
      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill(booking.name);
        await page.waitForTimeout(1000);
      }

      // 예약 행 찾기
      const bookingRow = page.locator(`text=${booking.name}`).first();
      if (await bookingRow.isVisible({ timeout: 5000 })) {
        console.log(`✅ ${booking.name} 예약 발견`);
        
        // 예약 클릭하여 모달 열기
        await bookingRow.click();
        await page.waitForTimeout(2000);

        // 모달이 열릴 때까지 대기
        const modal = page.locator('text=예약 상세').first();
        if (await modal.isVisible({ timeout: 5000 })) {
          console.log(`📝 ${booking.name} 모달 열림`);
          
          // API 호출 대기
          await page.waitForTimeout(3000);

          // 체크박스 상태 확인
          const checkbox = page.locator('input[type="checkbox"][id="reminder-enabled"]').first();
          if (await checkbox.isVisible({ timeout: 3000 })) {
            const isChecked = await checkbox.isChecked();
            console.log(`   체크박스 상태: ${isChecked ? '체크됨' : '체크 안됨'}`);

            // 발송 시간 확인
            const timeInput = page.locator('input[type="datetime-local"]').first();
            if (await timeInput.isVisible({ timeout: 3000 })) {
              const timeValue = await timeInput.inputValue();
              console.log(`   발송 시간: ${timeValue}`);
            }
          }

          // 모달 닫기
          const closeButton = page.locator('button:has(svg)').last();
          if (await closeButton.isVisible({ timeout: 2000 })) {
            await closeButton.click();
            await page.waitForTimeout(1000);
          }
        }
      } else {
        console.log(`❌ ${booking.name} 예약을 찾을 수 없음`);
      }
    }

    // 결과 출력
    console.log('\n📊 API 호출 결과:');
    console.log('='.repeat(80));
    apiCalls.forEach((call, index) => {
      console.log(`\n${index + 1}. 예약 ID: ${call.bookingId}`);
      console.log(`   URL: ${call.url}`);
      console.log(`   Status: ${call.status}`);
      if (call.data.success && call.data.reminder) {
        console.log(`   ✅ 메시지 발견:`);
        console.log(`      ID: ${call.data.reminder.id}`);
        console.log(`      Status: ${call.data.reminder.status}`);
        console.log(`      Scheduled At: ${call.data.reminder.scheduled_at}`);
        console.log(`      Metadata: ${JSON.stringify(call.data.reminder.metadata)}`);
        console.log(`      Note: ${call.data.reminder.note}`);
      } else {
        console.log(`   ❌ 메시지 없음`);
      }
    });

    console.log('\n📝 콘솔 로그:');
    console.log('='.repeat(80));
    consoleLogs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.type}] ${log.text}`);
    });

    // 스크린샷 저장
    await page.screenshot({ path: 'booking-reminder-check.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: booking-reminder-check.png');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'booking-reminder-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

checkBookingReminderAPI().catch(console.error);

















