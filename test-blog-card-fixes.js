const { chromium } = require('playwright');

async function testBlogCardFixes() {
  let browser;
  try {
    console.log('🚀 블로그 카드 수정사항 테스트 시작...');
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
    
    // 2. 발행 상태 표시 확인
    console.log('📊 2. 발행 상태 표시 확인...');
    
    // 카드 뷰에서 발행 상태 라벨 찾기
    const publishedLabels = page.locator('text=📢 발행됨');
    const draftLabels = page.locator('text=📝 초안');
    
    const publishedCount = await publishedLabels.count();
    const draftCount = await draftLabels.count();
    
    console.log(`✅ 발행된 글: ${publishedCount}개`);
    console.log(`✅ 초안 글: ${draftCount}개`);
    
    if (publishedCount > 0 || draftCount > 0) {
      console.log('✅ 발행 상태 표시가 정상적으로 작동합니다!');
    } else {
      console.log('⚠️ 발행 상태 라벨을 찾을 수 없습니다.');
    }
    
    // 3. 개별 체크박스 선택 테스트
    console.log('🔘 3. 개별 체크박스 선택 테스트...');
    
    // 첫 번째 카드의 체크박스 찾기
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
        console.log('❌ 개별 체크박스 선택이 작동하지 않습니다.');
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
      
    } else {
      console.log('❌ 체크박스를 찾을 수 없습니다.');
    }
    
    // 4. 모두 선택 기능 테스트
    console.log('☑️ 4. 모두 선택 기능 테스트...');
    
    const selectAllCheckbox = page.locator('input[type="checkbox"]').first(); // 모두 선택 체크박스
    if (await selectAllCheckbox.isVisible()) {
      console.log('🖱️ 모두 선택 체크박스 클릭...');
      await selectAllCheckbox.click();
      await page.waitForTimeout(2000);
      
      // 선택된 개수 확인
      const selectedCount = await page.locator('input[type="checkbox"]:checked').count();
      console.log(`📊 선택된 체크박스 개수: ${selectedCount}개`);
      
      if (selectedCount > 1) {
        console.log('✅ 모두 선택 기능이 정상적으로 작동합니다!');
      } else {
        console.log('⚠️ 모두 선택 기능에 문제가 있을 수 있습니다.');
      }
    }
    
    // 5. 스크린샷 촬영
    console.log('📸 5. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'blog-card-fixes-test-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: blog-card-fixes-test-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'blog-card-fixes-test-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: blog-card-fixes-test-error.png');
    }
  } finally {
    console.log('🔚 6. 브라우저 종료...');
    await browser.close();
    console.log('✅ 블로그 카드 수정사항 테스트 완료');
  }
}

// 테스트 실행
testBlogCardFixes().catch(console.error);
