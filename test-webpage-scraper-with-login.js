const { chromium } = require('playwright');

async function testWebpageScraperWithLogin() {
  let browser;
  try {
    console.log('🚀 웹페이지 이미지 수집 기능 테스트 (로그인 포함)...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 1. 로컬 관리자 페이지 접속
    console.log('📝 1. 로컬 관리자 페이지 접속...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForTimeout(3000);
    
    // 2. 로그인 페이지인지 확인
    const currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}`);
    
    if (currentUrl.includes('/admin/login')) {
      console.log('🔑 로그인 페이지 감지, 로그인 시도...');
      
      // 로그인 폼 찾기
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      const emailVisible = await emailInput.isVisible();
      const passwordVisible = await passwordInput.isVisible();
      const submitVisible = await submitButton.isVisible();
      
      console.log(`📧 이메일 입력 필드 보임: ${emailVisible}`);
      console.log(`🔒 비밀번호 입력 필드 보임: ${passwordVisible}`);
      console.log(`🚀 제출 버튼 보임: ${submitVisible}`);
      
      if (emailVisible && passwordVisible && submitVisible) {
        await emailInput.fill('admin@example.com');
        await passwordInput.fill('1234');
        await submitButton.click();
        
        console.log('✅ 로그인 시도 완료');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      }
    }
    
    // 3. 현재 URL 다시 확인
    const finalUrl = page.url();
    console.log(`📍 최종 URL: ${finalUrl}`);
    
    if (finalUrl.includes('/admin/blog')) {
      console.log('✅ 관리자 페이지 로드 완료');
      
      // 4. 페이지를 아래로 스크롤
      console.log('📜 4. 페이지 스크롤...');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(2000);
      
      // 5. 이미지 갤러리 섹션 찾기
      console.log('🖼️ 5. 이미지 갤러리 섹션 찾기...');
      
      // "갤러리 열기" 버튼 찾기
      const galleryButton = page.locator('button:has-text("갤러리 열기")');
      const isGalleryVisible = await galleryButton.isVisible();
      console.log(`🖼️ 갤러리 열기 버튼 보임: ${isGalleryVisible}`);
      
      if (isGalleryVisible) {
        console.log('✅ 갤러리 열기 버튼 발견!');
        await galleryButton.click();
        await page.waitForTimeout(2000);
        
        // 6. 웹페이지 이미지 수집 버튼 찾기
        console.log('🔍 6. 웹페이지 이미지 수집 버튼 찾기...');
        const scraperButton = page.locator('button:has-text("🌐 웹페이지 이미지 수집")');
        const isScraperVisible = await scraperButton.isVisible();
        console.log(`🌐 웹페이지 이미지 수집 버튼 보임: ${isScraperVisible}`);
        
        if (isScraperVisible) {
          console.log('✅ 웹페이지 이미지 수집 버튼 발견!');
          await scraperButton.click();
          await page.waitForTimeout(1000);
          
          // 7. URL 입력 필드 확인
          console.log('📝 7. URL 입력 필드 확인...');
          const urlInput = page.locator('input[type="url"]');
          await urlInput.waitFor({ state: 'visible' });
          console.log('✅ URL 입력 필드 발견');
          
          // 8. 테스트 URL 입력
          console.log('🌐 8. 테스트 URL 입력...');
          const testUrl = 'https://httpbin.org/html';
          await urlInput.fill(testUrl);
          console.log(`✅ URL 입력 완료: ${testUrl}`);
          
          // 9. 이미지 수집 버튼 클릭
          console.log('🔍 9. 이미지 수집 버튼 클릭...');
          await page.click('button:has-text("🔍 이미지 수집")');
          
          // 10. 결과 확인
          console.log('⏳ 10. 결과 확인...');
          await page.waitForTimeout(5000);
          
          try {
            const alertPromise = page.waitForEvent('dialog', { timeout: 10000 });
            const alert = await alertPromise;
            console.log('📢 알림 메시지:', alert.message());
            await alert.accept();
          } catch (error) {
            console.log('⏰ 알림 다이얼로그 타임아웃');
          }
          
        } else {
          console.log('❌ 웹페이지 이미지 수집 버튼을 찾을 수 없음');
        }
        
      } else {
        console.log('❌ 갤러리 열기 버튼을 찾을 수 없음');
        
        // 페이지의 모든 버튼 확인
        const buttons = await page.locator('button').all();
        console.log('📊 페이지의 모든 버튼 (처음 10개):');
        for (let i = 0; i < Math.min(buttons.length, 10); i++) {
          const buttonText = await buttons[i].textContent();
          console.log(`  버튼 ${i + 1}: "${buttonText}"`);
        }
      }
      
    } else {
      console.log('❌ 관리자 페이지 로드 실패');
    }
    
    console.log('✅ 웹페이지 이미지 수집 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testWebpageScraperWithLogin();
