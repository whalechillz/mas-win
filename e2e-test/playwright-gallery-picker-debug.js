/**
 * Playwright 배포 환경 갤러리 선택 모달 이미지 로드 디버깅 테스트
 * 배포 환경에서 "갤러리에서 선택" 클릭 시 이미지가 안 나오는 원인 파악
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.masgolf.co.kr';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';
const TEST_DATE = '2026-01-24';

// 디버그 로그 저장
const debugLogs = [];
const apiCalls = [];
const consoleMessages = [];

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, type, message };
  debugLogs.push(logEntry);
  console.log(`[${timestamp}] ${message}`);
}

async function testGalleryPickerImageLoad() {
  log('🚀 배포 환경 갤러리 선택 모달 이미지 로드 디버깅 테스트 시작', 'info');
  log(`📅 테스트 날짜: ${TEST_DATE}`, 'info');
  log(`🌐 배포 URL: ${PRODUCTION_URL}`, 'info');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  // 네트워크 요청/응답 상세 로깅
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/admin/all-images') || url.includes('/api/admin/')) {
      const headers = request.headers();
      apiCalls.push({
        type: 'request',
        url,
        method: request.method(),
        headers: {
          cookie: headers.cookie || 'N/A',
          authorization: headers.authorization || 'N/A',
          referer: headers.referer || 'N/A'
        },
        timestamp: new Date().toISOString()
      });
      log(`📤 API 요청: ${request.method()} ${url}`, 'request');
      if (headers.cookie) {
        log(`   쿠키: ${headers.cookie.substring(0, 100)}...`, 'debug');
      }
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/admin/all-images') || url.includes('/api/admin/')) {
      const status = response.status();
      const headers = Object.fromEntries(response.headers());
      const timestamp = new Date().toISOString();
      
      apiCalls.push({
        type: 'response',
        url,
        status,
        statusText: response.statusText(),
        headers,
        timestamp
      });
      
      if (status === 401) {
        log(`❌ 401 Unauthorized: ${url}`, 'error');
        try {
          const text = await response.text();
          log(`   에러 내용: ${text}`, 'error');
        } catch (e) {
          log(`   응답 읽기 실패: ${e.message}`, 'error');
        }
      } else if (status >= 400) {
        log(`❌ 에러 응답: ${url} - ${status} ${response.statusText()}`, 'error');
        try {
          const text = await response.text();
          log(`   에러 내용: ${text.substring(0, 500)}`, 'error');
        } catch (e) {
          log(`   응답 읽기 실패: ${e.message}`, 'error');
        }
      } else {
        log(`✅ 성공 응답: ${url} - ${status}`, 'success');
        if (url.includes('/api/admin/all-images')) {
          try {
            const data = await response.json();
            log(`   이미지 개수: ${data.images?.length || 0}`, 'info');
            log(`   전체 개수: ${data.total || 0}`, 'info');
          } catch (e) {
            // JSON 파싱 실패는 무시
          }
        }
      }
    }
  });
  
  // 콘솔 로그 캡처 (디버그 메시지 포함)
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleMessages.push({
      type,
      text,
      timestamp: new Date().toISOString()
    });
    
    // 디버그 관련 메시지만 출력
    if (text.includes('[DEPLOY DEBUG]') || 
        text.includes('401') || 
        text.includes('Unauthorized') ||
        text.includes('이미지 로드') ||
        text.includes('GalleryPicker')) {
      log(`🔴 콘솔 [${type}]: ${text}`, 'console');
    }
  });
  
  // 페이지 에러 캡처
  page.on('pageerror', error => {
    log(`❌ 페이지 에러: ${error.message}`, 'error');
    consoleMessages.push({
      type: 'error',
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    // 1. 로그인
    log('\n1️⃣ 로그인 중...', 'info');
    await page.goto(`${PRODUCTION_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 로그인 폼 찾기
    const phoneInput = await page.locator('input[type="tel"], input[name="phone"], input[type="text"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인")').first();
    
    if (await phoneInput.isVisible({ timeout: 5000 })) {
      log('   ✅ 로그인 폼 발견', 'success');
      await phoneInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      await loginButton.click();
      await page.waitForTimeout(3000);
      log('   ✅ 로그인 완료', 'success');
      
      // 로그인 후 쿠키 확인
      const cookies = await context.cookies();
      log(`   쿠키 개수: ${cookies.length}`, 'debug');
      cookies.forEach(cookie => {
        if (cookie.name.includes('session') || cookie.name.includes('auth') || cookie.name.includes('next-auth')) {
          log(`   쿠키: ${cookie.name} = ${cookie.value.substring(0, 50)}...`, 'debug');
        }
      });
    } else {
      log('   ⚠️ 로그인 폼을 찾을 수 없습니다. 이미 로그인되어 있을 수 있습니다.', 'warning');
    }
    
    // 2. 카카오톡 콘텐츠 페이지로 이동
    log('\n2️⃣ 카카오톡 콘텐츠 페이지로 이동...', 'info');
    await page.goto(`${PRODUCTION_URL}/admin/kakao-content?date=${TEST_DATE}`, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    await page.waitForTimeout(5000);
    
    // 페이지 로드 확인
    const pageTitle = await page.locator('h1, h2').first().textContent().catch(() => '');
    log(`   페이지 제목: ${pageTitle}`, 'info');
    
    // 3. "갤러리에서 선택" 버튼 찾기 및 클릭
    log('\n3️⃣ "갤러리에서 선택" 버튼 찾기...', 'info');
    
    // 배경 이미지 섹션의 "갤러리에서 선택" 버튼 찾기
    const galleryButtons = page.locator('button:has-text("갤러리에서 선택")');
    const buttonCount = await galleryButtons.count();
    log(`   발견된 "갤러리에서 선택" 버튼 개수: ${buttonCount}`, 'info');
    
    if (buttonCount === 0) {
      log('   ❌ "갤러리에서 선택" 버튼을 찾을 수 없습니다.', 'error');
      await page.screenshot({ path: 'debug-no-gallery-button.png', fullPage: true });
      log('   📸 디버그 스크린샷 저장: debug-no-gallery-button.png', 'info');
      return;
    }
    
    // 첫 번째 버튼 클릭 (배경 이미지)
    log('   ✅ 첫 번째 "갤러리에서 선택" 버튼 클릭...', 'info');
    await galleryButtons.first().click();
    await page.waitForTimeout(3000);
    
    // 4. 갤러리 모달이 열렸는지 확인
    log('\n4️⃣ 갤러리 모달 확인...', 'info');
    
    const modal = page.locator('text=갤러리에서 이미지 선택, text=갤러리에서 선택').first();
    if (await modal.isVisible({ timeout: 5000 })) {
      log('   ✅ 갤러리 모달이 열렸습니다.', 'success');
      
      // 모달 내부 요소 확인
      const modalContent = await page.locator('[class*="modal"], [class*="Modal"]').first();
      if (await modalContent.isVisible({ timeout: 2000 })) {
        log('   ✅ 모달 컨텐츠 확인', 'success');
      }
      
      // 5. 이미지 로드 대기 및 확인
      log('\n5️⃣ 이미지 로드 대기 및 확인...', 'info');
      await page.waitForTimeout(5000); // 이미지 로드 대기
      
      // 이미지 요소 확인
      const images = await page.locator('img[src*="supabase"], img[src*="blog-images"]').count();
      log(`   발견된 이미지 개수: ${images}`, 'info');
      
      // "이미지가 없습니다" 메시지 확인
      const noImageMessage = page.locator('text=이미지가 없습니다');
      if (await noImageMessage.isVisible({ timeout: 2000 })) {
        log('   ⚠️ "이미지가 없습니다" 메시지가 표시됨', 'warning');
        
        // API 호출 상태 확인
        const api401Errors = apiCalls.filter(call => 
          call.type === 'response' && call.status === 401 && call.url.includes('/api/admin/all-images')
        );
        
        if (api401Errors.length > 0) {
          log('   ❌ 401 Unauthorized 에러 발견!', 'error');
          api401Errors.forEach(error => {
            log(`      URL: ${error.url}`, 'error');
            log(`      Status: ${error.status} ${error.statusText}`, 'error');
            log(`      Headers: ${JSON.stringify(error.headers, null, 2)}`, 'error');
          });
        }
      } else {
        log('   ✅ 이미지가 표시되고 있습니다.', 'success');
      }
      
      // 6. 콘솔 로그에서 디버그 메시지 확인
      log('\n6️⃣ 콘솔 디버그 메시지 확인...', 'info');
      const deployDebugMessages = consoleMessages.filter(msg => 
        msg.text.includes('[DEPLOY DEBUG]')
      );
      
      if (deployDebugMessages.length > 0) {
        log(`   발견된 [DEPLOY DEBUG] 메시지: ${deployDebugMessages.length}개`, 'info');
        deployDebugMessages.forEach(msg => {
          log(`   ${msg.text}`, 'debug');
        });
      } else {
        log('   ⚠️ [DEPLOY DEBUG] 메시지가 없습니다. 디버그 코드가 실행되지 않았을 수 있습니다.', 'warning');
      }
      
      // 401 에러 관련 콘솔 메시지
      const errorMessages = consoleMessages.filter(msg => 
        msg.text.includes('401') || msg.text.includes('Unauthorized')
      );
      
      if (errorMessages.length > 0) {
        log(`   발견된 401 에러 메시지: ${errorMessages.length}개`, 'error');
        errorMessages.forEach(msg => {
          log(`   ${msg.text}`, 'error');
        });
      }
      
      // 7. 스크린샷 저장
      await page.screenshot({ path: 'debug-gallery-modal.png', fullPage: true });
      log('   📸 디버그 스크린샷 저장: debug-gallery-modal.png', 'info');
      
      // 모달 닫기
      const closeButton = page.locator('button:has-text("닫기"), button:has-text("×"), button:has-text("X")').first();
      if (await closeButton.isVisible({ timeout: 2000 })) {
        await closeButton.click();
        await page.waitForTimeout(1000);
      }
    } else {
      log('   ❌ 갤러리 모달이 열리지 않았습니다.', 'error');
      await page.screenshot({ path: 'debug-modal-not-opened.png', fullPage: true });
      log('   📸 디버그 스크린샷 저장: debug-modal-not-opened.png', 'info');
    }
    
    // 8. API 호출 로그 요약
    log('\n8️⃣ API 호출 로그 요약...', 'info');
    const allImagesApiCalls = apiCalls.filter(call => 
      call.url.includes('/api/admin/all-images')
    );
    
    log(`   /api/admin/all-images 호출 횟수: ${allImagesApiCalls.filter(c => c.type === 'request').length}`, 'info');
    
    const successCalls = allImagesApiCalls.filter(c => c.type === 'response' && c.status < 400);
    const errorCalls = allImagesApiCalls.filter(c => c.type === 'response' && c.status >= 400);
    
    log(`   성공: ${successCalls.length}개`, successCalls.length > 0 ? 'success' : 'info');
    log(`   실패: ${errorCalls.length}개`, errorCalls.length > 0 ? 'error' : 'info');
    
    if (errorCalls.length > 0) {
      log('\n   ❌ 실패한 API 호출 상세:', 'error');
      errorCalls.forEach(call => {
        log(`      ${call.status} ${call.statusText}: ${call.url}`, 'error');
        log(`      시간: ${call.timestamp}`, 'error');
      });
    }
    
    // 9. 디버그 로그 파일 저장
    const logFilePath = path.join(__dirname, `gallery-picker-debug-${Date.now()}.json`);
    const debugData = {
      timestamp: new Date().toISOString(),
      url: PRODUCTION_URL,
      testDate: TEST_DATE,
      apiCalls,
      consoleMessages: consoleMessages.filter(msg => 
        msg.text.includes('[DEPLOY DEBUG]') || 
        msg.text.includes('401') || 
        msg.text.includes('Unauthorized') ||
        msg.text.includes('이미지 로드')
      ),
      summary: {
        totalApiCalls: apiCalls.filter(c => c.type === 'request').length,
        successApiCalls: apiCalls.filter(c => c.type === 'response' && c.status < 400).length,
        errorApiCalls: apiCalls.filter(c => c.type === 'response' && c.status >= 400).length,
        unauthorizedErrors: apiCalls.filter(c => c.type === 'response' && c.status === 401).length
      }
    };
    
    fs.writeFileSync(logFilePath, JSON.stringify(debugData, null, 2));
    log(`\n📄 디버그 로그 저장: ${logFilePath}`, 'info');
    
    // 최종 요약
    log('\n📊 최종 요약:', 'info');
    log(`   전체 API 호출: ${debugData.summary.totalApiCalls}개`, 'info');
    log(`   성공: ${debugData.summary.successApiCalls}개`, debugData.summary.successApiCalls > 0 ? 'success' : 'info');
    log(`   실패: ${debugData.summary.errorApiCalls}개`, debugData.summary.errorApiCalls > 0 ? 'error' : 'info');
    log(`   401 에러: ${debugData.summary.unauthorizedErrors}개`, debugData.summary.unauthorizedErrors > 0 ? 'error' : 'info');
    
    if (debugData.summary.unauthorizedErrors > 0) {
      log('\n⚠️ 401 Unauthorized 에러가 발생했습니다!', 'error');
      log('   가능한 원인:', 'error');
      log('   1. 세션 쿠키가 만료되었거나 전달되지 않음', 'error');
      log('   2. 인증 미들웨어가 쿠키를 인식하지 못함', 'error');
      log('   3. CORS 설정 문제', 'error');
      log('   4. SameSite 쿠키 설정 문제', 'error');
    }
    
    // 브라우저를 열어둠 (수동 확인용)
    log('\n✅ 테스트 완료. 브라우저를 30초간 열어둡니다...', 'info');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    log(`\n❌ 테스트 중 오류 발생: ${error.message}`, 'error');
    log(error.stack, 'error');
    
    // 에러 발생 시 스크린샷 저장
    await page.screenshot({ path: 'debug-error.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
}

// 실행
testGalleryPickerImageLoad().catch(console.error);
