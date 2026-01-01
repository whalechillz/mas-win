/**
 * Playwright 배포 환경 카카오 콘텐츠 생성 테스트
 * 2026-01-16 날짜로 배포 환경에서 테스트
 */

const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://www.masgolf.co.kr';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';
const TEST_DATE = '2026-01-16';

async function testKakaoContentGeneration() {
  console.log('🚀 배포 환경 카카오 콘텐츠 생성 테스트 시작...\n');
  console.log(`📅 테스트 날짜: ${TEST_DATE}\n`);
  
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
  const apiCalls = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/kakao-content/auto-create')) {
      apiCalls.push({
        type: 'request',
        url,
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      console.log(`📤 요청: ${request.method()} ${url}`);
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/kakao-content/auto-create')) {
      const status = response.status();
      const timestamp = new Date().toISOString();
      apiCalls.push({
        type: 'response',
        url,
        status,
        timestamp
      });
      
      if (status >= 400) {
        console.log(`❌ 응답 오류: ${url} - ${status}`);
        try {
          const text = await response.text();
          console.log(`   오류 내용: ${text.substring(0, 300)}`);
        } catch (e) {
          console.log(`   응답 읽기 실패: ${e.message}`);
        }
      } else {
        console.log(`✅ 응답 성공: ${url} - ${status}`);
        try {
          const data = await response.json();
          console.log(`   성공 여부: ${data.success || 'N/A'}`);
          if (data.results) {
            console.log(`   배경: ${data.results.background?.success ? '✅' : '❌'}`);
            console.log(`   프로필: ${data.results.profile?.success ? '✅' : '❌'}`);
            console.log(`   피드: ${data.results.feed?.success ? '✅' : '❌'}`);
          }
        } catch (e) {
          // JSON 파싱 실패는 무시
        }
      }
    }
  });
  
  // 콘솔 로그 캡처 (TIMING 로그 포함)
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('생성 실패') || text.includes('504') || text.includes('timeout') || text.includes('[TIMING]')) {
      console.log(`🔴 콘솔: ${msg.type()} - ${text}`);
    }
  });
  
  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto(`${PRODUCTION_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 로그인 폼 찾기
    const phoneInput = await page.locator('input[type="tel"], input[name="phone"], input[type="text"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인")').first();
    
    if (await phoneInput.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 로그인 폼 발견');
      await phoneInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      await loginButton.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ 로그인 완료');
    } else {
      console.log('   ⚠️ 로그인 폼을 찾을 수 없습니다. 이미 로그인되어 있을 수 있습니다.');
    }
    
    // 2. 카카오톡 콘텐츠 페이지로 이동
    console.log('\n2️⃣ 카카오톡 콘텐츠 페이지로 이동...');
    await page.goto(`${PRODUCTION_URL}/admin/kakao-content`, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    await page.waitForTimeout(5000);
    
    // 페이지 로드 확인
    const pageTitle = await page.locator('h1, h2').first().textContent().catch(() => '');
    console.log(`   페이지 제목: ${pageTitle}`);
    
    // 3. 날짜 선택 (2026-01-16)
    console.log(`\n3️⃣ 날짜 선택: ${TEST_DATE}...`);
    
    // "오늘" 보기 모드 선택 (날짜 입력 필드가 보이도록)
    const todayButton = page.locator('button:has-text("오늘")').first();
    if (await todayButton.isVisible({ timeout: 5000 })) {
      await todayButton.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ "오늘" 보기 모드 선택');
    }
    
    // 날짜 입력 필드 찾기 및 설정
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 10000 })) {
      await dateInput.fill(TEST_DATE);
      await page.waitForTimeout(2000);
      console.log(`   ✅ 날짜 설정 완료: ${TEST_DATE}`);
    } else {
      console.log('   ⚠️ 날짜 입력 필드를 찾을 수 없습니다. 페이지 구조 확인 필요.');
      // 페이지 스크린샷 저장
      await page.screenshot({ path: 'debug-date-input.png' });
      console.log('   📸 디버그 스크린샷 저장: debug-date-input.png');
    }
    
    // 4. "선택된 날짜 생성" 버튼 클릭
    console.log('\n4️⃣ "선택된 날짜 생성" 버튼 클릭...');
    
    // 모달이 열려있으면 닫기
    const modalCloseButton = page.locator('button:has-text("취소"), button:has-text("확인")').first();
    if (await modalCloseButton.isVisible({ timeout: 2000 })) {
      console.log('   ⚠️ 모달이 열려있음. 모달 닫기...');
      await modalCloseButton.click();
      await page.waitForTimeout(1000);
    }
    
    // 버튼 찾기 (여러 가능한 텍스트 패턴)
    const generateButton = page.locator('button:has-text("선택된 날짜 생성"), button:has-text("오늘 날짜 생성"), button:has-text("생성")').first();
    
    if (await generateButton.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 생성 버튼 발견');
      
      // 모달이 나타날 때까지 대기하면서 생성 진행
      const startTime = Date.now();
      await generateButton.click();
      console.log('   ✅ 버튼 클릭 완료');
      
      // 진행 상황 모니터링 (최대 10분 대기)
      const maxWaitTime = 10 * 60 * 1000; // 10분
      let lastProgress = '';
      
      while (Date.now() - startTime < maxWaitTime) {
        await page.waitForTimeout(2000);
        
        // 진행 상황 텍스트 확인
        const progressText = await page.locator('text=생성 진행 중, text=처리 중, text=완료').first().textContent().catch(() => '');
        
        // 모달 확인 (생성 완료 모달)
        const modal = page.locator('text=생성 완료, text=성공, text=실패').first();
        if (await modal.isVisible({ timeout: 1000 })) {
          console.log('\n   ✅ 생성 완료 모달 발견');
          break;
        }
        
        // 콘솔에서 오류 확인
        const consoleMessages = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('*')).map(el => el.textContent).join(' ');
        });
        
        if (consoleMessages.includes('504') || consoleMessages.includes('timeout')) {
          console.log('   ⚠️ 타임아웃 오류 감지');
          break;
        }
      }
      
      // 결과 모달 확인
      await page.waitForTimeout(2000);
      const modalText = await page.locator('body').textContent();
      
      if (modalText.includes('생성 완료')) {
        console.log('\n   ✅ 생성 완료 모달 확인');
        
        // 성공/실패 개수 추출
        const successMatch = modalText.match(/성공[:\s]*(\d+)개/);
        const failureMatch = modalText.match(/실패[:\s]*(\d+)개/);
        
        if (successMatch) console.log(`   성공: ${successMatch[1]}개`);
        if (failureMatch) console.log(`   실패: ${failureMatch[1]}개`);
        
        // 실패한 항목 확인
        if (failureMatch && parseInt(failureMatch[1]) > 0) {
          const failureLines = modalText.split('\n').filter(line => 
            line.includes(TEST_DATE) && (line.includes('504') || line.includes('실패'))
          );
          failureLines.forEach(line => console.log(`   ❌ ${line.trim()}`));
        }
      }
      
      // 모달 닫기
      const confirmButton = page.locator('button:has-text("확인")').first();
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('   ❌ 생성 버튼을 찾을 수 없습니다.');
    }
    
    // 5. 생성된 데이터 확인
    console.log('\n5️⃣ 생성된 데이터 확인...');
    await page.waitForTimeout(3000);
    
    // 페이지 새로고침하여 최신 데이터 로드
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // account1과 account2의 데이터 확인
    const dataCheck = await page.evaluate((date) => {
      const results = {
        account1: {
          backgroundImage: false,
          backgroundPrompt: false,
          profileImage: false,
          profilePrompt: false,
          profileMessage: false,
          feedImage: false,
          feedCaption: false
        },
        account2: {
          backgroundImage: false,
          backgroundPrompt: false,
          profileImage: false,
          profilePrompt: false,
          profileMessage: false,
          feedImage: false,
          feedCaption: false
        }
      };
      
      // 페이지에서 데이터 확인 (실제 DOM 구조에 맞게 수정 필요)
      const pageText = document.body.innerText;
      
      // account1 확인
      if (pageText.includes('account1') || pageText.includes('ProWhale')) {
        // 이미지 URL이 있는지 확인
        const images = Array.from(document.querySelectorAll('img[src*="supabase"], img[src*="kakao"]'));
        results.account1.backgroundImage = images.length > 0;
      }
      
      // account2 확인
      if (pageText.includes('account2') || pageText.includes('Tech')) {
        const images = Array.from(document.querySelectorAll('img[src*="supabase"], img[src*="kakao"]'));
        results.account2.backgroundImage = images.length > 0;
      }
      
      return results;
    }, TEST_DATE);
    
    console.log('\n📊 데이터 확인 결과:');
    console.log('Account1:');
    console.log(`  배경 이미지: ${dataCheck.account1.backgroundImage ? '✅' : '❌'}`);
    console.log(`  배경 프롬프트: ${dataCheck.account1.backgroundPrompt ? '✅' : '❌'}`);
    console.log(`  프로필 이미지: ${dataCheck.account1.profileImage ? '✅' : '❌'}`);
    console.log(`  프로필 프롬프트: ${dataCheck.account1.profilePrompt ? '✅' : '❌'}`);
    console.log(`  프로필 메시지: ${dataCheck.account1.profileMessage ? '✅' : '❌'}`);
    console.log(`  피드 이미지: ${dataCheck.account1.feedImage ? '✅' : '❌'}`);
    console.log(`  피드 캡션: ${dataCheck.account1.feedCaption ? '✅' : '❌'}`);
    
    console.log('\nAccount2:');
    console.log(`  배경 이미지: ${dataCheck.account2.backgroundImage ? '✅' : '❌'}`);
    console.log(`  배경 프롬프트: ${dataCheck.account2.backgroundPrompt ? '✅' : '❌'}`);
    console.log(`  프로필 이미지: ${dataCheck.account2.profileImage ? '✅' : '❌'}`);
    console.log(`  프로필 프롬프트: ${dataCheck.account2.profilePrompt ? '✅' : '❌'}`);
    console.log(`  프로필 메시지: ${dataCheck.account2.profileMessage ? '✅' : '❌'}`);
    console.log(`  피드 이미지: ${dataCheck.account2.feedImage ? '✅' : '❌'}`);
    console.log(`  피드 캡션: ${dataCheck.account2.feedCaption ? '✅' : '❌'}`);
    
    // 6. API 직접 호출 테스트 (타임아웃 확인)
    console.log('\n6️⃣ API 직접 호출 테스트 (타임아웃 확인)...');
    
    const apiTestResult = await page.evaluate(async (baseUrl, date) => {
      const results = {
        account1: { success: false, error: null, duration: 0 },
        account2: { success: false, error: null, duration: 0 }
      };
      
      // Account1 테스트
      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5분
        
        const response = await fetch(`${baseUrl}/api/kakao-content/auto-create-account1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, forceRegenerate: false }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        
        if (response.ok) {
          const data = await response.json();
          results.account1 = {
            success: data.success || false,
            duration,
            results: data.results || null
          };
        } else {
          const errorText = await response.text();
          results.account1 = {
            success: false,
            error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
            duration
          };
        }
      } catch (error) {
        results.account1 = {
          success: false,
          error: error.message,
          duration: 0
        };
      }
      
      // Account2 테스트
      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5분
        
        const response = await fetch(`${baseUrl}/api/kakao-content/auto-create-account2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, forceRegenerate: false }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        
        if (response.ok) {
          const data = await response.json();
          results.account2 = {
            success: data.success || false,
            duration,
            results: data.results || null
          };
        } else {
          const errorText = await response.text();
          results.account2 = {
            success: false,
            error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
            duration
          };
        }
      } catch (error) {
        results.account2 = {
          success: false,
          error: error.message,
          duration: 0
        };
      }
      
      return results;
    }, PRODUCTION_URL, TEST_DATE);
    
    console.log('\n📊 API 직접 호출 결과:');
    console.log('Account1:');
    console.log(`  성공: ${apiTestResult.account1.success ? '✅' : '❌'}`);
    console.log(`  소요 시간: ${apiTestResult.account1.duration}ms (${(apiTestResult.account1.duration / 1000).toFixed(1)}초)`);
    if (apiTestResult.account1.error) {
      console.log(`  오류: ${apiTestResult.account1.error}`);
    }
    if (apiTestResult.account1.results) {
      console.log(`  배경: ${apiTestResult.account1.results.background?.success ? '✅' : '❌'}`);
      console.log(`  프로필: ${apiTestResult.account1.results.profile?.success ? '✅' : '❌'}`);
      console.log(`  피드: ${apiTestResult.account1.results.feed?.success ? '✅' : '❌'}`);
    }
    
    console.log('\nAccount2:');
    console.log(`  성공: ${apiTestResult.account2.success ? '✅' : '❌'}`);
    console.log(`  소요 시간: ${apiTestResult.account2.duration}ms (${(apiTestResult.account2.duration / 1000).toFixed(1)}초)`);
    if (apiTestResult.account2.error) {
      console.log(`  오류: ${apiTestResult.account2.error}`);
    }
    if (apiTestResult.account2.results) {
      console.log(`  배경: ${apiTestResult.account2.results.background?.success ? '✅' : '❌'}`);
      console.log(`  프로필: ${apiTestResult.account2.results.profile?.success ? '✅' : '❌'}`);
      console.log(`  피드: ${apiTestResult.account2.results.feed?.success ? '✅' : '❌'}`);
    }
    
    // API 호출 로그 요약
    console.log('\n📋 API 호출 로그:');
    apiCalls.forEach(call => {
      const time = new Date(call.timestamp).toLocaleTimeString();
      if (call.type === 'request') {
        console.log(`  ${time} 📤 ${call.method} ${call.url}`);
      } else {
        const status = call.status >= 400 ? '❌' : '✅';
        console.log(`  ${time} ${status} 응답 ${call.status} ${call.url}`);
      }
    });
    
    // 최종 요약
    console.log('\n📊 최종 요약:');
    const allSuccess = apiTestResult.account1.success && apiTestResult.account2.success;
    console.log(`전체 성공: ${allSuccess ? '✅' : '❌'}`);
    
    if (!allSuccess) {
      console.log('\n⚠️ 문제점:');
      if (!apiTestResult.account1.success) {
        console.log(`  - Account1 실패: ${apiTestResult.account1.error || '알 수 없는 오류'}`);
      }
      if (!apiTestResult.account2.success) {
        console.log(`  - Account2 실패: ${apiTestResult.account2.error || '알 수 없는 오류'}`);
      }
    }
    
    // 브라우저를 열어둠 (수동 확인용)
    console.log('\n✅ 테스트 완료. 브라우저를 10초간 열어둡니다...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

// 실행
testKakaoContentGeneration().catch(console.error);

