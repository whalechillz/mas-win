const { chromium } = require('playwright');

async function testBookingReminderFinal() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500, // 각 액션 사이에 500ms 지연
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    console.log('🌐 실제 사이트 접속: https://www.masgolf.co.kr/admin/login');
    await page.goto('https://www.masgolf.co.kr/admin/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);

    // 로그인 폼 확인
    console.log('📝 로그인 폼 확인...');
    const loginInput = page.locator('input#login, input[name="login"]').first();
    const passwordInput = page.locator('input#password, input[name="password"]').first();
    
    if (await loginInput.isVisible({ timeout: 5000 })) {
      console.log('✅ 로그인 폼 발견');
      
      // 전화번호 입력
      await loginInput.fill('010-6669-9000');
      await page.waitForTimeout(1000);
      
      // 비밀번호 입력
      await passwordInput.fill('66699000');
      await page.waitForTimeout(1000);
      
      // 로그인 버튼 클릭
      const loginButton = page.locator('button[type="submit"]').first();
      await loginButton.click();
      console.log('✅ 로그인 버튼 클릭');
      
      // 로그인 완료 대기 (리다이렉트 또는 페이지 변경)
      await page.waitForTimeout(5000);
      
      // 현재 URL 확인
      const currentUrl = page.url();
      console.log(`📍 현재 URL: ${currentUrl}`);
    } else {
      console.log('⚠️ 이미 로그인된 상태일 수 있습니다.');
    }

    // 예약 관리 페이지로 이동
    console.log('\n📋 예약 관리 페이지로 이동...');
    await page.goto('https://www.masgolf.co.kr/admin/booking', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(3000);

    // 페이지가 로드되었는지 확인 (여러 선택자 시도)
    console.log('⏳ 페이지 로딩 확인...');
    let pageLoaded = false;
    const selectors = [
      'text=예약 관리',
      'text=대시보드',
      'text=목록',
      'text=캘린더',
      'h1, h2',
    ];
    
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`✅ 페이지 로드 확인: ${selector}`);
        pageLoaded = true;
        break;
      } catch (e) {
        // 다음 선택자 시도
      }
    }

    if (!pageLoaded) {
      console.log('⚠️ 페이지 로딩 확인 실패, 스크린샷 저장...');
      await page.screenshot({ path: 'page-load-failed.png', fullPage: true });
    }

    // API 호출 캡처
    const apiCalls = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/bookings/') && url.includes('/schedule-reminder')) {
        try {
          const data = await response.json();
          const bookingIdMatch = url.match(/\/api\/bookings\/(\d+)\/schedule-reminder/);
          const callInfo = {
            url,
            status: response.status(),
            data,
            bookingId: bookingIdMatch ? bookingIdMatch[1] : null,
            timestamp: new Date().toISOString(),
          };
          apiCalls.push(callInfo);
          
          console.log(`\n📡 API 호출 감지: 예약 ID ${callInfo.bookingId}`);
          console.log(`   Status: ${callInfo.status}`);
          if (data.success && data.reminder) {
            const metadata = typeof data.reminder.metadata === 'string' 
              ? JSON.parse(data.reminder.metadata) 
              : data.reminder.metadata;
            console.log(`   ✅ 메시지 발견:`);
            console.log(`      - 메시지 ID: ${data.reminder.id}`);
            console.log(`      - Booking ID: ${metadata?.booking_id}`);
            console.log(`      - Scheduled At: ${data.reminder.scheduled_at}`);
            if (data.reminder.note) {
              console.log(`      - Note: ${data.reminder.note.substring(0, 50)}...`);
            }
          } else {
            console.log(`   ❌ 메시지 없음`);
          }
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
        consoleLogs.push({ type: msg.type(), text, timestamp: new Date().toISOString() });
      }
    });

    // 목록 탭 클릭
    console.log('\n📋 목록 탭 클릭...');
    try {
      const listTab = page.locator('text=목록, button:has-text("목록")').first();
      if (await listTab.isVisible({ timeout: 5000 })) {
        await listTab.click();
        await page.waitForTimeout(2000);
        console.log('✅ 목록 탭 클릭 완료');
      }
    } catch (e) {
      console.log('⚠️ 목록 탭 클릭 실패, 계속 진행...');
    }

    // 확인할 예약들
    const bookings = ['장용덕', '김정석', '강영길'];
    
    for (const bookingName of bookings) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔍 ${bookingName} 예약 확인...`);

      try {
        // 모달 닫기 (열려있을 수 있음)
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);

        // 검색 입력 필드 찾기
        const searchInputs = await page.locator('input[type="text"]').all();
        let searchInput = null;
        for (const input of searchInputs) {
          const placeholder = await input.getAttribute('placeholder').catch(() => '');
          if (placeholder.includes('검색') || placeholder.includes('이름')) {
            searchInput = input;
            break;
          }
        }
        
        if (!searchInput && searchInputs.length > 0) {
          searchInput = searchInputs[0]; // 첫 번째 입력 필드 사용
        }

        if (searchInput) {
          await searchInput.fill('');
          await searchInput.fill(bookingName);
          await page.waitForTimeout(2000);
          console.log(`   검색어 입력: ${bookingName}`);
        }

        // 예약 찾기 (여러 방법 시도)
        let bookingFound = false;
        const bookingSelectors = [
          `td:has-text("${bookingName}")`,
          `text=${bookingName}`,
          `*:has-text("${bookingName}")`,
        ];

        for (const selector of bookingSelectors) {
          try {
            const bookingElement = page.locator(selector).first();
            if (await bookingElement.isVisible({ timeout: 3000 })) {
              console.log(`   ✅ ${bookingName} 발견 (${selector})`);
              await bookingElement.click({ force: true });
              await page.waitForTimeout(3000);
              bookingFound = true;
              break;
            }
          } catch (e) {
            // 다음 선택자 시도
          }
        }

        if (!bookingFound) {
          console.log(`   ❌ ${bookingName} 예약을 찾을 수 없음`);
          continue;
        }

        // 모달 확인
        const modalSelectors = [
          'text=예약 상세',
          'h2:has-text("예약")',
          'div[class*="modal"]',
        ];

        let modalFound = false;
        for (const selector of modalSelectors) {
          try {
            const modal = page.locator(selector).first();
            if (await modal.isVisible({ timeout: 5000 })) {
              console.log(`   📝 ${bookingName} 모달 열림`);
              modalFound = true;
              
              // API 호출 대기
              await page.waitForTimeout(2000);

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
              const buttonSelectors = [
                'button:has-text("예약 시간 저장")',
                'button:has-text("저장")',
                'button:has-text("수정")',
              ];
              
              for (const btnSelector of buttonSelectors) {
                const btn = page.locator(btnSelector).first();
                if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
                  const buttonText = await btn.textContent();
                  console.log(`   버튼 텍스트: "${buttonText.trim()}"`);
                  break;
                }
              }

              // 모달 닫기
              await page.keyboard.press('Escape');
              await page.waitForTimeout(1000);
              break;
            }
          } catch (e) {
            // 다음 선택자 시도
          }
        }

        if (!modalFound) {
          console.log(`   ❌ ${bookingName} 모달을 찾을 수 없음`);
        }

      } catch (error) {
        console.log(`   ❌ ${bookingName} 처리 중 오류: ${error.message}`);
      }
    }

    // 결과 요약
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 최종 API 호출 결과 요약:');
    console.log('='.repeat(80));
    
    if (apiCalls.length === 0) {
      console.log('❌ API 호출이 감지되지 않았습니다.');
    } else {
      apiCalls.forEach((call, i) => {
        console.log(`\n${i + 1}. 예약 ID: ${call.bookingId || 'unknown'}`);
        console.log(`   Status: ${call.status}`);
        console.log(`   Time: ${call.timestamp}`);
        if (call.data.success && call.data.reminder) {
          const metadata = typeof call.data.reminder.metadata === 'string' 
            ? JSON.parse(call.data.reminder.metadata) 
            : call.data.reminder.metadata;
          console.log(`   ✅ 메시지 발견:`);
          console.log(`      - 메시지 ID: ${call.data.reminder.id}`);
          console.log(`      - Booking ID: ${metadata?.booking_id}`);
          console.log(`      - Scheduled At: ${call.data.reminder.scheduled_at}`);
          if (call.data.reminder.note) {
            console.log(`      - Note: ${call.data.reminder.note}`);
          }
        } else {
          console.log(`   ❌ 메시지 없음`);
        }
      });
    }

    // 스크린샷
    await page.screenshot({ path: 'booking-reminder-final-test.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: booking-reminder-final-test.png');

    console.log('\n✅ 테스트 완료. 5초 후 종료...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ 오류:', error);
    await page.screenshot({ path: 'booking-reminder-final-error.png', fullPage: true });
    console.log('📸 에러 스크린샷 저장: booking-reminder-final-error.png');
  } finally {
    await browser.close();
  }
}

testBookingReminderFinal().catch(console.error);

















