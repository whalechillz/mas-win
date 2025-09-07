const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_DIR = 'mas9golf';
const BLOG_DIR = path.join(OUTPUT_DIR, 'blog');
const BLOG_POSTS_DIR = path.join(BLOG_DIR, 'all-162-posts');

let blogSummary = {
  startTime: new Date().toISOString(),
  endTime: null,
  totalPosts: 0,
  successfulPosts: 0,
  failedPosts: 0,
  posts: [],
  errors: [],
  progress: {
    current: 0,
    total: 0,
    percentage: 0
  }
};

async function ensureDirs() {
  await fs.mkdir(BLOG_DIR, { recursive: true });
  await fs.mkdir(BLOG_POSTS_DIR, { recursive: true });
}

async function getAllBlogUrlsFromPublic(page) {
  console.log('🔍 공개 블로그 페이지에서 모든 포스트 URL 수집...');
  
  const allUrls = new Set();
  let pageNumber = 1;
  let hasMorePages = true;
  
  while (hasMorePages && pageNumber <= 50) { // 최대 50페이지까지
    try {
      console.log(`📄 블로그 페이지 ${pageNumber} 수집 중...`);
      
      const url = pageNumber === 1 
        ? 'https://www.mas9golf.com/blog'
        : `https://www.mas9golf.com/blog/page/${pageNumber}`;
      
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      // 현재 페이지의 모든 블로그 포스트 URL 수집
      const pageUrls = await page.evaluate(() => {
        const urls = [];
        
        // 다양한 선택자로 블로그 포스트 링크 수집
        const selectors = [
          'a[href*="/post/"]',
          'article a[href]',
          '.blog-post a[href]',
          '[class*="post"] a[href]',
          '[class*="blog-item"] a[href]',
          'h1 a[href]',
          'h2 a[href]',
          'h3 a[href]'
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            const href = element.href;
            if (href && href.includes('/post/')) {
              urls.push(href);
            }
          });
        });
        
        return urls;
      });
      
      // URL 추가
      pageUrls.forEach(url => allUrls.add(url));
      console.log(`   - 페이지 ${pageNumber}에서 ${pageUrls.length}개 URL 발견`);
      
      // 다음 페이지 버튼 확인
      const nextButton = await page.$('a[href*="page/"]:not([href*="page/1"])');
      if (nextButton && pageUrls.length > 0) {
        pageNumber++;
      } else {
        hasMorePages = false;
      }
      
    } catch (error) {
      console.log(`❌ 페이지 ${pageNumber} 수집 실패: ${error.message}`);
      hasMorePages = false;
    }
  }
  
  const finalUrls = Array.from(allUrls);
  console.log(`📊 총 ${finalUrls.length}개의 고유한 블로그 URL 발견`);
  
  return finalUrls;
}

async function backupSinglePost(page, url, index, total) {
  try {
    console.log(`📖 [${index}/${total}] 블로그 포스트 수집: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
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
      const titleSelectors = ['h1', '.post-title', '.blog-title', '[class*="title"]', 'title'];
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          data.title = element.textContent.trim();
          break;
        }
      }
      
      // 본문 내용 수집
      const contentSelectors = ['.post-content', '.blog-content', '.entry-content', 'article', '[class*="content"]', 'main'];
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          data.content = element.innerText || element.textContent || '';
          data.html = element.innerHTML || '';
          break;
        }
      }
      
      if (!data.content) {
        data.content = document.body.innerText || document.body.textContent || '';
        data.html = document.body.innerHTML || '';
      }
      
      // 날짜 수집
      const dateSelectors = ['.date', '.post-date', '.published-date', 'time', '[class*="date"]'];
      for (const selector of dateSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          data.date = element.textContent.trim();
          break;
        }
      }
      
      // 작성자 수집
      const authorSelectors = ['.author', '.post-author', '.byline', '[class*="author"]'];
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
    
    // 파일명 생성
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    const safeFileName = lastPart.replace(/[^a-zA-Z0-9가-힣]/g, '_').substring(0, 50);
    
    // 개별 포스트 파일 저장
    const postFileName = `post-${index}-${safeFileName}.json`;
    await fs.writeFile(
      path.join(BLOG_POSTS_DIR, postFileName),
      JSON.stringify(postData, null, 2),
      'utf8'
    );
    
    blogSummary.posts.push(postData);
    blogSummary.successfulPosts++;
    blogSummary.progress.current = index;
    blogSummary.progress.percentage = Math.round((index / total) * 100);
    
    console.log(`✅ [${index}/${total}] 포스트 수집 완료: ${postData.title}`);
    console.log(`   - 내용 길이: ${postData.content.length}자`);
    console.log(`   - 이미지: ${postData.images.length}개`);
    console.log(`   - 링크: ${postData.links.length}개`);
    console.log(`   - 태그: ${postData.tags.length}개`);
    console.log(`   - 진행률: ${blogSummary.progress.percentage}%`);
    
    return postData;
    
  } catch (error) {
    console.error(`❌ [${index}/${total}] 포스트 수집 실패: ${url} - ${error.message}`);
    blogSummary.failedPosts++;
    blogSummary.errors.push({
      url: url,
      error: error.message,
      index: index
    });
    return null;
  }
}

async function backupBlogFromPublic() {
  console.log('📝 공개 블로그에서 모든 글 백업 시작!');
  await ensureDirs();

  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages()[0];
    
    console.log('📍 현재 URL:', page.url());
    
    // 1. 공개 블로그에서 모든 포스트 URL 수집
    const blogUrls = await getAllBlogUrlsFromPublic(page);
    
    if (blogUrls.length === 0) {
      console.log('❌ 블로그 URL을 찾을 수 없습니다.');
      return;
    }
    
    blogSummary.totalPosts = blogUrls.length;
    blogSummary.progress.total = blogUrls.length;
    
    console.log(`📊 총 ${blogUrls.length}개의 블로그 포스트를 백업합니다.`);
    
    // 2. 각 블로그 포스트 상세 내용 수집
    for (let i = 0; i < blogUrls.length; i++) {
      const url = blogUrls[i];
      await backupSinglePost(page, url, i + 1, blogUrls.length);
      
      // 진행 상황 저장 (매 10개마다)
      if ((i + 1) % 10 === 0) {
        blogSummary.endTime = new Date().toISOString();
        await fs.writeFile(
          path.join(BLOG_DIR, 'progress-backup.json'),
          JSON.stringify(blogSummary, null, 2),
          'utf8'
        );
        console.log(`💾 진행 상황 저장: ${i + 1}/${blogUrls.length} 완료`);
      }
      
      // 요청 간격 조절
      await page.waitForTimeout(1000);
    }
    
    // 3. 최종 요약 보고서 생성
    blogSummary.endTime = new Date().toISOString();
    
    // 전체 블로그 데이터 저장
    await fs.writeFile(
      path.join(BLOG_DIR, 'all-blog-posts-from-public.json'),
      JSON.stringify(blogSummary.posts, null, 2),
      'utf8'
    );
    
    // 최종 요약 보고서 저장
    await fs.writeFile(
      path.join(BLOG_DIR, 'blog-backup-from-public-summary.json'),
      JSON.stringify(blogSummary, null, 2),
      'utf8'
    );
    
    console.log(`🎉 블로그 백업 완료!`);
    console.log(`📊 최종 결과:`);
    console.log(`   - 총 포스트: ${blogSummary.totalPosts}개`);
    console.log(`   - 성공: ${blogSummary.successfulPosts}개`);
    console.log(`   - 실패: ${blogSummary.failedPosts}개`);
    console.log(`   - 성공률: ${Math.round((blogSummary.successfulPosts / blogSummary.totalPosts) * 100)}%`);
    console.log(`📁 저장 위치: ${BLOG_DIR}/`);
    console.log(`📄 개별 포스트: ${BLOG_POSTS_DIR}/`);
    console.log(`📄 전체 데이터: ${BLOG_DIR}/all-blog-posts-from-public.json`);
    console.log(`📄 최종 요약: ${BLOG_DIR}/blog-backup-from-public-summary.json`);
    
  } catch (error) {
    console.error('❌ 블로그 백업 중 오류 발생:', error);
    blogSummary.errors.push({ type: 'main_error', error: error.message });
    blogSummary.endTime = new Date().toISOString();
    await fs.writeFile(
      path.join(BLOG_DIR, 'blog-backup-from-public-summary.json'),
      JSON.stringify(blogSummary, null, 2),
      'utf8'
    );
  }
}

backupBlogFromPublic().catch(console.error);
