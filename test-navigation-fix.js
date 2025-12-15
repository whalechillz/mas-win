const { chromium } = require('playwright');

async function testNavigationFix() {
  let browser;
  try {
    console.log('🚀 네비게이션 수정 테스트 시작...');
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
    
    // 2. 우상단 "빠른 작성" 버튼 클릭
    console.log('⚡ 2. 우상단 "빠른 작성" 버튼 클릭...');
    const quickCreateButton = page.locator('button:has-text("⚡ 빠른 작성")');
    if (await quickCreateButton.isVisible()) {
      await quickCreateButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ 우상단 "빠른 작성" 버튼 클릭됨');
      
      // 새 게시물 작성 폼이 표시되는지 확인
      const createForm = page.locator('h2:has-text("새 게시물 작성")');
      if (await createForm.isVisible()) {
        console.log('✅ 새 게시물 작성 폼이 표시됨');
      } else {
        console.log('❌ 새 게시물 작성 폼이 표시되지 않음');
      }
    }
    
    // 3. "블로그 목록" 탭 클릭
    console.log('📋 3. "블로그 목록" 탭 클릭...');
    const listTab = page.locator('button:has-text("📋 블로그 목록")');
    if (await listTab.isVisible()) {
      await listTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ "블로그 목록" 탭 클릭됨');
      
      // 새 게시물 작성 폼이 사라지는지 확인
      const createForm = page.locator('h2:has-text("새 게시물 작성")');
      const isFormVisible = await createForm.isVisible();
      if (!isFormVisible) {
        console.log('✅ 새 게시물 작성 폼이 사라짐 (정상)');
      } else {
        console.log('❌ 새 게시물 작성 폼이 여전히 표시됨 (문제)');
      }
      
      // 블로그 목록이 표시되는지 확인
      const blogList = page.locator('.space-y-4, .grid');
      if (await blogList.isVisible()) {
        console.log('✅ 블로그 목록이 표시됨');
      } else {
        console.log('❌ 블로그 목록이 표시되지 않음');
      }
    }
    
    // 4. 탭의 "새 게시물 작성" 버튼 클릭
    console.log('✍️ 4. 탭의 "새 게시물 작성" 버튼 클릭...');
    const tabCreateButton = page.locator('button:has-text("✍️ 새 게시물 작성")');
    if (await tabCreateButton.isVisible()) {
      await tabCreateButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ 탭의 "새 게시물 작성" 버튼 클릭됨');
      
      // 새 게시물 작성 폼이 표시되는지 확인
      const createForm = page.locator('h2:has-text("새 게시물 작성")');
      if (await createForm.isVisible()) {
        console.log('✅ 새 게시물 작성 폼이 표시됨');
      } else {
        console.log('❌ 새 게시물 작성 폼이 표시되지 않음');
      }
    }
    
    // 5. 다시 "블로그 목록" 탭 클릭
    console.log('📋 5. 다시 "블로그 목록" 탭 클릭...');
    if (await listTab.isVisible()) {
      await listTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ "블로그 목록" 탭 클릭됨');
      
      // 새 게시물 작성 폼이 사라지는지 확인
      const createForm = page.locator('h2:has-text("새 게시물 작성")');
      const isFormVisible = await createForm.isVisible();
      if (!isFormVisible) {
        console.log('✅ 새 게시물 작성 폼이 사라짐 (정상)');
      } else {
        console.log('❌ 새 게시물 작성 폼이 여전히 표시됨 (문제)');
      }
    }
    
    // 6. 스크린샷 촬영
    console.log('📸 6. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'navigation-fix-test-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: navigation-fix-test-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'navigation-fix-test-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: navigation-fix-test-error.png');
    }
  } finally {
    console.log('🔚 7. 브라우저 종료...');
    await browser.close();
    console.log('✅ 네비게이션 수정 테스트 완료');
  }
}

// 테스트 실행
testNavigationFix().catch(console.error);
