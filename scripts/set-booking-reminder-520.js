const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    console.log('🌐 관리자 로그인 페이지 접속...');
    await page.goto('https://www.masgolf.co.kr/admin/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    // 로그인
    console.log('📝 로그인 진행...');
    const loginInput = page.locator('input#login, input[name="login"]').first();
    const passwordInput = page.locator('input#password, input[name="password"]').first();

    if (await loginInput.isVisible({ timeout: 5000 })) {
      await loginInput.fill('010-6669-9000'); // 아이디 또는 전화번호
      await page.waitForTimeout(500);
      await passwordInput.fill('66699000');   // 비밀번호
      await page.waitForTimeout(500);

      const loginButton = page.locator('button[type="submit"]').first();
      await loginButton.click();
      await page.waitForTimeout(5000);
    }

    // 예약 관리 페이지로 이동
    console.log('📋 예약 관리 페이지로 이동...');
    await page.goto('https://www.masgolf.co.kr/admin/booking', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // 목록 탭 클릭
    const listTab = page.locator('text=목록').first();
    if (await listTab.isVisible({ timeout: 5000 })) {
      await listTab.click();
      await page.waitForTimeout(2000);
    }

    // 테스트할 예약 찾기 (고객명 + 전화번호 둘 다 시도)
    const targetName = '마스골프';
    const targetPhone = '010-5704-0013';
    console.log(`🔍 예약 검색: ${targetName} / ${targetPhone}`);

    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      // 먼저 이름으로 검색
      await searchInput.fill('');
      await searchInput.fill(targetName);
      await page.waitForTimeout(2000);
    }

    // 이름으로 행 찾기
    let bookingRow = page.locator(`table tr:has-text("${targetName}")`).first();
    if (!(await bookingRow.isVisible({ timeout: 3000 }).catch(() => false))) {
      // 이름으로 못 찾으면 전화번호로 다시 검색
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill('');
        await searchInput.fill(targetPhone);
        await page.waitForTimeout(2000);
      }
      bookingRow = page.locator(`table tr:has-text("${targetPhone}")`).first();
    }

    if (!(await bookingRow.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('❌ 예약 행을 찾을 수 없습니다.');
      await browser.close();
      return;
    }

    const viewButton = bookingRow.locator('button:has-text("👁️"), button[title="상세보기"]').first();
    if (await viewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('   👁️ 버튼 클릭...');
      await viewButton.click();
    } else {
      console.log('   👁️ 버튼 없음, 행 클릭...');
      await bookingRow.click();
    }
    await page.waitForTimeout(3000);

    // 당일 예약 메세지 발송 체크
    const reminderCheckbox = page.locator('input#reminder-enabled').first();
    if (await reminderCheckbox.isVisible({ timeout: 5000 })) {
      const checked = await reminderCheckbox.isChecked();
      if (!checked) {
        await reminderCheckbox.check();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('❌ 당일 예약 메세지 발송 체크박스를 찾을 수 없습니다.');
      await browser.close();
      return;
    }

    // 오늘 날짜 기준으로 17:20(오후 5시 20분) 설정
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = '17';  // 17:20 (KST)
    const mi = '20';
    const datetimeValue = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;

    console.log(`🕒 발송 시간 입력: ${datetimeValue} (오늘 17:20)`);
    const datetimeInput = page.locator('input[type="datetime-local"]').first();
    if (await datetimeInput.isVisible({ timeout: 5000 })) {
      await datetimeInput.fill('');
      await datetimeInput.fill(datetimeValue);
      await page.waitForTimeout(1000);
    } else {
      console.log('❌ datetime-local 입력 필드를 찾을 수 없습니다.');
      await browser.close();
      return;
    }

    // 예약 시간 저장
    console.log('💾 예약 시간 저장 버튼 클릭...');
    const saveButton = page.locator('button:has-text("예약 시간 저장")').first();
    if (await saveButton.isVisible({ timeout: 5000 })) {
      await saveButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ 17:20 발송으로 예약 시간 저장 완료!');
    } else {
      console.log('❌ 예약 시간 저장 버튼을 찾을 수 없습니다.');
    }

    await page.screenshot({ path: 'booking-reminder-1720-set.png', fullPage: true });
    await page.waitForTimeout(2000);
  } catch (err) {
    console.error('❌ 스크립트 실행 중 오류:', err);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);


