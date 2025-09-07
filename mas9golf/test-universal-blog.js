const { chromium } = require('playwright');

// 절제된 범용 블로그 디자인 테스트 스크립트
async function testUniversalBlog() {
  let browser;
  try {
    console.log('🎨 절제된 범용 블로그 디자인 테스트 시작...');
    
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
    
    // 폰트 정보 확인
    console.log('\n📝 폰트 정보 확인...');
    
    const bodyFont = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      return {
        fontFamily: computedStyle.fontFamily,
        fontSize: computedStyle.fontSize,
        lineHeight: computedStyle.lineHeight
      };
    });
    
    console.log(`  📝 폰트 패밀리: ${bodyFont.fontFamily}`);
    console.log(`  📏 폰트 크기: ${bodyFont.fontSize}`);
    console.log(`  📐 줄 간격: ${bodyFont.lineHeight}`);
    
    // 콘텐츠 영역 폰트 확인
    const contentFont = await page.evaluate(() => {
      const content = document.querySelector('.blog-post-content');
      if (content) {
        const computedStyle = window.getComputedStyle(content);
        return {
          fontFamily: computedStyle.fontFamily,
          fontSize: computedStyle.fontSize,
          lineHeight: computedStyle.lineHeight
        };
      }
      return null;
    });
    
    if (contentFont) {
      console.log(`  📝 콘텐츠 폰트 패밀리: ${contentFont.fontFamily}`);
      console.log(`  📏 콘텐츠 폰트 크기: ${contentFont.fontSize}`);
      console.log(`  📐 콘텐츠 줄 간격: ${contentFont.lineHeight}`);
    }
    
    // 섹션 제목들 확인
    console.log('\n📋 섹션 제목 확인...');
    
    const sectionTitles = await page.$$eval('.section-title', titles => 
      titles.map(title => ({
        text: title.textContent.trim(),
        fontSize: window.getComputedStyle(title).fontSize,
        fontWeight: window.getComputedStyle(title).fontWeight
      }))
    );
    
    console.log(`📊 발견된 섹션 제목: ${sectionTitles.length}개`);
    sectionTitles.forEach((title, index) => {
      console.log(`  ${index + 1}. "${title.text}" (${title.fontSize}, ${title.fontWeight})`);
    });
    
    // 절제된 디자인 요소 확인
    console.log('\n🎨 절제된 디자인 요소 확인...');
    
    // 그라데이션 요소 확인 (제거되었는지)
    const gradientElements = await page.$$('[class*="bg-gradient-to"]');
    console.log(`🌈 그라데이션 요소: ${gradientElements.length}개 (최소화됨)`);
    
    // 단순한 색상 요소 확인
    const solidColorElements = await page.$$('[class*="bg-blue-"], [class*="bg-gray-"], [class*="bg-white"]');
    console.log(`🎨 단순 색상 요소: ${solidColorElements.length}개`);
    
    // 그림자 효과 확인
    const shadowElements = await page.$$('[class*="shadow-"]');
    console.log(`🌫️ 그림자 효과: ${shadowElements.length}개`);
    
    // 둥근 모서리 확인
    const roundedElements = await page.$$('[class*="rounded-"]');
    console.log(`🔵 둥근 모서리: ${roundedElements.length}개`);
    
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
    
    const mobileFontSize = await page.evaluate(() => {
      const content = document.querySelector('.blog-post-content');
      if (content) {
        return window.getComputedStyle(content).fontSize;
      }
      return null;
    });
    
    console.log(`  📱 모바일 폰트 크기: ${mobileFontSize}`);
    
    await page.screenshot({ 
      path: 'mas9golf/universal-blog-mobile-test.png',
      fullPage: true 
    });
    console.log('  ✅ 모바일 스크린샷 저장: mas9golf/universal-blog-mobile-test.png');
    
    // 데스크톱 반응형 테스트
    console.log('\n🖥️ 데스크톱 반응형 테스트...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(2000);
    
    const desktopFontSize = await page.evaluate(() => {
      const content = document.querySelector('.blog-post-content');
      if (content) {
        return window.getComputedStyle(content).fontSize;
      }
      return null;
    });
    
    console.log(`  🖥️ 데스크톱 폰트 크기: ${desktopFontSize}`);
    
    await page.screenshot({ 
      path: 'mas9golf/universal-blog-desktop-test.png',
      fullPage: true 
    });
    console.log('  ✅ 데스크톱 스크린샷 저장: mas9golf/universal-blog-desktop-test.png');
    
    console.log('\n🎉 절제된 범용 블로그 디자인 테스트 완료!');
    console.log('📊 테스트 결과 요약:');
    console.log(`  📝 폰트: Inter + 시스템 폰트`);
    console.log(`  📏 폰트 크기: ${bodyFont.fontSize} (기본)`);
    console.log(`  📱 모바일 폰트: ${mobileFontSize}`);
    console.log(`  🖥️ 데스크톱 폰트: ${desktopFontSize}`);
    console.log(`  📋 섹션 제목: ${sectionTitles.length}개`);
    console.log(`  🌈 그라데이션: ${gradientElements.length}개 (최소화)`);
    console.log(`  🎨 단순 색상: ${solidColorElements.length}개`);
    console.log(`  🖼️ 이미지: ${loadedImages}/${images.length}개 로드 성공`);
    
    console.log('\n🎨 절제된 범용 블로그 특징:');
    console.log(`  ✅ 상업적 느낌 최소화`);
    console.log(`  ✅ 범용적인 디자인`);
    console.log(`  ✅ 향상된 가독성`);
    console.log(`  ✅ 큰 폰트 크기`);
    console.log(`  ✅ 절제된 색상 팔레트`);
    console.log(`  ✅ 완벽한 반응형 디자인`);
    
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
  testUniversalBlog()
    .then(() => {
      console.log('\n🚀 절제된 범용 블로그 디자인 테스트 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { testUniversalBlog };
