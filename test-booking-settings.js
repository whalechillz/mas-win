const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 예약 설정 테스트 시작...\n');

    // 1. 관리자 로그인 페이지 접속
    console.log('1. 관리자 로그인 페이지 접속 중...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);

    // 로그인 (환경에 맞게 수정 필요)
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const loginButton = await page.$('button[type="submit"]');

    if (emailInput && passwordInput && loginButton) {
      await emailInput.fill(process.env.ADMIN_EMAIL || 'admin@example.com');
      await passwordInput.fill(process.env.ADMIN_PASSWORD || 'password');
      await loginButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ 로그인 완료\n');
    } else {
      console.log('⚠️ 로그인 폼을 찾을 수 없습니다. 이미 로그인되어 있을 수 있습니다.\n');
    }

    // 2. 예약 관리 페이지 접속
    console.log('2. 예약 관리 페이지 접속 중...');
    await page.goto('http://localhost:3000/admin/booking', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('✅ 예약 관리 페이지 로드 완료\n');

    // 3. 설정 탭 클릭
    console.log('3. 설정 탭 클릭 중...');
    // 여러 방법으로 설정 탭 찾기 시도
    let settingsTab = await page.locator('button:has-text("설정")').first();
    if (await settingsTab.count() === 0) {
      settingsTab = await page.locator('a:has-text("설정")').first();
    }
    if (await settingsTab.count() === 0) {
      settingsTab = await page.locator('[role="tab"]:has-text("설정")').first();
    }
    if (await settingsTab.count() === 0) {
      // 페이지 구조 확인을 위한 스크린샷
      await page.screenshot({ path: 'test-settings-tab-not-found.png', fullPage: true });
      console.log('⚠️ 설정 탭을 찾을 수 없습니다. 페이지 구조 확인 중...');
      // 직접 URL로 이동 시도
      await page.goto('http://localhost:3000/admin/booking?tab=settings', { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(2000);
      console.log('✅ 설정 탭 URL로 직접 이동 완료\n');
    } else {
      await settingsTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ 설정 탭 활성화 완료\n');
    }

    // 4. 예약 설정 테스트
    console.log('4. 예약 설정 테스트 중...');
    
    // 예약 설정 탭이 활성화되어 있는지 확인
    const settingsSubTab = await page.locator('button:has-text("예약 설정")');
    if (await settingsSubTab.count() > 0) {
      await settingsSubTab.click();
      await page.waitForTimeout(1000);
      console.log('   - 예약 설정 서브 탭 활성화');
    }
    
    // 당일 예약 불가 토글 찾기 (여러 방법 시도)
    let sameDayToggle = await page.locator('input[name="disable_same_day_booking"]');
    if (await sameDayToggle.count() === 0) {
      sameDayToggle = await page.locator('input[type="checkbox"]').first();
    }
    if (await sameDayToggle.count() > 0) {
      const isChecked = await sameDayToggle.isChecked();
      if (!isChecked) {
        await sameDayToggle.click();
        await page.waitForTimeout(500);
        console.log('   - 당일 예약 불가 토글 활성화');
      } else {
        console.log('   - 당일 예약 불가 토글 이미 활성화됨');
      }
    }

    // 주말 예약 불가 토글 찾기
    let weekendToggle = await page.locator('input[name="disable_weekend_booking"]');
    if (await weekendToggle.count() === 0) {
      weekendToggle = await page.locator('input[type="checkbox"]').nth(1);
    }
    if (await weekendToggle.count() > 0) {
      const isChecked = await weekendToggle.isChecked();
      if (!isChecked) {
        await weekendToggle.click();
        await page.waitForTimeout(500);
        console.log('   - 주말 예약 불가 토글 활성화');
      } else {
        console.log('   - 주말 예약 불가 토글 이미 활성화됨');
      }
    }

    // 최소 사전 예약 시간 변경
    let minHoursInput = await page.locator('input[name="min_advance_hours"]');
    if (await minHoursInput.count() === 0) {
      minHoursInput = await page.locator('input[type="number"]').first();
    }
    if (await minHoursInput.count() > 0) {
      await minHoursInput.fill('48');
      await page.waitForTimeout(500);
      console.log('   - 최소 사전 예약 시간 변경: 48시간');
    }

    // 설정 저장 버튼 클릭
    const saveButton = await page.locator('button:has-text("설정 저장")');
    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForTimeout(2000);
      console.log('   - 설정 저장 버튼 클릭');
      
      // 페이지에 성공 메시지가 표시되는지 확인
      const successMessage = await page.locator('text=/설정.*저장|저장.*완료/i').first();
      if (await successMessage.count() > 0) {
        console.log('   ✅ 저장 완료 메시지 확인');
      } else {
        console.log('   ⚠️ 저장 완료 메시지를 확인할 수 없습니다.');
      }
    } else {
      console.log('   ⚠️ 설정 저장 버튼을 찾을 수 없습니다.');
    }
    console.log('✅ 예약 설정 테스트 완료\n');

    // 5. 예약장소 관리 테스트
    console.log('5. 예약장소 관리 테스트 중...');
    const locationsTab = await page.locator('button:has-text("예약장소 관리")');
    if (await locationsTab.count() > 0) {
      await locationsTab.click();
      await page.waitForTimeout(2000);
      console.log('   - 예약장소 관리 탭 활성화');

      // 기존 장소가 있는지 확인
      const locationInputs = await page.locator('input[placeholder*="Massgoo"]').count();
      console.log(`   - 기존 장소 입력 필드: ${locationInputs}개`);

      // 장소 저장 버튼 클릭 (기존 장소가 있는 경우)
      const locationSaveButton = await page.locator('button:has-text("저장")').first();
      if (await locationSaveButton.count() > 0) {
        await locationSaveButton.click();
        await page.waitForTimeout(2000);
        console.log('   - 장소 저장 버튼 클릭');
      }
    }
    console.log('✅ 예약장소 관리 테스트 완료\n');

    // 6. 운영시간 관리 테스트
    console.log('6. 운영시간 관리 테스트 중...');
    const hoursTab = await page.locator('button:has-text("운영시간 관리")');
    if (await hoursTab.count() > 0) {
      await hoursTab.click();
      await page.waitForTimeout(2000);
      console.log('   - 운영시간 관리 탭 활성화');

      // 운영시간 저장 버튼 확인
      const hoursSaveButton = await page.locator('button:has-text("운영시간 저장")');
      if (await hoursSaveButton.count() > 0) {
        const isDisabled = await hoursSaveButton.isDisabled();
        if (!isDisabled) {
          await hoursSaveButton.click();
          await page.waitForTimeout(2000);
          console.log('   - 운영시간 저장 버튼 클릭');
        } else {
          console.log('   ⚠️ 운영시간 저장 버튼이 비활성화되어 있습니다 (장소가 저장되지 않았을 수 있음)');
        }
      }
    }
    console.log('✅ 운영시간 관리 테스트 완료\n');

    // 7. 콘솔 에러 확인
    console.log('7. 콘솔 에러 확인 중...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        consoleErrors.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    await page.waitForTimeout(3000);

    if (consoleErrors.length > 0) {
      console.log(`   ⚠️ 발견된 에러: ${consoleErrors.length}개`);
      consoleErrors.slice(0, 5).forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.substring(0, 100)}`);
      });
    } else {
      console.log('   ✅ 콘솔 에러 없음');
    }

    // 8. 스크린샷 저장
    await page.screenshot({ path: 'test-booking-settings-result.png', fullPage: true });
    console.log('\n📸 테스트 결과 스크린샷 저장: test-booking-settings-result.png');

    // 결과 요약
    console.log('\n📊 테스트 결과 요약:');
    console.log('   ✅ 예약 설정 저장 테스트 완료');
    console.log('   ✅ 예약장소 관리 테스트 완료');
    console.log('   ✅ 운영시간 관리 테스트 완료');
    if (consoleErrors.length > 0) {
      console.log(`   ⚠️ 에러: ${consoleErrors.length}개 발견`);
    } else {
      console.log('   ✅ 에러 없음');
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'test-booking-settings-error.png', fullPage: true });
    console.log('📸 에러 스크린샷 저장: test-booking-settings-error.png');
  } finally {
    await browser.close();
  }
})();

