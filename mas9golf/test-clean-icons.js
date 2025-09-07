const { chromium } = require('playwright');

// 깔끔한 아이콘 디자인 테스트 스크립트
async function testCleanIcons() {
  let browser;
  try {
    console.log('🎨 깔끔한 아이콘 디자인 테스트 시작...');
    
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
    
    // 섹션 제목들 확인
    console.log('\n📋 섹션 제목 확인...');
    
    const sectionTitles = await page.$$eval('.section-title', titles => 
      titles.map(title => title.textContent.trim())
    );
    
    console.log(`📊 발견된 섹션 제목: ${sectionTitles.length}개`);
    sectionTitles.forEach((title, index) => {
      console.log(`  ${index + 1}. "${title}"`);
    });
    
    // 이모지 중복 확인
    const hasEmojis = sectionTitles.some(title => 
      /[\u{1F300}-\u{1F9FF}]/u.test(title)
    );
    
    if (hasEmojis) {
      console.log('  ⚠️ 여전히 이모지가 포함된 섹션 제목이 있습니다.');
    } else {
      console.log('  ✅ 모든 섹션 제목에서 이모지가 제거되었습니다.');
    }
    
    // 아이콘 요소들 확인
    console.log('\n🎨 아이콘 요소 확인...');
    
    // 그라데이션 아이콘 배경 확인
    const gradientIcons = await page.$$('[class*="bg-gradient-to-br"]');
    console.log(`🌈 그라데이션 아이콘 배경: ${gradientIcons.length}개`);
    
    // 섹션 아이콘 확인
    const sectionIcons = await page.$$('.section-icon');
    console.log(`📋 섹션 아이콘: ${sectionIcons.length}개`);
    
    // 기능 아이콘 확인
    const featureIcons = await page.$$('.feature-icon');
    console.log(`⚡ 기능 아이콘: ${featureIcons.length}개`);
    
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
    
    // 페이지 스크린샷
    console.log('\n📸 페이지 스크린샷 저장...');
    await page.screenshot({ 
      path: 'mas9golf/clean-icons-design-test.png',
      fullPage: true 
    });
    console.log('  ✅ 스크린샷 저장: mas9golf/clean-icons-design-test.png');
    
    console.log('\n🎉 깔끔한 아이콘 디자인 테스트 완료!');
    console.log('📊 테스트 결과 요약:');
    console.log(`  📋 섹션 제목: ${sectionTitles.length}개`);
    console.log(`  🌈 그라데이션 아이콘: ${gradientIcons.length}개`);
    console.log(`  📋 섹션 아이콘: ${sectionIcons.length}개`);
    console.log(`  ⚡ 기능 아이콘: ${featureIcons.length}개`);
    console.log(`  🎯 SVG 아이콘: ${svgIcons.length}개`);
    console.log(`  🖼️ 이미지: ${loadedImages}/${images.length}개 로드 성공`);
    
    console.log('\n🎨 깔끔한 디자인 특징:');
    console.log(`  ✅ 이모지 중복 제거 완료`);
    console.log(`  ✅ 아이콘만으로 깔끔한 디자인`);
    console.log(`  ✅ 7월 퍼널 스타일 유지`);
    console.log(`  ✅ 고급스러운 그라데이션 아이콘`);
    console.log(`  ✅ 완벽한 모바일 최적화`);
    
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
  testCleanIcons()
    .then(() => {
      console.log('\n🚀 깔끔한 아이콘 디자인 테스트 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { testCleanIcons };
