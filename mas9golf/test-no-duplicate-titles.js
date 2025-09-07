const { chromium } = require('playwright');

// 중복 제목 제거 테스트 스크립트
async function testNoDuplicateTitles() {
  let browser;
  try {
    console.log('🧪 중복 제목 제거 테스트 시작...');
    
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
    
    // h1 태그 개수 확인
    const h1Elements = await page.$$('h1');
    console.log(`📊 h1 태그 개수: ${h1Elements.length}개`);
    
    if (h1Elements.length > 0) {
      for (let i = 0; i < h1Elements.length; i++) {
        const h1Text = await h1Elements[i].textContent();
        console.log(`  h1 ${i + 1}: "${h1Text}"`);
      }
    }
    
    // h2 태그 개수 확인
    const h2Elements = await page.$$('h2');
    console.log(`📊 h2 태그 개수: ${h2Elements.length}개`);
    
    if (h2Elements.length > 0) {
      for (let i = 0; i < h2Elements.length; i++) {
        const h2Text = await h2Elements[i].textContent();
        console.log(`  h2 ${i + 1}: "${h2Text}"`);
      }
    }
    
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
    
    // 콘텐츠 섹션 확인
    console.log('\n📝 콘텐츠 섹션 확인 중...');
    
    const sections = await page.$$eval('h2', headings => 
      headings.map(h => h.textContent.trim())
    ).catch(() => []);
    
    console.log(`📋 발견된 섹션: ${sections.length}개`);
    sections.forEach((section, index) => {
      console.log(`  ${index + 1}. ${section}`);
    });
    
    // 공유 버튼 확인
    const shareButtons = await page.$$('.share-btn');
    console.log(`📤 공유 버튼: ${shareButtons.length}개`);
    
    // 페이지 스크린샷
    console.log('\n📸 페이지 스크린샷 저장...');
    await page.screenshot({ 
      path: 'mas9golf/no-duplicate-titles-test-result.png',
      fullPage: true 
    });
    console.log('  ✅ 스크린샷 저장: mas9golf/no-duplicate-titles-test-result.png');
    
    console.log('\n🎉 중복 제목 제거 테스트 완료!');
    console.log('📊 테스트 결과 요약:');
    console.log(`  ✅ h1 태그: ${h1Elements.length}개 (페이지 헤더에서만)`);
    console.log(`  ✅ h2 태그: ${h2Elements.length}개 (콘텐츠 섹션)`);
    console.log(`  ✅ 이미지: ${loadedImages}/${images.length}개 로드 성공`);
    console.log(`  ✅ 섹션: ${sections.length}개 콘텐츠 섹션`);
    console.log(`  ✅ 공유: ${shareButtons.length}개 공유 버튼`);
    
    if (h1Elements.length === 1) {
      console.log(`  🎯 중복 제목 문제 해결 완료!`);
    } else {
      console.log(`  ⚠️ 여전히 중복 제목이 있을 수 있습니다.`);
    }
    
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
  testNoDuplicateTitles()
    .then(() => {
      console.log('\n🚀 중복 제목 제거 테스트 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { testNoDuplicateTitles };
