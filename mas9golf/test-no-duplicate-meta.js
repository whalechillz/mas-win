const { chromium } = require('playwright');

// 중복 메타 정보 제거 확인 테스트
async function testNoDuplicateMeta() {
  let browser;
  try {
    console.log('🔍 중복 메타 정보 제거 확인 테스트 시작...');
    
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
    
    // 중복된 메타 정보 확인
    console.log('\n🔍 중복된 메타 정보 확인...');
    
    // "고반발드라이버", "7월 9일", "0분 분량" 텍스트가 중복으로 나타나는지 확인
    const pageText = await page.textContent('body');
    
    const authorCount = (pageText.match(/고반발드라이버/g) || []).length;
    const dateCount = (pageText.match(/7월 9일/g) || []).length;
    const readTimeCount = (pageText.match(/0분 분량/g) || []).length;
    
    console.log(`📊 "고반발드라이버" 출현 횟수: ${authorCount}회`);
    console.log(`📊 "7월 9일" 출현 횟수: ${dateCount}회`);
    console.log(`📊 "0분 분량" 출현 횟수: ${readTimeCount}회`);
    
    if (authorCount <= 1 && dateCount <= 1 && readTimeCount <= 1) {
      console.log('✅ 중복된 메타 정보가 성공적으로 제거되었습니다!');
    } else {
      console.log('❌ 여전히 중복된 메타 정보가 있습니다.');
    }
    
    // 메타 정보 요소들 확인
    console.log('\n📋 메타 정보 요소 확인...');
    
    const metaElements = await page.$$('.post-meta');
    console.log(`📊 .post-meta 클래스 요소: ${metaElements.length}개`);
    
    if (metaElements.length === 0) {
      console.log('✅ 콘텐츠 내 중복된 메타 정보 요소가 제거되었습니다!');
    } else {
      console.log('❌ 콘텐츠 내에 여전히 메타 정보 요소가 있습니다.');
    }
    
    // 헤더의 메타 정보는 유지되는지 확인
    const headerMeta = await page.$('.flex.items-center.gap-6.text-slate-600');
    if (headerMeta) {
      const headerText = await headerMeta.textContent();
      console.log(`📋 헤더 메타 정보: ${headerText.trim()}`);
      console.log('✅ 헤더의 메타 정보는 정상적으로 유지됩니다.');
    }
    
    // 콘텐츠 구조 확인
    console.log('\n📝 콘텐츠 구조 확인...');
    
    const contentSections = await page.$$('.content-section');
    console.log(`📊 콘텐츠 섹션: ${contentSections.length}개`);
    
    const sectionTitles = await page.$$eval('.section-title', titles => 
      titles.map(title => title.textContent.trim())
    );
    
    console.log(`📋 섹션 제목들:`);
    sectionTitles.forEach((title, index) => {
      console.log(`  ${index + 1}. ${title}`);
    });
    
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
    
    console.log(`📊 이미지 로딩 결과: ${loadedImages}/${images.length}개 성공`);
    
    // 최종 스크린샷
    await page.screenshot({ 
      path: 'mas9golf/no-duplicate-meta-test.png',
      fullPage: true 
    });
    console.log('✅ 최종 스크린샷 저장: mas9golf/no-duplicate-meta-test.png');
    
    console.log('\n🎉 중복 메타 정보 제거 확인 테스트 완료!');
    console.log('📊 테스트 결과 요약:');
    console.log(`  📝 "고반발드라이버" 중복: ${authorCount <= 1 ? '제거됨' : '존재'}`);
    console.log(`  📅 "7월 9일" 중복: ${dateCount <= 1 ? '제거됨' : '존재'}`);
    console.log(`  ⏱️ "0분 분량" 중복: ${readTimeCount <= 1 ? '제거됨' : '존재'}`);
    console.log(`  🗑️ 콘텐츠 내 메타 요소: ${metaElements.length}개`);
    console.log(`  📋 콘텐츠 섹션: ${contentSections.length}개`);
    console.log(`  🖼️ 이미지 로딩: ${loadedImages}/${images.length}개 성공`);
    
    if (authorCount <= 1 && dateCount <= 1 && readTimeCount <= 1 && metaElements.length === 0) {
      console.log('\n✅ 모든 중복 메타 정보가 성공적으로 제거되었습니다!');
      console.log('🎨 절제된 범용 블로그 디자인이 완성되었습니다.');
    } else {
      console.log('\n❌ 일부 중복 메타 정보가 여전히 존재합니다.');
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
  testNoDuplicateMeta()
    .then(() => {
      console.log('\n🚀 중복 메타 정보 제거 확인 테스트 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { testNoDuplicateMeta };
