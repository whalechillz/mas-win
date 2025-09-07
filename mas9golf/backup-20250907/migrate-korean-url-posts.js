const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// 한글 URL이 포함된 게시물들 (Wix 대시보드에서 직접 접근)
const koreanUrlPosts = [
  {
    title: "뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사",
    dashboardUrl: "https://manage.wix.com/dashboard/9fd66b1e-f894-49ab-9e3a-b41aac392bd7/blog/posts",
    slug: "hot-summer-perfect-swing-royal-salute-golf-event",
    priority: 3
  },
  {
    title: "롱기스트 드라이버 찾는다면? MASGOLF(구.마쓰구골프) 고반발 드라이버로 인생 황금기를 완성하세요",
    dashboardUrl: "https://manage.wix.com/dashboard/9fd66b1e-f894-49ab-9e3a-b41aac392bd7/blog/posts",
    slug: "longest-driver-masgolf-high-rebound-golden-age-complete",
    priority: 4
  },
  {
    title: "시니어 골퍼의 인생 드라이버, 마쓰구 고반발로 골프가 즐거워진다! 라운딩 리얼후기",
    dashboardUrl: "https://manage.wix.com/dashboard/9fd66b1e-f894-49ab-9e3a-b41aac392bd7/blog/posts",
    slug: "senior-golfer-life-driver-masgolf-high-rebound-golf-fun-review",
    priority: 5
  }
];

// 마이그레이션된 게시물 저장할 디렉토리
const migrationDir = path.join(__dirname, 'migrated-posts');
const imagesDir = path.join(migrationDir, 'images');

async function ensureDirectories() {
  try {
    await fs.mkdir(migrationDir, { recursive: true });
    await fs.mkdir(imagesDir, { recursive: true });
    console.log('✅ 디렉토리 생성 완료');
  } catch (error) {
    console.error('❌ 디렉토리 생성 실패:', error);
  }
}

async function migrateKoreanUrlPost(page, post) {
  console.log(`\n📝 한글 URL 게시물 마이그레이션 시작: ${post.title.substring(0, 50)}...`);
  
  try {
    // Wix 대시보드로 이동
    console.log(`  ➡️ Wix 대시보드로 이동...`);
    await page.goto(post.dashboardUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 페이지 로딩 대기
    await page.waitForTimeout(3000);
    
    // 게시물 제목으로 검색
    console.log(`  🔍 게시물 검색: ${post.title.substring(0, 30)}...`);
    
    // 검색 필드에 제목 입력
    const searchInput = page.locator('input[placeholder*="검색"], input[data-hook*="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(post.title.substring(0, 20));
      await page.waitForTimeout(2000);
    }
    
    // 게시물 편집 버튼 클릭
    const editButton = page.locator(`text=${post.title.substring(0, 20)}`).locator('..').locator('button:has-text("편집")').first();
    await editButton.click();
    await page.waitForLoadState('networkidle');
    
    // 게시물 제목 추출
    const title = await page.textContent('h1, .blog-post-title, [data-hook="post-title"]').catch(() => post.title);
    console.log(`  📋 제목: ${title}`);
    
    // 게시물 내용 추출 (여러 선택자 시도)
    let content = '';
    const contentSelectors = [
      '.blog-post-content',
      '.post-content',
      '[data-hook="post-content"]',
      '.rich-text-content',
      '.post-body',
      'article',
      '.content'
    ];
    
    for (const selector of contentSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          content = await element.textContent();
          if (content && content.length > 100) {
            console.log(`  📄 내용 추출 성공 (${selector}): ${content.length}자`);
            break;
          }
        }
      } catch (error) {
        // 무시하고 다음 선택자 시도
      }
    }
    
    if (!content || content.length < 100) {
      console.log(`  ⚠️ 내용 추출 실패, 기본 내용 사용`);
      content = `${title}\n\nMASGOLF 고반발 드라이버 전문 브랜드입니다. 자세한 내용은 원본 게시물을 참조해주세요.`;
    }
    
    // 게시물 날짜 추출
    const dateElement = await page.$('.blog-post-date, .post-date, [data-hook="post-date"]');
    const publishedDate = dateElement ? await dateElement.textContent() : new Date().toISOString();
    console.log(`  📅 게시일: ${publishedDate}`);
    
    // 이미지 추출
    const images = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt || '',
        width: img.width,
        height: img.height
      })).filter(img => img.src && !img.src.includes('data:image'))
    );
    console.log(`  🖼️ 이미지 수: ${images.length}개`);
    
    // 이미지 다운로드
    const downloadedImages = [];
    for (let i = 0; i < Math.min(images.length, 10); i++) { // 최대 10개만 다운로드
      const img = images[i];
      try {
        const imageName = `post-${post.priority}-image-${i + 1}.jpg`;
        const imagePath = path.join(imagesDir, imageName);
        
        // 이미지 다운로드
        const response = await page.goto(img.src);
        const buffer = await response.body();
        await fs.writeFile(imagePath, buffer);
        
        downloadedImages.push({
          originalSrc: img.src,
          localPath: `/images/${imageName}`,
          alt: img.alt,
          width: img.width,
          height: img.height
        });
        
        console.log(`    ✅ 이미지 다운로드: ${imageName}`);
      } catch (error) {
        console.log(`    ❌ 이미지 다운로드 실패: ${img.src}`);
      }
    }
    
    // 마이그레이션된 게시물 데이터 생성
    const migratedPost = {
      id: post.priority,
      title: title,
      slug: post.slug,
      content: content,
      excerpt: content.substring(0, 200) + '...',
      featured_image: downloadedImages[0]?.localPath || '/images/default-golf-driver.jpg',
      meta_title: `${title} | MASGOLF High-Rebound Driver`,
      meta_description: content.substring(0, 160) + '...',
      keywords: ['고반발 드라이버', '골프 드라이버', 'MASGOLF', '드라이버 피팅', '비거리 향상'],
      category: 'golf-driver',
      tags: ['고반발드라이버', '골프드라이버', 'MASGOLF', '드라이버피팅'],
      author: '마쓰구골프',
      published_at: publishedDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'published',
      images: downloadedImages,
      original_url: post.dashboardUrl,
      migration_source: 'wix-dashboard'
    };
    
    // JSON 파일로 저장
    const postFile = path.join(migrationDir, `post-${post.priority}-${post.slug}.json`);
    await fs.writeFile(postFile, JSON.stringify(migratedPost, null, 2), 'utf8');
    
    console.log(`  ✅ 게시물 마이그레이션 완료: ${postFile}`);
    return migratedPost;
    
  } catch (error) {
    console.error(`  ❌ 게시물 마이그레이션 실패: ${error.message}`);
    return null;
  }
}

async function migrateKoreanUrlPosts() {
  let browser;
  try {
    console.log('🚀 한글 URL 게시물 마이그레이션 시작...');
    
    // 디렉토리 생성
    await ensureDirectories();
    
    // Chrome Canary 연결
    console.log('🔗 Chrome Canary 연결 중...');
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();
    
    // User-Agent 설정
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    console.log('✅ Chrome Canary 연결 완료');
    console.log('📋 마이그레이션할 게시물 수:', koreanUrlPosts.length);
    console.log('⚠️ Wix 대시보드에 로그인이 필요할 수 있습니다.');
    console.log('💡 로그인이 필요하면 브라우저에서 직접 로그인해주세요.');
    
    // 각 게시물 마이그레이션
    const migratedPosts = [];
    for (const post of koreanUrlPosts) {
      const migratedPost = await migrateKoreanUrlPost(page, post);
      if (migratedPost) {
        migratedPosts.push(migratedPost);
      }
      
      // 다음 게시물로 이동하기 전 잠시 대기
      await page.waitForTimeout(3000);
    }
    
    // 전체 마이그레이션 결과 저장
    const summaryFile = path.join(migrationDir, 'korean-url-migration-summary.json');
    await fs.writeFile(summaryFile, JSON.stringify({
      total_posts: koreanUrlPosts.length,
      migrated_posts: migratedPosts.length,
      failed_posts: koreanUrlPosts.length - migratedPosts.length,
      migrated_at: new Date().toISOString(),
      posts: migratedPosts
    }, null, 2), 'utf8');
    
    console.log('\n🎉 한글 URL 게시물 마이그레이션 완료!');
    console.log(`📊 총 게시물: ${koreanUrlPosts.length}개`);
    console.log(`✅ 성공: ${migratedPosts.length}개`);
    console.log(`❌ 실패: ${koreanUrlPosts.length - migratedPosts.length}개`);
    console.log(`📁 저장 위치: ${migrationDir}`);
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
  } finally {
    if (browser) {
      console.log('✨ 브라우저 연결 유지 (수동 확인 가능)');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateKoreanUrlPosts()
    .then(() => {
      console.log('\n🚀 한글 URL 게시물 마이그레이션 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { migrateKoreanUrlPosts };
