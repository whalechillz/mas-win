const { chromium } = require('playwright');

async function debugWixPage() {
  console.log('🔍 Wix 페이지 구조 디버깅...');
  
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages()[0];
    
    console.log('📍 현재 URL:', page.url());
    
    // 페이지의 모든 요소 확인
    const pageInfo = await page.evaluate(() => {
      const info = {
        title: document.title,
        url: window.location.href,
        bodyText: document.body.innerText.substring(0, 1000),
        allButtons: [],
        allLinks: [],
        allDivs: []
      };
      
      // 모든 버튼 수집
      const buttons = document.querySelectorAll('button, [role="button"]');
      buttons.forEach((btn, index) => {
        if (index < 10) { // 처음 10개만
          info.allButtons.push({
            text: btn.textContent?.trim(),
            className: btn.className,
            id: btn.id,
            href: btn.href
          });
        }
      });
      
      // 모든 링크 수집
      const links = document.querySelectorAll('a[href]');
      links.forEach((link, index) => {
        if (index < 10) { // 처음 10개만
          info.allLinks.push({
            text: link.textContent?.trim(),
            href: link.href,
            className: link.className
          });
        }
      });
      
      // 사이트 관련 요소 찾기
      const siteElements = document.querySelectorAll('[class*="site"], [class*="card"], [data-testid*="site"]');
      info.siteElements = [];
      siteElements.forEach((el, index) => {
        if (index < 5) {
          info.siteElements.push({
            tagName: el.tagName,
            className: el.className,
            text: el.textContent?.trim().substring(0, 100),
            dataTestId: el.getAttribute('data-testid')
          });
        }
      });
      
      return info;
    });
    
    console.log('📄 페이지 정보:');
    console.log('제목:', pageInfo.title);
    console.log('URL:', pageInfo.url);
    console.log('본문 (처음 1000자):', pageInfo.bodyText);
    
    console.log('\n🔘 버튼들:');
    pageInfo.allButtons.forEach((btn, index) => {
      console.log(`   ${index + 1}. "${btn.text}" (class: ${btn.className})`);
    });
    
    console.log('\n🔗 링크들:');
    pageInfo.allLinks.forEach((link, index) => {
      console.log(`   ${index + 1}. "${link.text}" -> ${link.href}`);
    });
    
    console.log('\n🏢 사이트 관련 요소들:');
    pageInfo.siteElements.forEach((el, index) => {
      console.log(`   ${index + 1}. ${el.tagName} (${el.className}) - "${el.text}"`);
    });
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류:', error);
  }
}

debugWixPage().catch(console.error);
