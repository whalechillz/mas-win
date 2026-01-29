/**
 * Playwright 갤러리 메타데이터 테스트 (OCR / 골프 AI 생성)
 * - 이미지 추가 모달에서 골프 AI 생성 또는 OCR 선택 후 업로드
 * - 콘솔 로그 및 네트워크 오류 수집하여 원인 분석
 *
 * 실행: node e2e-test/playwright-gallery-metadata-ocr-golf-ai.js
 * (로컬 서버 실행 중: npm run dev)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const LOCAL_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

// 테스트용 작은 PNG 생성
function createTestImage(filePath) {
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
  return filePath;
}

async function run() {
  const logPath = path.join(__dirname, 'gallery-metadata-test-log.txt');
  const logs = [];
  const log = (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    logs.push(line);
  };

  log('🚀 갤러리 메타데이터 (OCR/골프 AI) 재현 테스트 시작\n');

  const browser = await chromium.launch({ headless: !!process.env.CI, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const networkLog = [];
  const consoleLog = [];

  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();
    const isMeta = url.includes('/api/admin/image-metadata') || url.includes('/api/analyze-image-prompt') || url.includes('/api/analyze-image-general') || url.includes('/api/admin/extract-document-text') || url.includes('/api/upload-image-supabase');
    if (!isMeta) return;

    const shortUrl = url.replace(LOCAL_URL, '');
    const entry = { url: shortUrl, status };
    if (status >= 400) {
      try {
        entry.body = await response.text();
      } catch (_) {}
      networkLog.push(entry);
      log(`❌ 네트워크 ${status}: ${shortUrl}`);
      if (entry.body) log(`   body: ${entry.body.substring(0, 400)}`);
    } else {
      log(`✅ 네트워크 ${status}: ${shortUrl}`);
    }
  });

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (text.includes('[갤러리 메타데이터]') || text.includes('메타데이터') || text.includes('OCR') || text.includes('골프 AI') || type === 'error') {
      consoleLog.push({ type, text });
      log(`콘솔 [${type}]: ${text}`);
    }
  });

  try {
    log('1️⃣ 로그인');
    await page.goto(`${LOCAL_URL}/api/auth/signin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const phone = page.locator('input[type="tel"], input[name="phone"], input[type="text"]').first();
    const password = page.locator('input[type="password"]').first();
    const submit = page.locator('button[type="submit"], button:has-text("로그인")').first();

    if (await phone.isVisible({ timeout: 5000 }).catch(() => false)) {
      await phone.fill(ADMIN_LOGIN);
      await password.fill(ADMIN_PASSWORD);
      await submit.click();
      await page.waitForTimeout(3000);
    }

    log('2️⃣ 갤러리 페이지 이동');
    await page.goto(`${LOCAL_URL}/admin/gallery`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);

    log('3️⃣ 이미지 추가 클릭');
    const addBtn = page.locator('button:has-text("이미지 추가"), a:has-text("이미지 추가")').first();
    await addBtn.click();
    await page.waitForTimeout(1500);

    const metadataType = process.env.METADATA_TYPE || 'golf-ai'; // golf-ai | ocr
    log(`4️⃣ 메타데이터 타입: ${metadataType} 선택`);
    const radio = page.locator(`input[name="metadataType"][value="${metadataType}"]`);
    await radio.check({ timeout: 5000 }).catch(() => log(`   ⚠️ ${metadataType} 라디오 없음`));
    await page.waitForTimeout(500);

    const testImagePath = path.join(__dirname, 'gallery-metadata-test-image.png');
    createTestImage(testImagePath);
    log(`5️⃣ 테스트 이미지 업로드: ${testImagePath}`);

    const fileInput = page.locator('input[type="file"][accept*="image"], input[name="gallery-file-upload"], input#gallery-file-upload');
    await fileInput.setInputFiles(testImagePath);
    log('   파일 선택 완료, 업로드 및 메타데이터 생성 대기 (최대 30초)');

    await page.waitForTimeout(30000);

    log('\n--- 수집된 네트워크 오류 ---');
    networkLog.forEach((e, i) => log(JSON.stringify(e, null, 2)));
    log('\n--- 수집된 콘솔 로그 ---');
    consoleLog.forEach((e, i) => log(`${e.type}: ${e.text}`));

    if (networkLog.length > 0) {
      log('\n❌ 실패: image-metadata 또는 분석/OCR API 오류 발생');
    } else {
      log('\n✅ 이번 실행에서는 네트워크 4xx/5xx 없음 (콘솔 로그만 확인)');
    }
  } catch (err) {
    log(`\n❌ 테스트 예외: ${err.message}`);
    console.error(err);
  } finally {
    await browser.close();
  }

  fs.writeFileSync(logPath, logs.join('\n'), 'utf8');
  console.log(`\n📄 로그 저장: ${logPath}`);
}

run();
