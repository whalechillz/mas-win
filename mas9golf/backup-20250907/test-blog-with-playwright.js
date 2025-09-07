const { chromium } = require('playwright');

async function testBlogWithPlaywright() {
  let browser;
  try {
    console.log('🚀 Playwright로 블로그 페이지 테스트 시작...');
    
    // Chrome Canary 연결
    console.log('🔗 Chrome Canary 연결 중...');
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();
    
    // User-Agent 설정
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    console.log('✅ Chrome Canary 연결 완료');
    
    // 블로그 목록 페이지 테스트
    console.log('\n📋 블로그 목록 페이지 테스트...');
    await page.goto('http://localhost:3000/blog', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`  📄 페이지 제목: ${title}`);
    
    // 게시물 개수 확인
    const postElements = await page.$$('[data-testid="blog-post"], .blog-post, article');
    console.log(`  📊 게시물 개수: ${postElements.length}개`);
    
    // 첫 번째 게시물 링크 클릭
    console.log('\n🔗 첫 번째 게시물 링크 클릭...');
    const firstPostLink = await page.$('a[href*="/blog/"]');
    if (firstPostLink) {
      const href = await firstPostLink.getAttribute('href');
      console.log(`  📝 첫 번째 게시물 URL: ${href}`);
      
      await firstPostLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // 게시물 상세 페이지 확인
      const postTitle = await page.title();
      console.log(`  📄 게시물 제목: ${postTitle}`);
      
      // 이미지 로딩 확인
      console.log('\n🖼️ 이미지 로딩 상태 확인...');
      const images = await page.$$('img');
      console.log(`  📊 총 이미지 개수: ${images.length}개`);
      
      let loadedImages = 0;
      let failedImages = 0;
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const src = await img.getAttribute('src');
        const alt = await img.getAttribute('alt') || 'No alt text';
        
        try {
          // 이미지 로딩 상태 확인
          const isLoaded = await img.evaluate((el) => {
            return el.complete && el.naturalHeight !== 0;
          });
          
          if (isLoaded) {
            loadedImages++;
            console.log(`    ✅ 이미지 ${i + 1}: ${src.substring(0, 50)}... (로딩 성공)`);
          } else {
            failedImages++;
            console.log(`    ❌ 이미지 ${i + 1}: ${src.substring(0, 50)}... (로딩 실패)`);
          }
        } catch (error) {
          failedImages++;
          console.log(`    ❌ 이미지 ${i + 1}: ${src.substring(0, 50)}... (오류: ${error.message})`);
        }
      }
      
      console.log(`\n📊 이미지 로딩 결과:`);
      console.log(`  ✅ 성공: ${loadedImages}개`);
      console.log(`  ❌ 실패: ${failedImages}개`);
      
      // 게시물 내용 확인
      console.log('\n📝 게시물 내용 확인...');
      const content = await page.textContent('main, article, .blog-post-content');
      if (content) {
        console.log(`  📄 내용 길이: ${content.length}자`);
        console.log(`  📝 내용 미리보기: ${content.substring(0, 100)}...`);
      }
      
      // 스크린샷 촬영
      console.log('\n📸 스크린샷 촬영...');
      await page.screenshot({ 
        path: 'mas9golf/blog-test-screenshot.png', 
        fullPage: true 
      });
      console.log('  ✅ 스크린샷 저장: mas9golf/blog-test-screenshot.png');
      
    } else {
      console.log('  ❌ 게시물 링크를 찾을 수 없습니다.');
    }
    
    // 마이그레이션된 게시물 직접 테스트
    console.log('\n🔄 마이그레이션된 게시물 직접 테스트...');
    const migratedPostUrl = 'http://localhost:3000/blog/new-year-special-premium-golf-driver-accessories-30-people';
    await page.goto(migratedPostUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const migratedPostTitle = await page.title();
    console.log(`  📄 마이그레이션된 게시물 제목: ${migratedPostTitle}`);
    
    // 마이그레이션된 게시물의 이미지 확인
    const migratedImages = await page.$$('img');
    console.log(`  📊 마이그레이션된 게시물 이미지 개수: ${migratedImages.length}개`);
    
    let migratedLoadedImages = 0;
    for (let i = 0; i < migratedImages.length; i++) {
      const img = migratedImages[i];
      const src = await img.getAttribute('src');
      
      try {
        const isLoaded = await img.evaluate((el) => {
          return el.complete && el.naturalHeight !== 0;
        });
        
        if (isLoaded) {
          migratedLoadedImages++;
          console.log(`    ✅ 마이그레이션 이미지 ${i + 1}: ${src.substring(0, 50)}... (로딩 성공)`);
        } else {
          console.log(`    ❌ 마이그레이션 이미지 ${i + 1}: ${src.substring(0, 50)}... (로딩 실패)`);
        }
      } catch (error) {
        console.log(`    ❌ 마이그레이션 이미지 ${i + 1}: ${src.substring(0, 50)}... (오류: ${error.message})`);
      }
    }
    
    console.log(`\n📊 마이그레이션된 게시물 이미지 로딩 결과:`);
    console.log(`  ✅ 성공: ${migratedLoadedImages}개`);
    console.log(`  ❌ 실패: ${migratedImages.length - migratedLoadedImages}개`);
    
    // 마이그레이션된 게시물 스크린샷
    await page.screenshot({ 
      path: 'mas9golf/migrated-post-screenshot.png', 
      fullPage: true 
    });
    console.log('  ✅ 마이그레이션된 게시물 스크린샷 저장: mas9golf/migrated-post-screenshot.png');
    
    console.log('\n🎉 Playwright 테스트 완료!');
    
  } catch (error) {
    console.error('❌ Playwright 테스트 중 오류 발생:', error);
  } finally {
    if (browser) {
      console.log('✨ 브라우저 연결 유지 (수동 확인 가능)');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  testBlogWithPlaywright()
    .then(() => {
      console.log('\n🚀 Playwright 블로그 테스트 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { testBlogWithPlaywright };
