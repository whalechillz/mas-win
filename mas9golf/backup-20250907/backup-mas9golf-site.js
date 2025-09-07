const { chromium } = require('playwright');
const fs = require('fs').promises;

async function backupMas9golfSite() {
  console.log('🚀 mas9golf.com 사이트 백업 시작!');
  
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages()[0];
    
    console.log('📍 현재 URL:', page.url());
    
    // 사이트 정보 수집
    console.log('⚙️ 사이트 정보 수집...');
    const siteInfo = await page.evaluate(() => {
      const info = {
        title: document.title,
        url: window.location.href,
        domain: 'mas9golf.com',
        collectedAt: new Date().toISOString()
      };
      
      // 사이트 통계 정보 수집
      const statsElements = document.querySelectorAll('[class*="Card"]');
      const stats = {};
      
      statsElements.forEach(element => {
        const text = element.textContent;
        if (text.includes('사이트 세션')) {
          stats.siteSessions = text.match(/사이트 세션\s*(\d+)/)?.[1] || '0';
        }
        if (text.includes('총 판매')) {
          stats.totalSales = text.match(/총 판매\s*([₩\d,]+)/)?.[1] || '₩0';
        }
        if (text.includes('게시물 조회 수')) {
          stats.postViews = text.match(/게시물 조회 수\s*(\d+)/)?.[1] || '0';
        }
        if (text.includes('라이브 방문자')) {
          stats.liveVisitors = text.match(/라이브 방문자\s*(\d+)/)?.[1] || '0';
        }
      });
      
      info.stats = stats;
      
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
    console.log('📊 사이트 통계:', siteInfo.stats);
    
    // 블로그 섹션으로 이동
    console.log('📝 블로그 섹션으로 이동...');
    try {
      await page.goto('https://www.mas9golf.com/blog', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      const blogPosts = await page.evaluate(() => {
        const posts = [];
        
        // 다양한 블로그 포스트 선택자 시도
        const postSelectors = [
          'article',
          '.blog-post',
          '[class*="post"]',
          '[class*="blog"]',
          '.post-item',
          '.blog-item',
          '[data-testid*="post"]',
          '[data-testid*="blog"]'
        ];
        
        let postElements = [];
        for (const selector of postSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            postElements = elements;
            console.log(`블로그 포스트 발견: ${selector} (${elements.length}개)`);
            break;
          }
        }
        
        postElements.forEach((element, index) => {
          try {
            const titleElement = element.querySelector('h1, h2, h3, .title, [class*="title"]');
            const linkElement = element.querySelector('a[href]');
            const dateElement = element.querySelector('.date, [class*="date"], time');
            const contentElement = element.querySelector('.content, [class*="content"], p');
            const imageElement = element.querySelector('img');
            
            if (titleElement) {
              posts.push({
                title: titleElement.textContent.trim(),
                url: linkElement ? linkElement.href : '',
                date: dateElement ? dateElement.textContent.trim() : '',
                content: contentElement ? contentElement.textContent.trim().substring(0, 500) : '',
                image: imageElement ? imageElement.src : '',
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
      
      // 게시글 상세 정보 수집
      if (blogPosts.length > 0) {
        console.log('📄 게시글 상세 정보 수집...');
        for (let i = 0; i < Math.min(blogPosts.length, 5); i++) {
          const post = blogPosts[i];
          if (post.url) {
            try {
              console.log(`📖 게시글 상세 수집: ${post.title}`);
              await page.goto(post.url, { waitUntil: 'networkidle', timeout: 30000 });
              await page.waitForTimeout(2000);
              
              const postDetail = await page.evaluate(() => {
                return {
                  fullContent: document.body.innerText,
                  images: Array.from(document.querySelectorAll('img')).map(img => ({
                    src: img.src,
                    alt: img.alt,
                    width: img.width,
                    height: img.height
                  })),
                  links: Array.from(document.querySelectorAll('a[href]')).map(link => ({
                    text: link.textContent.trim(),
                    href: link.href
                  }))
                };
              });
              
              blogPosts[i].detail = postDetail;
              console.log(`✅ 게시글 상세 수집 완료: ${post.title}`);
              
            } catch (e) {
              console.log(`❌ 게시글 상세 수집 실패: ${post.title} - ${e.message}`);
            }
          }
        }
      }
      
    } catch (e) {
      console.log('블로그 수집 오류:', e.message);
    }
    
    // 메인 페이지로 돌아가서 전체 사이트 구조 수집
    console.log('🏠 메인 페이지로 이동...');
    await page.goto('https://www.mas9golf.com', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const mainPageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        content: document.body.innerText,
        images: Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height
        })),
        links: Array.from(document.querySelectorAll('a[href]')).map(link => ({
          text: link.textContent.trim(),
          href: link.href
        }))
      };
    });
    
    console.log('📄 메인 페이지 정보 수집 완료');
    
    // 데이터 저장
    console.log('💾 데이터 저장 중...');
    
    // 디렉토리 생성
    await fs.mkdir('mas9golf/admin', { recursive: true });
    await fs.mkdir('mas9golf/blog', { recursive: true });
    await fs.mkdir('mas9golf/pages', { recursive: true });
    await fs.mkdir('mas9golf/assets', { recursive: true });
    
    // 사이트 정보 저장
    await fs.writeFile(
      'mas9golf/admin/site-info.json',
      JSON.stringify(siteInfo, null, 2),
      'utf8'
    );
    
    // 메인 페이지 정보 저장
    await fs.writeFile(
      'mas9golf/pages/main-page.json',
      JSON.stringify(mainPageInfo, null, 2),
      'utf8'
    );
    
    // 블로그 게시글 저장
    let blogPosts = [];
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
      siteName: 'mas9golf.com',
      siteInfo: siteInfo,
      mainPage: mainPageInfo,
      blogPosts: blogPosts ? blogPosts.length : 0,
      totalImages: (mainPageInfo.images?.length || 0) + (blogPosts?.reduce((sum, post) => sum + (post.detail?.images?.length || 0), 0) || 0),
      totalLinks: mainPageInfo.links?.length || 0,
      status: 'completed'
    };
    
    await fs.writeFile(
      'mas9golf/admin/crawl-summary.json',
      JSON.stringify(summary, null, 2),
      'utf8'
    );
    
    console.log(`🎉 mas9golf.com 백업 완료!`);
    console.log(`📊 결과:`);
    console.log(`   - 사이트: mas9golf.com`);
    console.log(`   - 블로그 게시글: ${blogPosts ? blogPosts.length : 0}개`);
    console.log(`   - 총 이미지: ${summary.totalImages}개`);
    console.log(`   - 총 링크: ${summary.totalLinks}개`);
    console.log(`   - 사이트 세션: ${siteInfo.stats.siteSessions}`);
    console.log(`   - 게시물 조회 수: ${siteInfo.stats.postViews}`);
    console.log(`📁 저장 위치: mas9golf/ 폴더`);
    
  } catch (error) {
    console.error('❌ 백업 중 오류 발생:', error);
  }
}

backupMas9golfSite().catch(console.error);
