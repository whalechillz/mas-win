const { chromium } = require('playwright');

async function testDeleteButtonSize() {
  let browser;
  try {
    console.log('🚀 삭제 버튼 크기 테스트 시작...');
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
    
    // 2. 체크박스 선택하여 "선택된 삭제" 버튼 활성화
    console.log('🔘 2. 체크박스 선택하여 삭제 버튼 활성화...');
    
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click();
      await page.waitForTimeout(1000);
      console.log('✅ 첫 번째 체크박스 선택됨');
    }
    
    // 3. 삭제 버튼들 크기 비교
    console.log('📏 3. 삭제 버튼들 크기 비교...');
    
    // "선택된 삭제" 버튼 찾기
    const selectedDeleteButton = page.locator('button:has-text("선택된")');
    if (await selectedDeleteButton.isVisible()) {
      const selectedButtonBox = await selectedDeleteButton.boundingBox();
      console.log(`📊 "선택된 삭제" 버튼 크기: ${selectedButtonBox.width} x ${selectedButtonBox.height}`);
    }
    
    // 개별 삭제 버튼들 찾기
    const individualDeleteButtons = page.locator('button:has-text("삭제")').filter({ hasNotText: '선택된' });
    const individualButtonCount = await individualDeleteButtons.count();
    
    if (individualButtonCount > 0) {
      const firstIndividualButton = individualDeleteButtons.first();
      const individualButtonBox = await firstIndividualButton.boundingBox();
      console.log(`📊 개별 "삭제" 버튼 크기: ${individualButtonBox.width} x ${individualButtonBox.height}`);
      
      // 크기 비교
      if (await selectedDeleteButton.isVisible()) {
        const selectedButtonBox = await selectedDeleteButton.boundingBox();
        const widthDiff = Math.abs(selectedButtonBox.width - individualButtonBox.width);
        const heightDiff = Math.abs(selectedButtonBox.height - individualButtonBox.height);
        
        console.log(`📏 크기 차이: 너비 ${widthDiff.toFixed(1)}px, 높이 ${heightDiff.toFixed(1)}px`);
        
        if (widthDiff < 10 && heightDiff < 5) {
          console.log('✅ 삭제 버튼들의 크기가 일치합니다!');
        } else {
          console.log('⚠️ 삭제 버튼들의 크기가 다릅니다.');
        }
      }
    }
    
    // 4. 스크린샷 촬영
    console.log('📸 4. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'delete-button-size-test-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: delete-button-size-test-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'delete-button-size-test-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: delete-button-size-test-error.png');
    }
  } finally {
    console.log('🔚 5. 브라우저 종료...');
    await browser.close();
    console.log('✅ 삭제 버튼 크기 테스트 완료');
  }
}

// 테스트 실행
testDeleteButtonSize().catch(console.error);
