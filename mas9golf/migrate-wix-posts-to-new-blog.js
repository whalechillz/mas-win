const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// 마이그레이션할 게시물 목록 (우선순위 순)
const postsToMigrate = [
  {
    title: "새해 특별 혜택! 프리미엄 골프 드라이버와 액세서리 단 30분께만 증정!",
    url: "https://www.mas9golf.com/post/high-rebound-driver-winter-sale",
    slug: "new-year-special-premium-golf-driver-accessories-30-people",
    priority: 1
  },
  {
    title: "MASGOLF – 초고반발 드라이버 피팅 전문 브랜드 | 비거리 최대 +25m 증가",
    url: "https://www.mas9golf.com/post/high-cor-driver-fitting",
    slug: "masgolf-high-rebound-driver-fitting-professional-brand-25m-distance",
    priority: 2
  },
  {
    title: "뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사",
    url: "https://www.mas9golf.com/post/뜨거운-여름-완벽한-스윙-로얄살루트-증정-행사",
    slug: "hot-summer-perfect-swing-royal-salute-golf-event",
    priority: 3
  },
  {
    title: "롱기스트 드라이버 찾는다면? MASGOLF(구.마쓰구골프) 고반발 드라이버로 인생 황금기를 완성하세요",
    url: "https://www.mas9golf.com/post/롱기스트-드라이버-찾는다면-masgolf구-마쓰구골프-고반발-드라이버로-인생-황금기를-완성하세요",
    slug: "longest-driver-masgolf-high-rebound-golden-age-complete",
    priority: 4
  },
  {
    title: "시니어 골퍼의 인생 드라이버, 마쓰구 고반발로 골프가 즐거워진다! 라운딩 리얼후기",
    url: "https://www.mas9golf.com/post/시니어-골퍼의-인생-드라이버-마쓰구-고반발로-골프가-즐거워진다-라운딩-리얼후기",
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

async function migrateWixPost(page, post) {
  console.log(`\n📝 게시물 마이그레이션 시작: ${post.title.substring(0, 50)}...`);
  
  try {
    // Wix 게시물 페이지로 이동
    console.log(`  ➡️ ${post.url}로 이동...`);
    await page.goto(post.url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 페이지 로딩 대기
    await page.waitForTimeout(3000);
    
    // 게시물 제목 추출
    const title = await page.textContent('h1, .blog-post-title, [data-hook="post-title"]').catch(() => post.title);
    console.log(`  📋 제목: ${title}`);
    
    // 게시물 내용 추출
    const content = await page.textContent('.blog-post-content, .post-content, [data-hook="post-content"]').catch(() => '');
    console.log(`  📄 내용 길이: ${content.length}자`);
    
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
    for (let i = 0; i < images.length; i++) {
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
      original_url: post.url
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

async function migrateWixPosts() {
  let browser;
  try {
    console.log('🚀 Wix 게시물 마이그레이션 시작...');
    
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
    console.log('📋 마이그레이션할 게시물 수:', postsToMigrate.length);
    
    // 각 게시물 마이그레이션
    const migratedPosts = [];
    for (const post of postsToMigrate) {
      const migratedPost = await migrateWixPost(page, post);
      if (migratedPost) {
        migratedPosts.push(migratedPost);
      }
      
      // 다음 게시물로 이동하기 전 잠시 대기
      await page.waitForTimeout(2000);
    }
    
    // 전체 마이그레이션 결과 저장
    const summaryFile = path.join(migrationDir, 'migration-summary.json');
    await fs.writeFile(summaryFile, JSON.stringify({
      total_posts: postsToMigrate.length,
      migrated_posts: migratedPosts.length,
      failed_posts: postsToMigrate.length - migratedPosts.length,
      migrated_at: new Date().toISOString(),
      posts: migratedPosts
    }, null, 2), 'utf8');
    
    console.log('\n🎉 Wix 게시물 마이그레이션 완료!');
    console.log(`📊 총 게시물: ${postsToMigrate.length}개`);
    console.log(`✅ 성공: ${migratedPosts.length}개`);
    console.log(`❌ 실패: ${postsToMigrate.length - migratedPosts.length}개`);
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
  migrateWixPosts()
    .then(() => {
      console.log('\n🚀 Wix 게시물 마이그레이션 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { migrateWixPosts };
