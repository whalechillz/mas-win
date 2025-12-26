const { chromium } = require('playwright');

async function testBookingReminderAfterDeploy() {
  console.log('⏳ 배포 완료 대기 중... (2분)');
  console.log('   현재 시간:', new Date().toLocaleString('ko-KR'));
  
  // 2분(120초) 대기
  const waitTime = 120 * 1000;
  const startTime = Date.now();
  
  // 진행 상황 표시
  const interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = 120 - elapsed;
    if (remaining > 0) {
      process.stdout.write(`\r   남은 시간: ${remaining}초...`);
    }
  }, 1000);
  
  await new Promise(resolve => setTimeout(resolve, waitTime));
  clearInterval(interval);
  
  console.log('\n✅ 대기 완료. 테스트 시작...\n');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
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
    const bookings = ['장용덕', '김정석', '강영길'];
    const results = [];
    
    for (const bookingName of bookings) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔍 ${bookingName} 예약 확인...`);

      try {
        // 모달 닫기
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);

        // 검색
        const searchInput = page.locator('input[type="text"]').first();
        if (await searchInput.isVisible({ timeout: 3000 })) {
          await searchInput.fill('');
          await searchInput.fill(bookingName);
          await page.waitForTimeout(2000);
        }

        // 예약 클릭
        const bookingCell = page.locator(`td:has-text("${bookingName}")`).first();
        if (await bookingCell.isVisible({ timeout: 5000 })) {
          console.log(`✅ ${bookingName} 발견, 클릭...`);
          await bookingCell.click({ force: true });
          await page.waitForTimeout(3000);

          // 모달 확인
          const modal = page.locator('text=예약 상세').first();
          if (await modal.isVisible({ timeout: 5000 })) {
            console.log(`📝 ${bookingName} 모달 열림`);

            // API 호출 대기
            await page.waitForTimeout(2000);

            const result = {
              name: bookingName,
              checkbox: null,
              time: null,
              button: null,
              apiCall: null,
            };

            // 체크박스 상태
            const checkbox = page.locator('input#reminder-enabled').first();
            if (await checkbox.isVisible({ timeout: 3000 })) {
              result.checkbox = await checkbox.isChecked();
              console.log(`   체크박스: ${result.checkbox ? '✅ 체크됨' : '❌ 체크 안됨'}`);
            }

            // 발송 시간
            const timeInput = page.locator('input[type="datetime-local"]').first();
            if (await timeInput.isVisible({ timeout: 3000 })) {
              result.time = await timeInput.inputValue();
              console.log(`   발송 시간: ${result.time || '(비어있음)'}`);
            }

            // 버튼 텍스트
            const saveButton = page.locator('button:has-text("예약 시간 저장")').first();
            if (await saveButton.isVisible({ timeout: 3000 })) {
              result.button = await saveButton.textContent();
              console.log(`   버튼: "${result.button.trim()}"`);
            }

            // 해당 예약의 API 호출 찾기
            const bookingApiCall = apiCalls.find(call => {
              // 최근 5초 이내의 호출 중에서
              const callTime = new Date(call.timestamp).getTime();
              const now = Date.now();
              return (now - callTime) < 5000;
            });
            
            if (bookingApiCall) {
              result.apiCall = bookingApiCall;
              if (bookingApiCall.data.success && bookingApiCall.data.reminder) {
                const metadata = typeof bookingApiCall.data.reminder.metadata === 'string' 
                  ? JSON.parse(bookingApiCall.data.reminder.metadata) 
                  : bookingApiCall.data.reminder.metadata;
                console.log(`   API: 메시지 발견 (ID: ${bookingApiCall.data.reminder.id}, Booking ID: ${metadata?.booking_id})`);
              } else {
                console.log(`   API: 메시지 없음`);
              }
            }

            results.push(result);

            // 모달 닫기
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
          }
        }
      } catch (error) {
        console.log(`   ❌ ${bookingName} 처리 중 오류: ${error.message}`);
      }
    }

    // 결과 요약
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 최종 테스트 결과 요약:');
    console.log('='.repeat(80));
    
    results.forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.name}:`);
      console.log(`   체크박스: ${result.checkbox ? '✅ 체크됨' : '❌ 체크 안됨'}`);
      console.log(`   발송 시간: ${result.time || '(비어있음)'}`);
      console.log(`   버튼: "${result.button || 'N/A'}"`);
      if (result.apiCall) {
        if (result.apiCall.data.success && result.apiCall.data.reminder) {
          const metadata = typeof result.apiCall.data.reminder.metadata === 'string' 
            ? JSON.parse(result.apiCall.data.reminder.metadata) 
            : result.apiCall.data.reminder.metadata;
          console.log(`   API: ✅ 메시지 발견 (Booking ID: ${metadata?.booking_id})`);
        } else {
          console.log(`   API: ❌ 메시지 없음`);
        }
      }
    });

    // 스크린샷
    await page.screenshot({ path: 'booking-reminder-after-deploy.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: booking-reminder-after-deploy.png');

    console.log('\n✅ 테스트 완료!');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ 오류:', error);
    await page.screenshot({ path: 'booking-reminder-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testBookingReminderAfterDeploy().catch(console.error);


















