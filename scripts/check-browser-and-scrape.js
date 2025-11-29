const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222').catch(async () => {
    console.log('⚠️  기존 브라우저에 연결할 수 없습니다. 새 브라우저를 시작합니다.');
    const newBrowser = await chromium.launch({ headless: false, slowMo: 300 });
    return newBrowser;
  });
  
  const contexts = browser.contexts();
  const context = contexts.length > 0 ? contexts[0] : await browser.newContext();
  const pages = context.pages();
  const page = pages.length > 0 ? pages[0] : await context.newPage();
  
  const currentUrl = page.url();
  console.log(`📍 현재 URL: ${currentUrl}`);
  
  const bodyText = await page.textContent('body').catch(() => '');
  const hasTemplates = /[A-Z]{1,2}_\d+/.test(bodyText);
  const isTemplatePage = bodyText.includes('템플릿관리') || bodyText.includes('템플릿코드');
  
  if (hasTemplates && isTemplatePage) {
    console.log('✅ 템플릿 페이지입니다. 스크래핑을 시작합니다.');
    // 스크래핑 로직 실행
    require('./scrape-aligo-templates.js');
  } else {
    console.log('⚠️  템플릿 페이지가 아닙니다.');
    console.log('💡 브라우저에서 다음 경로로 이동해주세요:');
    console.log('   카카오톡 → 템플릿관리 → 카카오채널 ID 선택 (마쓰구골프)');
    console.log('\n이동 후 Enter를 눌러주세요...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    console.log('✅ 스크래핑을 시작합니다.');
    require('./scrape-aligo-templates.js');
  }
})();
