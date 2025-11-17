/**
 * Playwright 로컬 테스트 스크립트
 * 로컬 환경에서 카카오톡 콘텐츠 생성 기능 테스트
 */

const { chromium } = require('playwright');

const LOCAL_URL = 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function testKakaoContentGeneration() {
  console.log('🚀 로컬 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // 디버깅을 위해 느리게 실행
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 네트워크 요청/응답 로깅
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/kakao-content/')) {
      const status = response.status();
      if (status >= 400) {
        console.log(`❌ API 오류: ${url} - ${status}`);
        try {
          const text = await response.text();
          console.log(`   응답 내용: ${text.substring(0, 200)}`);
        } catch (e) {
          console.log(`   응답 읽기 실패: ${e.message}`);
        }
      } else {
        console.log(`✅ API 성공: ${url} - ${status}`);
      }
    }
  });
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔴 브라우저 콘솔 오류: ${msg.text()}`);
    }
  });
  
  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto(`${LOCAL_URL}/api/auth/signin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 로그인 폼 찾기 (전화번호 로그인)
    const phoneInput = await page.locator('input[type="tel"], input[name="phone"], input[type="text"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인")').first();
    
    if (await phoneInput.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 로그인 폼 발견');
      await phoneInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      await loginButton.click();
      await page.waitForTimeout(3000);
      
      // 로그인 성공 확인
      try {
        await page.waitForURL('**/admin/**', { timeout: 5000 });
        console.log('   ✅ 로그인 완료');
      } catch (error) {
        console.log('   ⚠️ 로그인 후 리다이렉트 확인 실패, 계속 진행...');
      }
    } else {
      console.log('   ⚠️ 로그인 폼을 찾을 수 없습니다. 이미 로그인되어 있을 수 있습니다.');
    }
    
    // 2. 카카오톡 콘텐츠 페이지로 이동
    console.log('\n2️⃣ 카카오톡 콘텐츠 페이지로 이동...');
    await page.goto(`${LOCAL_URL}/admin/kakao-content`);
    await page.waitForTimeout(3000);
    
    // 페이지 로드 확인
    const pageTitle = await page.locator('h1, h2, .page-title').first().textContent().catch(() => '');
    console.log(`   페이지 제목: ${pageTitle}`);
    
    // 3. generate-base-prompt API 직접 테스트
    console.log('\n3️⃣ generate-base-prompt API 직접 테스트...');
    const apiTestResult = await page.evaluate(async (baseUrl) => {
      const testCases = [
        { date: '2025-11-20', accountType: 'account1', type: 'background' },
        { date: '2025-11-20', accountType: 'account1', type: 'profile' },
        { date: '2025-11-20', accountType: 'account2', type: 'background' },
      ];
      
      const results = [];
      for (const testCase of testCases) {
        try {
          const response = await fetch(`${baseUrl}/api/kakao-content/generate-base-prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testCase)
          });
          
          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = { error: 'JSON 파싱 실패', rawText: text.substring(0, 200) };
          }
          
          results.push({
            testCase,
            status: response.status,
            ok: response.ok,
            data
          });
        } catch (error) {
          results.push({
            testCase,
            error: error.message
          });
        }
      }
      
      return results;
    }, LOCAL_URL);
    
    console.log('\n📊 API 테스트 결과:');
    apiTestResult.forEach((result, index) => {
      console.log(`\n   테스트 ${index + 1}:`, result.testCase);
      if (result.error) {
        console.log(`   ❌ 오류: ${result.error}`);
      } else if (result.ok) {
        console.log(`   ✅ 성공 (${result.status})`);
        console.log(`   basePrompt: ${result.data?.basePrompt?.substring(0, 50)}...`);
      } else {
        console.log(`   ❌ 실패 (${result.status})`);
        console.log(`   응답: ${JSON.stringify(result.data, null, 2).substring(0, 200)}`);
      }
    });
    
    // 4. "목록" 보기 모드로 전환
    console.log('\n4️⃣ "목록" 보기 모드로 전환...');
    await page.waitForTimeout(2000);
    
    const listViewButton = await page.locator('button:has-text("목록")').first();
    if (await listViewButton.isVisible({ timeout: 5000 })) {
      await listViewButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ "목록" 보기 모드로 전환 완료');
    } else {
      console.log('   ⚠️ "목록" 버튼을 찾을 수 없습니다.');
    }
    
    // 5. 전체 타입 필터 테스트
    console.log('\n5️⃣ 전체 타입 필터 테스트...');
    await page.waitForTimeout(2000);
    
    try {
      // 전체 타입 드롭다운 찾기
      const typeFilterSelect = await page.locator('select[id="filter-type"], select[aria-label*="타입"]').first();
      if (await typeFilterSelect.isVisible({ timeout: 5000 })) {
        console.log('   ✅ 전체 타입 필터 발견');
        
        // 각 옵션 테스트
        const typeOptions = ['all', 'profile', 'feed'];
        for (const option of typeOptions) {
          console.log(`   테스트: ${option === 'all' ? '전체 타입' : option === 'profile' ? '프로필 메시지' : '피드 캡션'}`);
          await typeFilterSelect.selectOption(option);
          await page.waitForTimeout(2000);
          
          // 테이블 행 확인
          const tableRows = await page.locator('table tbody tr').count();
          console.log(`     테이블 행 수: ${tableRows}`);
          
          // 프로필/피드 컬럼 확인
          const profileCells = await page.locator('td:has-text("스윙"), td:has-text("리듬")').count();
          const feedCells = await page.locator('td:has-text("비거리"), td:has-text("드라이버")').count();
          console.log(`     프로필 메시지 셀: ${profileCells}, 피드 캡션 셀: ${feedCells}`);
        }
        
        // 다시 전체 타입으로 복원
        await typeFilterSelect.selectOption('all');
        await page.waitForTimeout(1000);
      } else {
        console.log('   ⚠️ 전체 타입 필터를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.log(`   ❌ 전체 타입 필터 테스트 오류: ${error.message}`);
    }
    
    // 6. 전체 상태 필터 테스트
    console.log('\n6️⃣ 전체 상태 필터 테스트...');
    await page.waitForTimeout(2000);
    
    try {
      // 전체 상태 드롭다운 찾기
      const statusFilterSelect = await page.locator('select[id="filter-status"], select[aria-label*="상태"]').first();
      if (await statusFilterSelect.isVisible({ timeout: 5000 })) {
        console.log('   ✅ 전체 상태 필터 발견');
        
        // 각 옵션 테스트
        const statusOptions = ['all', 'created', 'published', 'planned'];
        for (const option of statusOptions) {
          const optionText = option === 'all' ? '전체 상태' : 
                           option === 'created' ? '생성됨' : 
                           option === 'published' ? '배포됨' : '계획됨';
          console.log(`   테스트: ${optionText}`);
          await statusFilterSelect.selectOption(option);
          await page.waitForTimeout(2000);
          
          // 테이블 행 확인
          const tableRows = await page.locator('table tbody tr').count();
          console.log(`     테이블 행 수: ${tableRows}`);
          
          // 상태 배지 확인
          const statusBadges = await page.locator('span:has-text("생성됨"), span:has-text("배포됨"), span:has-text("계획됨"), span:has-text("미작성")').count();
          console.log(`     상태 배지 수: ${statusBadges}`);
        }
        
        // 다시 전체 상태로 복원
        await statusFilterSelect.selectOption('all');
        await page.waitForTimeout(1000);
      } else {
        console.log('   ⚠️ 전체 상태 필터를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.log(`   ❌ 전체 상태 필터 테스트 오류: ${error.message}`);
    }
    
    // 7. 콘솔 에러 확인
    console.log('\n7️⃣ 브라우저 콘솔 에러 확인...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`   🔴 콘솔 오류: ${msg.text()}`);
      }
    });
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length === 0) {
      console.log('   ✅ 콘솔 에러 없음');
    } else {
      console.log(`   ⚠️ 총 ${consoleErrors.length}개의 콘솔 에러 발견`);
    }
    
    // 8. 스크린샷 촬영
    console.log('\n8️⃣ 스크린샷 촬영...');
    await page.screenshot({
      path: 'playwright-local-test-result.png',
      fullPage: true
    });
    console.log('   ✅ 스크린샷 저장: playwright-local-test-result.png');
    
    // 9. 서버 로그 확인 안내
    console.log('\n📋 서버 로그 확인:');
    console.log('   로컬 서버 콘솔에서 API 호출 로그를 확인하세요.');
    
    console.log('\n✅ 테스트 완료');
    
    // 브라우저를 열어둠 (수동 확인 가능)
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({
      path: 'playwright-local-test-error.png',
      fullPage: true
    });
  } finally {
    // 브라우저는 수동으로 닫도록 주석 처리
    // await browser.close();
    console.log('\n💡 브라우저를 수동으로 닫아주세요.');
  }
}

// 실행
testKakaoContentGeneration().catch(console.error);

