/**
 * Playwright로 154번 메시지 이미지 조회 확인
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = '010-6669-9000';
const ADMIN_PASSWORD = '66699000';

async function check154Image() {
  console.log('🔍 Playwright로 154번 메시지 이미지 조회 확인...\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인
    console.log('📝 1단계: 로그인...\n');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForSelector('#login', { timeout: 10000 });
    await page.fill('#login', ADMIN_LOGIN);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    console.log('✅ 로그인 완료\n');

    // 2. 154번 메시지 편집 페이지로 이동
    console.log('📝 2단계: 154번 메시지 편집 페이지로 이동...\n');
    await page.goto(`${BASE_URL}/admin/sms?id=154`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // 추가 대기 시간
    console.log('✅ 페이지 로드 완료\n');
    
    // 페이지 스크린샷 저장 (디버깅용)
    await page.screenshot({ path: 'screenshots/154-page-loaded.png', fullPage: true });
    console.log('📸 페이지 로드 스크린샷 저장: screenshots/154-page-loaded.png\n');

    // 3. 네트워크 요청 모니터링 시작
    console.log('📝 3단계: 네트워크 요청 모니터링 시작...\n');
    const apiRequests = [];
    const apiResponses = [];

    page.on('request', request => {
      if (request.url().includes('/api/admin/all-images')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log(`📤 API 요청: ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/admin/all-images')) {
        response.json().then(data => {
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            data: data
          });
          console.log(`📥 API 응답: ${response.status()} - count: ${data.count}, total: ${data.total}`);
        }).catch(err => {
          console.error(`❌ API 응답 파싱 오류: ${err.message}`);
        });
      }
    });

    // 4. 갤러리 버튼 클릭
    console.log('📝 4단계: 갤러리 버튼 클릭...\n');
    
    // 페이지의 모든 버튼 텍스트 확인 (디버깅)
    const allButtons = await page.locator('button').all();
    console.log(`📋 페이지에 ${allButtons.length}개 버튼 발견\n`);
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      try {
        const text = await allButtons[i].textContent();
        if (text && (text.includes('갤러리') || text.includes('선택'))) {
          console.log(`  버튼 ${i + 1}: "${text}"\n`);
        }
      } catch (e) {
        // 무시
      }
    }
    
    // 여러 선택자 시도
    const gallerySelectors = [
      'button:has-text("갤러리에서 선택")',
      'text=갤러리에서 선택',
      'button:has-text("갤러리")',
    ];
    
    let galleryButton = null;
    for (const selector of gallerySelectors) {
      try {
        galleryButton = page.locator(selector).first();
        if (await galleryButton.isVisible({ timeout: 3000 })) {
          console.log(`✅ 갤러리 버튼 발견: ${selector}\n`);
          break;
        }
      } catch (e) {
        // 다음 선택자 시도
        continue;
      }
    }
    
    if (galleryButton && await galleryButton.isVisible()) {
      await galleryButton.click();
      console.log('✅ 갤러리 버튼 클릭 완료\n');
      
      // 갤러리 모달이 나타날 때까지 대기
      await page.waitForSelector('[role="dialog"], .modal, [class*="modal"], [class*="Gallery"]', { timeout: 10000 });
      console.log('✅ 갤러리 모달 표시됨\n');
      
      // 5초 대기하여 API 요청 완료 대기
      await page.waitForTimeout(5000);
      
      // 갤러리 내용 확인
      const noImageMessage = await page.locator('text=이미지가 없습니다').first();
      if (await noImageMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('⚠️ "이미지가 없습니다" 메시지 표시됨\n');
      } else {
        console.log('✅ 이미지가 표시됨\n');
      }
      
      // 현재 폴더 경로 확인
      const folderInput = await page.locator('input[value*="154"]').first();
      if (await folderInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const folderValue = await folderInput.inputValue();
        console.log(`📁 현재 폴더 경로: ${folderValue}\n`);
      }
    } else {
      console.log('⚠️ 갤러리 버튼을 찾을 수 없습니다\n');
      console.log('📸 현재 페이지 스크린샷 저장 중...\n');
      await page.screenshot({ path: 'screenshots/154-no-gallery-button.png', fullPage: true });
    }

    // 5. API 요청/응답 요약
    console.log('\n📊 API 요청/응답 요약:\n');
    console.log(`총 ${apiRequests.length}개 요청, ${apiResponses.length}개 응답\n`);
    
    apiRequests.forEach((req, index) => {
      console.log(`${index + 1}. 요청:`);
      console.log(`   URL: ${req.url}`);
      console.log(`   Method: ${req.method}\n`);
    });
    
    apiResponses.forEach((res, index) => {
      console.log(`${index + 1}. 응답:`);
      console.log(`   Status: ${res.status}`);
      console.log(`   Count: ${res.data?.count || 0}`);
      console.log(`   Total: ${res.data?.total || 0}`);
      console.log(`   Images: ${res.data?.images?.length || 0}개\n`);
    });

    // 6. 콘솔 로그 확인
    console.log('📝 6단계: 콘솔 로그 확인...\n');
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('getAllImagesForPagination') || 
          msg.text().includes('all-images') ||
          msg.text().includes('154')) {
        consoleLogs.push(msg.text());
        console.log(`📋 콘솔: ${msg.text()}`);
      }
    });

    // 추가 5초 대기하여 모든 로그 수집
    await page.waitForTimeout(5000);

    console.log(`\n✅ 총 ${consoleLogs.length}개 관련 콘솔 로그 수집됨\n`);

    // 7. 스크린샷 저장
    console.log('📝 7단계: 스크린샷 저장...\n');
    await page.screenshot({ path: 'screenshots/154-gallery-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: screenshots/154-gallery-check.png\n');

    // 10초 대기하여 사용자가 확인할 수 있도록
    console.log('⏳ 10초 대기 중... (브라우저를 확인하세요)\n');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'screenshots/154-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

check154Image();


 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = '010-6669-9000';
const ADMIN_PASSWORD = '66699000';

async function check154Image() {
  console.log('🔍 Playwright로 154번 메시지 이미지 조회 확인...\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인
    console.log('📝 1단계: 로그인...\n');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForSelector('#login', { timeout: 10000 });
    await page.fill('#login', ADMIN_LOGIN);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    console.log('✅ 로그인 완료\n');

    // 2. 154번 메시지 편집 페이지로 이동
    console.log('📝 2단계: 154번 메시지 편집 페이지로 이동...\n');
    await page.goto(`${BASE_URL}/admin/sms?id=154`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // 추가 대기 시간
    console.log('✅ 페이지 로드 완료\n');
    
    // 페이지 스크린샷 저장 (디버깅용)
    await page.screenshot({ path: 'screenshots/154-page-loaded.png', fullPage: true });
    console.log('📸 페이지 로드 스크린샷 저장: screenshots/154-page-loaded.png\n');

    // 3. 네트워크 요청 모니터링 시작
    console.log('📝 3단계: 네트워크 요청 모니터링 시작...\n');
    const apiRequests = [];
    const apiResponses = [];

    page.on('request', request => {
      if (request.url().includes('/api/admin/all-images')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log(`📤 API 요청: ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/admin/all-images')) {
        response.json().then(data => {
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            data: data
          });
          console.log(`📥 API 응답: ${response.status()} - count: ${data.count}, total: ${data.total}`);
        }).catch(err => {
          console.error(`❌ API 응답 파싱 오류: ${err.message}`);
        });
      }
    });

    // 4. 갤러리 버튼 클릭
    console.log('📝 4단계: 갤러리 버튼 클릭...\n');
    
    // 페이지의 모든 버튼 텍스트 확인 (디버깅)
    const allButtons = await page.locator('button').all();
    console.log(`📋 페이지에 ${allButtons.length}개 버튼 발견\n`);
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      try {
        const text = await allButtons[i].textContent();
        if (text && (text.includes('갤러리') || text.includes('선택'))) {
          console.log(`  버튼 ${i + 1}: "${text}"\n`);
        }
      } catch (e) {
        // 무시
      }
    }
    
    // 여러 선택자 시도
    const gallerySelectors = [
      'button:has-text("갤러리에서 선택")',
      'text=갤러리에서 선택',
      'button:has-text("갤러리")',
    ];
    
    let galleryButton = null;
    for (const selector of gallerySelectors) {
      try {
        galleryButton = page.locator(selector).first();
        if (await galleryButton.isVisible({ timeout: 3000 })) {
          console.log(`✅ 갤러리 버튼 발견: ${selector}\n`);
          break;
        }
      } catch (e) {
        // 다음 선택자 시도
        continue;
      }
    }
    
    if (galleryButton && await galleryButton.isVisible()) {
      await galleryButton.click();
      console.log('✅ 갤러리 버튼 클릭 완료\n');
      
      // 갤러리 모달이 나타날 때까지 대기
      await page.waitForSelector('[role="dialog"], .modal, [class*="modal"], [class*="Gallery"]', { timeout: 10000 });
      console.log('✅ 갤러리 모달 표시됨\n');
      
      // 5초 대기하여 API 요청 완료 대기
      await page.waitForTimeout(5000);
      
      // 갤러리 내용 확인
      const noImageMessage = await page.locator('text=이미지가 없습니다').first();
      if (await noImageMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('⚠️ "이미지가 없습니다" 메시지 표시됨\n');
      } else {
        console.log('✅ 이미지가 표시됨\n');
      }
      
      // 현재 폴더 경로 확인
      const folderInput = await page.locator('input[value*="154"]').first();
      if (await folderInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const folderValue = await folderInput.inputValue();
        console.log(`📁 현재 폴더 경로: ${folderValue}\n`);
      }
    } else {
      console.log('⚠️ 갤러리 버튼을 찾을 수 없습니다\n');
      console.log('📸 현재 페이지 스크린샷 저장 중...\n');
      await page.screenshot({ path: 'screenshots/154-no-gallery-button.png', fullPage: true });
    }

    // 5. API 요청/응답 요약
    console.log('\n📊 API 요청/응답 요약:\n');
    console.log(`총 ${apiRequests.length}개 요청, ${apiResponses.length}개 응답\n`);
    
    apiRequests.forEach((req, index) => {
      console.log(`${index + 1}. 요청:`);
      console.log(`   URL: ${req.url}`);
      console.log(`   Method: ${req.method}\n`);
    });
    
    apiResponses.forEach((res, index) => {
      console.log(`${index + 1}. 응답:`);
      console.log(`   Status: ${res.status}`);
      console.log(`   Count: ${res.data?.count || 0}`);
      console.log(`   Total: ${res.data?.total || 0}`);
      console.log(`   Images: ${res.data?.images?.length || 0}개\n`);
    });

    // 6. 콘솔 로그 확인
    console.log('📝 6단계: 콘솔 로그 확인...\n');
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('getAllImagesForPagination') || 
          msg.text().includes('all-images') ||
          msg.text().includes('154')) {
        consoleLogs.push(msg.text());
        console.log(`📋 콘솔: ${msg.text()}`);
      }
    });

    // 추가 5초 대기하여 모든 로그 수집
    await page.waitForTimeout(5000);

    console.log(`\n✅ 총 ${consoleLogs.length}개 관련 콘솔 로그 수집됨\n`);

    // 7. 스크린샷 저장
    console.log('📝 7단계: 스크린샷 저장...\n');
    await page.screenshot({ path: 'screenshots/154-gallery-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: screenshots/154-gallery-check.png\n');

    // 10초 대기하여 사용자가 확인할 수 있도록
    console.log('⏳ 10초 대기 중... (브라우저를 확인하세요)\n');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'screenshots/154-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

check154Image();


 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = '010-6669-9000';
const ADMIN_PASSWORD = '66699000';

async function check154Image() {
  console.log('🔍 Playwright로 154번 메시지 이미지 조회 확인...\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인
    console.log('📝 1단계: 로그인...\n');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForSelector('#login', { timeout: 10000 });
    await page.fill('#login', ADMIN_LOGIN);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    console.log('✅ 로그인 완료\n');

    // 2. 154번 메시지 편집 페이지로 이동
    console.log('📝 2단계: 154번 메시지 편집 페이지로 이동...\n');
    await page.goto(`${BASE_URL}/admin/sms?id=154`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // 추가 대기 시간
    console.log('✅ 페이지 로드 완료\n');
    
    // 페이지 스크린샷 저장 (디버깅용)
    await page.screenshot({ path: 'screenshots/154-page-loaded.png', fullPage: true });
    console.log('📸 페이지 로드 스크린샷 저장: screenshots/154-page-loaded.png\n');

    // 3. 네트워크 요청 모니터링 시작
    console.log('📝 3단계: 네트워크 요청 모니터링 시작...\n');
    const apiRequests = [];
    const apiResponses = [];

    page.on('request', request => {
      if (request.url().includes('/api/admin/all-images')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log(`📤 API 요청: ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/admin/all-images')) {
        response.json().then(data => {
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            data: data
          });
          console.log(`📥 API 응답: ${response.status()} - count: ${data.count}, total: ${data.total}`);
        }).catch(err => {
          console.error(`❌ API 응답 파싱 오류: ${err.message}`);
        });
      }
    });

    // 4. 갤러리 버튼 클릭
    console.log('📝 4단계: 갤러리 버튼 클릭...\n');
    
    // 페이지의 모든 버튼 텍스트 확인 (디버깅)
    const allButtons = await page.locator('button').all();
    console.log(`📋 페이지에 ${allButtons.length}개 버튼 발견\n`);
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      try {
        const text = await allButtons[i].textContent();
        if (text && (text.includes('갤러리') || text.includes('선택'))) {
          console.log(`  버튼 ${i + 1}: "${text}"\n`);
        }
      } catch (e) {
        // 무시
      }
    }
    
    // 여러 선택자 시도
    const gallerySelectors = [
      'button:has-text("갤러리에서 선택")',
      'text=갤러리에서 선택',
      'button:has-text("갤러리")',
    ];
    
    let galleryButton = null;
    for (const selector of gallerySelectors) {
      try {
        galleryButton = page.locator(selector).first();
        if (await galleryButton.isVisible({ timeout: 3000 })) {
          console.log(`✅ 갤러리 버튼 발견: ${selector}\n`);
          break;
        }
      } catch (e) {
        // 다음 선택자 시도
        continue;
      }
    }
    
    if (galleryButton && await galleryButton.isVisible()) {
      await galleryButton.click();
      console.log('✅ 갤러리 버튼 클릭 완료\n');
      
      // 갤러리 모달이 나타날 때까지 대기
      await page.waitForSelector('[role="dialog"], .modal, [class*="modal"], [class*="Gallery"]', { timeout: 10000 });
      console.log('✅ 갤러리 모달 표시됨\n');
      
      // 5초 대기하여 API 요청 완료 대기
      await page.waitForTimeout(5000);
      
      // 갤러리 내용 확인
      const noImageMessage = await page.locator('text=이미지가 없습니다').first();
      if (await noImageMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('⚠️ "이미지가 없습니다" 메시지 표시됨\n');
      } else {
        console.log('✅ 이미지가 표시됨\n');
      }
      
      // 현재 폴더 경로 확인
      const folderInput = await page.locator('input[value*="154"]').first();
      if (await folderInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const folderValue = await folderInput.inputValue();
        console.log(`📁 현재 폴더 경로: ${folderValue}\n`);
      }
    } else {
      console.log('⚠️ 갤러리 버튼을 찾을 수 없습니다\n');
      console.log('📸 현재 페이지 스크린샷 저장 중...\n');
      await page.screenshot({ path: 'screenshots/154-no-gallery-button.png', fullPage: true });
    }

    // 5. API 요청/응답 요약
    console.log('\n📊 API 요청/응답 요약:\n');
    console.log(`총 ${apiRequests.length}개 요청, ${apiResponses.length}개 응답\n`);
    
    apiRequests.forEach((req, index) => {
      console.log(`${index + 1}. 요청:`);
      console.log(`   URL: ${req.url}`);
      console.log(`   Method: ${req.method}\n`);
    });
    
    apiResponses.forEach((res, index) => {
      console.log(`${index + 1}. 응답:`);
      console.log(`   Status: ${res.status}`);
      console.log(`   Count: ${res.data?.count || 0}`);
      console.log(`   Total: ${res.data?.total || 0}`);
      console.log(`   Images: ${res.data?.images?.length || 0}개\n`);
    });

    // 6. 콘솔 로그 확인
    console.log('📝 6단계: 콘솔 로그 확인...\n');
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('getAllImagesForPagination') || 
          msg.text().includes('all-images') ||
          msg.text().includes('154')) {
        consoleLogs.push(msg.text());
        console.log(`📋 콘솔: ${msg.text()}`);
      }
    });

    // 추가 5초 대기하여 모든 로그 수집
    await page.waitForTimeout(5000);

    console.log(`\n✅ 총 ${consoleLogs.length}개 관련 콘솔 로그 수집됨\n`);

    // 7. 스크린샷 저장
    console.log('📝 7단계: 스크린샷 저장...\n');
    await page.screenshot({ path: 'screenshots/154-gallery-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: screenshots/154-gallery-check.png\n');

    // 10초 대기하여 사용자가 확인할 수 있도록
    console.log('⏳ 10초 대기 중... (브라우저를 확인하세요)\n');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'screenshots/154-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

check154Image();


 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = '010-6669-9000';
const ADMIN_PASSWORD = '66699000';

async function check154Image() {
  console.log('🔍 Playwright로 154번 메시지 이미지 조회 확인...\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인
    console.log('📝 1단계: 로그인...\n');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForSelector('#login', { timeout: 10000 });
    await page.fill('#login', ADMIN_LOGIN);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    console.log('✅ 로그인 완료\n');

    // 2. 154번 메시지 편집 페이지로 이동
    console.log('📝 2단계: 154번 메시지 편집 페이지로 이동...\n');
    await page.goto(`${BASE_URL}/admin/sms?id=154`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // 추가 대기 시간
    console.log('✅ 페이지 로드 완료\n');
    
    // 페이지 스크린샷 저장 (디버깅용)
    await page.screenshot({ path: 'screenshots/154-page-loaded.png', fullPage: true });
    console.log('📸 페이지 로드 스크린샷 저장: screenshots/154-page-loaded.png\n');

    // 3. 네트워크 요청 모니터링 시작
    console.log('📝 3단계: 네트워크 요청 모니터링 시작...\n');
    const apiRequests = [];
    const apiResponses = [];

    page.on('request', request => {
      if (request.url().includes('/api/admin/all-images')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log(`📤 API 요청: ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/admin/all-images')) {
        response.json().then(data => {
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            data: data
          });
          console.log(`📥 API 응답: ${response.status()} - count: ${data.count}, total: ${data.total}`);
        }).catch(err => {
          console.error(`❌ API 응답 파싱 오류: ${err.message}`);
        });
      }
    });

    // 4. 갤러리 버튼 클릭
    console.log('📝 4단계: 갤러리 버튼 클릭...\n');
    
    // 페이지의 모든 버튼 텍스트 확인 (디버깅)
    const allButtons = await page.locator('button').all();
    console.log(`📋 페이지에 ${allButtons.length}개 버튼 발견\n`);
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      try {
        const text = await allButtons[i].textContent();
        if (text && (text.includes('갤러리') || text.includes('선택'))) {
          console.log(`  버튼 ${i + 1}: "${text}"\n`);
        }
      } catch (e) {
        // 무시
      }
    }
    
    // 여러 선택자 시도
    const gallerySelectors = [
      'button:has-text("갤러리에서 선택")',
      'text=갤러리에서 선택',
      'button:has-text("갤러리")',
    ];
    
    let galleryButton = null;
    for (const selector of gallerySelectors) {
      try {
        galleryButton = page.locator(selector).first();
        if (await galleryButton.isVisible({ timeout: 3000 })) {
          console.log(`✅ 갤러리 버튼 발견: ${selector}\n`);
          break;
        }
      } catch (e) {
        // 다음 선택자 시도
        continue;
      }
    }
    
    if (galleryButton && await galleryButton.isVisible()) {
      await galleryButton.click();
      console.log('✅ 갤러리 버튼 클릭 완료\n');
      
      // 갤러리 모달이 나타날 때까지 대기
      await page.waitForSelector('[role="dialog"], .modal, [class*="modal"], [class*="Gallery"]', { timeout: 10000 });
      console.log('✅ 갤러리 모달 표시됨\n');
      
      // 5초 대기하여 API 요청 완료 대기
      await page.waitForTimeout(5000);
      
      // 갤러리 내용 확인
      const noImageMessage = await page.locator('text=이미지가 없습니다').first();
      if (await noImageMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('⚠️ "이미지가 없습니다" 메시지 표시됨\n');
      } else {
        console.log('✅ 이미지가 표시됨\n');
      }
      
      // 현재 폴더 경로 확인
      const folderInput = await page.locator('input[value*="154"]').first();
      if (await folderInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const folderValue = await folderInput.inputValue();
        console.log(`📁 현재 폴더 경로: ${folderValue}\n`);
      }
    } else {
      console.log('⚠️ 갤러리 버튼을 찾을 수 없습니다\n');
      console.log('📸 현재 페이지 스크린샷 저장 중...\n');
      await page.screenshot({ path: 'screenshots/154-no-gallery-button.png', fullPage: true });
    }

    // 5. API 요청/응답 요약
    console.log('\n📊 API 요청/응답 요약:\n');
    console.log(`총 ${apiRequests.length}개 요청, ${apiResponses.length}개 응답\n`);
    
    apiRequests.forEach((req, index) => {
      console.log(`${index + 1}. 요청:`);
      console.log(`   URL: ${req.url}`);
      console.log(`   Method: ${req.method}\n`);
    });
    
    apiResponses.forEach((res, index) => {
      console.log(`${index + 1}. 응답:`);
      console.log(`   Status: ${res.status}`);
      console.log(`   Count: ${res.data?.count || 0}`);
      console.log(`   Total: ${res.data?.total || 0}`);
      console.log(`   Images: ${res.data?.images?.length || 0}개\n`);
    });

    // 6. 콘솔 로그 확인
    console.log('📝 6단계: 콘솔 로그 확인...\n');
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('getAllImagesForPagination') || 
          msg.text().includes('all-images') ||
          msg.text().includes('154')) {
        consoleLogs.push(msg.text());
        console.log(`📋 콘솔: ${msg.text()}`);
      }
    });

    // 추가 5초 대기하여 모든 로그 수집
    await page.waitForTimeout(5000);

    console.log(`\n✅ 총 ${consoleLogs.length}개 관련 콘솔 로그 수집됨\n`);

    // 7. 스크린샷 저장
    console.log('📝 7단계: 스크린샷 저장...\n');
    await page.screenshot({ path: 'screenshots/154-gallery-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: screenshots/154-gallery-check.png\n');

    // 10초 대기하여 사용자가 확인할 수 있도록
    console.log('⏳ 10초 대기 중... (브라우저를 확인하세요)\n');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'screenshots/154-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

check154Image();


 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = '010-6669-9000';
const ADMIN_PASSWORD = '66699000';

async function check154Image() {
  console.log('🔍 Playwright로 154번 메시지 이미지 조회 확인...\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인
    console.log('📝 1단계: 로그인...\n');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForSelector('#login', { timeout: 10000 });
    await page.fill('#login', ADMIN_LOGIN);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    console.log('✅ 로그인 완료\n');

    // 2. 154번 메시지 편집 페이지로 이동
    console.log('📝 2단계: 154번 메시지 편집 페이지로 이동...\n');
    await page.goto(`${BASE_URL}/admin/sms?id=154`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // 추가 대기 시간
    console.log('✅ 페이지 로드 완료\n');
    
    // 페이지 스크린샷 저장 (디버깅용)
    await page.screenshot({ path: 'screenshots/154-page-loaded.png', fullPage: true });
    console.log('📸 페이지 로드 스크린샷 저장: screenshots/154-page-loaded.png\n');

    // 3. 네트워크 요청 모니터링 시작
    console.log('📝 3단계: 네트워크 요청 모니터링 시작...\n');
    const apiRequests = [];
    const apiResponses = [];

    page.on('request', request => {
      if (request.url().includes('/api/admin/all-images')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log(`📤 API 요청: ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/admin/all-images')) {
        response.json().then(data => {
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            data: data
          });
          console.log(`📥 API 응답: ${response.status()} - count: ${data.count}, total: ${data.total}`);
        }).catch(err => {
          console.error(`❌ API 응답 파싱 오류: ${err.message}`);
        });
      }
    });

    // 4. 갤러리 버튼 클릭
    console.log('📝 4단계: 갤러리 버튼 클릭...\n');
    
    // 페이지의 모든 버튼 텍스트 확인 (디버깅)
    const allButtons = await page.locator('button').all();
    console.log(`📋 페이지에 ${allButtons.length}개 버튼 발견\n`);
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      try {
        const text = await allButtons[i].textContent();
        if (text && (text.includes('갤러리') || text.includes('선택'))) {
          console.log(`  버튼 ${i + 1}: "${text}"\n`);
        }
      } catch (e) {
        // 무시
      }
    }
    
    // 여러 선택자 시도
    const gallerySelectors = [
      'button:has-text("갤러리에서 선택")',
      'text=갤러리에서 선택',
      'button:has-text("갤러리")',
    ];
    
    let galleryButton = null;
    for (const selector of gallerySelectors) {
      try {
        galleryButton = page.locator(selector).first();
        if (await galleryButton.isVisible({ timeout: 3000 })) {
          console.log(`✅ 갤러리 버튼 발견: ${selector}\n`);
          break;
        }
      } catch (e) {
        // 다음 선택자 시도
        continue;
      }
    }
    
    if (galleryButton && await galleryButton.isVisible()) {
      await galleryButton.click();
      console.log('✅ 갤러리 버튼 클릭 완료\n');
      
      // 갤러리 모달이 나타날 때까지 대기
      await page.waitForSelector('[role="dialog"], .modal, [class*="modal"], [class*="Gallery"]', { timeout: 10000 });
      console.log('✅ 갤러리 모달 표시됨\n');
      
      // 5초 대기하여 API 요청 완료 대기
      await page.waitForTimeout(5000);
      
      // 갤러리 내용 확인
      const noImageMessage = await page.locator('text=이미지가 없습니다').first();
      if (await noImageMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('⚠️ "이미지가 없습니다" 메시지 표시됨\n');
      } else {
        console.log('✅ 이미지가 표시됨\n');
      }
      
      // 현재 폴더 경로 확인
      const folderInput = await page.locator('input[value*="154"]').first();
      if (await folderInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const folderValue = await folderInput.inputValue();
        console.log(`📁 현재 폴더 경로: ${folderValue}\n`);
      }
    } else {
      console.log('⚠️ 갤러리 버튼을 찾을 수 없습니다\n');
      console.log('📸 현재 페이지 스크린샷 저장 중...\n');
      await page.screenshot({ path: 'screenshots/154-no-gallery-button.png', fullPage: true });
    }

    // 5. API 요청/응답 요약
    console.log('\n📊 API 요청/응답 요약:\n');
    console.log(`총 ${apiRequests.length}개 요청, ${apiResponses.length}개 응답\n`);
    
    apiRequests.forEach((req, index) => {
      console.log(`${index + 1}. 요청:`);
      console.log(`   URL: ${req.url}`);
      console.log(`   Method: ${req.method}\n`);
    });
    
    apiResponses.forEach((res, index) => {
      console.log(`${index + 1}. 응답:`);
      console.log(`   Status: ${res.status}`);
      console.log(`   Count: ${res.data?.count || 0}`);
      console.log(`   Total: ${res.data?.total || 0}`);
      console.log(`   Images: ${res.data?.images?.length || 0}개\n`);
    });

    // 6. 콘솔 로그 확인
    console.log('📝 6단계: 콘솔 로그 확인...\n');
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('getAllImagesForPagination') || 
          msg.text().includes('all-images') ||
          msg.text().includes('154')) {
        consoleLogs.push(msg.text());
        console.log(`📋 콘솔: ${msg.text()}`);
      }
    });

    // 추가 5초 대기하여 모든 로그 수집
    await page.waitForTimeout(5000);

    console.log(`\n✅ 총 ${consoleLogs.length}개 관련 콘솔 로그 수집됨\n`);

    // 7. 스크린샷 저장
    console.log('📝 7단계: 스크린샷 저장...\n');
    await page.screenshot({ path: 'screenshots/154-gallery-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: screenshots/154-gallery-check.png\n');

    // 10초 대기하여 사용자가 확인할 수 있도록
    console.log('⏳ 10초 대기 중... (브라우저를 확인하세요)\n');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'screenshots/154-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

check154Image();

