const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_DIR = 'mas9golf';
const BLOG_DIR = path.join(OUTPUT_DIR, 'blog');
const BLOG_POSTS_DIR = path.join(BLOG_DIR, 'posts');

let blogSummary = {
  startTime: new Date().toISOString(),
  endTime: null,
  totalPosts: 0,
  successfulPosts: 0,
  failedPosts: 0,
  posts: [],
  errors: []
};

async function ensureDirs() {
  await fs.mkdir(BLOG_DIR, { recursive: true });
  await fs.mkdir(BLOG_POSTS_DIR, { recursive: true });
}

async function backupAllBlogPosts() {
  console.log('📝 블로그 모든 글 완전 백업 시작!');
  await ensureDirs();

  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages()[0];
    
    console.log('📍 현재 URL:', page.url());
    
    // 1. 블로그 메인 페이지에서 모든 포스트 URL 수집
    console.log('🔍 블로그 메인 페이지에서 모든 포스트 URL 수집...');
    await page.goto('https://www.mas9golf.com/blog', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const blogUrls = await page.evaluate(() => {
      const urls = new Set();
      
      // 다양한 선택자로 블로그 포스트 링크 수집
      const selectors = [
        'a[href*="/post/"]',
        'a[href*="/blog/"]',
        '[class*="post"] a[href]',
        '[class*="blog"] a[href]',
        'article a[href]',
        '.blog-post a[href]'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const href = element.href;
          if (href && (href.includes('/post/') || href.includes('/blog/'))) {
            urls.add(href);
          }
        });
      });
      
      return Array.from(urls);
    });
    
    console.log(`📊 발견된 블로그 URL: ${blogUrls.length}개`);
    blogUrls.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`);
    });
    
    blogSummary.totalPosts = blogUrls.length;
    
    // 2. 각 블로그 포스트 상세 내용 수집
    for (let i = 0; i < blogUrls.length; i++) {
      const url = blogUrls[i];
      try {
        console.log(`📖 블로그 포스트 수집 중 (${i + 1}/${blogUrls.length}): ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        // 페이지 로딩 완료 대기
        await page.waitForSelector('body', { timeout: 10000 });
        
        const postData = await page.evaluate((currentUrl) => {
          const data = {
            url: currentUrl,
            title: '',
            content: '',
            excerpt: '',
            date: '',
            author: '',
            tags: [],
            categories: [],
            images: [],
            links: [],
            metaTags: {},
            html: '',
            collectedAt: new Date().toISOString()
          };
          
          // 제목 수집
          const titleSelectors = [
            'h1',
            '.post-title',
            '.blog-title',
            '[class*="title"]',
            'title'
          ];
          
          for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
              data.title = element.textContent.trim();
              break;
            }
          }
          
          // 본문 내용 수집
          const contentSelectors = [
            '.post-content',
            '.blog-content',
            '.entry-content',
            'article',
            '[class*="content"]',
            'main'
          ];
          
          for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              data.content = element.innerText || element.textContent || '';
              data.html = element.innerHTML || '';
              break;
            }
          }
          
          // 전체 본문이 없으면 body에서 수집
          if (!data.content) {
            data.content = document.body.innerText || document.body.textContent || '';
            data.html = document.body.innerHTML || '';
          }
          
          // 요약/발췌 수집
          const excerptSelectors = [
            '.excerpt',
            '.summary',
            '.post-excerpt',
            '[class*="excerpt"]'
          ];
          
          for (const selector of excerptSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
              data.excerpt = element.textContent.trim();
              break;
            }
          }
          
          // 날짜 수집
          const dateSelectors = [
            '.date',
            '.post-date',
            '.published-date',
            'time',
            '[class*="date"]'
          ];
          
          for (const selector of dateSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
              data.date = element.textContent.trim();
              break;
            }
          }
          
          // 작성자 수집
          const authorSelectors = [
            '.author',
            '.post-author',
            '.byline',
            '[class*="author"]'
          ];
          
          for (const selector of authorSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
              data.author = element.textContent.trim();
              break;
            }
          }
          
          // 태그 수집
          const tagElements = document.querySelectorAll('.tag, .tags a, [class*="tag"] a');
          tagElements.forEach(element => {
            const tag = element.textContent.trim();
            if (tag && !data.tags.includes(tag)) {
              data.tags.push(tag);
            }
          });
          
          // 카테고리 수집
          const categoryElements = document.querySelectorAll('.category, .categories a, [class*="category"] a');
          categoryElements.forEach(element => {
            const category = element.textContent.trim();
            if (category && !data.categories.includes(category)) {
              data.categories.push(category);
            }
          });
          
          // 이미지 수집
          const images = document.querySelectorAll('img');
          images.forEach(img => {
            if (img.src && !img.src.includes('data:')) {
              data.images.push({
                src: img.src,
                alt: img.alt || '',
                width: img.width || 0,
                height: img.height || 0
              });
            }
          });
          
          // 링크 수집
          const links = document.querySelectorAll('a[href]');
          links.forEach(link => {
            if (link.href && link.textContent.trim()) {
              data.links.push({
                text: link.textContent.trim(),
                href: link.href
              });
            }
          });
          
          // 메타 태그 수집
          const metaTags = document.querySelectorAll('meta');
          metaTags.forEach(meta => {
            const name = meta.getAttribute('name') || meta.getAttribute('property');
            const content = meta.getAttribute('content');
            if (name && content) {
              data.metaTags[name] = content;
            }
          });
          
          return data;
        }, url);
        
        // 파일명 생성 (URL에서 안전한 파일명 추출)
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
        const safeFileName = lastPart.replace(/[^a-zA-Z0-9가-힣]/g, '_').substring(0, 50);
        
        // 개별 포스트 파일 저장
        const postFileName = `post-${i + 1}-${safeFileName}.json`;
        await fs.writeFile(
          path.join(BLOG_POSTS_DIR, postFileName),
          JSON.stringify(postData, null, 2),
          'utf8'
        );
        
        blogSummary.posts.push(postData);
        blogSummary.successfulPosts++;
        
        console.log(`✅ 포스트 수집 완료: ${postData.title}`);
        console.log(`   - 내용 길이: ${postData.content.length}자`);
        console.log(`   - 이미지: ${postData.images.length}개`);
        console.log(`   - 링크: ${postData.links.length}개`);
        console.log(`   - 태그: ${postData.tags.length}개`);
        
      } catch (error) {
        console.error(`❌ 포스트 수집 실패: ${url} - ${error.message}`);
        blogSummary.failedPosts++;
        blogSummary.errors.push({
          url: url,
          error: error.message,
          index: i + 1
        });
      }
    }
    
    // 3. 블로그 요약 보고서 생성
    blogSummary.endTime = new Date().toISOString();
    
    // 전체 블로그 데이터 저장
    await fs.writeFile(
      path.join(BLOG_DIR, 'all-blog-posts.json'),
      JSON.stringify(blogSummary.posts, null, 2),
      'utf8'
    );
    
    // 요약 보고서 저장
    await fs.writeFile(
      path.join(BLOG_DIR, 'blog-backup-summary.json'),
      JSON.stringify(blogSummary, null, 2),
      'utf8'
    );
    
    console.log(`🎉 블로그 완전 백업 완료!`);
    console.log(`📊 결과:`);
    console.log(`   - 총 포스트: ${blogSummary.totalPosts}개`);
    console.log(`   - 성공: ${blogSummary.successfulPosts}개`);
    console.log(`   - 실패: ${blogSummary.failedPosts}개`);
    console.log(`   - 오류: ${blogSummary.errors.length}개`);
    console.log(`📁 저장 위치: ${BLOG_DIR}/`);
    console.log(`📄 개별 포스트: ${BLOG_POSTS_DIR}/`);
    console.log(`📄 전체 데이터: ${BLOG_DIR}/all-blog-posts.json`);
    console.log(`📄 요약 보고서: ${BLOG_DIR}/blog-backup-summary.json`);
    
  } catch (error) {
    console.error('❌ 블로그 백업 중 오류 발생:', error);
    blogSummary.errors.push({ type: 'main_error', error: error.message });
    blogSummary.endTime = new Date().toISOString();
    await fs.writeFile(
      path.join(BLOG_DIR, 'blog-backup-summary.json'),
      JSON.stringify(blogSummary, null, 2),
      'utf8'
    );
  }
}

backupAllBlogPosts().catch(console.error);
