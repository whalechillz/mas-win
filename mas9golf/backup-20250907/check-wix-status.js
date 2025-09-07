const { chromium } = require('playwright');

async function checkWixStatus() {
  try {
    console.log('🔍 Chrome Canary 연결 및 Wix 상태 확인...');
    
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const pages = context.pages();
    
    console.log(`📄 활성 페이지 수: ${pages.length}`);
    
    if (pages.length > 0) {
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        try {
          const url = page.url();
          const title = await page.title();
          console.log(`📄 페이지 ${i + 1}: ${title}`);
          console.log(`🔗 URL: ${url}`);
          
          if (url.includes('wix.com')) {
            console.log('✅ Wix 페이지 발견!');
            
            // 현재 페이지가 SEO 설정 페이지인지 확인
            if (url.includes('seo-settings') || url.includes('blog-post')) {
              console.log('🎯 SEO 설정 페이지에 있습니다!');
            } else {
              console.log('📍 SEO 설정 페이지로 이동이 필요합니다.');
            }
          }
        } catch (error) {
          console.log(`❌ 페이지 ${i + 1} 접근 실패: ${error.message}`);
        }
      }
    } else {
      console.log('❌ 활성 페이지가 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ Chrome Canary 연결 실패:', error.message);
  }
}

checkWixStatus();
