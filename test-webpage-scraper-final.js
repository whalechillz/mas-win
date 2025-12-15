const { chromium } = require('playwright');

async function testWebpageScraperFinal() {
  let browser;
  try {
    console.log('🚀 웹페이지 이미지 수집 기능 최종 테스트...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 1. 프로덕션 관리자 페이지 접속
    console.log('📝 1. 프로덕션 관리자 페이지 접속...');
    await page.goto('https://win.masgolf.co.kr/admin/blog');
    await page.waitForTimeout(5000);
    
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
        const password = process.env.ADMIN_PASSWORD || '';
        await passwordInput.fill(password);
        await submitButton.click();
        
        console.log('✅ 로그인 시도 완료');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000);
      }
    }
    
    // 3. 현재 URL 다시 확인
    const finalUrl = page.url();
    console.log(`📍 최종 URL: ${finalUrl}`);
    
    if (finalUrl.includes('/admin/blog')) {
      console.log('✅ 관리자 페이지 로드 완료');
      
      // 4. 새 게시물 작성 탭 클릭
      console.log('✍️ 4. 새 게시물 작성 탭 클릭...');
      const createTab = page.locator('button:has-text("✍️ 새 게시물 작성")');
      const isCreateTabVisible = await createTab.isVisible();
      console.log(`✍️ 새 게시물 작성 탭 보임: ${isCreateTabVisible}`);
      
      if (isCreateTabVisible) {
        await createTab.click();
        await page.waitForTimeout(3000);
        console.log('✅ 새 게시물 작성 모드 진입');
        
        // 5. 페이지를 아래로 스크롤
        console.log('📜 5. 페이지 스크롤...');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await page.waitForTimeout(2000);
        
        // 6. 이미지 갤러리 섹션 찾기
        console.log('🖼️ 6. 이미지 갤러리 섹션 찾기...');
        
        // "갤러리 열기" 버튼 찾기
        const galleryButton = page.locator('button:has-text("갤러리 열기")');
        const isGalleryVisible = await galleryButton.isVisible();
        console.log(`🖼️ 갤러리 열기 버튼 보임: ${isGalleryVisible}`);
        
        if (isGalleryVisible) {
          console.log('✅ 갤러리 열기 버튼 발견!');
          await galleryButton.click();
          await page.waitForTimeout(2000);
          
          // 7. 웹페이지 이미지 수집 버튼 찾기
          console.log('🔍 7. 웹페이지 이미지 수집 버튼 찾기...');
          const scraperButton = page.locator('button:has-text("🌐 웹페이지 이미지 수집")');
          const isScraperVisible = await scraperButton.isVisible();
          console.log(`🌐 웹페이지 이미지 수집 버튼 보임: ${isScraperVisible}`);
          
          if (isScraperVisible) {
            console.log('✅ 웹페이지 이미지 수집 버튼 발견!');
            await scraperButton.click();
            await page.waitForTimeout(1000);
            
            // 8. 웹페이지 URL 입력 필드 확인 (더 구체적인 선택자 사용)
            console.log('📝 8. 웹페이지 URL 입력 필드 확인...');
            const urlInput = page.locator('input[placeholder="https://example.com"]');
            await urlInput.waitFor({ state: 'visible' });
            console.log('✅ 웹페이지 URL 입력 필드 발견');
            
            // 9. 테스트 URL 입력 (간단한 웹사이트)
            console.log('🌐 9. 테스트 URL 입력...');
            const testUrl = 'https://httpbin.org/html';
            await urlInput.fill(testUrl);
            console.log(`✅ URL 입력 완료: ${testUrl}`);
            
            // 10. 이미지 수집 버튼 클릭
            console.log('🔍 10. 이미지 수집 버튼 클릭...');
            await page.click('button:has-text("🔍 이미지 수집")');
            
            // 11. 결과 확인
            console.log('⏳ 11. 결과 확인...');
            await page.waitForTimeout(5000);
            
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
              console.log('⏰ 알림 다이얼로그 타임아웃');
            }
            
            // 12. 수집된 이미지 확인
            console.log('🖼️ 12. 수집된 이미지 확인...');
            const imageGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-4');
            const imageCount = await imageGrid.locator('img').count();
            console.log(`📊 수집된 이미지 개수: ${imageCount}개`);
            
            // 13. 네이버 블로그 URL 테스트
            console.log('🧪 13. 네이버 블로그 URL 테스트...');
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
            
            // 14. 다른 웹사이트 테스트
            console.log('🧪 14. 다른 웹사이트 테스트...');
            await urlInput.fill('https://www.masgolf.co.kr/');
            await page.click('button:has-text("🔍 이미지 수집")');
            
            try {
              const alertPromise3 = page.waitForEvent('dialog', { timeout: 10000 });
              const alert3 = await alertPromise3;
              console.log('📢 마스골프 웹사이트 알림:', alert3.message());
              await alert3.accept();
            } catch (error) {
              console.log('⏰ 마스골프 웹사이트 테스트 타임아웃');
            }
            
          } else {
            console.log('❌ 웹페이지 이미지 수집 버튼을 찾을 수 없음');
          }
          
        } else {
          console.log('❌ 갤러리 열기 버튼을 찾을 수 없음');
        }
        
      } else {
        console.log('❌ 새 게시물 작성 탭을 찾을 수 없음');
      }
      
    } else {
      console.log('❌ 관리자 페이지 로드 실패');
    }
    
    console.log('✅ 웹페이지 이미지 수집 최종 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testWebpageScraperFinal();
