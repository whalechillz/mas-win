const { chromium } = require('playwright');

async function testGallerySimple() {
  let browser;
  try {
    console.log('🚀 간단한 갤러리 테스트 시작...');
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
        
        // 3. 갤러리 열기
        console.log('🖼️ 3. 갤러리 열기...');
        
        // 페이지 하단으로 스크롤
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(2000);
        
        // "전체 이미지 보기" 버튼 클릭
        const galleryButton = page.locator('button:has-text("전체 이미지 보기")').first();
        if (await galleryButton.isVisible()) {
          await galleryButton.click();
          console.log('✅ 갤러리 열림');
          await page.waitForTimeout(3000);
          
          // 갤러리 이미지 개수 확인
          const galleryImages = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-4 img');
          const imageCount = await galleryImages.count();
          console.log(`📊 갤러리 이미지 개수: ${imageCount}개`);
          
          if (imageCount > 0) {
            console.log('🎉 성공! 갤러리에 이미지가 있습니다!');
            
            // 처음 5개 이미지 확인
            for (let i = 0; i < Math.min(imageCount, 5); i++) {
              const img = galleryImages.nth(i);
              const src = await img.getAttribute('src');
              console.log(`  ${i + 1}. ${src}`);
              
              if (src.includes('supabase.co')) {
                console.log(`    ✅ Supabase 이미지!`);
              } else if (src.includes('unsplash.com')) {
                console.log(`    📷 Unsplash 이미지`);
              }
            }
          } else {
            console.log('❌ 갤러리가 비어있습니다');
            
            // 갤러리 메시지 확인
            const emptyMessage = page.locator('text=이 게시물에 연결된 이미지가 없습니다');
            if (await emptyMessage.isVisible()) {
              console.log('📄 갤러리 메시지: "이 게시물에 연결된 이미지가 없습니다"');
            }
          }
          
        } else {
          console.log('❌ "전체 이미지 보기" 버튼을 찾을 수 없습니다');
        }
        
      } else {
        console.log('❌ 편집 버튼을 찾을 수 없습니다');
      }
    } else {
      console.log('❌ 해당 포스트를 찾을 수 없습니다');
    }
    
    // 4. 스크린샷 촬영
    console.log('📸 4. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'test-gallery-simple-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: test-gallery-simple-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'test-gallery-simple-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: test-gallery-simple-error.png');
    }
  } finally {
    console.log('🔚 5. 브라우저 종료...');
    await browser.close();
    console.log('✅ 간단한 갤러리 테스트 완료');
  }
}

// 테스트 실행
testGallerySimple().catch(console.error);
