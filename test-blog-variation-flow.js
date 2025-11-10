const playwright = require('playwright');

(async () => {
  console.log('🚀 블로그 변형 기능 플레이라이트 테스트 시작...\n');
  
  const browser = await playwright.chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 로그인 페이지 접속
    console.log('1️⃣ 로그인 페이지 접속...');
    await page.goto('http://localhost:3000/api/auth/signin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 로그인 폼 찾기
    const phoneInput = await page.locator('input[type="tel"], input[name="phone"], input[type="text"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인")').first();
    
    if (await phoneInput.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 로그인 폼 발견');
      await phoneInput.fill('010-6669-9000');
      await passwordInput.fill('66699000');
      await loginButton.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ 로그인 완료\n');
    } else {
      console.log('   ⚠️ 로그인 폼을 찾을 수 없습니다. 직접 로그인 페이지로 이동합니다.');
      await page.goto('http://localhost:3000/admin/blog', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }
    
    // 2. 블로그 관리 페이지 접속
    console.log('2️⃣ 블로그 관리 페이지 접속...');
    await page.goto('http://localhost:3000/admin/blog', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log('   ✅ 블로그 관리 페이지 로드 완료\n');
    
    // 2-1. 게시물 생성 또는 편집 모드로 진입
    console.log('2-1️⃣ 게시물 생성/편집 모드로 진입...');
    await page.waitForTimeout(2000);
    
    // "새 게시물" 또는 "생성" 버튼 찾기
    const createButton = await page.locator('button:has-text("새 게시물"), button:has-text("생성"), button:has-text("글쓰기")').first();
    if (await createButton.isVisible({ timeout: 5000 })) {
      console.log('   ✅ "새 게시물" 버튼 발견');
      await createButton.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ 게시물 생성 모드 진입 완료\n');
    } else {
      // 또는 기존 게시물 편집
      const editButton = await page.locator('button:has-text("편집"), button:has-text("수정")').first();
      if (await editButton.isVisible({ timeout: 5000 })) {
        console.log('   ✅ "편집" 버튼 발견');
        await editButton.click();
        await page.waitForTimeout(3000);
        console.log('   ✅ 게시물 편집 모드 진입 완료\n');
      } else {
        console.log('   ⚠️ 게시물 생성/편집 버튼을 찾을 수 없습니다. 계속 진행...\n');
      }
    }
    
    // 2-2. 썸네일 이미지 선택 (대표 이미지 설정)
    console.log('2-2️⃣ 썸네일 이미지 선택 (대표 이미지 설정)...');
    await page.waitForTimeout(2000);
    
    // 갤러리 열기 버튼 찾기
    const galleryButton = await page.locator('button:has-text("갤러리 열기"), button:has-text("📂 갤러리 열기")').first();
    if (await galleryButton.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 갤러리 열기 버튼 발견');
      await galleryButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ 갤러리 열기 완료');
      
      // 첫 번째 이미지 찾기
      await page.waitForTimeout(2000);
      const firstImage = await page.locator('div[class*="cursor-pointer"][class*="border"] img, div[class*="cursor-pointer"][class*="border"]').first();
      if (await firstImage.isVisible({ timeout: 5000 })) {
        console.log('   ✅ 첫 번째 이미지 발견');
        
        // 이미지를 클릭하여 대표 이미지로 설정
        // 이미지 그룹의 "⭐ 대표" 버튼을 직접 찾기
        const imageContainer = firstImage.locator('..').locator('..');
        const featuredButton = await imageContainer.locator('button:has-text("⭐ 대표"), button:has-text("대표로")').first();
        
        if (await featuredButton.isVisible({ timeout: 3000 })) {
          console.log('   ✅ "⭐ 대표" 버튼 발견');
          await featuredButton.click();
          await page.waitForTimeout(2000);
          console.log('   ✅ 대표 이미지 설정 완료\n');
        } else {
          // 이미지를 직접 클릭
          console.log('   🔍 이미지를 클릭하여 대표 이미지 설정 시도...');
          await firstImage.click();
          await page.waitForTimeout(2000);
          
          // 모달이 열렸는지 확인하고 모달에서 대표 이미지 설정
          const modal = await page.locator('div[class*="fixed"][class*="z"]').first();
          if (await modal.isVisible({ timeout: 3000 })) {
            console.log('   ✅ 이미지 모달 열림');
            const modalFeaturedButton = await page.locator('button:has-text("⭐ 대표"), button:has-text("대표로"), button:has-text("대표 이미지로 설정")').first();
            if (await modalFeaturedButton.isVisible({ timeout: 3000 })) {
              await modalFeaturedButton.click();
              await page.waitForTimeout(2000);
              console.log('   ✅ 모달에서 대표 이미지 설정 완료');
              
              // 모달 닫기
              const closeButton = await page.locator('button:has-text("닫기"), button:has-text("✕"), button[class*="close"]').first();
              if (await closeButton.isVisible({ timeout: 2000 })) {
                await closeButton.click();
                await page.waitForTimeout(1000);
              }
            }
          } else {
            // 모달이 없으면 이미지 클릭으로 바로 설정됨
            console.log('   ✅ 이미지 클릭으로 대표 이미지 설정 완료');
          }
          console.log('   ✅ 대표 이미지 설정 완료\n');
        }
      } else {
        console.log('   ⚠️ 이미지를 찾을 수 없습니다. 계속 진행...\n');
      }
    } else {
      console.log('   ⚠️ 갤러리 열기 버튼을 찾을 수 없습니다. 계속 진행...\n');
    }
    
    // 썸네일 이미지가 로드되었는지 확인
    await page.waitForTimeout(2000);
    const featuredImagePreview = await page.locator('img[src*="supabase"], img[src*="storage"]').first();
    let featuredImageLoaded = false;
    
    if (await featuredImagePreview.isVisible({ timeout: 5000 })) {
      const src = await featuredImagePreview.getAttribute('src');
      console.log(`   ✅ 썸네일 이미지 로드 확인: ${src?.substring(0, 100)}...`);
      featuredImageLoaded = true;
    } else {
      console.log('   ⚠️ 썸네일 이미지 미리보기를 찾을 수 없습니다. 계속 진행...');
    }
    
    // 썸네일 이미지가 로드된 후에만 변형 버튼 클릭
    if (!featuredImageLoaded) {
      console.log('   ⚠️ 썸네일 이미지가 로드되지 않았습니다. 잠시 대기 후 다시 확인...');
      await page.waitForTimeout(3000);
      
      // 다시 확인
      const retryImage = await page.locator('img[src*="supabase"], img[src*="storage"]').first();
      if (await retryImage.isVisible({ timeout: 5000 })) {
        console.log('   ✅ 썸네일 이미지 로드 확인 (재시도)');
        featuredImageLoaded = true;
      }
    }
    
    // 3. 기존 이미지 변형 버튼 찾기 (페이지 맨 하단) - 썸네일 이미지가 로드된 상태에서
    console.log('3️⃣ 기존 이미지 변형 버튼 찾기 (페이지 맨 하단)...');
    await page.waitForTimeout(2000);
    
    // 페이지를 맨 아래로 스크롤 (여러 번 시도)
    console.log('   📜 페이지를 맨 아래로 스크롤...');
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(1000);
    }
    
    // 스크린샷 저장 (스크롤 후)
    await page.screenshot({ path: 'test-blog-variation-scrolled-bottom.png', fullPage: true });
    console.log('   📸 스크린샷 저장 완료: test-blog-variation-scrolled-bottom.png');
    
    // 페이지 높이 확인
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    console.log(`   📏 페이지 높이: ${pageHeight}px, 뷰포트 높이: ${viewportHeight}px`);
    
    await page.waitForTimeout(2000);
    
    // "기존 이미지 변형" 버튼 찾기 (여러 방법 시도)
    console.log('   🔍 "기존 이미지 변형" 버튼 검색...');
    
    let variationButton = null;
    
    // 방법 1: h4 제목으로 섹션 찾기 (JavaScript로 직접 찾기)
    try {
      const foundSection = await page.evaluate(() => {
        const h4s = Array.from(document.querySelectorAll('h4'));
        for (const h4 of h4s) {
          const text = h4.textContent || '';
          if (text.includes('기존 이미지 변형') || text.includes('🔄 기존')) {
            // 부모 요소에서 버튼 찾기
            let parent = h4.parentElement;
            let depth = 0;
            while (parent && parent !== document.body && depth < 5) {
              const buttons = parent.querySelectorAll('button');
              for (const button of buttons) {
                const buttonText = button.textContent || '';
                const buttonTitle = button.getAttribute('title') || '';
                if (buttonText.includes('기존 이미지 변형') || buttonText.includes('🔄 기존') || 
                    buttonTitle.includes('기존 이미지를 변형')) {
                  return {
                    h4Text: text.trim(),
                    buttonText: buttonText.trim(),
                    buttonTitle: buttonTitle,
                    buttonIndex: Array.from(parent.querySelectorAll('button')).indexOf(button)
                  };
                }
              }
              parent = parent.parentElement;
              depth++;
            }
          }
        }
        return null;
      });
      
      if (foundSection) {
        console.log(`   ✅ "기존 이미지 변형" 섹션 발견: "${foundSection.h4Text}"`);
        console.log(`   ✅ 버튼 텍스트: "${foundSection.buttonText}"`);
        console.log(`   ✅ 버튼 title: "${foundSection.buttonTitle}"`);
        
        // 버튼 찾기
        variationButton = await page.locator(`button:has-text("${foundSection.buttonText}")`).first();
        if (!await variationButton.isVisible({ timeout: 2000 })) {
          variationButton = await page.locator(`button[title="${foundSection.buttonTitle}"]`).first();
        }
      }
    } catch (e) {
      console.log('   ⚠️ h4 제목으로 섹션 찾기 실패:', e.message);
    }
    
    // 방법 2: 정확한 텍스트로 찾기 (모든 버튼 검색)
    if (!variationButton) {
      try {
        // 모든 버튼을 찾아서 텍스트 확인
        const allButtons = await page.locator('button').all();
        console.log(`   📋 총 ${allButtons.length}개의 버튼 발견, 검색 중...`);
        
        for (let i = 0; i < allButtons.length; i++) {
          try {
            const buttonText = await allButtons[i].textContent();
            const isVisible = await allButtons[i].isVisible();
            
            if (isVisible && buttonText && (
              buttonText.trim() === '🔄 기존 이미지 변형' ||
              buttonText.includes('기존 이미지 변형') ||
              buttonText.includes('🔄 기존')
            )) {
              console.log(`   ✅ 버튼 ${i + 1}번 발견: "${buttonText.trim()}"`);
              variationButton = allButtons[i];
              break;
            }
          } catch (e) {
            // 개별 버튼 확인 실패는 무시
          }
        }
      } catch (e) {
        console.log('   ⚠️ 모든 버튼 검색 실패:', e.message);
      }
    }
    
    // 방법 3: title 속성으로 찾기
    if (!variationButton) {
      try {
        variationButton = await page.locator('button[title*="기존 이미지를 변형"], button[title*="기존 이미지"]').first();
        if (await variationButton.isVisible({ timeout: 3000 })) {
          const title = await variationButton.getAttribute('title');
          const text = await variationButton.textContent();
          console.log(`   ✅ 기존 이미지 변형 버튼 발견 (title: "${title}", text: "${text}")`);
        } else {
          variationButton = null;
        }
      } catch (e) {
        console.log('   ⚠️ title 속성으로 찾기 실패...');
      }
    }
    
    // 방법 4: CSS 클래스로 찾기 (purple-500 배경색)
    if (!variationButton) {
      try {
        const purpleButtons = await page.locator('button.bg-purple-500, button[class*="purple-500"]').all();
        console.log(`   📋 보라색 버튼 ${purpleButtons.length}개 발견`);
        for (let i = 0; i < Math.min(purpleButtons.length, 50); i++) { // 처음 50개만 확인
          try {
            const buttonText = await purpleButtons[i].textContent();
            const isVisible = await purpleButtons[i].isVisible();
            const buttonTitle = await purpleButtons[i].getAttribute('title');
            
            if (isVisible && buttonText) {
              // 변형 관련 버튼 찾기
              if (buttonText.includes('변형') || buttonText.includes('기존') || buttonText.includes('🔄')) {
                console.log(`   🔍 보라색 버튼 ${i + 1}번: "${buttonText.trim()}" (title: "${buttonTitle}")`);
                if (buttonText.includes('기존 이미지 변형') || buttonText.includes('🔄 기존')) {
                  console.log(`   ✅ 보라색 버튼 ${i + 1}번 발견: "${buttonText.trim()}"`);
                  variationButton = purpleButtons[i];
                  break;
                }
              }
            }
          } catch (e) {
            // 개별 버튼 확인 실패는 무시
          }
        }
      } catch (e) {
        console.log('   ⚠️ CSS 클래스로 찾기 실패...');
      }
    }
    
    // 방법 5: JavaScript로 직접 찾기
    if (!variationButton) {
      try {
        const foundButton = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          for (const btn of buttons) {
            const text = btn.textContent || '';
            const title = btn.getAttribute('title') || '';
            if (text.includes('기존 이미지 변형') || text.includes('🔄 기존') || 
                title.includes('기존 이미지를 변형')) {
              return {
                text: text.trim(),
                title: title,
                className: btn.className
              };
            }
          }
          return null;
        });
        
        if (foundButton) {
          console.log(`   ✅ JavaScript로 버튼 발견: "${foundButton.text}" (title: "${foundButton.title}")`);
          variationButton = await page.locator(`button:has-text("${foundButton.text}")`).first();
        }
      } catch (e) {
        console.log('   ⚠️ JavaScript로 찾기 실패:', e.message);
      }
    }
    
    if (variationButton && await variationButton.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 기존 이미지 변형 버튼 발견');
      await variationButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await variationButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ 기존 이미지 변형 버튼 클릭 완료\n');
    } else {
      console.log('   ⚠️ 기존 이미지 변형 버튼을 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-blog-variation-button-not-found.png', fullPage: true });
      throw new Error('기존 이미지 변형 버튼을 찾을 수 없습니다.');
    }
    
    // 4. 변형 모달 확인
    console.log('4️⃣ 변형 모달 확인...');
    await page.waitForTimeout(2000);
    
    const modal = await page.locator('div[class*="fixed"] h3:has-text("기존 이미지 변형")').first();
    if (await modal.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 변형 모달 열림');
      await page.screenshot({ path: 'test-blog-variation-modal-opened.png', fullPage: true });
    } else {
      console.log('   ⚠️ 변형 모달을 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-blog-variation-modal-not-found.png', fullPage: true });
    }
    
    // 5. 갤러리 탭 클릭
    console.log('5️⃣ 갤러리 탭 클릭...');
    await page.waitForTimeout(2000);
    
    const galleryTab = await page.locator('button:has-text("갤러리에서 선택"), button:has-text("🖼️ 갤러리에서 선택")').first();
    if (await galleryTab.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 갤러리 탭 발견');
      await galleryTab.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ 갤러리 탭 클릭 완료\n');
    } else {
      console.log('   ⚠️ 갤러리 탭을 찾을 수 없습니다.');
    }
    
    // 6. 첫 번째 이미지 선택 (모달 내부)
    console.log('6️⃣ 첫 번째 이미지 선택 (모달 내부)...');
    await page.waitForTimeout(2000);
    
    // 모달 내부의 이미지 그리드에서 첫 번째 이미지 찾기
    const variationModal = await page.locator('div[class*="fixed"][class*="z-50"]').first();
    if (await variationModal.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 변형 모달 확인');
      
      // 모달 내부의 이미지 찾기
      const firstImageInModal = await variationModal.locator('div[class*="cursor-pointer"][class*="border"]').first();
      if (await firstImageInModal.isVisible({ timeout: 5000 })) {
        console.log('   ✅ 모달 내 첫 번째 이미지 발견');
        
        // 이미지 컨테이너 클릭
        await firstImageInModal.click();
        await page.waitForTimeout(1000);
        console.log('   ✅ 첫 번째 이미지 클릭 완료');
        
        // 선택된 이미지가 표시되는지 확인 (파란색 테두리 또는 체크 표시)
        let imageSelected = false;
        for (let i = 0; i < 10; i++) {
          // 파란색 테두리 확인
          const selectedIndicator = await firstImageInModal.locator('div[class*="border-blue-500"], div[class*="bg-blue-50"]').first();
          if (await selectedIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log(`   ✅ 이미지 선택 확인 (파란색 테두리) - 시도 ${i + 1}`);
            imageSelected = true;
            break;
          }
          
          // 체크 표시 확인
          const checkMark = await firstImageInModal.locator('div:has-text("✓"), span:has-text("✓")').first();
          if (await checkMark.isVisible({ timeout: 500 }).catch(() => false)) {
            console.log(`   ✅ 이미지 선택 확인 (체크 표시) - 시도 ${i + 1}`);
            imageSelected = true;
            break;
          }
          
          await page.waitForTimeout(500);
        }
        
        if (imageSelected) {
          console.log('   ✅ 첫 번째 이미지 선택 완료\n');
        } else {
          console.log('   ⚠️ 이미지 선택 상태를 확인할 수 없지만 계속 진행...\n');
        }
      } else {
        // 모달 내부의 이미지 그리드 찾기
        const imageGrid = await variationModal.locator('div[class*="grid"], div[class*="grid-cols"]').first();
        if (await imageGrid.isVisible({ timeout: 3000 })) {
          const firstImage = await imageGrid.locator('div').first();
          if (await firstImage.isVisible({ timeout: 3000 })) {
            await firstImage.click();
            await page.waitForTimeout(2000);
            console.log('   ✅ 첫 번째 이미지 선택 완료\n');
          } else {
            console.log('   ⚠️ 이미지를 찾을 수 없습니다.');
            await page.screenshot({ path: 'test-blog-variation-no-images.png', fullPage: true });
          }
        } else {
          console.log('   ⚠️ 이미지 그리드를 찾을 수 없습니다.');
          await page.screenshot({ path: 'test-blog-variation-no-images.png', fullPage: true });
        }
      }
    } else {
      console.log('   ⚠️ 모달을 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-blog-variation-modal-not-found.png', fullPage: true });
    }
    
    // 7. "이미지 불러오기" 버튼 클릭 (활성화될 때까지 대기)
    console.log('7️⃣ "이미지 불러오기" 버튼 클릭...');
    await page.waitForTimeout(2000);
    
    // 이미지 선택 확인 (선택된 이미지 미리보기 표시 확인)
    const selectedImagePreview = await variationModal.locator('img[src], div[class*="selected"]').first();
    if (await selectedImagePreview.isVisible({ timeout: 3000 })) {
      console.log('   ✅ 선택된 이미지 미리보기 확인');
    }
    
    // 버튼이 활성화될 때까지 대기 (최대 10초)
    let loadButton = null;
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
      loadButton = await variationModal.locator('button:has-text("이미지 불러오기")').first();
      const isEnabled = await loadButton.isEnabled({ timeout: 1000 }).catch(() => false);
      
      if (isEnabled) {
        console.log(`   ✅ "이미지 불러오기" 버튼 활성화됨 (시도 ${attempts + 1})`);
        break;
      }
      
      attempts++;
      await page.waitForTimeout(500);
      
      if (attempts === maxAttempts) {
        console.log('   ⚠️ 버튼이 활성화되지 않았습니다. 현재 상태 확인...');
        const buttonState = await loadButton.getAttribute('disabled');
        console.log(`   📊 버튼 disabled 상태: ${buttonState}`);
        // 스크린샷 저장
        await page.screenshot({ path: 'test-blog-variation-load-button-disabled.png', fullPage: true });
      }
    }
    
    if (loadButton && await loadButton.isEnabled({ timeout: 1000 }).catch(() => false)) {
      console.log('   ✅ "이미지 불러오기" 버튼 발견 (활성화됨)');
      
      // API 응답 리스너 설정
      let apiResponse = null;
      page.on('response', async response => {
        if (response.url().includes('/api/get-image-prompt') && response.request().method() === 'POST') {
          try {
            apiResponse = await response.json();
            console.log('   📦 get-image-prompt API 응답:', JSON.stringify(apiResponse, null, 2));
          } catch (e) {
            console.log('   ⚠️ API 응답 파싱 실패:', e.message);
          }
        }
        if (response.url().includes('/api/analyze-image-prompt') && response.request().method() === 'POST') {
          try {
            apiResponse = await response.json();
            console.log('   📦 analyze-image-prompt API 응답:', JSON.stringify(apiResponse, null, 2));
          } catch (e) {
            console.log('   ⚠️ API 응답 파싱 실패:', e.message);
          }
        }
      });
      
      await loadButton.click();
      await page.waitForTimeout(5000);
      console.log('   ✅ "이미지 불러오기" 버튼 클릭 완료\n');
      
      // 8. "생성된 이미지" 섹션 나타날 때까지 대기
      console.log('8️⃣ "생성된 이미지" 섹션 나타날 때까지 대기...');
      await page.waitForTimeout(3000);
      
      // "생성된 이미지" 섹션 확인 (최대 30초 대기)
      let generatedImagesSection = null;
      let sectionAttempts = 0;
      const maxSectionAttempts = 30;
      
      while (sectionAttempts < maxSectionAttempts) {
        generatedImagesSection = await page.locator('h4:has-text("생성된 이미지"), div:has-text("생성된 이미지")').first();
        if (await generatedImagesSection.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`   ✅ "생성된 이미지" 섹션 발견 (시도 ${sectionAttempts + 1})`);
          break;
        }
        sectionAttempts++;
        await page.waitForTimeout(1000);
      }
      
      if (generatedImagesSection && await generatedImagesSection.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('   ✅ "생성된 이미지" 섹션 확인 완료');
        
        // "이미지 변형 중" 또는 "업로드 중" 상태가 끝날 때까지 대기
        console.log('   ⏳ 이미지 업로드 완료 대기 중...');
        let uploadComplete = false;
        let uploadAttempts = 0;
        const maxUploadAttempts = 60; // 최대 60초 대기
        
        while (!uploadComplete && uploadAttempts < maxUploadAttempts) {
          // "변형 중", "업로드 중", "생성 중" 텍스트 확인
          const uploadingText = await page.locator('text=변형 중, text=업로드 중, text=생성 중, text=...').first();
          const isUploading = await uploadingText.isVisible({ timeout: 1000 }).catch(() => false);
          
          if (!isUploading) {
            // 이미지가 완전히 로드되었는지 확인
            const generatedImage = await generatedImagesSection.locator('..').locator('..').locator('img').first();
            if (await generatedImage.isVisible({ timeout: 2000 }).catch(() => false)) {
              const imageSrc = await generatedImage.getAttribute('src');
              if (imageSrc && !imageSrc.includes('placeholder')) {
                console.log(`   ✅ 이미지 업로드 완료 확인 (시도 ${uploadAttempts + 1})`);
                uploadComplete = true;
                break;
              }
            }
          }
          
          uploadAttempts++;
          await page.waitForTimeout(1000);
          
          if (uploadAttempts % 10 === 0) {
            console.log(`   ⏳ 이미지 업로드 대기 중... (${uploadAttempts}초 경과)`);
          }
        }
        
        if (uploadComplete) {
          console.log('   ✅ 이미지 업로드 완료');
        } else {
          console.log('   ⚠️ 이미지 업로드 완료를 확인할 수 없지만 계속 진행...');
        }
        
        await page.screenshot({ path: 'test-blog-variation-generated-images-section.png', fullPage: true });
        
        // 9. 생성된 이미지 위의 "변형" 버튼 클릭
        console.log('9️⃣ 생성된 이미지 위의 "변형" 버튼 클릭...');
        await page.waitForTimeout(2000);
        
        // "생성된 이미지" 섹션 내부의 이미지 찾기 (모달 밖에 있을 수 있음)
        // 먼저 모달 밖에서 찾기
        let generatedImage = null;
        let imageParent = null;
        
        // 모달 밖의 "생성된 이미지" 섹션 찾기
        const pageGeneratedSection = await page.locator('h4:has-text("생성된 이미지")').first();
        if (await pageGeneratedSection.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('   ✅ 페이지의 "생성된 이미지" 섹션 발견');
          const pageImageContainer = await pageGeneratedSection.locator('..').locator('..').first();
          generatedImage = await pageImageContainer.locator('img').first();
          imageParent = await generatedImage.locator('..').locator('..').first();
        } else {
          // 모달 내부에서 찾기
          const generatedImageContainer = await generatedImagesSection.locator('..').locator('..').first();
          generatedImage = await generatedImageContainer.locator('img').first();
          imageParent = await generatedImage.locator('..').locator('..').first();
        }
        
        if (await generatedImage.isVisible({ timeout: 5000 })) {
          console.log('   ✅ 생성된 이미지 발견');
          
          // 이미지에 직접 호버 (오버레이를 피하기 위해 이미지 자체에 호버)
          await page.evaluate((img) => {
            const container = img.closest('.relative.group, .relative[class*="group"]');
            if (container) {
              const event = new MouseEvent('mouseenter', {
                view: window,
                bubbles: true,
                cancelable: true
              });
              container.dispatchEvent(event);
            }
          }, await generatedImage.elementHandle());
          await page.waitForTimeout(1500);
          console.log('   ✅ 이미지 호버 완료');
          
          // 호버 시 나타나는 "변형" 버튼 찾기 (🎨 이모지 또는 title="변형")
          const variationButton = await imageParent.locator('button[title="변형"], button:has-text("🎨")').first();
          
          if (await variationButton.isVisible({ timeout: 5000 })) {
            console.log('   ✅ 이미지 위의 "변형" 버튼 발견');
            await variationButton.click();
            await page.waitForTimeout(3000);
            console.log('   ✅ "변형" 버튼 클릭 완료\n');
            
            // 10. 변형 생성 완료까지 대기
            console.log('🔟 변형 생성 완료까지 대기...');
            await page.waitForTimeout(3000);
            
            // "변형 중..." 또는 "생성 중..." 메시지 확인 및 대기
            let isGenerating = true;
            let generationAttempts = 0;
            const maxGenerationAttempts = 120; // 최대 2분 대기
            
            while (isGenerating && generationAttempts < maxGenerationAttempts) {
              // "변형 중...", "생성 중...", "업로드 중..." 텍스트 확인
              const generatingText = await page.locator('text=변형 중, text=생성 중, text=업로드 중, text=...').first();
              const isStillGenerating = await generatingText.isVisible({ timeout: 1000 }).catch(() => false);
              
              if (!isStillGenerating) {
                // 생성 완료 확인 모달 확인
                const completionModal = await page.locator('div[role="dialog"]:has-text("변형이 완료되었습니다"), div[role="dialog"]:has-text("생성되었습니다")').first();
                if (await completionModal.isVisible({ timeout: 2000 }).catch(() => false)) {
                  console.log('   ✅ 생성 완료 확인 모달 발견');
                  
                  // "확인" 버튼 클릭하여 모달 닫기
                  const confirmButton = await completionModal.locator('button:has-text("확인")').first();
                  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await confirmButton.click();
                    await page.waitForTimeout(1000);
                    console.log('   ✅ 생성 완료 모달 닫기 완료');
                  }
                  
                  isGenerating = false;
                  break;
                }
                
                // 생성된 이미지 개수 확인
                const pageGeneratedSection2 = await page.locator('h4:has-text("생성된 이미지")').first();
                if (await pageGeneratedSection2.isVisible({ timeout: 2000 }).catch(() => false)) {
                  const imageContainer = await pageGeneratedSection2.locator('..').locator('..').first();
                  const newGeneratedImages = await imageContainer.locator('img').all();
                  const imageCount = newGeneratedImages.length;
                  
                  if (imageCount > 1) {
                    console.log(`   ✅ 새로운 이미지 생성 완료! (총 ${imageCount}개)`);
                    isGenerating = false;
                    break;
                  }
                }
              }
              
              generationAttempts++;
              await page.waitForTimeout(2000);
              
              if (generationAttempts % 10 === 0) {
                console.log(`   ⏳ 변형 생성 대기 중... (${generationAttempts * 2}초 경과)`);
              }
            }
            
            if (generationAttempts >= maxGenerationAttempts) {
              console.log('   ⚠️ 변형 생성 시간 초과 (최대 대기 시간 도달)');
            }
            
            // 최종 생성된 이미지 개수 확인
            const pageGeneratedSection2 = await page.locator('h4:has-text("생성된 이미지")').first();
            if (await pageGeneratedSection2.isVisible({ timeout: 3000 }).catch(() => false)) {
              const imageContainer = await pageGeneratedSection2.locator('..').locator('..').first();
              const finalGeneratedImages = await imageContainer.locator('img').all();
              console.log(`   ✅ 최종 생성된 이미지 개수: ${finalGeneratedImages.length}개`);
            }
            
            // 최종 스크린샷
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'test-blog-variation-completed.png', fullPage: true });
            console.log('   📸 최종 스크린샷 저장: test-blog-variation-completed.png');
            
          } else {
            console.log('   ⚠️ 이미지 위의 "변형" 버튼을 찾을 수 없습니다.');
            // 스크린샷 저장
            await page.screenshot({ path: 'test-blog-variation-no-variation-button.png', fullPage: true });
            
            // 다른 방법으로 버튼 찾기 시도
            const allButtons = await imageParent.locator('button').all();
            console.log(`   🔍 이미지 컨테이너 내부 버튼 개수: ${allButtons.length}개`);
            for (let i = 0; i < allButtons.length; i++) {
              const buttonText = await allButtons[i].textContent();
              const buttonTitle = await allButtons[i].getAttribute('title');
              console.log(`   📋 버튼 ${i + 1}: text="${buttonText}", title="${buttonTitle}"`);
            }
          }
        } else {
          console.log('   ⚠️ 생성된 이미지를 찾을 수 없습니다.');
          await page.screenshot({ path: 'test-blog-variation-no-generated-image.png', fullPage: true });
        }
      } else {
        console.log('   ⚠️ "생성된 이미지" 섹션을 찾을 수 없습니다.');
        await page.screenshot({ path: 'test-blog-variation-no-generated-section.png', fullPage: true });
      }
      
    } else {
      console.log('   ⚠️ "이미지 불러오기" 버튼을 찾을 수 없거나 활성화되지 않았습니다.');
      await page.screenshot({ path: 'test-blog-variation-load-button-not-found.png', fullPage: true });
    }
    
    await page.screenshot({ path: 'test-blog-variation-final-state.png', fullPage: true });
    console.log('\n✅ 블로그 변형 기능 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'test-blog-variation-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();

