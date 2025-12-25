const { chromium } = require('playwright');

async function checkBookingReminderSchedule() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    console.log('🌐 로그인 페이지 접속...');
    await page.goto('https://www.masgolf.co.kr/admin/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);

    // 로그인
    console.log('📝 로그인 진행...');
    const loginInput = page.locator('input#login, input[name="login"]').first();
    const passwordInput = page.locator('input#password, input[name="password"]').first();
    
    if (await loginInput.isVisible({ timeout: 5000 })) {
      await loginInput.fill('010-6669-9000');
      await page.waitForTimeout(500);
      await passwordInput.fill('66699000');
      await page.waitForTimeout(500);
      
      const loginButton = page.locator('button[type="submit"]').first();
      await loginButton.click();
      await page.waitForTimeout(5000);
    }

    // 예약 관리 페이지로 이동
    console.log('📋 예약 관리 페이지로 이동...');
    await page.goto('https://www.masgolf.co.kr/admin/booking', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(3000);

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
            timestamp: new Date().toISOString(),
          });
        } catch (e) {}
      }
    });

    // 목록 탭 클릭
    console.log('📋 목록 탭 클릭...');
    const listTab = page.locator('text=목록').first();
    if (await listTab.isVisible({ timeout: 5000 })) {
      await listTab.click();
      await page.waitForTimeout(2000);
    }

    // 확인할 예약들
    const bookings = [
      { name: '장용덕', expectedDate: '2025-12-18', expectedTime: '13:00' },
      { name: '김정석', expectedDate: '2025-12-18', expectedTime: '16:00' },
      { name: '강영길', expectedDate: '2025-12-19', expectedTime: '11:00' },
    ];
    
    const results = [];
    
    for (const booking of bookings) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔍 ${booking.name} 예약 확인...`);
      console.log(`   예상 예약 시간: ${booking.expectedDate} ${booking.expectedTime}`);
      
      // 예상 발송 시간 계산 (2시간 전)
      const [hours, minutes] = booking.expectedTime.split(':');
      const bookingDateTime = new Date(`${booking.expectedDate}T${booking.expectedTime}:00+09:00`);
      const reminderDateTime = new Date(bookingDateTime.getTime() - 2 * 60 * 60 * 1000);
      const expectedReminderTime = reminderDateTime.toISOString().replace('Z', '+09:00');
      const expectedReminderTimeKST = reminderDateTime.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Seoul'
      });
      console.log(`   예상 발송 시간 (2시간 전): ${expectedReminderTimeKST}`);

      try {
        // 기존 모달 닫기 (여러 방법 시도)
        const modalOverlay = page.locator('div.fixed.inset-0.bg-black').first();
        if (await modalOverlay.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('   기존 모달 오버레이 감지, 닫기...');
          // ESC 키 여러 번 시도
          for (let i = 0; i < 3; i++) {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
            if (!(await modalOverlay.isVisible({ timeout: 500 }).catch(() => false))) {
              break;
            }
          }
          // 닫기 버튼도 시도
          const closeBtn = page.locator('button:has(svg), button[aria-label*="닫기"], button[aria-label*="close"]').last();
          if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await closeBtn.click({ force: true });
            await page.waitForTimeout(1000);
          }
        }
        await page.waitForTimeout(1000);

        // 검색 (여러 방법 시도)
        const searchInputs = await page.locator('input[type="text"], input[placeholder*="검색"], input[placeholder*="이름"]').all();
        for (const input of searchInputs) {
          try {
            if (await input.isVisible({ timeout: 1000 })) {
              await input.fill('');
              await input.fill(booking.name);
              await page.waitForTimeout(2000);
              console.log(`   검색어 입력: ${booking.name}`);
              break;
            }
          } catch (e) {
            // 다음 입력 필드 시도
          }
        }

        // 예약 찾기 (테이블 행에서 👁️ 버튼 클릭)
        let bookingFound = false;
        
        // 테이블에서 예약 이름이 포함된 행 찾기
        const bookingRow = page.locator(`table tr:has-text("${booking.name}")`).first();
        if (await bookingRow.isVisible({ timeout: 5000 })) {
          console.log(`✅ ${booking.name} 행 발견`);
          
          // 해당 행의 👁️ 버튼 찾기
          const viewButton = bookingRow.locator('button:has-text("👁️"), button[title="상세보기"]').first();
          if (await viewButton.isVisible({ timeout: 3000 })) {
            console.log(`   👁️ 버튼 발견, 클릭...`);
            // 모달이 열려있으면 먼저 닫기
            const overlay = page.locator('div.fixed.inset-0.bg-black').first();
            if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
              await page.keyboard.press('Escape');
              await page.waitForTimeout(1000);
            }
            await viewButton.click({ force: true, timeout: 5000 });
            await page.waitForTimeout(3000);
            bookingFound = true;
          } else {
            // 👁️ 버튼이 없으면 행 자체를 클릭
            console.log(`   👁️ 버튼 없음, 행 클릭...`);
            await bookingRow.click({ force: true });
            await page.waitForTimeout(3000);
            bookingFound = true;
          }
        } else {
          // 테이블 행을 찾지 못하면 이름으로 직접 검색
          const nameCell = page.locator(`td:has-text("${booking.name}")`).first();
          if (await nameCell.isVisible({ timeout: 3000 })) {
            console.log(`✅ ${booking.name} 셀 발견, 클릭...`);
            await nameCell.click({ force: true });
            await page.waitForTimeout(3000);
            bookingFound = true;
          }
        }

        if (!bookingFound) {
          console.log(`❌ ${booking.name} 예약을 찾을 수 없음`);
          continue;
        }

        // 모달 확인
        const modal = page.locator('text=예약 상세').first();
        if (await modal.isVisible({ timeout: 5000 })) {
            console.log(`📝 ${booking.name} 모달 열림`);

            // API 호출 대기 (콘솔 로그 확인)
            console.log('   API 호출 대기 중...');
            await page.waitForTimeout(3000);
            
            // 콘솔 로그에서 API 응답 확인
            const consoleMessages = [];
            const consoleListener = (msg) => {
              const text = msg.text();
              if (text.includes('[schedule-reminder]') || text.includes('예약 메시지')) {
                consoleMessages.push(text);
                console.log(`   [콘솔] ${text}`);
              }
            };
            page.on('console', consoleListener);

            const result = {
              name: booking.name,
              bookingDate: booking.expectedDate,
              bookingTime: booking.expectedTime,
              expectedReminderTime: expectedReminderTimeKST,
              checkbox: null,
              scheduledTime: null,
              scheduledTimeKST: null,
              button: null,
              apiReminder: null,
            };

            // 예약일시 확인
            const bookingDateTimeText = page.locator('text=/2025-12-1[89]/').first();
            if (await bookingDateTimeText.isVisible({ timeout: 3000 })) {
              const dateTimeText = await bookingDateTimeText.textContent();
              console.log(`   예약일시 (화면): ${dateTimeText?.trim()}`);
            }

            // 체크박스 상태
            const checkbox = page.locator('input#reminder-enabled').first();
            if (await checkbox.isVisible({ timeout: 3000 })) {
              result.checkbox = await checkbox.isChecked();
              console.log(`   체크박스: ${result.checkbox ? '✅ 체크됨' : '❌ 체크 안됨'}`);
            }

            // 발송 시간
            const timeInput = page.locator('input[type="datetime-local"]').first();
            if (await timeInput.isVisible({ timeout: 3000 })) {
              result.scheduledTime = await timeInput.inputValue();
              if (result.scheduledTime) {
                // datetime-local 값을 KST로 변환하여 표시
                const scheduledDate = new Date(result.scheduledTime + ':00+09:00');
                result.scheduledTimeKST = scheduledDate.toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Seoul'
                });
                console.log(`   발송 시간 (입력 필드): ${result.scheduledTimeKST}`);
              } else {
                console.log(`   발송 시간: (비어있음)`);
              }
            }

            // 버튼 텍스트
            const saveButton = page.locator('button:has-text("예약 시간 저장")').first();
            if (await saveButton.isVisible({ timeout: 3000 })) {
              result.button = await saveButton.textContent();
              console.log(`   버튼: "${result.button.trim()}"`);
            }

            // 해당 예약의 API 호출 찾기 (예약 ID로 매칭)
            // 먼저 예약 ID를 URL이나 다른 방법으로 찾기
            let bookingId = null;
            const currentUrl = page.url();
            const urlMatch = currentUrl.match(/booking[\/\?](\d+)/);
            if (urlMatch) {
              bookingId = urlMatch[1];
            }
            
            // API 호출 중에서 해당 예약 ID 찾기
            let recentApiCall = apiCalls
              .filter(call => {
                if (bookingId && call.bookingId === bookingId) {
                  return true;
                }
                // 또는 최근 호출 중에서
                const callTime = new Date(call.timestamp).getTime();
                const now = Date.now();
                return (now - callTime) < 15000; // 최근 15초 이내
              })
              .pop();
            
            // API 호출이 없으면 조금 더 기다리기
            if (!recentApiCall) {
              console.log('   API 호출 대기 중...');
              await page.waitForTimeout(2000);
              // 다시 확인
              const latestCall = apiCalls
                .filter(call => {
                  const callTime = new Date(call.timestamp).getTime();
                  const now = Date.now();
                  return (now - callTime) < 20000; // 최근 20초 이내
                })
                .pop();
              if (latestCall) {
                recentApiCall = latestCall;
              }
            }
            
            if (recentApiCall) {
              result.apiReminder = recentApiCall.data;
              if (recentApiCall.data.success && recentApiCall.data.reminder) {
                const reminder = recentApiCall.data.reminder;
                const metadata = typeof reminder.metadata === 'string' 
                  ? JSON.parse(reminder.metadata) 
                  : reminder.metadata;
                
                if (reminder.scheduled_at) {
                  const scheduledAtUTC = new Date(reminder.scheduled_at);
                  const scheduledAtKST = scheduledAtUTC.toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Seoul'
                  });
                  console.log(`   API 발송 시간: ${scheduledAtKST}`);
                  console.log(`   API Booking ID: ${metadata?.booking_id}`);
                } else {
                  console.log(`   API 발송 시간: (없음)`);
                }
              } else {
                console.log(`   API: 메시지 없음`);
              }
            }

            results.push(result);

            // 모달 닫기
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
          } else {
            console.log(`❌ ${booking.name} 모달을 찾을 수 없음`);
          }
      } catch (error) {
        console.log(`   ❌ ${booking.name} 처리 중 오류: ${error.message}`);
      }
    }

    // 결과 요약
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 최종 결과 요약:');
    console.log('='.repeat(80));
    
    results.forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.name}:`);
      console.log(`   예약 시간: ${result.bookingDate} ${result.bookingTime}`);
      console.log(`   예상 발송 시간 (2시간 전): ${result.expectedReminderTime}`);
      console.log(`   체크박스: ${result.checkbox ? '✅ 체크됨' : '❌ 체크 안됨'}`);
      console.log(`   설정된 발송 시간: ${result.scheduledTimeKST || '(없음)'}`);
      
      if (result.scheduledTimeKST && result.expectedReminderTime) {
        // 시간 비교
        const scheduled = new Date(result.scheduledTime + ':00+09:00');
        const expected = new Date(`${result.bookingDate}T${result.bookingTime}:00+09:00`);
        const expectedReminder = new Date(expected.getTime() - 2 * 60 * 60 * 1000);
        
        const diff = Math.abs(scheduled.getTime() - expectedReminder.getTime());
        const diffMinutes = Math.floor(diff / (60 * 1000));
        
        if (diffMinutes <= 5) {
          console.log(`   ✅ 발송 시간이 예상 시간과 일치합니다 (차이: ${diffMinutes}분)`);
        } else {
          console.log(`   ⚠️ 발송 시간이 예상 시간과 다릅니다 (차이: ${diffMinutes}분)`);
        }
      }
      
      if (result.apiReminder && result.apiReminder.success && result.apiReminder.reminder) {
        const reminder = result.apiReminder.reminder;
        if (reminder.scheduled_at) {
          const scheduledAtUTC = new Date(reminder.scheduled_at);
          const scheduledAtKST = scheduledAtUTC.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Seoul'
          });
          console.log(`   API 발송 시간: ${scheduledAtKST}`);
        }
      }
    });

    // 스크린샷
    await page.screenshot({ path: 'booking-reminder-schedule-check.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: booking-reminder-schedule-check.png');

    console.log('\n✅ 테스트 완료!');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ 오류:', error);
    await page.screenshot({ path: 'booking-reminder-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

checkBookingReminderSchedule().catch(console.error);

