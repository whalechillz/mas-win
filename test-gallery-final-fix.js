const { chromium } = require('playwright');

async function testGalleryFinalFix() {
  let browser;
  try {
    console.log('🚀 최종 갤러리 수정사항 테스트 시작...');
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
        
        // 3. 편집 모드 진입 후 갤러리 상태 확인
        console.log('🖼️ 3. 편집 모드 진입 후 갤러리 상태 확인...');
        
        // 페이지 하단으로 스크롤하여 갤러리 찾기
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(2000);
        
        // "전체 이미지 보기" 버튼 클릭
        const galleryButton = page.locator('button:has-text("전체 이미지 보기")').first();
        if (await galleryButton.isVisible()) {
          await galleryButton.click();
          console.log('✅ 갤러리 열림');
          await page.waitForTimeout(2000);
          
          // 갤러리 이미지 개수 확인
          const galleryImages = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-4 img');
          const initialImageCount = await galleryImages.count();
          console.log(`📊 편집 모드 진입 후 갤러리 이미지 개수: ${initialImageCount}개`);
          
          if (initialImageCount > 0) {
            console.log('✅ 편집 모드에서 대표 이미지가 갤러리에 표시됩니다!');
            
            // 각 이미지의 src 확인
            for (let i = 0; i < Math.min(initialImageCount, 3); i++) {
              const img = galleryImages.nth(i);
              const src = await img.getAttribute('src');
              console.log(`  ${i + 1}. ${src}`);
            }
          } else {
            console.log('❌ 편집 모드에서 갤러리가 비어있습니다');
          }
          
          // 갤러리 닫기
          const closeButton = page.locator('button:has-text("갤러리 닫기")');
          if (await closeButton.isVisible()) {
            await closeButton.click();
            console.log('✅ 갤러리 닫힘');
            await page.waitForTimeout(1000);
          }
        }
        
        // 4. 대표 이미지 관리 섹션으로 스크롤
        console.log('🖼️ 4. 대표 이미지 관리 섹션으로 이동...');
        
        const featuredImageSection = page.locator('h4:has-text("🖼️ 대표 이미지 관리")');
        if (await featuredImageSection.isVisible()) {
          await featuredImageSection.scrollIntoViewIfNeeded();
          await page.waitForTimeout(1000);
          
          // 현재 대표 이미지 URL 확인
          const featuredImageInput = page.locator('input[type="url"][placeholder*="대표 이미지 URL을 입력하세요"]');
          if (await featuredImageInput.isVisible()) {
            const currentValue = await featuredImageInput.inputValue();
            console.log('📊 현재 대표 이미지 URL:', currentValue);
            
            // 5. Supabase 저장 버튼 테스트
            console.log('💾 5. Supabase 저장 버튼 테스트...');
            
            const saveButton = page.locator('button:has-text("💾 Supabase에 저장")');
            if (await saveButton.isVisible()) {
              console.log('✅ Supabase 저장 버튼 발견');
              
              // 콘솔 로그 모니터링 시작
              const consoleLogs = [];
              page.on('console', msg => {
                if (msg.type() === 'log') {
                  consoleLogs.push(msg.text());
                  console.log('🔍 콘솔 로그:', msg.text());
                }
              });
              
              // 저장 버튼 클릭
              await saveButton.click();
              console.log('✅ Supabase 저장 버튼 클릭됨');
              
              // API 응답 대기
              await page.waitForTimeout(5000);
              
              // 6. 저장 후 상태 확인
              console.log('📊 6. 저장 후 상태 확인...');
              
              // 대표 이미지 URL이 변경되었는지 확인
              const newValue = await featuredImageInput.inputValue();
              console.log('📊 저장 후 대표 이미지 URL:', newValue);
              
              if (newValue !== currentValue) {
                console.log('✅ 대표 이미지 URL이 변경되었습니다!');
                
                if (newValue.includes('supabase.co')) {
                  console.log('✅ Supabase URL로 변경되었습니다!');
                } else {
                  console.log('❌ 여전히 외부 URL입니다');
                }
                
                // 7. 갤러리 다시 확인
                console.log('🖼️ 7. 저장 후 갤러리 상태 확인...');
                
                // 페이지 하단으로 스크롤
                await page.evaluate(() => {
                  window.scrollTo(0, document.body.scrollHeight);
                });
                await page.waitForTimeout(2000);
                
                // 갤러리 다시 열기
                const galleryButton2 = page.locator('button:has-text("전체 이미지 보기")').first();
                if (await galleryButton2.isVisible()) {
                  await galleryButton2.click();
                  console.log('✅ 갤러리 다시 열림');
                  await page.waitForTimeout(2000);
                  
                  const finalImageCount = await galleryImages.count();
                  console.log(`📊 저장 후 갤러리 이미지 개수: ${finalImageCount}개`);
                  
                  if (finalImageCount > 0) {
                    console.log('🎉 성공! 갤러리에 이미지가 있습니다!');
                    
                    // 새로 추가된 이미지 확인
                    for (let i = 0; i < Math.min(finalImageCount, 3); i++) {
                      const img = galleryImages.nth(i);
                      const src = await img.getAttribute('src');
                      console.log(`  ${i + 1}. ${src}`);
                      
                      if (src === newValue) {
                        console.log(`    ✅ 새로 저장된 이미지와 일치!`);
                      }
                      
                      if (src.includes('supabase.co')) {
                        console.log(`    ✅ Supabase 이미지!`);
                      }
                    }
                  } else {
                    console.log('❌ 갤러리에 여전히 이미지가 없습니다');
                    
                    // 갤러리 메시지 확인
                    const emptyMessage = page.locator('text=이 게시물에 연결된 이미지가 없습니다');
                    if (await emptyMessage.isVisible()) {
                      console.log('📄 갤러리 메시지: "이 게시물에 연결된 이미지가 없습니다"');
                    }
                  }
                  
                } else {
                  console.log('❌ 갤러리 버튼을 찾을 수 없습니다');
                }
                
              } else {
                console.log('❌ 대표 이미지 URL이 변경되지 않았습니다');
              }
              
            } else {
              console.log('❌ Supabase 저장 버튼을 찾을 수 없습니다');
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
    
    // 8. 스크린샷 촬영
    console.log('📸 8. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'test-gallery-final-fix-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: test-gallery-final-fix-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'test-gallery-final-fix-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: test-gallery-final-fix-error.png');
    }
  } finally {
    console.log('🔚 9. 브라우저 종료...');
    await browser.close();
    console.log('✅ 최종 갤러리 수정사항 테스트 완료');
  }
}

// 테스트 실행
testGalleryFinalFix().catch(console.error);
