const { chromium } = require('playwright');

async function testFeaturedImageDisplay() {
  let browser;
  try {
    console.log('🚀 대표 이미지 표시 테스트 시작...');
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
        
        // 3. 대표 이미지 관리 섹션 찾기
        console.log('🖼️ 3. 대표 이미지 관리 섹션 찾기...');
        
        const featuredImageSection = page.locator('h4:has-text("🖼️ 대표 이미지 관리")');
        if (await featuredImageSection.isVisible()) {
          console.log('✅ 대표 이미지 관리 섹션 발견');
          
          // 섹션으로 스크롤
          await featuredImageSection.scrollIntoViewIfNeeded();
          await page.waitForTimeout(1000);
          
          // 4. 대표 이미지 URL 입력 필드 확인
          console.log('📝 4. 대표 이미지 URL 입력 필드 확인...');
          
          const featuredImageInput = page.locator('input[type="url"][placeholder*="대표 이미지 URL을 입력하세요"]');
          if (await featuredImageInput.isVisible()) {
            console.log('✅ 대표 이미지 URL 입력 필드 발견');
            
            // 현재 값 확인
            const currentValue = await featuredImageInput.inputValue();
            console.log(`📊 현재 대표 이미지 URL: "${currentValue}"`);
            
            if (currentValue) {
              console.log('✅ 대표 이미지가 설정되어 있습니다');
              
              // 5. 현재 대표 이미지 표시 확인
              console.log('🖼️ 5. 현재 대표 이미지 표시 확인...');
              
              const currentImageText = page.locator('text=✅ 현재 대표 이미지:');
              if (await currentImageText.isVisible()) {
                console.log('✅ "현재 대표 이미지" 텍스트 발견');
                
                // 미리보기 이미지 확인
                const previewImage = page.locator('img[alt="대표 이미지 미리보기"]');
                if (await previewImage.isVisible()) {
                  console.log('✅ 대표 이미지 미리보기가 표시됨');
                  
                  const isLoaded = await previewImage.evaluate((img) => img.complete && img.naturalHeight !== 0);
                  if (isLoaded) {
                    console.log('✅ 미리보기 이미지가 정상적으로 로드됨');
                  } else {
                    console.log('⚠️ 미리보기 이미지 로드 중이거나 실패');
                  }
                } else {
                  console.log('❌ 대표 이미지 미리보기를 찾을 수 없습니다');
                }
                
                // URL 표시 확인
                const urlText = page.locator('text=URL:');
                if (await urlText.isVisible()) {
                  console.log('✅ 대표 이미지 URL이 표시됨');
                } else {
                  console.log('❌ 대표 이미지 URL이 표시되지 않음');
                }
                
              } else {
                console.log('❌ "현재 대표 이미지" 텍스트를 찾을 수 없습니다');
              }
              
            } else {
              console.log('⚠️ 대표 이미지가 설정되지 않았습니다');
              
              // 경고 메시지 확인
              const warningText = page.locator('text=⚠️ 대표 이미지가 설정되지 않았습니다');
              if (await warningText.isVisible()) {
                console.log('✅ 경고 메시지가 표시됨');
              } else {
                console.log('❌ 경고 메시지를 찾을 수 없습니다');
              }
            }
            
          } else {
            console.log('❌ 대표 이미지 URL 입력 필드를 찾을 수 없습니다');
          }
          
        } else {
          console.log('❌ 대표 이미지 관리 섹션을 찾을 수 없습니다');
        }
        
      } else {
        console.log('❌ 편집 버튼을 찾을 수 없습니다');
      }
    } else {
      console.log('❌ 해당 포스트를 찾을 수 없습니다');
    }
    
    // 6. 스크린샷 촬영
    console.log('📸 6. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'featured-image-display-test-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: featured-image-display-test-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'featured-image-display-test-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: featured-image-display-test-error.png');
    }
  } finally {
    console.log('🔚 7. 브라우저 종료...');
    await browser.close();
    console.log('✅ 대표 이미지 표시 테스트 완료');
  }
}

// 테스트 실행
testFeaturedImageDisplay().catch(console.error);
