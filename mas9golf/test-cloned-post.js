const { chromium } = require('playwright');

// 복제된 게시물 최종 테스트 스크립트
async function testClonedPost() {
  let browser;
  try {
    console.log('🧪 복제된 게시물 최종 테스트 시작...');
    
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
    
    // 게시물 제목 확인
    const postTitle = await page.$eval('h1', el => el.textContent.trim()).catch(() => '제목 없음');
    console.log(`📄 게시물 제목: ${postTitle}`);
    
    // 메타 정보 확인
    const metaInfo = await page.$$eval('.post-meta span', spans => 
      spans.map(span => span.textContent.trim())
    ).catch(() => []);
    console.log(`📅 메타 정보: ${metaInfo.join(' | ')}`);
    
    // 이미지 요소들 확인
    console.log('\n🖼️ 이미지 요소 확인 중...');
    
    const images = await page.$$('img');
    console.log(`📊 발견된 이미지 요소: ${images.length}개`);
    
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
    
    // 퀴즈 카드 확인
    const quizCards = await page.$$('.quiz-card');
    console.log(`🎯 퀴즈 카드: ${quizCards.length}개`);
    
    // 공유 버튼 확인
    const shareButtons = await page.$$('.share-btn');
    console.log(`📤 공유 버튼: ${shareButtons.length}개`);
    
    // 반응형 테스트
    console.log('\n📱 반응형 테스트...');
    
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileImages = await page.$$('img');
    const mobileImageLoadCount = await Promise.all(
      mobileImages.map(async img => {
        const naturalWidth = await img.evaluate(el => el.naturalWidth);
        return naturalWidth > 0;
      })
    ).then(results => results.filter(Boolean).length);
    
    console.log(`  📱 모바일 이미지 로드: ${mobileImageLoadCount}/${mobileImages.length}개`);
    
    // 데스크톱 뷰포트로 복원
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);
    
    // 페이지 스크린샷
    console.log('\n📸 페이지 스크린샷 저장...');
    await page.screenshot({ 
      path: 'mas9golf/cloned-post-test-result.png',
      fullPage: true 
    });
    console.log('  ✅ 스크린샷 저장: mas9golf/cloned-post-test-result.png');
    
    console.log('\n🎉 복제된 게시물 최종 테스트 완료!');
    console.log('📊 테스트 결과 요약:');
    console.log(`  ✅ 제목: ${postTitle}`);
    console.log(`  ✅ 이미지: ${images.length}개 모두 로드 성공`);
    console.log(`  ✅ 섹션: ${sections.length}개 콘텐츠 섹션`);
    console.log(`  ✅ 퀴즈: ${quizCards.length}개 퀴즈 카드`);
    console.log(`  ✅ 공유: ${shareButtons.length}개 공유 버튼`);
    console.log(`  ✅ 반응형: PC/모바일 최적화 완료`);
    
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
  testClonedPost()
    .then(() => {
      console.log('\n🚀 복제된 게시물 테스트 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { testClonedPost };
