const { chromium } = require('playwright');

(async () => {
  console.log('🔍 블로그 페이지네이션 테스트...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('📱 블로그 페이지 접속...');
    await page.goto('https://www.masgolf.co.kr/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 스크린샷
    await page.screenshot({ path: 'blog-pagination-test.png', fullPage: true });
    console.log('📸 스크린샷 저장됨');
    
    // 페이지네이션 확인
    const paginationInfo = await page.evaluate(() => {
      const paginationNav = document.querySelector('nav');
      const buttons = Array.from(document.querySelectorAll('nav button'));
      const pageNumbers = buttons.filter(btn => !isNaN(parseInt(btn.textContent)));
      
      return {
        hasPagination: paginationNav !== null,
        totalButtons: buttons.length,
        pageNumbers: pageNumbers.map(btn => parseInt(btn.textContent)),
        currentPage: pageNumbers.find(btn => btn.classList.contains('bg-gradient-to-r'))?.textContent || '1'
      };
    });
    
    console.log('페이지네이션 정보:', paginationInfo);
    
    if (paginationInfo.hasPagination && paginationInfo.pageNumbers.length > 1) {
      console.log('✅ 페이지네이션이 표시됨');
      
      // 2페이지 클릭 테스트
      const page2Button = await page.$('nav button:text("2")');
      if (page2Button) {
        console.log('✅ 2페이지 버튼 클릭...');
        await page2Button.click();
        await page.waitForTimeout(3000);
        
        // 페이지 변경 확인
        const afterClick = await page.evaluate(() => {
          const currentPageBtn = document.querySelector('nav button.bg-gradient-to-r');
          return currentPageBtn ? currentPageBtn.textContent : '1';
        });
        
        console.log('클릭 후 현재 페이지:', afterClick);
        
        // 스크린샷
        await page.screenshot({ path: 'blog-page2-test.png', fullPage: true });
        console.log('📸 2페이지 스크린샷 저장됨');
        
        // 1페이지로 돌아가기
        const page1Button = await page.$('nav button:text("1")');
        if (page1Button) {
          console.log('✅ 1페이지로 돌아가기...');
          await page1Button.click();
          await page.waitForTimeout(3000);
          
          const backToPage1 = await page.evaluate(() => {
            const currentPageBtn = document.querySelector('nav button.bg-gradient-to-r');
            return currentPageBtn ? currentPageBtn.textContent : '1';
          });
          
          console.log('1페이지로 돌아간 후:', backToPage1);
        }
      }
    } else {
      console.log('⚠️ 페이지네이션이 표시되지 않거나 페이지가 1개뿐입니다');
    }
    
    // 게시물 수 확인
    const postCount = await page.evaluate(() => {
      const posts = document.querySelectorAll('article');
      return posts.length;
    });
    
    console.log('현재 페이지 게시물 수:', postCount);
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
    await page.screenshot({ path: 'blog-pagination-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
