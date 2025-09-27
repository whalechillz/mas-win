const { chromium } = require('playwright');

async function testCardCheckboxFix() {
  let browser;
  try {
    console.log('🚀 카드 체크박스 수정 테스트 시작...');
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
      await page.fill('input[type="password"]', '1234');
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
    
    // 3. 카드 뷰에서 체크박스 테스트
    console.log('🔘 3. 카드 뷰 체크박스 테스트...');
    
    const cardCheckboxes = page.locator('.grid .absolute input[type="checkbox"]');
    const checkboxCount = await cardCheckboxes.count();
    console.log(`📊 카드 뷰에서 발견된 체크박스: ${checkboxCount}개`);
    
    if (checkboxCount > 0) {
      const firstCheckbox = cardCheckboxes.first();
      
      // 체크박스 클릭 전 상태 확인
      const isCheckedBefore = await firstCheckbox.isChecked();
      console.log(`🔘 첫 번째 체크박스 클릭 전 상태: ${isCheckedBefore ? '체크됨' : '체크 안됨'}`);
      
      // 체크박스 클릭
      await firstCheckbox.click();
      await page.waitForTimeout(1000);
      
      // 체크박스 클릭 후 상태 확인
      const isCheckedAfter = await firstCheckbox.isChecked();
      console.log(`🔘 첫 번째 체크박스 클릭 후 상태: ${isCheckedAfter ? '체크됨' : '체크 안됨'}`);
      
      if (isCheckedBefore !== isCheckedAfter) {
        console.log('✅ 카드 뷰 체크박스가 정상적으로 작동합니다!');
      } else {
        console.log('❌ 카드 뷰 체크박스가 작동하지 않습니다.');
      }
      
      // "선택된 삭제" 버튼이 나타나는지 확인
      const selectedDeleteButton = page.locator('button:has-text("선택 삭제")');
      if (await selectedDeleteButton.isVisible()) {
        console.log('✅ "선택 삭제" 버튼이 정상적으로 표시됩니다!');
      } else {
        console.log('❌ "선택 삭제" 버튼이 표시되지 않습니다.');
      }
    }
    
    // 4. 새 게시물 작성 버튼 크기 확인
    console.log('📏 4. 새 게시물 작성 버튼 크기 확인...');
    const newPostButton = page.locator('button:has-text("새 게시물 작성")').first();
    if (await newPostButton.isVisible()) {
      const buttonBox = await newPostButton.boundingBox();
      console.log(`📊 새 게시물 작성 버튼 크기: ${buttonBox.width} x ${buttonBox.height}`);
      
      if (buttonBox.width < 200 && buttonBox.height < 50) {
        console.log('✅ 새 게시물 작성 버튼 크기가 적절합니다!');
      } else {
        console.log('⚠️ 새 게시물 작성 버튼이 여전히 큽니다.');
      }
    }
    
    // 5. 스크린샷 촬영
    console.log('📸 5. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'card-checkbox-fix-test-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: card-checkbox-fix-test-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'card-checkbox-fix-test-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: card-checkbox-fix-test-error.png');
    }
  } finally {
    console.log('🔚 6. 브라우저 종료...');
    await browser.close();
    console.log('✅ 카드 체크박스 수정 테스트 완료');
  }
}

// 테스트 실행
testCardCheckboxFix().catch(console.error);
