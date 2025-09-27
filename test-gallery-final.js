const { chromium } = require('playwright');

async function testGalleryFinal() {
  let browser;
  try {
    console.log('🚀 최종 갤러리 테스트 시작...');
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
          
          // 4. 갤러리 열기
          console.log('🖼️ 4. 갤러리 열기...');
          
          // 페이지 하단으로 스크롤
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          await page.waitForTimeout(2000);
          
          // "전체 이미지 보기" 버튼 클릭 (첫 번째 것만)
          const galleryButton = page.locator('button:has-text("전체 이미지 보기")').first();
          if (await galleryButton.isVisible()) {
            await galleryButton.click();
            console.log('✅ 갤러리 열림');
            await page.waitForTimeout(2000);
            
            // 5. 갤러리 이미지 확인
            console.log('📊 5. 갤러리 이미지 확인...');
            
            const galleryImages = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-4 img');
            const imageCount = await galleryImages.count();
            console.log(`📊 갤러리 이미지 개수: ${imageCount}개`);
            
            if (imageCount > 0) {
              console.log('🎉 성공! 갤러리에 이미지가 있습니다!');
              
              // 각 이미지의 src 확인
              for (let i = 0; i < Math.min(imageCount, 5); i++) {
                const img = galleryImages.nth(i);
                const src = await img.getAttribute('src');
                console.log(`  ${i + 1}. ${src}`);
                
                // Supabase URL인지 확인
                if (src.includes('supabase.co')) {
                  console.log(`    ✅ Supabase 이미지!`);
                }
              }
              
              // 6. 대표 이미지 URL 확인
              console.log('📊 6. 대표 이미지 URL 확인...');
              
              const featuredImageInput = page.locator('input[type="url"][placeholder*="대표 이미지 URL을 입력하세요"]');
              if (await featuredImageInput.isVisible()) {
                const currentValue = await featuredImageInput.inputValue();
                console.log('📊 현재 대표 이미지 URL:', currentValue);
                
                if (currentValue.includes('supabase.co')) {
                  console.log('✅ 대표 이미지가 Supabase URL로 변경되었습니다!');
                } else {
                  console.log('❌ 대표 이미지가 여전히 외부 URL입니다');
                }
              }
              
            } else {
              console.log('❌ 갤러리가 여전히 비어있습니다');
              
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
      path: 'test-gallery-final-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: test-gallery-final-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'test-gallery-final-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: test-gallery-final-error.png');
    }
  } finally {
    console.log('🔚 8. 브라우저 종료...');
    await browser.close();
    console.log('✅ 최종 갤러리 테스트 완료');
  }
}

// 테스트 실행
testGalleryFinal().catch(console.error);
