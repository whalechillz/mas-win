const { chromium } = require('playwright');

async function testWebpageScraperFixed() {
  let browser;
  try {
    console.log('🚀 웹페이지 이미지 수집 기능 테스트 (수정된 버전)...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 1. 로컬 관리자 페이지 접속
    console.log('📝 1. 로컬 관리자 페이지 접속...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForTimeout(5000);
    
    console.log('✅ 로컬 관리자 페이지 로드 완료');
    
    // 2. 이미지 갤러리 섹션 열기
    console.log('🖼️ 2. 이미지 갤러리 섹션 열기...');
    
    // 페이지를 아래로 스크롤
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(2000);
    
    // "갤러리 열기" 버튼 찾기
    const galleryButton = page.locator('button:has-text("갤러리 열기")');
    const isGalleryVisible = await galleryButton.isVisible();
    console.log(`🖼️ 갤러리 열기 버튼 보임: ${isGalleryVisible}`);
    
    if (isGalleryVisible) {
      console.log('✅ 갤러리 열기 버튼 발견!');
      await galleryButton.click();
      await page.waitForTimeout(2000);
      
      // 3. 웹페이지 이미지 수집 버튼 찾기
      console.log('🔍 3. 웹페이지 이미지 수집 버튼 찾기...');
      const scraperButton = page.locator('button:has-text("🌐 웹페이지 이미지 수집")');
      const isScraperVisible = await scraperButton.isVisible();
      console.log(`🌐 웹페이지 이미지 수집 버튼 보임: ${isScraperVisible}`);
      
      if (isScraperVisible) {
        console.log('✅ 웹페이지 이미지 수집 버튼 발견!');
        await scraperButton.click();
        await page.waitForTimeout(1000);
        
        // 4. URL 입력 필드 확인
        console.log('📝 4. URL 입력 필드 확인...');
        const urlInput = page.locator('input[type="url"]');
        await urlInput.waitFor({ state: 'visible' });
        console.log('✅ URL 입력 필드 발견');
        
        // 5. 테스트 URL 입력 (간단한 웹사이트)
        console.log('🌐 5. 테스트 URL 입력...');
        const testUrl = 'https://httpbin.org/html'; // 간단한 HTML 페이지
        await urlInput.fill(testUrl);
        console.log(`✅ URL 입력 완료: ${testUrl}`);
        
        // 6. 이미지 수집 버튼 클릭
        console.log('🔍 6. 이미지 수집 버튼 클릭...');
        await page.click('button:has-text("🔍 이미지 수집")');
        
        // 7. 수집 진행 상태 확인
        console.log('⏳ 7. 수집 진행 상태 확인...');
        await page.waitForTimeout(5000);
        
        // 8. 결과 확인 (성공 또는 실패)
        console.log('📊 8. 결과 확인...');
        
        // 알림 다이얼로그 확인
        try {
          const alertPromise = page.waitForEvent('dialog', { timeout: 10000 });
          const alert = await alertPromise;
          console.log('📢 알림 메시지:', alert.message());
          
          if (alert.message().includes('✅')) {
            console.log('🎉 이미지 수집 성공!');
          } else {
            console.log('❌ 이미지 수집 실패:', alert.message());
          }
          
          await alert.accept();
        } catch (error) {
          console.log('⏰ 알림 다이얼로그 타임아웃 또는 없음');
        }
        
        // 9. 수집된 이미지 확인
        console.log('🖼️ 9. 수집된 이미지 확인...');
        const imageGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-4');
        const imageCount = await imageGrid.locator('img').count();
        console.log(`📊 수집된 이미지 개수: ${imageCount}개`);
        
        // 10. 네이버 블로그 URL 테스트
        console.log('🧪 10. 네이버 블로그 URL 테스트...');
        await urlInput.fill('https://blog.naver.com/massgoogolf/223958579134');
        await page.click('button:has-text("🔍 이미지 수집")');
        
        try {
          const alertPromise2 = page.waitForEvent('dialog', { timeout: 15000 });
          const alert2 = await alertPromise2;
          console.log('📢 네이버 블로그 알림:', alert2.message());
          await alert2.accept();
        } catch (error) {
          console.log('⏰ 네이버 블로그 테스트 타임아웃');
        }
        
      } else {
        console.log('❌ 웹페이지 이미지 수집 버튼을 찾을 수 없음');
        
        // 이미지 갤러리 섹션의 모든 버튼 확인
        const galleryButtons = await page.locator('button').all();
        console.log('📊 이미지 갤러리 섹션의 모든 버튼:');
        for (let i = 0; i < Math.min(galleryButtons.length, 10); i++) {
          const buttonText = await galleryButtons[i].textContent();
          console.log(`  버튼 ${i + 1}: "${buttonText}"`);
        }
      }
      
    } else {
      console.log('❌ 갤러리 열기 버튼을 찾을 수 없음');
      
      // 모든 버튼 텍스트 출력
      const buttons = await page.locator('button').all();
      console.log('📊 페이지의 모든 버튼 (처음 20개):');
      for (let i = 0; i < Math.min(buttons.length, 20); i++) {
        const buttonText = await buttons[i].textContent();
        console.log(`  버튼 ${i + 1}: "${buttonText}"`);
      }
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

testWebpageScraperFixed();
