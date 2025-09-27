const { chromium } = require('playwright');

async function testSupabaseSave() {
  let browser;
  try {
    console.log('🚀 Supabase 저장 기능 테스트 시작...');
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
          
          // 4. Supabase 저장 버튼 찾기
          console.log('💾 4. Supabase 저장 버튼 찾기...');
          
          const saveButton = page.locator('button:has-text("💾 Supabase에 저장")');
          if (await saveButton.isVisible()) {
            console.log('✅ Supabase 저장 버튼 발견');
            
            // 5. 네트워크 요청 모니터링 시작
            console.log('📡 5. 네트워크 요청 모니터링 시작...');
            
            const requests = [];
            page.on('request', request => {
              if (request.url().includes('/api/admin/save-external-image')) {
                requests.push({
                  url: request.url(),
                  method: request.method(),
                  headers: request.headers()
                });
                console.log('📤 API 요청 감지:', request.url());
              }
            });
            
            page.on('response', response => {
              if (response.url().includes('/api/admin/save-external-image')) {
                console.log('📥 API 응답:', response.status(), response.url());
                response.text().then(text => {
                  console.log('📄 응답 내용:', text);
                }).catch(err => {
                  console.log('📄 응답 읽기 실패:', err.message);
                });
              }
            });
            
            // 6. Supabase 저장 버튼 클릭
            console.log('🖱️ 6. Supabase 저장 버튼 클릭...');
            
            await saveButton.click();
            await page.waitForTimeout(3000);
            
            // 7. 결과 확인
            console.log('📊 7. 결과 확인...');
            
            // 알림 메시지 확인
            const alertText = await page.evaluate(() => {
              // 알림이 표시되었는지 확인 (실제로는 확인하기 어려움)
              return '알림 확인 불가';
            });
            console.log('알림 상태:', alertText);
            
            // 대표 이미지 URL 변경 확인
            const featuredImageInput = page.locator('input[type="url"][placeholder*="대표 이미지 URL을 입력하세요"]');
            const currentValue = await featuredImageInput.inputValue();
            console.log('📊 현재 대표 이미지 URL:', currentValue);
            
            // 상태 표시 확인
            const statusSpan = page.locator('span:has-text("Supabase 최적화됨")');
            if (await statusSpan.isVisible()) {
              console.log('✅ 상태가 "Supabase 최적화됨"으로 변경됨');
            } else {
              console.log('❌ 상태가 변경되지 않음');
            }
            
            // 8. 이미지 갤러리 확인
            console.log('🖼️ 8. 이미지 갤러리 확인...');
            
            // 이미지 갤러리 열기
            const galleryButton = page.locator('button:has-text("갤러리 닫기"), button:has-text("전체 이미지 보기")');
            if (await galleryButton.isVisible()) {
              await galleryButton.click();
              await page.waitForTimeout(1000);
              
              // 갤러리 이미지 개수 확인
              const galleryImages = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-4 img');
              const imageCount = await galleryImages.count();
              console.log(`📊 갤러리 이미지 개수: ${imageCount}개`);
              
              if (imageCount > 0) {
                console.log('✅ 이미지 갤러리에 이미지가 있습니다');
              } else {
                console.log('❌ 이미지 갤러리가 비어있습니다');
              }
            } else {
              console.log('❌ 이미지 갤러리 버튼을 찾을 수 없습니다');
            }
            
          } else {
            console.log('❌ Supabase 저장 버튼을 찾을 수 없습니다');
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
    
    // 9. 스크린샷 촬영
    console.log('📸 9. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'supabase-save-test-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: supabase-save-test-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'supabase-save-test-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: supabase-save-test-error.png');
    }
  } finally {
    console.log('🔚 10. 브라우저 종료...');
    await browser.close();
    console.log('✅ Supabase 저장 기능 테스트 완료');
  }
}

// 테스트 실행
testSupabaseSave().catch(console.error);
