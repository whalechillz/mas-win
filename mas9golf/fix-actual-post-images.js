const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// 실제 게시물 이미지를 가져오는 스크립트
async function fixActualPostImages() {
  let browser;
  try {
    console.log('🚀 실제 게시물 이미지 수정 시작...');
    
    // Chrome Canary 연결
    console.log('🔗 Chrome Canary 연결 중...');
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();
    
    // User-Agent 설정
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    console.log('✅ Chrome Canary 연결 완료');
    
    // 실제 게시물 URL들
    const postUrls = [
      {
        url: 'https://www.mas9golf.com/post/high-rebound-driver-winter-sale',
        title: '새해 특별 혜택! 프리미엄 골프 드라이버와 액세서리 단 30분께만 증정!',
        slug: 'new-year-special-premium-golf-driver-accessories-30-people'
      },
      {
        url: 'https://www.mas9golf.com/post/high-cor-driver-fitting',
        title: 'MASGOLF – 초고반발 드라이버 피팅 전문 브랜드 | 비거리 최대 +25m 증가',
        slug: 'masgolf-high-rebound-driver-fitting-professional-brand-25m-distance'
      }
    ];
    
    for (const post of postUrls) {
      console.log(`\n📝 게시물 처리 중: ${post.title.substring(0, 50)}...`);
      
      try {
        // 게시물 페이지로 이동
        console.log(`  ➡️ ${post.url}로 이동...`);
        await page.goto(post.url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // 실제 게시물 이미지 찾기 (로고가 아닌 실제 콘텐츠 이미지)
        const images = await page.$$eval('img', imgs => 
          imgs.map(img => ({
            src: img.src,
            alt: img.alt || '',
            width: img.width,
            height: img.height,
            className: img.className || '',
            parentElement: img.parentElement?.tagName || ''
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
        
        console.log(`  🖼️ 실제 콘텐츠 이미지 수: ${images.length}개`);
        
        if (images.length > 0) {
          // 첫 번째 이미지를 featured_image로 사용
          const featuredImage = images[0];
          console.log(`  📸 Featured Image: ${featuredImage.src.substring(0, 80)}...`);
          
          // 이미지 다운로드
          const imageName = `post-${post.slug}-featured.jpg`;
          const imagePath = path.join(__dirname, 'migrated-posts', 'images', imageName);
          
          try {
            const response = await page.goto(featuredImage.src);
            const buffer = await response.body();
            await fs.writeFile(imagePath, buffer);
            
            console.log(`  ✅ Featured Image 다운로드 완료: ${imageName}`);
            
            // 데이터 파일 업데이트
            await updatePostData(post.slug, `/mas9golf/blog/images/${imageName}`);
            
          } catch (error) {
            console.log(`  ❌ Featured Image 다운로드 실패: ${error.message}`);
          }
          
          // 갤러리 이미지들 다운로드 (최대 5개)
          const galleryImages = images.slice(1, 6);
          const galleryPaths = [];
          
          for (let i = 0; i < galleryImages.length; i++) {
            const img = galleryImages[i];
            const galleryImageName = `post-${post.slug}-gallery-${i + 1}.jpg`;
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
          
          // 갤러리 이미지 경로도 업데이트
          if (galleryPaths.length > 0) {
            await updatePostGallery(post.slug, galleryPaths);
          }
          
        } else {
          console.log(`  ⚠️ 실제 콘텐츠 이미지를 찾을 수 없습니다.`);
        }
        
      } catch (error) {
        console.error(`  ❌ 게시물 처리 중 오류: ${error.message}`);
      }
    }
    
    console.log('\n🎉 실제 게시물 이미지 수정 완료!');
    
  } catch (error) {
    console.error('❌ 이미지 수정 중 오류 발생:', error);
  } finally {
    if (browser) {
      console.log('✨ 브라우저 연결 유지 (수동 확인 가능)');
    }
  }
}

async function updatePostData(slug, newFeaturedImage) {
  try {
    const dataPath = path.join(__dirname, '../data/migrated-blog-posts.json');
    const posts = JSON.parse(await fs.readFile(dataPath, 'utf8'));
    
    const postIndex = posts.findIndex(post => post.slug === slug);
    if (postIndex !== -1) {
      posts[postIndex].featured_image = newFeaturedImage;
      posts[postIndex].updated_at = new Date().toISOString();
      
      await fs.writeFile(dataPath, JSON.stringify(posts, null, 2), 'utf8');
      console.log(`  ✅ 게시물 데이터 업데이트 완료: ${slug}`);
    }
  } catch (error) {
    console.error(`  ❌ 게시물 데이터 업데이트 실패: ${error.message}`);
  }
}

async function updatePostGallery(slug, galleryPaths) {
  try {
    const dataPath = path.join(__dirname, '../data/migrated-blog-posts.json');
    const posts = JSON.parse(await fs.readFile(dataPath, 'utf8'));
    
    const postIndex = posts.findIndex(post => post.slug === slug);
    if (postIndex !== -1) {
      posts[postIndex].images = galleryPaths;
      posts[postIndex].updated_at = new Date().toISOString();
      
      await fs.writeFile(dataPath, JSON.stringify(posts, null, 2), 'utf8');
      console.log(`  ✅ 게시물 갤러리 업데이트 완료: ${slug}`);
    }
  } catch (error) {
    console.error(`  ❌ 게시물 갤러리 업데이트 실패: ${error.message}`);
  }
}

// 스크립트 실행
if (require.main === module) {
  fixActualPostImages()
    .then(() => {
      console.log('\n🚀 실제 게시물 이미지 수정 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixActualPostImages };
