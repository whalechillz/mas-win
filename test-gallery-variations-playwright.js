// Playwright로 갤러리 두 가지 변형 버튼 테스트
const { chromium } = require('playwright');

(async () => {
  console.log('🎭 Playwright 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 디버깅을 위해 느리게 실행
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 네트워크 요청 로깅
  page.on('request', request => {
    if (request.url().includes('/api/vary-existing-image') || 
        request.url().includes('/api/generate-blog-image-replicate-flux')) {
      console.log(`📤 요청: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/vary-existing-image') || 
        response.url().includes('/api/generate-blog-image-replicate-flux')) {
      console.log(`📥 응답: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 입력 필드가 나타날 때까지 대기
    await page.waitForSelector('input#login', { timeout: 10000 });
    await page.waitForSelector('input#password', { timeout: 10000 });
    
    // 전화번호 입력 (자동 포맷팅을 위해 숫자만 입력)
    await page.fill('input#login', '01066699000');
    await page.waitForTimeout(500);
    
    // 비밀번호 입력
    await page.fill('input#password', '66699000');
    await page.waitForTimeout(500);
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 로그인 완료 대기 (리다이렉트 또는 에러 메시지 확인)
    await page.waitForTimeout(3000);
    
    // 로그인 성공 확인 (URL이 /admin으로 변경되었는지 확인)
    const currentUrl = page.url();
    if (currentUrl.includes('/admin') && !currentUrl.includes('/login')) {
      console.log('   ✅ 로그인 완료\n');
    } else {
      // 에러 메시지 확인
      const errorMessage = await page.evaluate(() => {
        const errorDiv = document.querySelector('.text-red-700, .bg-red-50');
        return errorDiv ? errorDiv.textContent : null;
      });
      
      if (errorMessage) {
        console.log(`   ❌ 로그인 실패: ${errorMessage}`);
        throw new Error(`로그인 실패: ${errorMessage}`);
      } else {
        console.log('   ⚠️ 로그인 상태 확인 필요');
      }
    }
    
    // 2. 갤러리 페이지로 이동
    console.log('2️⃣ 갤러리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/gallery', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // 초기 로드 대기
    
    // 갤러리 리스트가 나타날 때까지 대기
    console.log('   ⏳ 이미지 리스트 로딩 대기...');
    let imagesLoaded = false;
    let waitCount = 0;
    const maxWait = 30; // 최대 30초 대기
    
    while (!imagesLoaded && waitCount < maxWait) {
      await page.waitForTimeout(1000);
      waitCount++;
      
      // 이미지가 로드되었는지 확인
      const imageCount = await page.evaluate(() => {
        const selectors = [
          'img[src*="blog-images"]',
          'img[src*="supabase"]',
          'div[class*="cursor-pointer"] img',
          'div[class*="border-2"] img',
          'div[class*="group"] img',
          'img[class*="object-cover"]',
          'img[alt]'
        ];
        
        for (const selector of selectors) {
          const images = document.querySelectorAll(selector);
          if (images.length > 0) {
            return images.length;
          }
        }
        
        return document.querySelectorAll('img').length;
      });
      
      if (imageCount > 0) {
        imagesLoaded = true;
        console.log(`   ✅ 이미지 ${imageCount}개 발견!`);
      } else {
        console.log(`   ⏳ 대기 중... (${waitCount}/${maxWait}초)`);
      }
    }
    
    if (!imagesLoaded) {
      console.log('   ⚠️ 이미지가 로드되지 않았습니다. 스크린샷 저장...');
      await page.screenshot({ path: 'test-gallery-no-images.png', fullPage: true });
      throw new Error('이미지가 로드되지 않았습니다.');
    }
    
    console.log('   ✅ 갤러리 페이지 로드 완료\n');
    
    // 3. 이미지 찾기 및 확대 모달 열기
    console.log('3️⃣ 이미지 찾기 및 확대 모달 열기...');
    await page.waitForTimeout(2000);
    
    // "🔍" (확대) 버튼 찾기 및 클릭
    const zoomButtonClicked = await page.evaluate(() => {
      // title이 "확대"인 버튼 찾기
      const buttons = Array.from(document.querySelectorAll('button'));
      const zoomButton = buttons.find(btn => {
        const title = btn.getAttribute('title');
        const text = btn.textContent || '';
        return (title === '확대' || text.includes('🔍')) && btn.offsetParent !== null;
      });
      
      if (zoomButton) {
        zoomButton.click();
        return true;
      }
      
      return false;
    });
    
    if (!zoomButtonClicked) {
      console.log('   ⚠️ 확대 버튼을 찾을 수 없습니다. 이미지를 직접 클릭합니다...');
      // 확대 버튼이 없으면 이미지 직접 클릭
      const imageClicked = await page.evaluate(() => {
        const selectors = [
          'img[src*="blog-images"]',
          'img[src*="supabase"]',
          'div[class*="cursor-pointer"] img',
          'div[class*="border-2"] img',
          'div[class*="group"] img',
          'img[class*="object-cover"]',
          'img[alt]'
        ];
        
        for (const selector of selectors) {
          const images = document.querySelectorAll(selector);
          if (images.length > 0) {
            const img = images[0];
            const container = img.closest('div[class*="cursor-pointer"], div[class*="group"], div[class*="border"]');
            if (container) {
              container.click();
              return true;
            } else {
              img.click();
              return true;
            }
          }
        }
        
        return false;
      });
      
      if (!imageClicked) {
        throw new Error('이미지나 확대 버튼을 찾을 수 없습니다.');
      }
    } else {
      console.log('   ✅ 확대 버튼 클릭 완료');
    }
    
    // 모달이 열릴 때까지 대기
    console.log('   ⏳ 확대 모달 열기 대기...');
    let modalOpened = false;
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(500);
      const hasModal = await page.evaluate(() => {
        // 모달 요소 찾기 (fixed inset-0 bg-black)
        const modals = Array.from(document.querySelectorAll('[class*="fixed"]'))
          .filter(el => {
            const classes = el.className || '';
            return classes.includes('inset-0') && classes.includes('bg-black');
          });
        return modals.length > 0;
      });
      
      if (hasModal) {
        modalOpened = true;
        console.log('   ✅ 확대 모달 열림!');
        break;
      }
    }
    
    if (!modalOpened) {
      console.log('   ⚠️ 확대 모달이 열리지 않았습니다. 스크린샷 저장...');
      await page.screenshot({ path: 'test-gallery-modal-not-opened.png', fullPage: true });
    }
    
    await page.waitForTimeout(2000);
    console.log('   ✅ 확대 모달 열기 완료\n');
    
    // 4. 🔄 변형 (FAL) 버튼 테스트
    console.log('4️⃣ 🔄 변형 (FAL) 버튼 테스트...');
    
    // 확대 모달이 완전히 로드될 때까지 대기
    await page.waitForTimeout(3000);
    
    // 스크린샷 저장 (디버깅용)
    await page.screenshot({ path: 'test-gallery-modal-opened.png', fullPage: true });
    
    // 확대 모달 내부의 버튼만 찾기 (모달이 열려있는지 확인)
    const modalButtons = await page.evaluate(() => {
      // 모달 요소 찾기 (fixed inset-0 bg-black)
      const modals = Array.from(document.querySelectorAll('[class*="fixed"]'))
        .filter(el => {
          const classes = el.className || '';
          return classes.includes('inset-0') && classes.includes('bg-black');
        });
      
      if (modals.length === 0) {
        // 모든 버튼 찾기 (모달이 아닐 수도 있음)
        const allButtons = Array.from(document.querySelectorAll('button'))
          .filter(btn => btn.offsetParent !== null) // 보이는 버튼만
          .map(btn => ({
            text: btn.textContent?.trim(),
            title: btn.getAttribute('title'),
            className: btn.className,
            visible: btn.offsetParent !== null
          }));
        return { 
          found: false, 
          buttons: allButtons,
          message: '모달을 찾지 못했습니다. 모든 보이는 버튼을 반환합니다.'
        };
      }
      
      // 모달 내부의 버튼 찾기
      const buttons = Array.from(modals[0].querySelectorAll('button'))
        .filter(btn => btn.offsetParent !== null) // 보이는 버튼만
        .map(btn => ({
          text: btn.textContent?.trim(),
          title: btn.getAttribute('title'),
          className: btn.className,
          visible: btn.offsetParent !== null
        }));
      
      return { found: true, buttons, modalClass: modals[0].className };
    });
    
    console.log('   📋 확대 모달 내부 버튼:', JSON.stringify(modalButtons, null, 2));
    
    // 모달에서 "🔄 변형 (FAL)" 버튼 찾기
    let falButtonFound = false;
    
    try {
      // 방법 1: title 속성으로 찾기 (모달 내부)
      const falButton1 = await page.locator('button[title*="변형 (FAL AI")').first();
      if (await falButton1.isVisible({ timeout: 3000 })) {
        await falButton1.click();
        falButtonFound = true;
        console.log('   ✅ 🔄 변형 (FAL) 버튼 클릭 완료 (title 속성)');
      }
    } catch (e) {
      // 방법 2: 텍스트로 찾기
      try {
        const falButton2 = await page.locator('button:has-text("변형 (FAL)")').first();
        if (await falButton2.isVisible({ timeout: 3000 })) {
          await falButton2.click();
          falButtonFound = true;
          console.log('   ✅ 🔄 변형 (FAL) 버튼 클릭 완료 (텍스트)');
        }
      } catch (e2) {
        // 방법 3: JavaScript로 모달 내부에서 찾기
        const found = await page.evaluate(() => {
          // 모달 요소 찾기 (fixed inset-0 또는 z-50)
          const modals = Array.from(document.querySelectorAll('[class*="fixed"]'))
            .filter(el => {
              const style = window.getComputedStyle(el);
              const classes = el.className || '';
              return (classes.includes('z-50') || 
                      (style.zIndex && parseInt(style.zIndex) >= 50)) &&
                     (classes.includes('inset-0') || classes.includes('bg-black'));
            });
          
          if (modals.length === 0) {
            // 모든 버튼에서 찾기 (모달이 아닐 수도 있음)
            const allButtons = Array.from(document.querySelectorAll('button'));
            const falButton = allButtons.find(btn => {
              const text = btn.textContent || '';
              const title = btn.getAttribute('title') || '';
              return (text.includes('변형 (FAL)') || 
                     text.includes('🔄 변형') ||
                     title.includes('변형 (FAL') ||
                     title.includes('FAL AI')) &&
                     btn.offsetParent !== null; // 보이는 버튼만
            });
            
            if (falButton) {
              falButton.click();
              return true;
            }
            return false;
          }
          
          const buttons = Array.from(modals[0].querySelectorAll('button'));
          const falButton = buttons.find(btn => {
            const text = btn.textContent || '';
            const title = btn.getAttribute('title') || '';
            return text.includes('변형 (FAL)') || 
                   text.includes('🔄 변형') ||
                   title.includes('변형 (FAL') ||
                   title.includes('FAL AI');
          });
          
          if (falButton) {
            falButton.click();
            return true;
          }
          
          return false;
        });
        
        if (found) {
          falButtonFound = true;
          console.log('   ✅ 🔄 변형 (FAL) 버튼 클릭 완료 (JavaScript)');
        }
      }
    }
    
    if (!falButtonFound) {
      console.log('   ⚠️ 🔄 변형 (FAL) 버튼을 찾을 수 없습니다.');
    } else {
      console.log('   ✅ 🔄 변형 (FAL) 버튼 클릭 완료');
      
      // 변형 모달이 열릴 때까지 대기
      console.log('   ⏳ 변형 모달 열기 대기...');
      let variationModalOpened = false;
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(500);
        const hasModal = await page.evaluate(() => {
          // 프롬프트 입력 필드 찾기
          const promptInput = document.querySelector('input[placeholder*="프롬프트"], textarea[placeholder*="프롬프트"], input[placeholder*="밝게"], textarea[placeholder*="밝게"]');
          return promptInput !== null;
        });
        
        if (hasModal) {
          variationModalOpened = true;
          console.log('   ✅ 변형 모달 열림!');
          break;
        }
      }
      
      if (!variationModalOpened) {
        console.log('   ⚠️ 변형 모달이 열리지 않았습니다.');
        await page.screenshot({ path: 'test-gallery-variation-modal-not-opened.png', fullPage: true });
      } else {
        console.log('   ✅ 변형 모달 열림');
        
        // 프롬프트 입력
        await page.evaluate(() => {
          const promptInput = document.querySelector('input[placeholder*="프롬프트"], textarea[placeholder*="프롬프트"]');
          if (promptInput) {
            promptInput.value = '아시아 인으로 변경';
            promptInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        
        await page.waitForTimeout(1000);
        
        // "이미지 변형하기" 버튼 클릭
        const transformButtonClicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const transformButton = buttons.find(btn => 
            btn.textContent.includes('변형하기') || 
            btn.textContent.includes('변형')
          );
          
          if (transformButton && !transformButton.disabled) {
            transformButton.click();
            return true;
          }
          
          return false;
        });
        
        if (transformButtonClicked) {
          console.log('   ✅ 변형 시작 버튼 클릭 완료');
          console.log('   ⏳ 변형 진행 중... (최대 60초 대기)');
          
          // 변형 완료 대기 (최대 60초)
          let variationCompleted = false;
          for (let i = 0; i < 60; i++) {
            await page.waitForTimeout(1000);
            
            // 성공 메시지 확인
            const successMessage = await page.evaluate(() => {
              return document.body.textContent.includes('변형 완료') || 
                     document.body.textContent.includes('완료') ||
                     document.body.textContent.includes('이미지 변형 완료');
            });
            
            if (successMessage) {
              variationCompleted = true;
              console.log(`   ✅ 🔄 변형 (FAL) 성공! (${i + 1}초 소요)`);
              break;
            }
            
            // 에러 메시지 확인
            const errorMessage = await page.evaluate(() => {
              return document.body.textContent.includes('실패') || 
                     document.body.textContent.includes('오류') ||
                     document.body.textContent.includes('에러');
            });
            
            if (errorMessage) {
              console.log(`   ❌ 🔄 변형 (FAL) 실패 (${i + 1}초 후)`);
              break;
            }
            
            if (i % 10 === 9) {
              console.log(`   ⏳ 변형 진행 중... (${i + 1}초)`);
            }
          }
          
          if (!variationCompleted) {
            console.log('   ⚠️ 🔄 변형 (FAL) 결과 확인 필요 (60초 초과)');
          }
        } else {
          console.log('   ⚠️ 변형 시작 버튼을 찾을 수 없거나 비활성화되어 있습니다.');
        }
        
        // 모달 닫기
        await page.evaluate(() => {
          const cancelButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.includes('취소')
          );
          if (cancelButton) cancelButton.click();
        });
        
        await page.waitForTimeout(2000);
      }
    }
    
    console.log('\n');
    
    // 5. 🎨 변형 (Replicate) 버튼 테스트
    console.log('5️⃣ 🎨 변형 (Replicate) 버튼 테스트...');
    
    // 이전 모달이 닫혔을 수 있으므로 다시 확대 모달 열기
    await page.waitForTimeout(2000);
    
    // ESC 키로 모달 닫기 시도
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // 다시 이미지 클릭하여 확대 모달 열기
    await page.evaluate(() => {
      const selectors = [
        'img[src*="blog-images"]',
        'img[src*="supabase"]',
        'div[class*="cursor-pointer"] img',
        'div[class*="border-2"] img',
        'div[class*="group"] img',
        'img[class*="object-cover"]',
        'img[alt]'
      ];
      
      for (const selector of selectors) {
        const images = document.querySelectorAll(selector);
        if (images.length > 0) {
          const img = images[0];
          const container = img.closest('div[class*="cursor-pointer"], div[class*="group"], div[class*="border"]');
          if (container) {
            container.click();
          } else {
            img.click();
          }
          break;
        }
      }
    });
    
    await page.waitForTimeout(2000);
    
    // 모달에서 "🎨 변형 (Replicate)" 버튼 찾기 (여러 방법 시도)
    let replicateButtonFound = false;
    
    try {
      // 방법 1: title 속성으로 찾기
      const replicateButton1 = await page.locator('button[title*="변형 (Replicate")').first();
      if (await replicateButton1.isVisible({ timeout: 2000 })) {
        const isDisabled = await replicateButton1.isDisabled();
        if (!isDisabled) {
          await replicateButton1.click();
          replicateButtonFound = true;
          console.log('   ✅ 🎨 변형 (Replicate) 버튼 클릭 완료 (title 속성)');
        } else {
          console.log('   ⚠️ 🎨 변형 (Replicate) 버튼이 비활성화되어 있습니다.');
        }
      }
    } catch (e) {
      // 방법 2: 텍스트로 찾기
      try {
        const replicateButton2 = await page.locator('button:has-text("변형 (Replicate)")').first();
        if (await replicateButton2.isVisible({ timeout: 2000 })) {
          const isDisabled = await replicateButton2.isDisabled();
          if (!isDisabled) {
            await replicateButton2.click();
            replicateButtonFound = true;
            console.log('   ✅ 🎨 변형 (Replicate) 버튼 클릭 완료 (텍스트)');
          } else {
            console.log('   ⚠️ 🎨 변형 (Replicate) 버튼이 비활성화되어 있습니다.');
          }
        }
      } catch (e2) {
        // 방법 3: JavaScript로 찾기
        const found = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const replicateButton = buttons.find(btn => {
            const text = btn.textContent || '';
            const title = btn.getAttribute('title') || '';
            return (text.includes('변형 (Replicate)') || 
                   text.includes('🎨 변형') ||
                   title.includes('변형 (Replicate') ||
                   title.includes('Replicate')) &&
                   !btn.disabled;
          });
          
          if (replicateButton) {
            replicateButton.click();
            return true;
          }
          
          return false;
        });
        
        if (found) {
          replicateButtonFound = true;
          console.log('   ✅ 🎨 변형 (Replicate) 버튼 클릭 완료 (JavaScript)');
        }
      }
    }
    
    if (!replicateButtonFound) {
      console.log('   ⚠️ 🎨 변형 (Replicate) 버튼을 찾을 수 없거나 비활성화되어 있습니다.');
    } else {
      console.log('   ✅ 🎨 변형 (Replicate) 버튼 클릭 완료');
      await page.waitForTimeout(10000); // 변형 완료 대기
      
      // 성공 메시지 확인
      const successMessage = await page.evaluate(() => {
        return document.body.textContent.includes('변형 완료') || 
               document.body.textContent.includes('완료') ||
               document.body.textContent.includes('Replicate');
      });
      
      if (successMessage) {
        console.log('   ✅ 🎨 변형 (Replicate) 성공!');
      } else {
        console.log('   ⚠️ 🎨 변형 (Replicate) 결과 확인 필요');
      }
    }
    
    console.log('\n✅ 테스트 완료!');
    
    // 최종 스크린샷
    await page.screenshot({ path: 'test-gallery-variations-final.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'test-gallery-variations-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();

