const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🧪 로딩 상태 테스트 시작\n');
    
    // 1단계: 로그인
    console.log('📋 1단계: 로그인');
    await page.goto('https://www.masgolf.co.kr/admin/login', { waitUntil: 'networkidle' });
    console.log('✅ 로그인 페이지 로드 완료');
    
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    console.log('✅ 로그인 완료, 대시보드로 이동\n');

    // 2단계: 대시보드에서 로딩 상태 확인 (5초간)
    console.log('📋 2단계: 대시보드에서 로딩 상태 확인 (5초 대기)');
    await page.waitForTimeout(5000);
    
    // 모든 "로딩 중..." 텍스트 찾기
    const loadingSelectors = [
      'text=로딩 중...',
      'text=로딩 중',
      'text=Loading...',
      '[class*="loading"]',
      '[class*="spinner"]'
    ];
    
    const foundLoadings = [];
    for (const selector of loadingSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const el of elements) {
          const isVisible = await el.isVisible();
          if (isVisible) {
            const text = await el.textContent();
            const location = await el.evaluate((e) => {
              const rect = e.getBoundingClientRect();
              const parent = e.closest('nav, header, div');
              return {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                text: e.textContent?.trim(),
                parentTag: parent?.tagName,
                parentClass: parent?.className?.substring(0, 50)
              };
            });
            foundLoadings.push({ selector, location, text });
          }
        }
      } catch (e) {
        // 무시
      }
    }
    
    if (foundLoadings.length > 0) {
      console.log('❌ 로딩 상태가 계속 표시됨:');
      foundLoadings.forEach((item, idx) => {
        console.log(`  ${idx + 1}. "${item.text}" 위치: (${item.location.x}, ${item.location.y}) 부모: ${item.location.parentTag} ${item.location.parentClass}`);
      });
    } else {
      console.log('✅ 로딩 상태 없음 - 정상\n');
    }

    // 3단계: 네비게이션 바 확인
    console.log('📋 3단계: 네비게이션 바 확인');
    try {
      const navElements = await page.locator('nav, header, [class*="nav"]').all();
      if (navElements.length > 0) {
        const navText = await navElements[0].textContent();
        console.log('📋 네비게이션 바 텍스트 (처음 200자):', navText?.substring(0, 200));
      }
    } catch (e) {
      console.log('⚠️  네비게이션 바를 찾을 수 없음');
    }
    
    // 프로필 드롭다운 확인
    try {
      const profileButton = await page.locator('button:has-text("관리자"), button:has-text("편집자"), button:has-text("로딩")').first();
      if (await profileButton.count() > 0) {
        const profileText = await profileButton.textContent();
        console.log('📋 프로필 버튼 텍스트:', profileText);
        
        if (profileText && profileText.includes('로딩')) {
          console.log('❌ 프로필 버튼에 "로딩" 텍스트가 표시됨');
        }
      } else {
        console.log('⚠️  프로필 버튼을 찾을 수 없음');
      }
    } catch (e) {
      console.log('⚠️  프로필 버튼 확인 실패:', e.message);
    }
    console.log('');

    // 4단계: 계정 관리 페이지 확인
    console.log('📋 4단계: 계정 관리 페이지로 이동');
    await page.goto('https://www.masgolf.co.kr/admin/team', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log('✅ 계정 관리 페이지 로드 완료\n');
    
    // 계정 관리 페이지에서 로딩 상태 확인
    console.log('📋 5단계: 계정 관리 페이지에서 로딩 상태 확인');
    const foundLoadings2 = [];
    for (const selector of loadingSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const el of elements) {
          const isVisible = await el.isVisible();
          if (isVisible) {
            const text = await el.textContent();
            const location = await el.evaluate((e) => {
              const rect = e.getBoundingClientRect();
              const parent = e.closest('nav, header, div, table');
              return {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                text: e.textContent?.trim(),
                parentTag: parent?.tagName,
                parentClass: parent?.className?.substring(0, 50)
              };
            });
            foundLoadings2.push({ selector, location, text });
          }
        }
      } catch (e) {
        // 무시
      }
    }
    
    if (foundLoadings2.length > 0) {
      console.log('❌ 계정 관리 페이지에서 로딩 상태 표시:');
      foundLoadings2.forEach((item, idx) => {
        console.log(`  ${idx + 1}. "${item.text}" 위치: (${item.location.x}, ${item.location.y}) 부모: ${item.location.parentTag}`);
      });
    } else {
      console.log('✅ 계정 관리 페이지: 로딩 상태 없음\n');
    }

    // 6단계: 콘솔 로그 확인
    console.log('📋 6단계: 브라우저 콘솔 로그 확인');
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('로딩') || text.includes('loading') || text.includes('세션') || text.includes('session')) {
        consoleMessages.push({ type: msg.type(), text });
      }
    });

    await page.waitForTimeout(2000);
    
    if (consoleMessages.length > 0) {
      console.log('📋 관련 콘솔 메시지:');
      consoleMessages.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. [${msg.type}] ${msg.text}`);
      });
    } else {
      console.log('✅ 관련 콘솔 메시지 없음');
    }
    console.log('');

    // 7단계: 스크린샷 저장
    console.log('📋 7단계: 스크린샷 저장');
    await page.screenshot({ path: 'e2e-test/loading-test-result.png', fullPage: true });
    console.log('✅ 스크린샷 저장: e2e-test/loading-test-result.png\n');

    // 8단계: 요약
    console.log('📊 테스트 결과 요약:');
    console.log(`  - 대시보드 로딩 상태: ${foundLoadings.length > 0 ? '❌ 발견됨' : '✅ 없음'}`);
    console.log(`  - 계정 관리 페이지 로딩 상태: ${foundLoadings2.length > 0 ? '❌ 발견됨' : '✅ 없음'}`);
    
    if (foundLoadings.length > 0 || foundLoadings2.length > 0) {
      console.log('\n⚠️  로딩 상태가 계속 표시되고 있습니다.');
      console.log('   원인 분석을 위해 스크린샷을 확인하세요.');
    } else {
      console.log('\n✅ 모든 페이지에서 로딩 상태가 정상적으로 해제되었습니다.');
    }

    console.log('\n✅ 로딩 상태 테스트 완료');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.error('스택 트레이스:', error.stack);
    
    await page.screenshot({ path: 'e2e-test/loading-test-error.png', fullPage: true });
    console.log('📸 에러 스크린샷 저장: e2e-test/loading-test-error.png');
    
    throw error;
  } finally {
    await browser.close();
  }
})();

