const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.PLAYWRIGHT_ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';
const HEADLESS =
  process.env.PLAYWRIGHT_HEADLESS === 'true'
    ? true
    : process.env.PLAYWRIGHT_HEADLESS === 'false'
      ? false
      : false;
const OUTPUT_DIR = path.join(__dirname);
const SCREENSHOT_PATH = path.join(OUTPUT_DIR, 'customers-page-error.png');
const LOG_PATH = path.join(OUTPUT_DIR, 'customers-page-error.log');

async function run() {
  const browser = await chromium.launch({
    headless: HEADLESS,
    slowMo: 0,
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
    console.log('🚀 고객 관리 페이지 Playwright 점검 시작');
    console.log(`   ▶ headless 모드: ${HEADLESS}`);

    console.log('1️⃣ 로그인 페이지 접속');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });

    console.log('2️⃣ 자격 증명 입력');
    await page.fill('#login', ADMIN_LOGIN);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    console.log('3️⃣ 관리자 대시보드 진입 대기');
    await page.waitForURL(`${BASE_URL}/admin`, { timeout: 15000 });

    console.log('4️⃣ 고객 관리 페이지 이동');
    await page.goto(`${BASE_URL}/admin/customers`, { waitUntil: 'networkidle' });

    console.log('5️⃣ 오류 오버레이 감지 시도');
    const errorOverlay = await page.$('text=Unhandled Runtime Error');
    if (errorOverlay) {
      console.warn('⚠️ 오류 오버레이 감지됨. 스크린샷을 저장합니다.');
    } else {
      console.log('✅ 오류 오버레이가 즉시 나타나지 않았습니다.');
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    console.log(`📸 스크린샷 저장 완료: ${SCREENSHOT_PATH}`);

    if (errorOverlay || pageErrors.length > 0) {
      throw new Error('고객 관리 페이지 렌더링 중 오류가 감지되었습니다.');
    }

    console.log('🎉 고객 관리 페이지에서 즉시 재현 가능한 오류가 발견되지 않았습니다.');
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
    console.error(error);
  } finally {
    const logPayload = [
      `Timestamp: ${new Date().toISOString()}`,
      `BaseURL: ${BASE_URL}`,
      `Console logs:`,
      ...consoleLogs,
      `Page errors:`,
      ...pageErrors,
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





