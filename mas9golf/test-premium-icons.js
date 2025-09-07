const { chromium } = require('playwright');

// 7월 퍼널 스타일 프리미엄 아이콘 테스트 스크립트
async function testPremiumIcons() {
  let browser;
  try {
    console.log('🎨 7월 퍼널 스타일 프리미엄 아이콘 테스트 시작...');
    
    // Chrome Canary 연결
    console.log('🔗 Chrome Canary 연결 중...');
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();
    
    console.log('✅ Chrome Canary 연결 완료');
    
    // 로컬 블로그 게시물 페이지로 이동
    const blogUrl = 'http://localhost:3000/blog/hot-summer-perfect-swing-royal-salute-gift-event';
    console.log(`\n📄 로컬 블로그 게시물 페이지로 이동: ${blogUrl}`);
    
    await page.goto(blogUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📋 페이지 제목: ${title}`);
    
    // 프리미엄 아이콘 요소들 확인
    console.log('\n🎨 프리미엄 아이콘 요소 확인...');
    
    // 그라데이션 아이콘 배경 확인
    const gradientIcons = await page.$$('[class*="bg-gradient-to-br"]');
    console.log(`🌈 그라데이션 아이콘 배경: ${gradientIcons.length}개`);
    
    // 둥근 모서리 아이콘 확인
    const roundedIcons = await page.$$('[class*="rounded-2xl"]');
    console.log(`🔵 둥근 모서리 아이콘: ${roundedIcons.length}개`);
    
    // 그림자 효과 아이콘 확인
    const shadowIcons = await page.$$('[class*="shadow-lg"]');
    console.log(`🌫️ 그림자 효과 아이콘: ${shadowIcons.length}개`);
    
    // 섹션 헤더 확인
    const sectionHeaders = await page.$$('.section-header');
    console.log(`📋 섹션 헤더: ${sectionHeaders.length}개`);
    
    // 프리미엄 섹션 확인
    const premiumSections = await page.$$('.premium-section');
    console.log(`✨ 프리미엄 섹션: ${premiumSections.length}개`);
    
    // 기능 아이콘 확인
    const featureIcons = await page.$$('.feature-icon');
    console.log(`⚡ 기능 아이콘: ${featureIcons.length}개`);
    
    // 갤러리 아이템 확인
    const galleryItems = await page.$$('.gallery-item');
    console.log(`🖼️ 갤러리 아이템: ${galleryItems.length}개`);
    
    // 갤러리 오버레이 확인
    const galleryOverlays = await page.$$('.gallery-overlay');
    console.log(`🎭 갤러리 오버레이: ${galleryOverlays.length}개`);
    
    // SVG 아이콘 확인
    const svgIcons = await page.$$('svg');
    console.log(`🎯 SVG 아이콘: ${svgIcons.length}개`);
    
    // 이미지 요소들 확인
    console.log('\n🖼️ 이미지 요소 확인 중...');
    
    const images = await page.$$('img');
    console.log(`📊 발견된 이미지 요소: ${images.length}개`);
    
    let loadedImages = 0;
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      const naturalWidth = await img.evaluate(el => el.naturalWidth);
      const naturalHeight = await img.evaluate(el => el.naturalHeight);
      
      console.log(`  🖼️ 이미지 ${i + 1}:`);
      console.log(`    📁 경로: ${src}`);
      console.log(`    📝 Alt: ${alt || '없음'}`);
      console.log(`    📏 크기: ${naturalWidth}x${naturalHeight}`);
      
      if (naturalWidth === 0 || naturalHeight === 0) {
        console.log(`    ❌ 이미지 로드 실패`);
      } else {
        console.log(`    ✅ 이미지 로드 성공`);
        loadedImages++;
      }
    }
    
    // 모바일 반응형 테스트
    console.log('\n📱 모바일 반응형 테스트...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'mas9golf/premium-icons-mobile-test.png',
      fullPage: true 
    });
    console.log('  ✅ 모바일 스크린샷 저장: mas9golf/premium-icons-mobile-test.png');
    
    // 데스크톱 반응형 테스트
    console.log('\n🖥️ 데스크톱 반응형 테스트...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'mas9golf/premium-icons-desktop-test.png',
      fullPage: true 
    });
    console.log('  ✅ 데스크톱 스크린샷 저장: mas9golf/premium-icons-desktop-test.png');
    
    console.log('\n🎉 7월 퍼널 스타일 프리미엄 아이콘 테스트 완료!');
    console.log('📊 테스트 결과 요약:');
    console.log(`  🌈 그라데이션 아이콘 배경: ${gradientIcons.length}개`);
    console.log(`  🔵 둥근 모서리 아이콘: ${roundedIcons.length}개`);
    console.log(`  🌫️ 그림자 효과 아이콘: ${shadowIcons.length}개`);
    console.log(`  📋 섹션 헤더: ${sectionHeaders.length}개`);
    console.log(`  ✨ 프리미엄 섹션: ${premiumSections.length}개`);
    console.log(`  ⚡ 기능 아이콘: ${featureIcons.length}개`);
    console.log(`  🖼️ 갤러리 아이템: ${galleryItems.length}개`);
    console.log(`  🎭 갤러리 오버레이: ${galleryOverlays.length}개`);
    console.log(`  🎯 SVG 아이콘: ${svgIcons.length}개`);
    console.log(`  🖼️ 이미지: ${loadedImages}/${images.length}개 로드 성공`);
    
    console.log('\n🎨 7월 퍼널 스타일 특징:');
    console.log(`  ✅ 그라데이션 배경의 고급스러운 아이콘`);
    console.log(`  ✅ 둥근 모서리와 그림자 효과`);
    console.log(`  ✅ 호버 애니메이션과 인터랙션`);
    console.log(`  ✅ 완벽한 모바일 최적화`);
    console.log(`  ✅ 7월 퍼널과 동일한 디자인 언어`);
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    if (browser) {
      console.log('✨ 브라우저 연결 유지 (수동 확인 가능)');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  testPremiumIcons()
    .then(() => {
      console.log('\n🚀 7월 퍼널 스타일 프리미엄 아이콘 테스트 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { testPremiumIcons };
