const { chromium } = require('playwright');

async function testChromeConnection() {
  try {
    console.log('🔍 Chrome Canary 연결 테스트...');
    
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const contexts = browser.contexts();
    console.log(`📊 브라우저 컨텍스트 수: ${contexts.length}`);
    
    if (contexts.length > 0) {
      const context = contexts[0];
      const pages = context.pages();
      console.log(`📄 활성 페이지 수: ${pages.length}`);
      
      if (pages.length > 0) {
        const page = pages[0];
        console.log(`📍 현재 URL: ${page.url()}`);
        console.log(`📝 페이지 제목: ${await page.title()}`);
        console.log('✅ Chrome Canary 연결 성공!');
      } else {
        console.log('❌ 활성 페이지가 없습니다.');
      }
    } else {
      console.log('❌ 브라우저 컨텍스트가 없습니다.');
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Chrome Canary 연결 실패:', error.message);
  }
}

testChromeConnection();
