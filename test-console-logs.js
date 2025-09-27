const { chromium } = require('playwright');

async function testConsoleLogs() {
  let browser;
  try {
    console.log('🚀 콘솔 로그 확인 테스트 시작...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 콘솔 메시지 수집
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });

    // 1. 관리자 페이지 접속
    console.log('📝 1. 관리자 페이지 접속...');
    await page.goto('https://win.masgolf.co.kr/admin/blog');
    await page.waitForTimeout(3000);
    
    // 2. 첫 번째 게시물 수정 버튼 클릭
    console.log('🔍 2. 첫 번째 게시물 수정...');
    await page.click('button:has-text("수정")');
    await page.waitForTimeout(3000);
    
    // 3. 콘솔 메시지 확인
    console.log('📊 3. 콘솔 메시지 확인...');
    console.log('총 콘솔 메시지 개수:', consoleMessages.length);
    
    // 대표 이미지 관련 로그 필터링
    const featuredImageLogs = consoleMessages.filter(msg => 
      msg.text.includes('대표 이미지') || 
      msg.text.includes('addToImageGallery') ||
      msg.text.includes('갤러리')
    );
    
    console.log('🖼️ 대표 이미지 관련 로그:');
    featuredImageLogs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.type}] ${log.text}`);
    });
    
    // 4. 갤러리 열기
    console.log('🖼️ 4. 갤러리 열기...');
    await page.click('button:has-text("갤러리 닫기"), button:has-text("전체 이미지 보기")');
    await page.waitForTimeout(2000);
    
    // 5. 갤러리 이미지 개수 확인
    console.log('📊 5. 갤러리 이미지 개수 확인...');
    const galleryImages = await page.locator('.grid img').count();
    console.log(`✅ 갤러리 이미지 개수: ${galleryImages}개`);
    
    // 6. 대표 이미지 URL 확인
    console.log('🔗 6. 대표 이미지 URL 확인...');
    const featuredImageUrl = await page.inputValue('input[placeholder*="대표 이미지"]');
    console.log(`✅ 대표 이미지 URL: ${featuredImageUrl}`);
    
    console.log('🎉 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testConsoleLogs();
