const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// 첫 번째 게시물 마이그레이션 스크립트
async function migrateFirstPost() {
  let browser;
  try {
    console.log('🚀 첫 번째 게시물 마이그레이션 시작...');
    
    // Chrome Canary 연결
    console.log('🔗 Chrome Canary 연결 중...');
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();
    
    // User-Agent 설정
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    console.log('✅ Chrome Canary 연결 완료');
    
    // 첫 번째 게시물 URL (스크린샷에서 확인된 URL)
    const postUrl = 'https://mas9golf.com/post/뜨거운-여름-완벽한-스윙-로얄살루트-증정-행사';
    console.log(`\n📝 게시물 마이그레이션: ${postUrl}`);
    
    // 게시물 페이지로 이동
    console.log('  ➡️ 게시물 페이지로 이동...');
    await page.goto(postUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 게시물 정보 추출
    console.log('  📋 게시물 정보 추출 중...');
    
    // 제목 추출
    const title = await page.$eval('h1, .post-title, [data-testid="post-title"]', el => el.textContent.trim()).catch(() => {
      return page.$eval('title', el => el.textContent.replace(' | MASGOLF', '').trim());
    });
    
    console.log(`  📄 제목: "${title}"`);
    
    // 게시일 추출
    const publishedDate = await page.$eval('.post-date, .published-date, [data-testid="post-date"]', el => el.textContent.trim()).catch(() => {
      return new Date().toISOString();
    });
    
    console.log(`  📅 게시일: ${publishedDate}`);
    
    // 콘텐츠 추출
    const content = await page.$eval('.post-content, .blog-post-content, [data-testid="post-content"]', el => el.innerHTML).catch(() => {
      return page.$eval('body', el => el.innerHTML);
    });
    
    console.log(`  📝 콘텐츠 길이: ${content.length}자`);
    
    // 이미지 추출
    const images = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt || '',
        width: img.width,
        height: img.height,
        className: img.className || ''
      })).filter(img => {
        // 로고나 작은 아이콘이 아닌 실제 콘텐츠 이미지 필터링
        return img.src && 
               !img.src.includes('logo') && 
               !img.src.includes('icon') &&
               !img.alt.toLowerCase().includes('logo') &&
               img.width > 200 && 
               img.height > 200 &&
               !img.src.includes('data:image');
      })
    );
    
    console.log(`  🖼️ 콘텐츠 이미지 수: ${images.length}개`);
    
    // SEO 최적화된 슬러그 생성
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    console.log(`  🔗 생성된 슬러그: ${slug}`);
    
    // 게시물 데이터 생성
    const postData = {
      id: 1,
      title: title,
      slug: slug,
      content: content,
      excerpt: title.substring(0, 150) + '...',
      featured_image: '',
      meta_title: `${title} | MASGOLF High-Rebound Driver`,
      meta_description: title.substring(0, 150) + '...',
      keywords: ['고반발 드라이버', '골프 드라이버', 'MASGOLF', '드라이버 피팅', '비거리 향상'],
      category: 'golf-driver',
      tags: ['고반발드라이버', '골프드라이버', 'MASGOLF', '드라이버피팅'],
      author: '마쓰구골프',
      published_at: publishedDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'published',
      images: [],
      original_url: postUrl,
      migration_source: 'wix-manual'
    };
    
    // 이미지 다운로드 및 경로 업데이트
    if (images.length > 0) {
      console.log('  📸 이미지 다운로드 중...');
      
      // 첫 번째 이미지를 featured_image로 사용
      const featuredImage = images[0];
      const featuredImageName = `post-1-featured.jpg`;
      const featuredImagePath = path.join(__dirname, 'migrated-posts', 'images', featuredImageName);
      
      try {
        const response = await page.goto(featuredImage.src);
        const buffer = await response.body();
        await fs.writeFile(featuredImagePath, buffer);
        
        postData.featured_image = `/mas9golf/blog/images/${featuredImageName}`;
        console.log(`  ✅ Featured Image 다운로드 완료: ${featuredImageName}`);
        
      } catch (error) {
        console.log(`  ❌ Featured Image 다운로드 실패: ${error.message}`);
      }
      
      // 갤러리 이미지들 다운로드
      const galleryImages = images.slice(1, 6);
      const galleryPaths = [];
      
      for (let i = 0; i < galleryImages.length; i++) {
        const img = galleryImages[i];
        const galleryImageName = `post-1-gallery-${i + 1}.jpg`;
        const galleryImagePath = path.join(__dirname, 'migrated-posts', 'images', galleryImageName);
        
        try {
          const response = await page.goto(img.src);
          const buffer = await response.body();
          await fs.writeFile(galleryImagePath, buffer);
          
          galleryPaths.push({
            originalSrc: img.src,
            localPath: `/mas9golf/blog/images/${galleryImageName}`,
            alt: img.alt,
            width: img.width,
            height: img.height
          });
          
          console.log(`  ✅ 갤러리 이미지 ${i + 1} 다운로드 완료: ${galleryImageName}`);
          
        } catch (error) {
          console.log(`  ❌ 갤러리 이미지 ${i + 1} 다운로드 실패: ${error.message}`);
        }
      }
      
      postData.images = galleryPaths;
    }
    
    // 게시물 데이터 저장
    const postFilePath = path.join(__dirname, 'migrated-posts', `post-1-${slug}.json`);
    await fs.writeFile(postFilePath, JSON.stringify(postData, null, 2), 'utf8');
    
    console.log(`  ✅ 게시물 데이터 저장 완료: post-1-${slug}.json`);
    
    console.log('\n🎉 첫 번째 게시물 마이그레이션 완료!');
    console.log('📊 마이그레이션 결과:');
    console.log(`  📄 제목: ${title}`);
    console.log(`  🔗 슬러그: ${slug}`);
    console.log(`  🖼️ 이미지: ${images.length}개`);
    console.log(`  📁 저장 위치: ${postFilePath}`);
    
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
  migrateFirstPost()
    .then(() => {
      console.log('\n🚀 첫 번째 게시물 마이그레이션 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { migrateFirstPost };
