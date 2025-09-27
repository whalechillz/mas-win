const { chromium } = require('playwright');

async function debugPageContent() {
  let browser;
  try {
    console.log('🚀 페이지 내용 디버깅 시작...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 1. 로컬 관리자 페이지 접속
    console.log('📝 1. 로컬 관리자 페이지 접속...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForTimeout(5000);
    
    // 2. 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);
    
    // 3. 페이지 내용 확인
    const bodyText = await page.textContent('body');
    console.log(`📝 페이지 내용 길이: ${bodyText.length}자`);
    
    // 4. 특정 텍스트 검색
    const searchTerms = [
      '이미지 갤러리',
      '갤러리 열기',
      '웹페이지 이미지 수집',
      '🌐',
      '갤러리',
      '이미지'
    ];
    
    console.log('🔍 4. 특정 텍스트 검색...');
    for (const term of searchTerms) {
      const found = bodyText.includes(term);
      console.log(`  "${term}": ${found ? '✅ 발견' : '❌ 없음'}`);
    }
    
    // 5. 모든 버튼 확인
    const buttons = await page.locator('button').all();
    console.log(`📊 총 버튼 개수: ${buttons.length}개`);
    
    if (buttons.length > 0) {
      console.log('📊 모든 버튼 텍스트:');
      for (let i = 0; i < Math.min(buttons.length, 20); i++) {
        const buttonText = await buttons[i].textContent();
        console.log(`  버튼 ${i + 1}: "${buttonText}"`);
      }
    }
    
    // 6. 페이지 스크린샷 저장
    await page.screenshot({ path: 'debug-page-content.png', fullPage: true });
    console.log('📸 스크린샷 저장 완료: debug-page-content.png');
    
    // 7. 페이지 HTML 일부 확인
    const html = await page.content();
    console.log(`📄 HTML 길이: ${html.length}자`);
    
    // HTML에서 특정 섹션 찾기
    if (html.includes('이미지 갤러리')) {
      console.log('✅ HTML에서 "이미지 갤러리" 텍스트 발견');
    } else {
      console.log('❌ HTML에서 "이미지 갤러리" 텍스트 없음');
    }
    
    console.log('✅ 페이지 내용 디버깅 완료!');
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류 발생:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugPageContent();
