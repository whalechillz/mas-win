const { chromium } = require('playwright');

(async () => {
  console.log('Testing admin page and scheduling feature...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 관리자 페이지 테스트
    console.log('Testing admin page...');
    await page.goto('https://www.masgolf.co.kr/admin/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 게시물 목록 확인
    const postElements = await page.$$('.border.border-gray-200');
    console.log(`Found ${postElements.length} blog posts in admin`);
    
    if (postElements.length > 0) {
      console.log('✅ Admin page shows blog posts');
      
      // 첫 번째 게시물의 정보 확인
      const firstPost = postElements[0];
      const title = await firstPost.$eval('h3', el => el.textContent);
      console.log(`First post: ${title}`);
      
      // 수정 버튼 클릭 테스트
      const editButton = await firstPost.$('button:has-text("수정")');
      if (editButton) {
        console.log('✅ Edit button found');
        await editButton.click();
        await page.waitForTimeout(2000);
        
        // 폼이 나타났는지 확인
        const form = await page.$('form');
        if (form) {
          console.log('✅ Edit form opened');
          
          // 발행 예약 체크박스 확인
          const scheduleCheckbox = await page.$('#is_scheduled');
          if (scheduleCheckbox) {
            console.log('✅ Scheduling checkbox found');
            
            // 예약 발행 테스트
            await scheduleCheckbox.click();
            await page.waitForTimeout(1000);
            
            // 예약 시간 입력 필드 확인
            const scheduleTimeInput = await page.$('input[type="datetime-local"]');
            if (scheduleTimeInput) {
              console.log('✅ Schedule time input found');
              
              // 내일 날짜로 설정
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const tomorrowString = tomorrow.toISOString().slice(0, 16);
              
              await scheduleTimeInput.fill(tomorrowString);
              console.log(`✅ Schedule time set to: ${tomorrowString}`);
            }
          }
          
          // 취소 버튼으로 폼 닫기
          const cancelButton = await page.$('button:has-text("취소")');
          if (cancelButton) {
            await cancelButton.click();
            console.log('✅ Form closed');
          }
        }
      }
    } else {
      console.log('❌ No blog posts found in admin');
    }
    
    // 새 게시물 작성 테스트
    console.log('Testing new post creation...');
    const newPostButton = await page.$('button:has-text("새 게시물 작성")');
    if (newPostButton) {
      await newPostButton.click();
      await page.waitForTimeout(2000);
      
      const form = await page.$('form');
      if (form) {
        console.log('✅ New post form opened');
        
        // 제목 입력
        const titleInput = await page.$('input[placeholder*="제목"]');
        if (titleInput) {
          await titleInput.fill('테스트 예약 게시물');
          console.log('✅ Title entered');
        }
        
        // 발행 예약 체크박스 확인
        const scheduleCheckbox = await page.$('#is_scheduled');
        if (scheduleCheckbox) {
          await scheduleCheckbox.click();
          await page.waitForTimeout(1000);
          console.log('✅ Scheduling enabled for new post');
        }
        
        // 취소 버튼으로 폼 닫기
        const cancelButton = await page.$('button:has-text("취소")');
        if (cancelButton) {
          await cancelButton.click();
          console.log('✅ New post form closed');
        }
      }
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'admin-scheduling-test.png', fullPage: true });
    console.log('📸 Test screenshot saved');
    
    console.log('\n🎉 Admin page and scheduling feature test completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'admin-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
