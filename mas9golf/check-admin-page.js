const { chromium } = require('playwright');

(async () => {
  console.log('Checking admin page structure...');
  
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
    
    // 스크린샷 저장
    await page.screenshot({ path: 'admin-page-current.png', fullPage: true });
    console.log('📸 Admin page screenshot saved');
    
    // 새 게시물 작성 버튼 클릭
    console.log('Clicking new post button...');
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(2000);
    
    // 폼 상태 스크린샷
    await page.screenshot({ path: 'admin-form-state.png', fullPage: true });
    console.log('📸 Form state screenshot saved');
    
    // 모든 input 요소 찾기
    const inputs = await page.$$('input');
    console.log(`Found ${inputs.length} input elements`);
    
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await inputs[i].getAttribute('placeholder');
      const type = await inputs[i].getAttribute('type');
      const name = await inputs[i].getAttribute('name');
      console.log(`Input ${i}: placeholder="${placeholder}", type="${type}", name="${name}"`);
    }
    
    // 모든 textarea 요소 찾기
    const textareas = await page.$$('textarea');
    console.log(`Found ${textareas.length} textarea elements`);
    
    for (let i = 0; i < textareas.length; i++) {
      const placeholder = await textareas[i].getAttribute('placeholder');
      const name = await textareas[i].getAttribute('name');
      console.log(`Textarea ${i}: placeholder="${placeholder}", name="${name}"`);
    }
    
    // 모든 버튼 찾기
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} button elements`);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}: "${text}"`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'admin-page-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
