const { chromium } = require('playwright');

async function checkBookingReminderWithLogin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 로그인 페이지로 직접 이동
    console.log('🔐 로그인 페이지로 이동...');
    await page.goto('https://masgolf.co.kr/admin/login');
    await page.waitForTimeout(2000);

    // 전화번호 입력 (id="login" 또는 name="login")
    const phoneInput = page.locator('input#login, input[name="login"]').first();
    if (await phoneInput.isVisible({ timeout: 5000 })) {
      console.log('📱 전화번호 입력: 010-6669-9000');
      await phoneInput.fill('010-6669-9000');
      await page.waitForTimeout(1000);
    } else {
      console.log('❌ 전화번호 입력 필드를 찾을 수 없음');
    }

    // 비밀번호 입력 (전화번호 뒷8자리: 66699000)
    const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]').first();
    if (await passwordInput.isVisible({ timeout: 5000 })) {
      console.log('🔑 비밀번호 입력: 66699000');
      await passwordInput.fill('66699000');
      await page.waitForTimeout(1000);
    } else {
      console.log('❌ 비밀번호 입력 필드를 찾을 수 없음');
    }

    // 로그인 제출
    const submitButton = page.locator('button[type="submit"], button:has-text("로그인")').first();
    if (await submitButton.isVisible({ timeout: 3000 })) {
      console.log('✅ 로그인 제출...');
      await submitButton.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ 로그인 버튼을 찾을 수 없음');
    }

    // 예약 관리 페이지로 이동
    console.log('📋 예약 관리 페이지로 이동...');
    await page.goto('https://masgolf.co.kr/admin/booking');
    await page.waitForTimeout(2000);

    // 예약 관리 페이지 대기
    console.log('📋 예약 관리 페이지 로딩 대기...');
    await page.waitForSelector('text=예약 관리', { timeout: 10000 });

    // 콘솔 로그 캡처 설정
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
            timestamp: new Date().toISOString(),
          });
          console.log(`\n📡 API 호출 감지: 예약 ID ${bookingIdMatch ? bookingIdMatch[1] : 'unknown'}`);
          console.log(`   Status: ${response.status()}`);
          if (data.success && data.reminder) {
            console.log(`   ✅ 메시지 발견:`);
            console.log(`      ID: ${data.reminder.id}`);
            console.log(`      Status: ${data.reminder.status}`);
            console.log(`      Scheduled At: ${data.reminder.scheduled_at}`);
            console.log(`      Metadata: ${JSON.stringify(data.reminder.metadata)}`);
            console.log(`      Note: ${data.reminder.note}`);
            if (data.reminder.message_text) {
              const customerName = data.reminder.message_text.match(/\[마쓰구골프\]\s*([^님]+)님/)?.[1];
              console.log(`      고객명 (메시지에서 추출): ${customerName || 'N/A'}`);
            }
          } else {
            console.log(`   ❌ 메시지 없음`);
          }
        } catch (e) {
          console.log(`   ⚠️ JSON 파싱 실패: ${e.message}`);
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
          timestamp: new Date().toISOString(),
        });
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

    // 확인할 예약 목록
    const bookingsToCheck = [
      { name: '장용덕' },
      { name: '김정석' },
      { name: '강영길' },
    ];

    // 각 예약 확인
    for (const booking of bookingsToCheck) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔍 ${booking.name} 예약 확인 중...`);
      
      // 검색 입력 필드 찾기
      const searchInputs = page.locator('input[type="text"], input[placeholder*="검색"]');
      const searchInput = searchInputs.first();
      
      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill('');
        await searchInput.fill(booking.name);
        await page.waitForTimeout(1500);
      }

      // 기존 모달이 열려있으면 먼저 닫기 (여러 방법 시도)
      const existingModal = page.locator('text=예약 상세, div.fixed.inset-0').first();
      if (await existingModal.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('   기존 모달 닫기...');
        // ESC 키로 닫기 시도
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        // 닫기 버튼 찾아서 클릭
        const closeButton = page.locator('button:has(svg), button[aria-label*="닫기"], button[aria-label*="close"]').last();
        if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await closeButton.click();
        }
        await page.waitForTimeout(1000);
      }

      // 모달 오버레이가 있으면 강제로 닫기
      const overlay = page.locator('div.fixed.inset-0.bg-black').first();
      if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('   모달 오버레이 감지, ESC 키로 닫기...');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }

      // 예약 행 찾기 (테이블 내에서)
      const bookingRow = page.locator(`table tr:has-text("${booking.name}")`).first();
      if (await bookingRow.isVisible({ timeout: 5000 })) {
        console.log(`✅ ${booking.name} 예약 발견, 클릭...`);
        // 행의 이름 셀 클릭
        const nameCell = bookingRow.locator(`td:has-text("${booking.name}")`).first();
        await nameCell.click({ force: true });
        await page.waitForTimeout(3000);

        // 모달 확인
        const modal = page.locator('text=예약 상세').first();
        if (await modal.isVisible({ timeout: 5000 })) {
          console.log(`📝 ${booking.name} 모달 열림`);

          // API 호출 대기
          await page.waitForTimeout(2000);

          // 체크박스 상태 확인
          const checkbox = page.locator('input[type="checkbox"][id="reminder-enabled"]').first();
          if (await checkbox.isVisible({ timeout: 3000 })) {
            const isChecked = await checkbox.isChecked();
            console.log(`   체크박스 상태: ${isChecked ? '✅ 체크됨' : '❌ 체크 안됨'}`);

            // 발송 시간 확인
            const timeInput = page.locator('input[type="datetime-local"]').first();
            if (await timeInput.isVisible({ timeout: 3000 })) {
              const timeValue = await timeInput.inputValue();
              console.log(`   발송 시간: ${timeValue || '(비어있음)'}`);
            }

            // 상태 메시지 확인
            const statusMessages = page.locator('text=/메시지|예약|발송/');
            const statusCount = await statusMessages.count();
            if (statusCount > 0) {
              console.log(`   상태 메시지 발견: ${statusCount}개`);
            }
          }

          // 모달 닫기
          const closeButtons = page.locator('button:has(svg), button[aria-label*="닫기"], button[aria-label*="close"]');
          const closeButton = closeButtons.last();
          if (await closeButton.isVisible({ timeout: 2000 })) {
            await closeButton.click();
            await page.waitForTimeout(1000);
          } else {
            // ESC 키로 닫기 시도
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
          }
        } else {
          console.log(`❌ ${booking.name} 모달을 찾을 수 없음`);
        }
      } else {
        console.log(`❌ ${booking.name} 예약을 찾을 수 없음`);
      }
    }

    // 최종 결과 출력
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 최종 API 호출 결과 요약:');
    console.log('='.repeat(80));
    
    if (apiCalls.length === 0) {
      console.log('❌ API 호출이 감지되지 않았습니다.');
    } else {
      apiCalls.forEach((call, index) => {
        console.log(`\n${index + 1}. 예약 ID: ${call.bookingId || 'unknown'}`);
        console.log(`   URL: ${call.url}`);
        console.log(`   Status: ${call.status}`);
        console.log(`   Time: ${call.timestamp}`);
        if (call.data.success && call.data.reminder) {
          console.log(`   ✅ 메시지 발견:`);
          console.log(`      - ID: ${call.data.reminder.id}`);
          console.log(`      - Status: ${call.data.reminder.status}`);
          console.log(`      - Scheduled At: ${call.data.reminder.scheduled_at}`);
          if (call.data.reminder.metadata) {
            const metadata = typeof call.data.reminder.metadata === 'string' 
              ? JSON.parse(call.data.reminder.metadata) 
              : call.data.reminder.metadata;
            console.log(`      - Metadata Booking ID: ${metadata.booking_id}`);
            console.log(`      - Notification Type: ${metadata.notification_type}`);
          }
          console.log(`      - Note: ${call.data.reminder.note}`);
          if (call.data.reminder.message_text) {
            const customerName = call.data.reminder.message_text.match(/\[마쓰구골프\]\s*([^님]+)님/)?.[1];
            console.log(`      - 고객명 (메시지에서): ${customerName || 'N/A'}`);
          }
        } else {
          console.log(`   ❌ 메시지 없음`);
        }
      });
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'booking-reminder-check-login.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: booking-reminder-check-login.png');

    // 5초 대기 후 종료
    console.log('\n⏳ 5초 후 종료...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'booking-reminder-error.png', fullPage: true });
    console.log('📸 에러 스크린샷 저장: booking-reminder-error.png');
  } finally {
    await browser.close();
  }
}

checkBookingReminderWithLogin().catch(console.error);

