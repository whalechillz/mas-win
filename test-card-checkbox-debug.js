const { chromium } = require('playwright');

async function testCardCheckboxDebug() {
  let browser;
  try {
    console.log('🚀 카드 체크박스 디버그 테스트 시작...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 1. 관리자 페이지 접속
    console.log('📝 1. 관리자 페이지 접속...');
    await page.goto('http://localhost:3000/admin/blog');

    // 로그인 처리 (필요한 경우)
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
      console.log('🔑 로그인 페이지 감지, 로그인 시도...');
      await page.fill('input[type="email"]', 'admin@example.com');
      const password = process.env.ADMIN_PASSWORD || ''; await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ 관리자 페이지 로드 완료');
    await page.waitForTimeout(3000);
    
    // 2. 카드 뷰로 전환
    console.log('🎴 2. 카드 뷰로 전환...');
    const cardButton = page.locator('button:has-text("🎴 카드")');
    if (await cardButton.isVisible()) {
      await cardButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ 카드 뷰로 전환됨');
    }
    
    // 3. 모든 체크박스 찾기
    console.log('🔍 3. 모든 체크박스 찾기...');
    
    // 다양한 셀렉터로 체크박스 찾기
    const selectors = [
      'input[type="checkbox"]',
      '.grid input[type="checkbox"]',
      'input[type="checkbox"].absolute',
      'input[type="checkbox"][class*="absolute"]',
      'input[type="checkbox"][class*="top-4"]',
      'input[type="checkbox"][class*="left-4"]'
    ];
    
    for (const selector of selectors) {
      const checkboxes = page.locator(selector);
      const count = await checkboxes.count();
      console.log(`📊 셀렉터 "${selector}": ${count}개 발견`);
      
      if (count > 0) {
        console.log(`✅ 체크박스 발견! 첫 번째 체크박스 테스트...`);
        
        const firstCheckbox = checkboxes.first();
        const isVisible = await firstCheckbox.isVisible();
        const isEnabled = await firstCheckbox.isEnabled();
        console.log(`   - 보이는가: ${isVisible}`);
        console.log(`   - 활성화됨: ${isEnabled}`);
        
        if (isVisible && isEnabled) {
          // 체크박스 클릭 전 상태
          const isCheckedBefore = await firstCheckbox.isChecked();
          console.log(`   - 클릭 전 상태: ${isCheckedBefore ? '체크됨' : '체크 안됨'}`);
          
          // 체크박스 클릭
          await firstCheckbox.click();
          await page.waitForTimeout(1000);
          
          // 체크박스 클릭 후 상태
          const isCheckedAfter = await firstCheckbox.isChecked();
          console.log(`   - 클릭 후 상태: ${isCheckedAfter ? '체크됨' : '체크 안됨'}`);
          
          if (isCheckedBefore !== isCheckedAfter) {
            console.log('✅ 체크박스가 정상적으로 작동합니다!');
          } else {
            console.log('❌ 체크박스가 작동하지 않습니다.');
          }
        }
        break;
      }
    }
    
    // 4. 카드 요소들 확인
    console.log('🎴 4. 카드 요소들 확인...');
    const cards = page.locator('.grid > div');
    const cardCount = await cards.count();
    console.log(`📊 카드 개수: ${cardCount}개`);
    
    if (cardCount > 0) {
      const firstCard = cards.first();
      const cardHTML = await firstCard.innerHTML();
      console.log('📄 첫 번째 카드 HTML (일부):');
      console.log(cardHTML.substring(0, 500) + '...');
    }
    
    // 5. 스크린샷 촬영
    console.log('📸 5. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'card-checkbox-debug-test-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: card-checkbox-debug-test-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'card-checkbox-debug-test-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: card-checkbox-debug-test-error.png');
    }
  } finally {
    console.log('🔚 6. 브라우저 종료...');
    await browser.close();
    console.log('✅ 카드 체크박스 디버그 테스트 완료');
  }
}

// 테스트 실행
testCardCheckboxDebug().catch(console.error);
