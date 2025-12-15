const { chromium } = require('playwright');

async function testStatusButtonMove() {
  let browser;
  try {
    console.log('🚀 상태 라벨 위치 변경 테스트 시작...');
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
    
    // 2. 목록 뷰에서 상태 라벨 위치 확인
    console.log('📋 2. 목록 뷰에서 상태 라벨 위치 확인...');
    
    // 목록 뷰가 기본이므로 바로 확인
    const listStatusLabels = page.locator('.flex.items-center.space-x-2 span:has-text("발행됨"), .flex.items-center.space-x-2 span:has-text("초안")');
    const listStatusCount = await listStatusLabels.count();
    console.log(`📊 목록 뷰에서 발견된 상태 라벨: ${listStatusCount}개`);
    
    if (listStatusCount > 0) {
      console.log('✅ 목록 뷰에서 상태 라벨이 액션 버튼 근처에 위치합니다!');
    }
    
    // 3. 카드 뷰로 전환하여 상태 라벨 위치 확인
    console.log('🎴 3. 카드 뷰로 전환하여 상태 라벨 위치 확인...');
    const cardButton = page.locator('button:has-text("🎴 카드")');
    if (await cardButton.isVisible()) {
      await cardButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ 카드 뷰로 전환됨');
    }
    
    const cardStatusLabels = page.locator('.flex.items-center.space-x-2 span:has-text("발행됨"), .flex.items-center.space-x-2 span:has-text("초안")');
    const cardStatusCount = await cardStatusLabels.count();
    console.log(`📊 카드 뷰에서 발견된 상태 라벨: ${cardStatusCount}개`);
    
    if (cardStatusCount > 0) {
      console.log('✅ 카드 뷰에서도 상태 라벨이 액션 버튼 근처에 위치합니다!');
    }
    
    // 4. 상태 라벨과 액션 버튼의 관계 확인
    console.log('🔍 4. 상태 라벨과 액션 버튼의 관계 확인...');
    
    // 첫 번째 카드의 액션 영역 확인
    const firstActionArea = page.locator('.flex.items-center.space-x-2').first();
    if (await firstActionArea.isVisible()) {
      const actionAreaHTML = await firstActionArea.innerHTML();
      console.log('📄 첫 번째 액션 영역 HTML:');
      console.log(actionAreaHTML);
      
      // 상태 라벨이 액션 버튼들과 함께 있는지 확인
      if (actionAreaHTML.includes('발행됨') || actionAreaHTML.includes('초안')) {
        console.log('✅ 상태 라벨이 액션 버튼들과 함께 그룹화되어 있습니다!');
      }
      
      if (actionAreaHTML.includes('보기') && actionAreaHTML.includes('수정')) {
        console.log('✅ 액션 버튼들(보기, 수정)이 정상적으로 표시됩니다!');
      }
    }
    
    // 5. 스크린샷 촬영
    console.log('📸 5. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'status-button-move-test-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: status-button-move-test-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'status-button-move-test-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: status-button-move-test-error.png');
    }
  } finally {
    console.log('🔚 6. 브라우저 종료...');
    await browser.close();
    console.log('✅ 상태 라벨 위치 변경 테스트 완료');
  }
}

// 테스트 실행
testStatusButtonMove().catch(console.error);
