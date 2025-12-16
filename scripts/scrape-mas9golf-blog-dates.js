const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

/**
 * mas9golf.com/blog에서 블로그 글들의 원본 발행일을 스크래핑
 */
async function scrapeMas9golfBlogDates() {
  console.log('🔍 mas9golf.com/blog에서 블로그 발행일 스크래핑 시작...\n');
  
  let browser;
  try {
    // Chrome Canary 연결 (이미 열려있는 경우)
    try {
      browser = await chromium.connectOverCDP('http://localhost:9222');
      console.log('✅ 기존 Chrome Canary 연결됨');
    } catch (error) {
      // Chrome Canary가 없으면 새로 실행
      browser = await chromium.launch({ 
        headless: false,
        channel: 'chrome-canary'
      });
      console.log('✅ 새 Chrome 브라우저 실행됨');
    }
    
    const context = browser.contexts()[0] || await browser.newContext();
    const page = context.pages()[0] || await context.newPage();
    
    // User-Agent 설정
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    // mas9golf.com/blog 페이지로 이동
    console.log('📄 mas9golf.com/blog 페이지 접속 중...');
    try {
      await page.goto('https://www.mas9golf.com/blog', { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });
    } catch (error) {
      console.log('⚠️ networkidle 타임아웃, domcontentloaded로 재시도...');
      await page.goto('https://www.mas9golf.com/blog', { 
        waitUntil: 'load', 
        timeout: 60000 
      });
    }
    await page.waitForTimeout(5000);
    
    // 페이지 스크린샷 (디버깅용)
    await page.screenshot({ path: 'mas9golf-blog-list.png', fullPage: true });
    console.log('📸 페이지 스크린샷 저장: mas9golf-blog-list.png\n');
    
    // 블로그 글 목록 추출 (모든 페이지 순회)
    console.log('📋 블로그 글 목록 추출 중...');
    const allPosts = [];
    let currentPage = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      console.log(`\n📄 페이지 ${currentPage} 처리 중...`);
      
      if (currentPage > 1) {
        const pageUrl = `https://www.mas9golf.com/blog/page/${currentPage}`;
        await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);
      }
      
      const blogPosts = await page.evaluate(() => {
        const posts = [];
        const seenUrls = new Set();
        
        // /post/로 시작하는 링크만 찾기 (페이지네이션 제외)
        const links = document.querySelectorAll('a[href*="/post/"]');
        
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (!href) return;
          
          // 페이지네이션 링크 제외
          if (href.includes('/page/')) return;
          
          const fullUrl = href.startsWith('http') ? href : `https://www.mas9golf.com${href}`;
          
          // 중복 제거
          if (seenUrls.has(fullUrl)) return;
          seenUrls.add(fullUrl);
          
          // 제목 찾기
          const titleElement = link.querySelector('h1, h2, h3, .title, .post-title, .blog-title, [class*="title"]') || 
                               link.closest('article, .blog-post, .post-item')?.querySelector('h1, h2, h3, .title') ||
                               link;
          const title = titleElement ? titleElement.textContent.trim() : '';
          
          // 날짜 찾기 (게시물 카드 내)
          const cardElement = link.closest('article, .blog-post, .post-item, [class*="post"], [class*="blog"]');
          const dateElement = cardElement ? cardElement.querySelector('.date, .post-date, .blog-date, .published-date, [class*="date"], time, [datetime]') : null;
          let publishedDate = '';
          if (dateElement) {
            const datetime = dateElement.getAttribute('datetime');
            publishedDate = datetime || dateElement.textContent.trim();
          }
          
          // 이미지 찾기
          const imageElement = cardElement ? cardElement.querySelector('img') : null;
          const imageUrl = imageElement ? imageElement.getAttribute('src') : '';
          
          if (title || fullUrl) {
            posts.push({
              title: title || `게시물 ${posts.length + 1}`,
              url: fullUrl,
              publishedDate: publishedDate,
              imageUrl: imageUrl || '',
              slug: href.split('/').pop()
            });
          }
        });
        
        return posts;
      });
      
      console.log(`  ✅ 페이지 ${currentPage}에서 ${blogPosts.length}개 게시물 발견`);
      
      // 중복 제거 후 추가
      const existingUrls = new Set(allPosts.map(p => p.url));
      const newPosts = blogPosts.filter(p => !existingUrls.has(p.url));
      allPosts.push(...newPosts);
      
      // 다음 페이지 확인
      const nextPageLink = await page.$('a[href*="/blog/page/"]:has-text("다음"), a[href*="/blog/page/"]:has-text(">"), a[href*="/blog/page/"]:has-text("Next")');
      const nextPageUrl = await page.$eval('a[href*="/blog/page/"]', el => {
        const links = Array.from(document.querySelectorAll('a[href*="/blog/page/"]'));
        const currentPageNum = parseInt(window.location.pathname.split('/page/')[1] || '1');
        for (const link of links) {
          const href = link.getAttribute('href');
          const pageNum = parseInt(href.split('/page/')[1] || '0');
          if (pageNum === currentPageNum + 1) {
            return href;
          }
        }
        return null;
      }).catch(() => null);
      
      if (nextPageUrl && currentPage < 10) { // 최대 10페이지까지만
        currentPage++;
      } else {
        hasMorePages = false;
      }
    }
    
    console.log(`\n✅ 총 ${allPosts.length}개의 고유한 블로그 글 발견\n`);
    
    // 중복 제거
    const uniquePosts = [];
    const seenUrls = new Set();
    for (const post of allPosts) {
      if (!seenUrls.has(post.url)) {
        seenUrls.add(post.url);
        uniquePosts.push({ ...post, index: uniquePosts.length + 1 });
      }
    }
    
    const blogPosts = uniquePosts;
    
    // 각 게시물 상세 페이지에서 발행일 확인
    console.log('📅 각 게시물의 상세 발행일 확인 중...\n');
    const postsWithDates = [];
    
    for (let i = 0; i < blogPosts.length; i++) {
      const post = blogPosts[i];
      if (!post.url) continue;
      
      try {
        console.log(`[${i + 1}/${blogPosts.length}] ${post.title.substring(0, 50)}...`);
        console.log(`  ➡️ ${post.url}`);
        
        await page.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);
        
        // 상세 페이지에서 발행일 추출
        const postDetail = await page.evaluate(() => {
          // 다양한 날짜 선택자 시도
          const dateSelectors = [
            'time[datetime]',
            '[datetime]',
            '.blog-post-date',
            '.post-date',
            '.published-date',
            '.date',
            '[class*="date"]',
            '[data-hook="post-date"]',
            'meta[property="article:published_time"]',
            'meta[name="publish-date"]'
          ];
          
          let publishedDate = '';
          let dateSource = '';
          
          // meta 태그에서 먼저 확인
          const metaDate = document.querySelector('meta[property="article:published_time"], meta[name="publish-date"]');
          if (metaDate) {
            publishedDate = metaDate.getAttribute('content') || metaDate.getAttribute('value');
            dateSource = 'meta';
          }
          
          // HTML 요소에서 확인
          if (!publishedDate) {
            for (const selector of dateSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                const datetime = element.getAttribute('datetime');
                if (datetime) {
                  publishedDate = datetime;
                  dateSource = selector;
                  break;
                } else {
                  const text = element.textContent.trim();
                  if (text) {
                    publishedDate = text;
                    dateSource = selector;
                    break;
                  }
                }
              }
            }
          }
          
          // 제목도 다시 확인 (더 정확할 수 있음)
          const titleElement = document.querySelector('h1, .blog-post-title, .post-title, [data-hook="post-title"]');
          const title = titleElement ? titleElement.textContent.trim() : '';
          
          return {
            title,
            publishedDate,
            dateSource,
            pageUrl: window.location.href
          };
        });
        
          // 날짜 파싱 및 정규화
        let normalizedDate = '';
        if (postDetail.publishedDate) {
          try {
            // ISO 형식이면 그대로 사용
            if (postDetail.publishedDate.match(/^\d{4}-\d{2}-\d{2}/)) {
              const date = new Date(postDetail.publishedDate);
              if (!isNaN(date.getTime())) {
                normalizedDate = date.toISOString();
              }
            } else {
              // 한글 날짜 형식 파싱 시도
              const koreanDateMatch = postDetail.publishedDate.match(/(\d{4})[년.\s-]+(\d{1,2})[월.\s-]+(\d{1,2})/);
              if (koreanDateMatch) {
                const [, year, month, day] = koreanDateMatch;
                normalizedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).toISOString();
              } else {
                // 일반 날짜 파싱 시도
                const date = new Date(postDetail.publishedDate);
                if (!isNaN(date.getTime())) {
                  normalizedDate = date.toISOString();
                }
              }
            }
          } catch (error) {
            console.error(`  ⚠️ 날짜 파싱 실패: ${postDetail.publishedDate}`);
          }
        }
        
        // 2025년 날짜는 의심스러우므로 페이지에서 직접 확인
        if (normalizedDate && normalizedDate.startsWith('2025-')) {
          console.log(`  ⚠️ 2025년 날짜 발견, 페이지에서 직접 확인 시도...`);
          // 페이지 텍스트에서 날짜 찾기
          const pageText = await page.textContent('body');
          const yearMatches = pageText.match(/(\d{4})[년.\s-]+(\d{1,2})[월.\s-]+(\d{1,2})/g);
          if (yearMatches) {
            for (const match of yearMatches) {
              const dateMatch = match.match(/(\d{4})[년.\s-]+(\d{1,2})[월.\s-]+(\d{1,2})/);
              if (dateMatch) {
                const [, year, month, day] = dateMatch;
                const parsedYear = parseInt(year);
                // 2020-2024 사이의 날짜만 사용
                if (parsedYear >= 2020 && parsedYear <= 2024) {
                  normalizedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).toISOString();
                  console.log(`  ✅ 실제 발행일 발견: ${normalizedDate}`);
                  break;
                }
              }
            }
          }
        }
        
        postsWithDates.push({
          ...post,
          title: postDetail.title || post.title,
          publishedDate: normalizedDate || postDetail.publishedDate || post.publishedDate,
          dateSource: postDetail.dateSource || 'unknown',
          pageUrl: postDetail.pageUrl || post.url
        });
        
        console.log(`  📅 발행일: ${normalizedDate || postDetail.publishedDate || '없음'}`);
        console.log(`  📍 출처: ${postDetail.dateSource || 'unknown'}\n`);
        
        // API 부하 방지를 위한 대기
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.error(`  ❌ 오류: ${error.message}`);
        postsWithDates.push({
          ...post,
          publishedDate: post.publishedDate || '',
          error: error.message
        });
      }
    }
    
    // 결과 저장
    const outputDir = path.join(__dirname, '../backup');
    await fs.mkdir(outputDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputFile = path.join(outputDir, `mas9golf-blog-dates-${timestamp}.json`);
    
    await fs.writeFile(
      outputFile,
      JSON.stringify({
        scraped_at: new Date().toISOString(),
        total_posts: postsWithDates.length,
        posts: postsWithDates
      }, null, 2)
    );
    
    console.log(`\n✅ 스크래핑 완료!`);
    console.log(`📁 결과 저장: ${outputFile}`);
    console.log(`📊 총 ${postsWithDates.length}개 게시물의 발행일 수집 완료\n`);
    
    // 발행일이 있는 게시물 통계
    const postsWithValidDate = postsWithDates.filter(p => p.publishedDate);
    console.log(`📅 발행일이 있는 게시물: ${postsWithValidDate.length}개`);
    console.log(`⚠️ 발행일이 없는 게시물: ${postsWithDates.length - postsWithValidDate.length}개\n`);
    
    // 샘플 출력
    console.log('📋 샘플 데이터 (처음 5개):');
    postsWithDates.slice(0, 5).forEach((post, index) => {
      console.log(`\n${index + 1}. ${post.title.substring(0, 50)}...`);
      console.log(`   URL: ${post.url}`);
      console.log(`   발행일: ${post.publishedDate || '없음'}`);
    });
    
    return postsWithDates;
    
  } catch (error) {
    console.error('❌ 스크래핑 오류:', error);
    throw error;
  } finally {
    // 브라우저는 연결된 경우 닫지 않음
    if (browser && browser.isConnected()) {
      // CDP로 연결된 경우 닫지 않음
      if (!browser.contexts || browser.contexts().length === 0) {
        await browser.close();
      }
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  scrapeMas9golfBlogDates()
    .then(() => {
      console.log('\n✅ 모든 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { scrapeMas9golfBlogDates };

