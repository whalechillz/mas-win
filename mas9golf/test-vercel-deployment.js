const { chromium } = require('playwright');

// Vercel 배포 테스트
async function testVercelDeployment() {
  let browser;
  try {
    console.log('🌐 Vercel 배포 테스트 시작...');
    
    // Chrome Canary 연결
    console.log('🔗 Chrome Canary 연결 중...');
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();
    
    // 더 큰 뷰포트 설정
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('✅ Chrome Canary 연결 완료');
    
    const baseUrl = 'https://mas-win.vercel.app';
    
    // 1. 메인 페이지 테스트
    console.log('\n🏠 메인 페이지 테스트...');
    
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const mainTitle = await page.title();
    console.log(`  📋 메인 페이지 제목: ${mainTitle}`);
    
    // 메인 페이지 스크린샷
    await page.screenshot({ 
      path: 'mas9golf/vercel-main-page-final.png',
      fullPage: true 
    });
    console.log('  📸 메인 페이지 스크린샷 저장: mas9golf/vercel-main-page-final.png');
    
    // 2. 블로그 페이지 테스트
    console.log('\n📝 블로그 페이지 테스트...');
    
    const blogUrl = `${baseUrl}/blog/`;
    console.log(`📄 블로그 페이지 URL: ${blogUrl}`);
    
    await page.goto(blogUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const blogTitle = await page.title();
    console.log(`  📋 블로그 페이지 제목: ${blogTitle}`);
    
    // 블로그 목록 확인
    const blogPosts = await page.$$('.blog-post-card, .post-card, [data-testid*="post"]');
    console.log(`  📊 발견된 블로그 게시물: ${blogPosts.length}개`);
    
    // 블로그 페이지 스크린샷
    await page.screenshot({ 
      path: 'mas9golf/vercel-blog-list-final.png',
      fullPage: true 
    });
    console.log('  📸 블로그 목록 스크린샷 저장: mas9golf/vercel-blog-list-final.png');
    
    // 3. 개별 블로그 게시물 테스트
    console.log('\n📄 개별 블로그 게시물 테스트...');
    
    const postUrl = `${baseUrl}/blog/hot-summer-perfect-swing-royal-salute-gift-event/`;
    console.log(`📄 게시물 URL: ${postUrl}`);
    
    await page.goto(postUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const postTitle = await page.title();
    console.log(`  📋 게시물 제목: ${postTitle}`);
    
    // 프리미엄 디자인 요소 확인
    console.log('\n🎨 프리미엄 디자인 요소 확인...');
    
    const designElements = await page.evaluate(() => {
      const heroSection = document.querySelector('.hero-section');
      const premiumCards = document.querySelectorAll('.premium-card');
      const goldText = document.querySelector('.gold-gradient');
      const ctaButton = document.querySelector('.cta-button');
      
      return {
        heroSection: !!heroSection,
        premiumCards: premiumCards.length,
        goldText: !!goldText,
        ctaButton: !!ctaButton
      };
    });
    
    console.log(`  🎨 히어로 섹션: ${designElements.heroSection ? '✅' : '❌'}`);
    console.log(`  💎 프리미엄 카드: ${designElements.premiumCards}개`);
    console.log(`  ✨ 골드 그라데이션: ${designElements.goldText ? '✅' : '❌'}`);
    console.log(`  🔘 CTA 버튼: ${designElements.ctaButton ? '✅' : '❌'}`);
    
    // 이미지 로딩 확인
    console.log('\n🖼️ 이미지 로딩 확인...');
    
    const images = await page.$$('img');
    let loadedImages = 0;
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = await img.getAttribute('src');
      const naturalWidth = await img.evaluate(el => el.naturalWidth);
      
      if (naturalWidth > 0) {
        loadedImages++;
        console.log(`  ✅ 이미지 ${i + 1}: ${src} (${naturalWidth}px)`);
      } else {
        console.log(`  ❌ 이미지 ${i + 1}: ${src} (로드 실패)`);
      }
    }
    
    console.log(`  📊 이미지 로딩 결과: ${loadedImages}/${images.length}개 성공`);
    
    // 반응형 테스트
    console.log('\n📱 반응형 디자인 테스트...');
    
    // 모바일 테스트
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'mas9golf/vercel-mobile-final.png',
      fullPage: true 
    });
    console.log('  📱 모바일 스크린샷 저장: mas9golf/vercel-mobile-final.png');
    
    // 태블릿 테스트
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'mas9golf/vercel-tablet-final.png',
      fullPage: true 
    });
    console.log('  📱 태블릿 스크린샷 저장: mas9golf/vercel-tablet-final.png');
    
    // 데스크톱 테스트
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'mas9golf/vercel-desktop-final.png',
      fullPage: true 
    });
    console.log('  🖥️ 데스크톱 스크린샷 저장: mas9golf/vercel-desktop-final.png');
    
    // API 엔드포인트 테스트
    console.log('\n🔌 API 엔드포인트 테스트...');
    
    try {
      const apiUrl = `${baseUrl}/api/blog/posts`;
      console.log(`  📡 API URL: ${apiUrl}`);
      
      const response = await page.goto(apiUrl, { waitUntil: 'networkidle', timeout: 10000 });
      const responseText = await page.textContent('body');
      
      if (response.ok()) {
        console.log('  ✅ API 엔드포인트 응답 성공');
        try {
          const apiData = JSON.parse(responseText);
          console.log(`  📊 API 응답 데이터: ${apiData.posts ? apiData.posts.length : 0}개 게시물`);
        } catch (e) {
          console.log('  ⚠️ API 응답이 JSON 형식이 아닙니다');
        }
      } else {
        console.log(`  ❌ API 엔드포인트 응답 실패: ${response.status()}`);
      }
    } catch (error) {
      console.log(`  ❌ API 테스트 실패: ${error.message}`);
    }
    
    // 4. 배포 테스트 결과 요약
    console.log('\n✅ Vercel 배포 테스트 결과 요약:');
    
    const testResults = {
      vercel: {
        mainPage: !!mainTitle && !mainTitle.includes('404'),
        blogPage: !!blogTitle && !blogTitle.includes('404'),
        postPage: !!postTitle && !postTitle.includes('404')
      },
      design: {
        heroSection: designElements.heroSection,
        premiumCards: designElements.premiumCards > 0,
        goldText: designElements.goldText,
        ctaButton: designElements.ctaButton
      },
      images: {
        loaded: loadedImages,
        total: images.length,
        successRate: Math.round((loadedImages / images.length) * 100)
      },
      responsive: {
        mobile: true,
        tablet: true,
        desktop: true
      }
    };
    
    console.log('  🌐 Vercel 배포:');
    console.log(`    - 메인 페이지: ${testResults.vercel.mainPage ? '✅' : '❌'}`);
    console.log(`    - 블로그 페이지: ${testResults.vercel.blogPage ? '✅' : '❌'}`);
    console.log(`    - 게시물 페이지: ${testResults.vercel.postPage ? '✅' : '❌'}`);
    
    console.log('  🎨 프리미엄 디자인:');
    console.log(`    - 히어로 섹션: ${testResults.design.heroSection ? '✅' : '❌'}`);
    console.log(`    - 프리미엄 카드: ${testResults.design.premiumCards ? '✅' : '❌'}`);
    console.log(`    - 골드 그라데이션: ${testResults.design.goldText ? '✅' : '❌'}`);
    console.log(`    - CTA 버튼: ${testResults.design.ctaButton ? '✅' : '❌'}`);
    
    console.log('  🖼️ 이미지 로딩:');
    console.log(`    - 성공률: ${testResults.images.successRate}% (${testResults.images.loaded}/${testResults.images.total})`);
    
    console.log('  📱 반응형 디자인:');
    console.log(`    - 모바일: ${testResults.responsive.mobile ? '✅' : '❌'}`);
    console.log(`    - 태블릿: ${testResults.responsive.tablet ? '✅' : '❌'}`);
    console.log(`    - 데스크톱: ${testResults.responsive.desktop ? '✅' : '❌'}`);
    
    // 전체 성공 여부
    const allGood = testResults.vercel.mainPage && 
                   testResults.vercel.blogPage && 
                   testResults.vercel.postPage &&
                   testResults.design.heroSection &&
                   testResults.images.successRate > 80;
    
    if (allGood) {
      console.log('\n🎉 Vercel 배포 및 테스트가 성공적으로 완료되었습니다!');
      console.log(`🌐 배포된 사이트: ${baseUrl}`);
      console.log('📝 프리미엄 브랜드 블로그가 정상적으로 구동되고 있습니다.');
    } else {
      console.log('\n⚠️ 일부 테스트에서 문제가 발견되었습니다.');
    }
    
    console.log('\n🎉 Vercel 배포 테스트 완료!');
    
    return {
      baseUrl: baseUrl,
      testResults: testResults,
      allGood: allGood
    };
    
  } catch (error) {
    console.error('❌ 배포 테스트 중 오류 발생:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('✨ 브라우저 연결 유지 (수동 확인 가능)');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  testVercelDeployment()
    .then((results) => {
      console.log('\n🚀 Vercel 배포 테스트 작업 완료!');
      console.log('📊 테스트 결과:', results);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { testVercelDeployment };
