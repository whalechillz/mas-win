const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.PLAYWRIGHT_ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';
const HEADLESS =
  process.env.PLAYWRIGHT_HEADLESS === 'false'
    ? false
    : true;

const OUTPUT_DIR = __dirname;
const SCREENSHOT_PATH = path.join(OUTPUT_DIR, 'scheduled-time-check.png');
const LOG_PATH = path.join(OUTPUT_DIR, 'scheduled-time-check.log');

async function run() {
  const browser = await chromium.launch({
    headless: HEADLESS,
    slowMo: 0
  });

  const page = await browser.newPage();
  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    const entry = `[console:${msg.type()}] ${msg.text()}`;
    consoleLogs.push(entry);
    console.log(entry);
  });

  page.on('pageerror', (error) => {
    const entry = `[pageerror] ${error.message}`;
    pageErrors.push(entry);
    console.error(entry);
  });

  try {
    console.log('🚀 SMS 리스트 예약 시간 점검 시작');
    console.log(`   ▶ baseUrl: ${BASE_URL}`);

    console.log('1️⃣ 로그인 페이지 진입');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });

    console.log('2️⃣ 관리자 자격 증명 입력');
    await page.fill('#login', ADMIN_LOGIN);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    console.log('3️⃣ 관리자 대시보드 로딩 대기');
    await page.waitForURL(`${BASE_URL}/admin`, { timeout: 20000 });

    console.log('4️⃣ SMS 리스트 페이지 이동');
    await page.goto(`${BASE_URL}/admin/sms-list`, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=SMS/MMS 관리', { timeout: 15000 });
    await page.waitForSelector('text=예약일', { timeout: 15000 });

    console.log('5️⃣ 예약일 컬럼 셀 확인');
    const scheduledCells = await page.$$('[data-testid="scheduled-time"]');
    if (scheduledCells.length > 0) {
      const firstCellText = (await scheduledCells[0].innerText()).trim();
      console.log(`   ▶ 첫 예약 셀 텍스트: ${firstCellText || '(공백)'}`);
    } else {
      console.warn('⚠️ 예약 컬럼 셀을 찾지 못했습니다. (예약 데이터가 없을 수 있음)');
    }

    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    console.log(`📸 스크린샷 저장 완료: ${SCREENSHOT_PATH}`);

    if (pageErrors.length > 0) {
      throw new Error('페이지 오류가 감지되었습니다.');
    }

    console.log('🎉 예약 시간 UI 점검 완료');
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
    console.error(error);
    throw error;
  } finally {
    const logPayload = [
      `Timestamp: ${new Date().toISOString()}`,
      `BaseURL: ${BASE_URL}`,
      `Console logs:`,
      ...consoleLogs,
      `Page errors:`,
      ...pageErrors
    ].join('\n');

    fs.writeFileSync(LOG_PATH, logPayload, 'utf8');
    console.log(`📝 로그 저장 완료: ${LOG_PATH}`);

    await browser.close();
    console.log('🔚 Playwright 브라우저 종료');
  }
}

run().catch((err) => {
  console.error('🚨 스크립트 실행 오류:', err);
  process.exit(1);
});

