const { chromium } = require('playwright');

async function fixWixSEOSlugs() {
  try {
    console.log('🔧 Wix SEO 설정 및 URL 슬러그 수정 시작...');
    
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    
    // Wix 에디터로 이동
    await page.goto('https://manage.wix.com/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('📍 Wix 대시보드 접근 완료');
    
    // 블로그 포스트 목록으로 이동
    await page.goto('https://manage.wix.com/dashboard/site-editor', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('📍 Wix 에디터 접근 완료');
    
    // 블로그 섹션 찾기
    await page.waitForSelector('[data-testid="blog-posts"]', { timeout: 10000 });
    await page.click('[data-testid="blog-posts"]');
    console.log('📝 블로그 포스트 섹션 접근');
    
    // 모든 블로그 포스트 수집
    const blogPosts = await page.evaluate(() => {
      const posts = [];
      const postElements = document.querySelectorAll('[data-testid="blog-post-item"]');
      
      postElements.forEach((element, index) => {
        const titleElement = element.querySelector('[data-testid="post-title"]');
        const urlElement = element.querySelector('[data-testid="post-url"]');
        
        if (titleElement && urlElement) {
          posts.push({
            index: index,
            title: titleElement.textContent.trim(),
            currentUrl: urlElement.textContent.trim(),
            element: element
          });
        }
      });
      
      return posts;
    });
    
    console.log(`📊 발견된 블로그 포스트: ${blogPosts.length}개`);
    
    // 각 포스트의 SEO 설정 수정
    for (let i = 0; i < blogPosts.length; i++) {
      const post = blogPosts[i];
      console.log(`\n🔧 [${i + 1}/${blogPosts.length}] SEO 설정 수정: ${post.title}`);
      
      try {
        // 포스트 편집 모드로 이동
        await page.evaluate((index) => {
          const postElement = document.querySelectorAll('[data-testid="blog-post-item"]')[index];
          const editButton = postElement.querySelector('[data-testid="edit-post"]');
          if (editButton) {
            editButton.click();
          }
        }, post.index);
        
        await page.waitForTimeout(2000);
        
        // SEO 설정 패널 열기
        await page.click('[data-testid="seo-settings"]');
        await page.waitForTimeout(1000);
        
        // URL 슬러그 수정
        const newSlug = await generateEnglishSlug(post.title);
        console.log(`   - 새 슬러그: ${newSlug}`);
        
        await page.fill('[data-testid="url-slug-input"]', newSlug);
        
        // 메타 설명 추가 (한국어)
        const metaDescription = await generateMetaDescription(post.title);
        await page.fill('[data-testid="meta-description-input"]', metaDescription);
        
        // SEO 제목 최적화
        const seoTitle = await generateSEOTitle(post.title);
        await page.fill('[data-testid="seo-title-input"]', seoTitle);
        
        // 저장
        await page.click('[data-testid="save-seo-settings"]');
        await page.waitForTimeout(2000);
        
        console.log(`   ✅ SEO 설정 수정 완료`);
        
        // 다음 포스트로 이동
        await page.goBack();
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.log(`   ❌ SEO 설정 수정 실패: ${error.message}`);
        continue;
      }
    }
    
    console.log('\n🎉 모든 블로그 포스트 SEO 설정 수정 완료!');
    
  } catch (error) {
    console.error('❌ SEO 설정 수정 중 오류 발생:', error);
  }
}

// 한국어 제목을 영문 슬러그로 변환
async function generateEnglishSlug(koreanTitle) {
  const translations = {
    '뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사': 'hot-summer-perfect-swing-royal-salute-event',
    '롱기스트 드라이버 찾는다면': 'longest-driver-search',
    '고반발 드라이버': 'high-rebound-driver',
    '시니어 골퍼': 'senior-golfer',
    '비거리': 'distance',
    '증정': 'gift',
    '행사': 'event',
    '프로모션': 'promotion',
    '할인': 'discount',
    '이벤트': 'event',
    '후기': 'review',
    '체험': 'experience',
    '분석': 'analysis',
    '팁': 'tips',
    '가이드': 'guide',
    '소개': 'introduction',
    '개발': 'development',
    '기술': 'technology',
    '성능': 'performance',
    '품질': 'quality'
  };
  
  let slug = koreanTitle.toLowerCase();
  
  // 번역 적용
  for (const [korean, english] of Object.entries(translations)) {
    slug = slug.replace(korean, english);
  }
  
  // 특수문자 제거 및 공백을 하이픈으로 변경
  slug = slug
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return slug || 'blog-post';
}

// 메타 설명 생성
async function generateMetaDescription(title) {
  const descriptions = {
    '뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사': '마쓰구 골프의 뜨거운 여름 프로모션! 완벽한 스윙으로 로얄살루트를 받아가세요. 고반발 드라이버로 비거리를 늘리고 특별한 선물도 받으세요.',
    '롱기스트 드라이버': '시니어 골퍼를 위한 롱기스트 드라이버 완벽 가이드. 마쓰구 골프의 고반발 드라이버로 비거리를 최대 25m까지 늘려보세요.',
    '고반발 드라이버': '마쓰구 골프의 고반발 드라이버로 비거리 혁신을 경험하세요. 일본산 티타늄과 NGS 샤프트로 최고의 성능을 제공합니다.'
  };
  
  for (const [keyword, description] of Object.entries(descriptions)) {
    if (title.includes(keyword)) {
      return description;
    }
  }
  
  return `마쓰구 골프 ${title} - 고반발 드라이버 전문 브랜드의 프리미엄 골프 용품과 전문적인 피팅 서비스를 경험해보세요.`;
}

// SEO 제목 생성
async function generateSEOTitle(title) {
  if (title.length > 60) {
    return title.substring(0, 57) + '...';
  }
  return title;
}

fixWixSEOSlugs().catch(console.error);
