const { chromium } = require('playwright');

async function testGalleryButtonIssue() {
  let browser;
  try {
    console.log('🚀 갤러리 버튼 사라짐 문제 테스트 시작...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 1. 프로덕션 관리자 페이지 접속
    console.log('📝 1. 프로덕션 관리자 페이지 접속...');
    await page.goto('https://win.masgolf.co.kr/admin/blog');

    // 로그인 처리 (필요한 경우)
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
      console.log('🔑 로그인 페이지 감지, 로그인 시도...');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', '1234');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ 프로덕션 관리자 페이지 로드 완료');
    await page.waitForTimeout(3000);
    
    // 2. 해당 포스트 찾기 및 편집 버튼 클릭
    console.log('🔍 2. 해당 포스트 찾기...');
    
    const postTitle = '골프 입문자를 위한 완벽 가이드! MASSGOO 드라이버로 시작하는 골프';
    const postElement = page.locator(`text=${postTitle}`).first();
    
    if (await postElement.isVisible()) {
      console.log('✅ 포스트를 찾았습니다');
      
      // 해당 포스트의 편집 버튼 찾기
      const editButton = page.locator('button:has-text("수정")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ 편집 모드로 진입');
        
        // 3. Supabase 저장 버튼 클릭
        console.log('💾 3. Supabase 저장 버튼 클릭...');
        
        const saveButton = page.locator('button:has-text("💾 Supabase에 저장")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          console.log('✅ Supabase 저장 버튼 클릭됨');
          
          // API 응답 대기
          await page.waitForTimeout(5000);
          
          // 4. 저장 후 갤러리 버튼 상태 확인
          console.log('🔍 4. 저장 후 갤러리 버튼 상태 확인...');
          
          // 페이지 하단으로 스크롤
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          await page.waitForTimeout(2000);
          
          // 모든 가능한 갤러리 버튼들 확인
          const possibleButtons = [
            '갤러리 닫기',
            '전체 이미지 보기', 
            '이미지 갤러리',
            '갤러리 열기',
            '이미지 보기'
          ];
          
          console.log('🔍 갤러리 관련 버튼들 확인...');
          for (const buttonText of possibleButtons) {
            const button = page.locator(`button:has-text("${buttonText}")`);
            const isVisible = await button.isVisible();
            console.log(`  "${buttonText}": ${isVisible ? '✅ 보임' : '❌ 안보임'}`);
          }
          
          // 5. 페이지 전체에서 갤러리 관련 텍스트 찾기
          console.log('🔍 5. 페이지 전체에서 갤러리 관련 텍스트 찾기...');
          
          const galleryTexts = [
            '갤러리',
            '이미지',
            'gallery',
            'image'
          ];
          
          for (const text of galleryTexts) {
            const elements = page.locator(`text=${text}`);
            const count = await elements.count();
            if (count > 0) {
              console.log(`  "${text}" 텍스트: ${count}개 발견`);
              
              // 처음 몇 개만 확인
              for (let i = 0; i < Math.min(count, 3); i++) {
                const element = elements.nth(i);
                const isVisible = await element.isVisible();
                const tagName = await element.evaluate(el => el.tagName);
                const textContent = await element.textContent();
                console.log(`    ${i + 1}. <${tagName}> ${textContent} (${isVisible ? '보임' : '안보임'})`);
              }
            }
          }
          
          // 6. DOM 구조 확인
          console.log('🔍 6. DOM 구조 확인...');
          
          // 이미지 갤러리 관련 클래스들 확인
          const galleryClasses = [
            '.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-4',
            '.image-gallery',
            '.gallery',
            '[class*="gallery"]',
            '[class*="image"]'
          ];
          
          for (const className of galleryClasses) {
            const elements = page.locator(className);
            const count = await elements.count();
            if (count > 0) {
              console.log(`  "${className}": ${count}개 발견`);
            }
          }
          
        } else {
          console.log('❌ Supabase 저장 버튼을 찾을 수 없습니다');
        }
        
      } else {
        console.log('❌ 편집 버튼을 찾을 수 없습니다');
      }
    } else {
      console.log('❌ 해당 포스트를 찾을 수 없습니다');
    }
    
    // 7. 스크린샷 촬영
    console.log('📸 7. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'test-gallery-button-issue-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: test-gallery-button-issue-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'test-gallery-button-issue-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: test-gallery-button-issue-error.png');
    }
  } finally {
    console.log('🔚 8. 브라우저 종료...');
    await browser.close();
    console.log('✅ 갤러리 버튼 사라짐 문제 테스트 완료');
  }
}

// 테스트 실행
testGalleryButtonIssue().catch(console.error);
