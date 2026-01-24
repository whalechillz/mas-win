/**
 * Playwright 터치 스크롤 테스트
 * 모바일 화면에서 모든 세로 페이지들이 터치로 스크롤이 안되는 오류 재현
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

// 테스트 결과 저장
const testResults = [];
const scrollLogs = [];

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, type, message };
  scrollLogs.push(logEntry);
  console.log(`[${timestamp}] ${message}`);
}

async function testTouchScroll(page, pageName, url) {
  log(`\n📱 ${pageName} 터치 스크롤 테스트 시작`, 'info');
  log(`📍 URL: ${url}`, 'info');
  
  try {
    // 페이지 이동
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // 페이지 로드 대기
    
    // 초기 스크롤 위치 확인
    const initialScrollY = await page.evaluate(() => window.scrollY);
    log(`   초기 스크롤 위치: ${initialScrollY}px`, 'debug');
    
    // 페이지 높이 확인
    const pageHeight = await page.evaluate(() => {
      return {
        windowHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        bodyHeight: document.body.scrollHeight,
        canScroll: document.documentElement.scrollHeight > window.innerHeight
      };
    });
    
    log(`   윈도우 높이: ${pageHeight.windowHeight}px`, 'debug');
    log(`   문서 높이: ${pageHeight.documentHeight}px`, 'debug');
    log(`   본문 높이: ${pageHeight.bodyHeight}px`, 'debug');
    log(`   스크롤 가능: ${pageHeight.canScroll}`, pageHeight.canScroll ? 'success' : 'warning');
    
    if (!pageHeight.canScroll) {
      log(`   ⚠️ 스크롤할 콘텐츠가 없습니다.`, 'warning');
      testResults.push({
        page: pageName,
        url,
        status: 'skipped',
        reason: 'No scrollable content'
      });
      return;
    }
    
    // CSS 스타일 확인
    const styles = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      return {
        htmlOverflow: window.getComputedStyle(html).overflow,
        htmlOverflowY: window.getComputedStyle(html).overflowY,
        htmlOverflowX: window.getComputedStyle(html).overflowX,
        htmlHeight: window.getComputedStyle(html).height,
        htmlMaxHeight: window.getComputedStyle(html).maxHeight,
        bodyOverflow: window.getComputedStyle(body).overflow,
        bodyOverflowY: window.getComputedStyle(body).overflowY,
        bodyOverflowX: window.getComputedStyle(body).overflowX,
        bodyHeight: window.getComputedStyle(body).height,
        bodyMaxHeight: window.getComputedStyle(body).maxHeight,
        webkitOverflowScrolling: window.getComputedStyle(html).webkitOverflowScrolling || 'N/A',
        touchAction: window.getComputedStyle(html).touchAction || 'N/A'
      };
    });
    
    log(`   CSS 스타일:`, 'debug');
    log(`     html.overflow: ${styles.htmlOverflow}`, 'debug');
    log(`     html.overflowY: ${styles.htmlOverflowY}`, 'debug');
    log(`     html.height: ${styles.htmlHeight}`, 'debug');
    log(`     body.overflow: ${styles.bodyOverflow}`, 'debug');
    log(`     body.overflowY: ${styles.bodyOverflowY}`, 'debug');
    log(`     body.height: ${styles.bodyHeight}`, 'debug');
    log(`     -webkit-overflow-scrolling: ${styles.webkitOverflowScrolling}`, 'debug');
    log(`     touch-action: ${styles.touchAction}`, 'debug');
    
    // 터치 스크롤 시도
    log(`   터치 스크롤 시도 중...`, 'info');
    
    // 터치 이벤트 시뮬레이션
    const touchScrollResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        const startY = window.scrollY;
        let touchStartY = 0;
        let touchMoveY = 0;
        let scrollChanged = false;
        
        // 터치 시작
        const touchStart = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: [new Touch({
            identifier: 0,
            target: document.body,
            clientX: 100,
            clientY: 300,
            screenX: 100,
            screenY: 300,
            pageX: 100,
            pageY: 300,
            radiusX: 2.5,
            radiusY: 2.5,
            rotationAngle: 0,
            force: 0.5
          })]
        });
        
        // 터치 이동
        const touchMove = new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [new Touch({
            identifier: 0,
            target: document.body,
            clientX: 100,
            clientY: 100, // 위로 스크롤
            screenX: 100,
            screenY: 100,
            pageX: 100,
            pageY: 100,
            radiusX: 2.5,
            radiusY: 2.5,
            rotationAngle: 0,
            force: 0.5
          })]
        });
        
        // 스크롤 이벤트 리스너
        const scrollHandler = () => {
          scrollChanged = true;
        };
        window.addEventListener('scroll', scrollHandler, { once: true });
        
        // 터치 이벤트 발생
        document.body.dispatchEvent(touchStart);
        setTimeout(() => {
          document.body.dispatchEvent(touchMove);
          setTimeout(() => {
            const endY = window.scrollY;
            window.removeEventListener('scroll', scrollHandler);
            resolve({
              startY,
              endY,
              scrollChanged,
              scrollDelta: endY - startY
            });
          }, 100);
        }, 50);
      });
    });
    
    log(`   터치 스크롤 결과:`, 'debug');
    log(`     시작 위치: ${touchScrollResult.startY}px`, 'debug');
    log(`     종료 위치: ${touchScrollResult.endY}px`, 'debug');
    log(`     스크롤 변화: ${touchScrollResult.scrollChanged ? '✅ 있음' : '❌ 없음'}`, touchScrollResult.scrollChanged ? 'success' : 'error');
    log(`     스크롤 거리: ${touchScrollResult.scrollDelta}px`, 'debug');
    
    // 프로그래밍 방식 스크롤 테스트 (비교용)
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await page.waitForTimeout(500);
    
    const programmaticScrollY = await page.evaluate(() => window.scrollY);
    log(`   프로그래밍 스크롤 위치: ${programmaticScrollY}px`, 'debug');
    
    // 스크롤 가능 여부 확인
    const canScrollManually = programmaticScrollY > initialScrollY;
    log(`   프로그래밍 스크롤 가능: ${canScrollManually ? '✅ 가능' : '❌ 불가능'}`, canScrollManually ? 'success' : 'error');
    
    // 문제 진단
    const issues = [];
    if (styles.htmlOverflow === 'hidden' || styles.htmlOverflowY === 'hidden') {
      issues.push('html 요소에 overflow: hidden 적용됨');
    }
    if (styles.bodyOverflow === 'hidden' || styles.bodyOverflowY === 'hidden') {
      issues.push('body 요소에 overflow: hidden 적용됨');
    }
    if (styles.htmlHeight === '100%' && styles.bodyHeight === '100%') {
      issues.push('html/body 높이가 100%로 고정됨');
    }
    if (styles.webkitOverflowScrolling === 'N/A' || styles.webkitOverflowScrolling === 'auto') {
      issues.push('-webkit-overflow-scrolling: touch 미적용');
    }
    if (!touchScrollResult.scrollChanged && canScrollManually) {
      issues.push('터치 스크롤이 작동하지 않음 (프로그래밍 스크롤은 가능)');
    }
    
    const status = issues.length > 0 ? 'failed' : 'passed';
    log(`   진단 결과: ${issues.length > 0 ? '❌ 문제 발견' : '✅ 정상'}`, status === 'passed' ? 'success' : 'error');
    
    if (issues.length > 0) {
      log(`   발견된 문제:`, 'error');
      issues.forEach(issue => log(`     - ${issue}`, 'error'));
    }
    
    testResults.push({
      page: pageName,
      url,
      status,
      issues,
      styles,
      touchScrollResult,
      canScrollManually
    });
    
  } catch (error) {
    log(`   ❌ 테스트 실패: ${error.message}`, 'error');
    testResults.push({
      page: pageName,
      url,
      status: 'error',
      error: error.message
    });
  }
}

async function runTouchScrollTests() {
  log('🚀 터치 스크롤 테스트 시작', 'info');
  log(`🌐 Base URL: ${BASE_URL}`, 'info');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  // 모바일 컨텍스트 생성 (iPhone 12 Pro)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  // 콘솔 메시지 캡처
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[TOUCH-SCROLL]') || text.includes('touch') || text.includes('scroll')) {
      log(`   콘솔: ${text}`, 'debug');
    }
  });
  
  // 로그인
  log('\n🔐 로그인 중...', 'info');
  try {
    await page.goto(`${BASE_URL}/api/auth/signin`, { waitUntil: 'networkidle' });
    await page.fill('input[name="phone"]', ADMIN_LOGIN);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    log('✅ 로그인 성공', 'success');
  } catch (error) {
    log(`⚠️ 로그인 실패 또는 이미 로그인됨: ${error.message}`, 'warning');
  }
  
  // 테스트할 페이지 목록
  const testPages = [
    {
      name: '카카오 콘텐츠 페이지',
      url: `${BASE_URL}/admin/kakao-content?date=2026-01-24`
    },
    {
      name: '갤러리 관리 페이지',
      url: `${BASE_URL}/admin/gallery`
    },
    {
      name: '블로그 관리 페이지',
      url: `${BASE_URL}/admin/blog`
    },
    {
      name: '고객 관리 페이지',
      url: `${BASE_URL}/admin/contacts`
    }
  ];
  
  // 각 페이지 테스트
  for (const testPage of testPages) {
    await testTouchScroll(page, testPage.name, testPage.url);
    await page.waitForTimeout(2000); // 페이지 간 대기
  }
  
  // 결과 요약
  log('\n📊 테스트 결과 요약', 'info');
  const passed = testResults.filter(r => r.status === 'passed').length;
  const failed = testResults.filter(r => r.status === 'failed').length;
  const errors = testResults.filter(r => r.status === 'error').length;
  const skipped = testResults.filter(r => r.status === 'skipped').length;
  
  log(`   ✅ 통과: ${passed}`, 'success');
  log(`   ❌ 실패: ${failed}`, failed > 0 ? 'error' : 'info');
  log(`   ⚠️ 오류: ${errors}`, errors > 0 ? 'error' : 'info');
  log(`   ⏭️ 건너뜀: ${skipped}`, 'info');
  
  // 결과 저장
  const resultPath = path.join(__dirname, 'playwright-touch-scroll-results.json');
  fs.writeFileSync(resultPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { passed, failed, errors, skipped },
    results: testResults,
    logs: scrollLogs
  }, null, 2));
  
  log(`\n💾 결과 저장: ${resultPath}`, 'info');
  
  await browser.close();
  
  // 실패한 테스트가 있으면 종료 코드 1 반환
  process.exit(failed > 0 || errors > 0 ? 1 : 0);
}

// 실행
runTouchScrollTests().catch(error => {
  log(`❌ 테스트 실행 실패: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
