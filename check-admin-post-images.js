const { chromium } = require('playwright');

async function checkAdminPostImages() {
  let browser;
  try {
    console.log('🚀 관리자 페이지에서 포스트 이미지 확인 시작...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 1. 관리자 페이지 접속
    console.log('📝 1. 관리자 페이지 접속...');
    await page.goto('http://localhost:3000/admin/blog');

    // 로그인 처리 (필요한 경우)
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
      console.log('🔑 로그인 페이지 감지, 로그인 시도...');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', '1234');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ 관리자 페이지 로드 완료');
    await page.waitForTimeout(3000);
    
    // 2. 해당 포스트 찾기 및 편집 버튼 클릭
    console.log('🔍 2. 해당 포스트 찾기...');
    
    // 포스트 제목으로 찾기
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
        
        // 3. 이미지 갤러리 확인
        console.log('🖼️ 3. 이미지 갤러리 확인...');
        
        // "이 게시물의 이미지" 섹션 찾기
        const postImagesSection = page.locator('h5:has-text("이 게시물의 이미지")');
        if (await postImagesSection.isVisible()) {
          console.log('✅ "이 게시물의 이미지" 섹션 발견');
          
          // 이미지 개수 확인
          const imageCountText = await postImagesSection.textContent();
          console.log(`📊 ${imageCountText}`);
          
          // 이미지 갤러리 그리드 확인
          const imageGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-4').first();
          if (await imageGrid.isVisible()) {
            const images = await imageGrid.locator('img').all();
            console.log(`📊 갤러리에서 발견된 이미지: ${images.length}개`);
            
            for (let i = 0; i < images.length; i++) {
              const img = images[i];
              const src = await img.getAttribute('src');
              const alt = await img.getAttribute('alt');
              console.log(`  ${i + 1}. ${alt} - ${src}`);
            }
          } else {
            console.log('❌ 이미지 갤러리 그리드를 찾을 수 없습니다');
          }
        } else {
          console.log('❌ "이 게시물의 이미지" 섹션을 찾을 수 없습니다');
        }
        
        // 4. 전체 이미지 갤러리 확인
        console.log('\n🖼️ 4. 전체 이미지 갤러리 확인...');
        
        const fullGallerySection = page.locator('h5:has-text("전체 이미지 갤러리")');
        if (await fullGallerySection.isVisible()) {
          console.log('✅ "전체 이미지 갤러리" 섹션 발견');
          
          // 전체 갤러리 이미지 개수 확인
          const fullGalleryText = await fullGallerySection.textContent();
          console.log(`📊 ${fullGalleryText}`);
          
          // 전체 갤러리 그리드 확인
          const fullImageGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-4').last();
          if (await fullImageGrid.isVisible()) {
            const fullImages = await fullImageGrid.locator('img').all();
            console.log(`📊 전체 갤러리에서 발견된 이미지: ${fullImages.length}개`);
            
            // 웨지/잔디 관련 이미지 찾기
            let wedgeFound = false;
            for (let i = 0; i < fullImages.length; i++) {
              const img = fullImages[i];
              const src = await img.getAttribute('src');
              const alt = await img.getAttribute('alt');
              
              if (alt && (alt.includes('웨지') || alt.includes('wedge') || alt.includes('잔디') || alt.includes('grass'))) {
                console.log(`🎯 웨지/잔디 관련 이미지 발견: ${alt} - ${src}`);
                wedgeFound = true;
              }
            }
            
            if (!wedgeFound) {
              console.log('❌ 전체 갤러리에서 웨지/잔디 관련 이미지를 찾을 수 없습니다');
            }
          } else {
            console.log('❌ 전체 이미지 갤러리 그리드를 찾을 수 없습니다');
          }
        } else {
          console.log('❌ "전체 이미지 갤러리" 섹션을 찾을 수 없습니다');
        }
        
      } else {
        console.log('❌ 편집 버튼을 찾을 수 없습니다');
      }
    } else {
      console.log('❌ 해당 포스트를 찾을 수 없습니다');
    }
    
    // 5. 스크린샷 촬영
    console.log('\n📸 5. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'admin-post-images-check.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: admin-post-images-check.png');
    
  } catch (error) {
    console.error('❌ 확인 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'admin-post-images-check-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: admin-post-images-check-error.png');
    }
  } finally {
    console.log('\n🔚 6. 브라우저 종료...');
    await browser.close();
    console.log('✅ 관리자 페이지 이미지 확인 완료');
  }
}

// 확인 실행
checkAdminPostImages().catch(console.error);
