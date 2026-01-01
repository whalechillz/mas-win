/**
 * 카카오 채널 초안 저장 오류 확인 스크립트
 * 
 * 사용법:
 * node scripts/check-kakao-save-error.js
 * 
 * 환경 변수:
 * - ADMIN_LOGIN: 관리자 로그인 ID
 * - ADMIN_PASSWORD: 관리자 비밀번호
 */

require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.PRODUCTION_URL || 'https://www.masgolf.co.kr';
const ADMIN_LOGIN = process.env.ADMIN_EMAIL || process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function checkKakaoSaveError() {
  console.log('🔍 카카오 채널 초안 저장 오류 확인 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome-beta'
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  // 네트워크 요청 및 응답 모니터링
  const networkLogs = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/channels/kakao/save')) {
      const status = response.status();
      const headers = response.headers();
      const contentType = headers['content-type'] || '';
      
      let responseBody = null;
      try {
        if (contentType.includes('application/json')) {
          responseBody = await response.json();
        } else {
          responseBody = await response.text();
        }
      } catch (e) {
        responseBody = `응답 본문 읽기 실패: ${e.message}`;
      }

      networkLogs.push({
        url,
        status,
        statusText: response.statusText(),
        headers: Object.fromEntries(Object.entries(headers)),
        body: responseBody,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 콘솔 메시지 모니터링
  const consoleLogs = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleLogs.push({
      type,
      text,
      timestamp: new Date().toISOString()
    });
  });

  // 페이지 오류 모니터링
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  try {
    // 1. 로그인
    console.log('1️⃣ 관리자 로그인 중...');
    await page.goto(`${BASE_URL}/admin/login`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);

    if (page.url().includes('/admin/login')) {
      console.log('   이메일 입력 중...');
      const loginInput = page.locator('input#login').or(
        page.locator('input[name="login"]')
      ).first();
      await loginInput.waitFor({ timeout: 10000 });
      await loginInput.fill(ADMIN_LOGIN);
      await page.waitForTimeout(500);

      console.log('   비밀번호 입력 중...');
      const passwordInput = page.locator('input#password').or(
        page.locator('input[name="password"]')
      ).first();
      await passwordInput.fill(ADMIN_PASSWORD);
      await page.waitForTimeout(500);

      console.log('   로그인 버튼 클릭 중...');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      // 2단계 인증 대기
      console.log('   💡 2단계 인증 대기 중... (최대 5분)');
      console.log('      브라우저에서 수동으로 2단계 인증을 완료해주세요.');
      
      const maxWaitTime = 5 * 60 * 1000;
      const checkInterval = 10 * 1000;
      let waitedTime = 0;

      while (waitedTime < maxWaitTime) {
        const currentUrl = page.url();
        if (!currentUrl.includes('/admin/login') && currentUrl.includes('admin')) {
          console.log('   ✅ 로그인 완료!\n');
          break;
        }
        await page.waitForTimeout(checkInterval);
        waitedTime += checkInterval;
        if (waitedTime % 30000 === 0) {
          console.log(`   대기 중... (${Math.floor(waitedTime / 1000)}초 경과)`);
        }
      }
    } else {
      console.log('   ✅ 이미 로그인되어 있습니다.\n');
    }

    // 2. 카카오 채널 에디터 페이지로 이동
    console.log('2️⃣ 카카오 채널 에디터 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/kakao`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await page.waitForTimeout(3000);
    console.log('   ✅ 페이지 로드 완료\n');

    // 3. 메시지 내용 입력
    console.log('3️⃣ 테스트 메시지 입력...');
    const messageTextarea = page.locator('textarea[placeholder*="메시지 내용"]').first();
    await messageTextarea.waitFor({ timeout: 10000 });
    await messageTextarea.fill('테스트 메시지입니다.');
    await page.waitForTimeout(1000);
    console.log('   ✅ 메시지 내용 입력 완료\n');

    // 4. 초안 저장 버튼 클릭
    console.log('4️⃣ 초안 저장 버튼 클릭...');
    const saveButton = page.locator('button:has-text("초안 저장")').first();
    await saveButton.waitFor({ timeout: 10000 });
    
    // 저장 전 네트워크 로그 초기화
    networkLogs.length = 0;
    consoleLogs.length = 0;
    pageErrors.length = 0;
    
    await saveButton.click();
    console.log('   ✅ 초안 저장 버튼 클릭 완료\n');

    // 5. 응답 대기 (최대 10초)
    console.log('5️⃣ 서버 응답 대기 중...');
    await page.waitForTimeout(10000);

    // 6. 오류 메시지 확인
    console.log('\n' + '='.repeat(80));
    console.log('📋 오류 분석 결과');
    console.log('='.repeat(80));

    // 네트워크 응답 확인
    if (networkLogs.length > 0) {
      console.log('\n🌐 네트워크 응답:');
      networkLogs.forEach((log, index) => {
        console.log(`\n   [${index + 1}] ${log.url}`);
        console.log(`   상태 코드: ${log.status} ${log.statusText}`);
        console.log(`   타임스탬프: ${log.timestamp}`);
        console.log(`   응답 본문:`);
        console.log(JSON.stringify(log.body, null, 2));
      });
    } else {
      console.log('\n⚠️ 네트워크 응답이 없습니다.');
    }

    // 콘솔 로그 확인
    if (consoleLogs.length > 0) {
      console.log('\n📝 콘솔 로그:');
      const errorLogs = consoleLogs.filter(log => 
        log.type === 'error' || 
        log.text.toLowerCase().includes('error') ||
        log.text.toLowerCase().includes('오류') ||
        log.text.toLowerCase().includes('실패')
      );
      
      if (errorLogs.length > 0) {
        errorLogs.forEach((log, index) => {
          console.log(`\n   [${index + 1}] [${log.type}] ${log.text}`);
        });
      } else {
        console.log('   오류 관련 콘솔 로그가 없습니다.');
      }
    }

    // 페이지 오류 확인
    if (pageErrors.length > 0) {
      console.log('\n❌ 페이지 오류:');
      pageErrors.forEach((error, index) => {
        console.log(`\n   [${index + 1}] ${error.message}`);
        if (error.stack) {
          console.log(`   스택: ${error.stack.substring(0, 200)}...`);
        }
      });
    }

    // 화면의 오류 메시지 확인
    console.log('\n🔍 화면 오류 메시지 확인 중...');
    const errorMessages = await page.locator('text=/오류|error|실패|fail/i').all();
    if (errorMessages.length > 0) {
      console.log('   발견된 오류 메시지:');
      for (const msg of errorMessages) {
        const text = await msg.textContent();
        console.log(`   - ${text}`);
      }
    } else {
      console.log('   화면에 오류 메시지가 표시되지 않습니다.');
    }

    // 스크린샷 저장
    const screenshotPath = 'kakao-save-error-check.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 스크린샷 저장: ${screenshotPath}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ 오류 확인 완료');
    console.log('='.repeat(80) + '\n');

    // 사용자 입력 대기 (5초 후 자동 종료)
    console.log('\n⏳ 5초 후 브라우저를 자동으로 닫습니다...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ 스크립트 실행 중 오류:', error.message);
    console.error('스택:', error.stack);
    
    // 오류 발생 시에도 스크린샷 저장
    try {
      await page.screenshot({ path: 'kakao-save-error-exception.png', fullPage: true });
      console.log('\n📸 오류 스크린샷 저장: kakao-save-error-exception.png');
    } catch (e) {
      // 무시
    }
  } finally {
    await browser.close();
  }
}

// 실행
checkKakaoSaveError()
  .then(() => {
    console.log('\n✅ 스크립트 완료\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 스크립트 실패:', error);
    process.exit(1);
  });

