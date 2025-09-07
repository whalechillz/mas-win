const { chromium } = require('playwright');

(async () => {
  console.log('Checking select options...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to admin page...');
    await page.goto('https://www.masgolf.co.kr/admin/blog');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(2000);
    
    // 모든 select 요소의 옵션들 확인
    const selects = await page.$$('select');
    console.log(`Found ${selects.length} select elements`);
    
    for (let i = 0; i < selects.length; i++) {
      console.log(`\n=== Select ${i} ===`);
      
      const options = await selects[i].$$('option');
      console.log(`Found ${options.length} options:`);
      
      for (let j = 0; j < options.length; j++) {
        const value = await options[j].getAttribute('value');
        const text = await options[j].textContent();
        console.log(`  Option ${j}: value="${value}", text="${text}"`);
      }
    }
    
    // 스크린샷도 저장
    await page.screenshot({ path: 'select-options-debug.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'select-options-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
