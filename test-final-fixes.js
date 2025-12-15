const { chromium } = require('playwright');

async function testFinalFixes() {
  let browser;
  try {
    console.log('🚀 최종 수정사항 테스트 시작...');
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
    
    // 2. 목록 뷰에서 발행 상태 라벨 확인
    console.log('📋 2. 목록 뷰에서 발행 상태 라벨 확인...');
    
    // 목록 뷰로 전환
    const listViewButton = page.locator('button:has-text("📋 목록")');
    if (await listViewButton.isVisible()) {
      console.log('🔄 목록 뷰로 전환...');
      await listViewButton.click();
      await page.waitForTimeout(2000);
      
      // 발행 상태 라벨 확인
      const publishedLabels = page.locator('span:has-text("📢 발행됨")');
      const draftLabels = page.locator('span:has-text("📝 초안")');
      
      const publishedCount = await publishedLabels.count();
      const draftCount = await draftLabels.count();
      
      console.log(`✅ 목록 뷰 - 발행된 글: ${publishedCount}개`);
      console.log(`✅ 목록 뷰 - 초안 글: ${draftCount}개`);
      
      if (publishedCount > 0 || draftCount > 0) {
        console.log('✅ 목록 뷰 발행 상태 라벨이 정상적으로 표시됩니다!');
      } else {
        console.log('⚠️ 목록 뷰에서 발행 상태 라벨을 찾을 수 없습니다.');
      }
    }
    
    // 3. 카드 뷰로 전환하여 개별 체크박스 테스트
    console.log('🔄 3. 카드 뷰로 전환하여 개별 체크박스 테스트...');
    
    const cardViewButton = page.locator('button:has-text("📋 카드")');
    if (await cardViewButton.isVisible()) {
      await cardViewButton.click();
      await page.waitForTimeout(2000);
      
      // 첫 번째 카드의 체크박스 테스트
      const firstCheckbox = page.locator('input[type="checkbox"]').first();
      
      if (await firstCheckbox.isVisible()) {
        console.log('✅ 첫 번째 체크박스 발견');
        
        // 체크박스 클릭 전 상태 확인
        const initialChecked = await firstCheckbox.isChecked();
        console.log(`📋 체크박스 초기 상태: ${initialChecked ? '체크됨' : '체크 안됨'}`);
        
        // 체크박스 클릭
        console.log('🖱️ 체크박스 클릭...');
        await firstCheckbox.click();
        await page.waitForTimeout(1000);
        
        // 클릭 후 상태 확인
        const afterClickChecked = await firstCheckbox.isChecked();
        console.log(`📋 체크박스 클릭 후 상태: ${afterClickChecked ? '체크됨' : '체크 안됨'}`);
        
        if (initialChecked !== afterClickChecked) {
          console.log('✅ 개별 체크박스 선택이 정상적으로 작동합니다!');
        } else {
          console.log('❌ 개별 체크박스 선택이 여전히 작동하지 않습니다.');
        }
        
        // 두 번째 체크박스도 테스트
        const secondCheckbox = page.locator('input[type="checkbox"]').nth(1);
        if (await secondCheckbox.isVisible()) {
          console.log('🖱️ 두 번째 체크박스 클릭...');
          await secondCheckbox.click();
          await page.waitForTimeout(1000);
          
          const secondChecked = await secondCheckbox.isChecked();
          console.log(`📋 두 번째 체크박스 상태: ${secondChecked ? '체크됨' : '체크 안됨'}`);
        }
        
        // 카드 뷰에서 발행 상태 라벨도 확인
        const cardPublishedLabels = page.locator('span:has-text("📢 발행됨")');
        const cardDraftLabels = page.locator('span:has-text("📝 초안")');
        
        const cardPublishedCount = await cardPublishedLabels.count();
        const cardDraftCount = await cardDraftLabels.count();
        
        console.log(`✅ 카드 뷰 - 발행된 글: ${cardPublishedCount}개`);
        console.log(`✅ 카드 뷰 - 초안 글: ${cardDraftCount}개`);
        
        if (cardPublishedCount > 0 || cardDraftCount > 0) {
          console.log('✅ 카드 뷰 발행 상태 라벨이 정상적으로 표시됩니다!');
        }
        
      } else {
        console.log('❌ 체크박스를 찾을 수 없습니다.');
      }
    }
    
    // 4. 스크린샷 촬영
    console.log('📸 4. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'final-fixes-test-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: final-fixes-test-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'final-fixes-test-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: final-fixes-test-error.png');
    }
  } finally {
    console.log('🔚 5. 브라우저 종료...');
    await browser.close();
    console.log('✅ 최종 수정사항 테스트 완료');
  }
}

// 테스트 실행
testFinalFixes().catch(console.error);
