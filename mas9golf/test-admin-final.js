const { chromium } = require('playwright');

(async () => {
  console.log('🔍 관리자 페이지 최종 테스트...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('📱 관리자 페이지 접속...');
    await page.goto('https://www.masgolf.co.kr/admin/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // 스크린샷
    await page.screenshot({ path: 'admin-final-test.png', fullPage: true });
    console.log('📸 스크린샷 저장됨');
    
    // 페이지 내용 확인
    const pageContent = await page.evaluate(() => {
      const body = document.body.innerText;
      const buttons = Array.from(document.querySelectorAll('button'));
      const hasNewPostButton = buttons.some(btn => btn.textContent.includes('새 게시물 작성'));
      
      return {
        hasNewPostButton: hasNewPostButton,
        hasPostsList: document.querySelector('.border.border-gray-200') !== null,
        hasLoadingMessage: body.includes('로딩 중'),
        hasErrorMessage: body.includes('게시물이 없습니다') || body.includes('오류'),
        bodyText: body.substring(0, 500)
      };
    });
    
    console.log('페이지 상태:', pageContent);
    
    // 새 게시물 작성 버튼 클릭
    if (pageContent.hasNewPostButton) {
      console.log('✅ "새 게시물 작성" 버튼 클릭...');
      await page.click('button:text("새 게시물 작성")');
      await page.waitForTimeout(3000);
      
      // 폼이 나타났는지 확인
      const formVisible = await page.evaluate(() => {
        const titleInput = document.querySelector('input[placeholder*="제목"]');
        const slugInput = document.querySelector('input[placeholder*="slug"]');
        return {
          hasTitleInput: titleInput !== null,
          hasSlugInput: slugInput !== null,
          formVisible: document.querySelector('form') !== null
        };
      });
      
      console.log('폼 상태:', formVisible);
      
      if (formVisible.hasTitleInput) {
        console.log('✅ 제목 입력 테스트...');
        await page.fill('input[placeholder*="제목"]', '테스트 게시물');
        await page.waitForTimeout(1000);
        
        // AI 슬러그 생성 버튼 확인
        const aiButton = await page.$('button:text("AI 슬러그 생성")');
        if (aiButton) {
          console.log('✅ AI 슬러그 생성 버튼 발견');
        }
        
        // 스크린샷
        await page.screenshot({ path: 'admin-form-test.png', fullPage: true });
        console.log('📸 폼 스크린샷 저장됨');
      }
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
    await page.screenshot({ path: 'admin-error-final.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
