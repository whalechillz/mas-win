const { chromium } = require('playwright');
const fs = require('fs').promises;

async function useExistingBrowser() {
  console.log('🚀 기존 Chrome Canary 브라우저 활용하여 Wix 백업 시작!');
  
  // 기존 브라우저에 연결
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  try {
    console.log('🔍 현재 페이지 확인...');
    const currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}`);
    
    // Wix 대시보드로 이동
    if (!currentUrl.includes('wix.com/dashboard')) {
      console.log('🔐 Wix 대시보드로 이동...');
      await page.goto('https://www.wix.com/dashboard', { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(3000);
    }
    
    console.log('📋 Wix 사이트 목록 수집...');
    
    // 사이트 목록 수집
    const sites = await page.evaluate(() => {
      const siteElements = document.querySelectorAll('[data-testid="site-card"], .site-card, [class*="site-card"]');
      const sites = [];
      
      siteElements.forEach((element, index) => {
        try {
          const titleElement = element.querySelector('h3, .site-title, [class*="title"]');
          const linkElement = element.querySelector('a[href*="editor.wix.com"]');
          
          if (titleElement && linkElement) {
            sites.push({
              title: titleElement.textContent.trim(),
              editorUrl: linkElement.href,
              index: index
            });
          }
        } catch (e) {
          console.log('사이트 요소 파싱 오류:', e);
        }
      });
      
      return sites;
    });
    
    console.log(`📊 발견된 사이트: ${sites.length}개`);
    sites.forEach((site, index) => {
      console.log(`   ${index + 1}. ${site.title}`);
    });
    
    // mas9golf 사이트 찾기
    let mas9golfSite = sites.find(site => 
      site.title.toLowerCase().includes('mas9golf') || 
      site.title.toLowerCase().includes('mas golf') ||
      site.editorUrl.includes('mas9golf')
    );
    
    if (!mas9golfSite) {
      console.log('❌ mas9golf 사이트를 찾을 수 없습니다. 첫 번째 사이트를 사용합니다.');
      if (sites.length > 0) {
        mas9golfSite = sites[0];
      } else {
        throw new Error('사이트를 찾을 수 없습니다.');
      }
    }
    
    console.log(`🎯 선택된 사이트: ${mas9golfSite.title}`);
    console.log(`🔗 에디터 URL: ${mas9golfSite.editorUrl}`);
    
    // 에디터로 이동
    console.log('📝 Wix 에디터로 이동...');
    await page.goto(mas9golfSite.editorUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // 사이트 정보 수집
    console.log('⚙️ 사이트 정보 수집...');
    const siteInfo = await page.evaluate(() => {
      const info = {
        title: document.title,
        url: window.location.href,
        domain: window.location.hostname,
        collectedAt: new Date().toISOString()
      };
      
      // 메타 정보 수집
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          info[`meta_${name}`] = content;
        }
      });
      
      return info;
    });
    
    console.log('📄 사이트 정보 수집 완료');
    
    // 블로그/게시판 수집
    console.log('📝 블로그/게시판 수집...');
    
    // 블로그 섹션으로 이동
    try {
      await page.goto('https://www.mas9golf.com/blog', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      const blogPosts = await page.evaluate(() => {
        const posts = [];
        const postElements = document.querySelectorAll('article, .blog-post, [class*="post"], [class*="blog"]');
        
        postElements.forEach((element, index) => {
          try {
            const titleElement = element.querySelector('h1, h2, h3, .title, [class*="title"]');
            const linkElement = element.querySelector('a[href]');
            const dateElement = element.querySelector('.date, [class*="date"], time');
            const contentElement = element.querySelector('.content, [class*="content"], p');
            
            if (titleElement) {
              posts.push({
                title: titleElement.textContent.trim(),
                url: linkElement ? linkElement.href : '',
                date: dateElement ? dateElement.textContent.trim() : '',
                content: contentElement ? contentElement.textContent.trim().substring(0, 500) : '',
                index: index
              });
            }
          } catch (e) {
            console.log('게시글 요소 파싱 오류:', e);
          }
        });
        
        return posts;
      });
      
      console.log(`📝 발견된 게시글: ${blogPosts.length}개`);
      
    } catch (e) {
      console.log('블로그 수집 오류:', e.message);
    }
    
    // 데이터 저장
    console.log('💾 데이터 저장 중...');
    
    // 디렉토리 생성
    await fs.mkdir('mas9golf/admin', { recursive: true });
    await fs.mkdir('mas9golf/blog', { recursive: true });
    await fs.mkdir('mas9golf/settings', { recursive: true });
    
    // 사이트 정보 저장
    await fs.writeFile(
      'mas9golf/admin/site-info.json',
      JSON.stringify(siteInfo, null, 2),
      'utf8'
    );
    
    // 사이트 목록 저장
    await fs.writeFile(
      'mas9golf/admin/sites-list.json',
      JSON.stringify(sites, null, 2),
      'utf8'
    );
    
    // 블로그 게시글 저장
    if (blogPosts && blogPosts.length > 0) {
      await fs.writeFile(
        'mas9golf/blog/posts.json',
        JSON.stringify(blogPosts, null, 2),
        'utf8'
      );
    }
    
    // 요약 보고서 생성
    const summary = {
      crawledAt: new Date().toISOString(),
      totalSites: sites.length,
      selectedSite: mas9golfSite.title,
      blogPosts: blogPosts ? blogPosts.length : 0,
      siteInfo: siteInfo,
      status: 'completed'
    };
    
    await fs.writeFile(
      'mas9golf/admin/crawl-summary.json',
      JSON.stringify(summary, null, 2),
      'utf8'
    );
    
    console.log(`🎉 Wix 백업 완료!`);
    console.log(`📊 결과:`);
    console.log(`   - 총 사이트: ${sites.length}개`);
    console.log(`   - 선택된 사이트: ${mas9golfSite.title}`);
    console.log(`   - 블로그 게시글: ${blogPosts ? blogPosts.length : 0}개`);
    console.log(`📁 저장 위치: mas9golf/admin/ 폴더`);
    
  } catch (error) {
    console.error('❌ 백업 중 오류 발생:', error);
  }
}

useExistingBrowser().catch(console.error);
