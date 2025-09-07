const { chromium } = require('playwright');

async function testChromeWithNewPage() {
  try {
    console.log('🔍 Chrome Canary 연결 및 새 페이지 테스트...');
    
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    
    // 새 페이지 생성
    const page = await context.newPage();
    console.log('✅ 새 페이지 생성 완료');
    
    // 테스트 페이지로 이동
    await page.goto('https://www.mas9golf.com/blog', { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`📍 현재 URL: ${page.url()}`);
    console.log(`📝 페이지 제목: ${await page.title()}`);
    
    // 간단한 블로그 포스트 링크 수집 테스트
    const postLinks = await page.evaluate(() => {
      const links = [];
      const elements = document.querySelectorAll('a[href*="/post/"]');
      elements.forEach(el => {
        if (el.href && !links.includes(el.href)) {
          links.push(el.href);
        }
      });
      return links.slice(0, 5); // 처음 5개만
    });
    
    console.log(`📊 발견된 블로그 포스트 링크: ${postLinks.length}개`);
    postLinks.forEach((link, index) => {
      console.log(`   ${index + 1}. ${link}`);
    });
    
    console.log('✅ Chrome Canary 연결 및 테스트 성공!');
    
    // 페이지는 닫지 않고 유지 (다른 스크립트에서 사용할 수 있도록)
    // await page.close();
    
  } catch (error) {
    console.error('❌ Chrome Canary 테스트 실패:', error.message);
  }
}

testChromeWithNewPage();
