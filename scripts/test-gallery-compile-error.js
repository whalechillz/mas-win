const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🌐 갤러리 페이지 접속 중...');
    await page.goto('http://localhost:3000/admin/gallery', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 페이지 로드 대기
    await page.waitForTimeout(3000);
    
    // 오류 메시지 확인
    const errorText = await page.textContent('body');
    
    if (errorText.includes('Failed to compile') || errorText.includes('Syntax Error')) {
      console.error('❌ 컴파일 오류 발견!');
      
      // 오류 상세 정보 추출
      const errorDetails = await page.evaluate(() => {
        const errorElement = document.querySelector('pre, code, [class*="error"]');
        return errorElement ? errorElement.textContent : '오류 정보를 찾을 수 없습니다.';
      });
      
      console.log('📋 오류 상세:');
      console.log(errorDetails);
      
      // 스크린샷 저장
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
      console.log('📸 오류 스크린샷 저장: error-screenshot.png');
      
    } else {
      console.log('✅ 페이지가 정상적으로 로드되었습니다.');
      
      // 페이지 제목 확인
      const title = await page.title();
      console.log('📄 페이지 제목:', title);
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    
    // 스크린샷 저장
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('📸 오류 스크린샷 저장: error-screenshot.png');
  } finally {
    await browser.close();
  }
})();



