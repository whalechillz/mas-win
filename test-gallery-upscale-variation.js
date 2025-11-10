const { chromium } = require('playwright');

(async () => {
  console.log('🚀 갤러리 업스케일링 및 변형 기능 테스트 시작...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 입력 필드가 보일 때까지 대기
    await page.waitForSelector('input[type="text"]', { state: 'visible' });
    await page.waitForSelector('input[type="password"]', { state: 'visible' });
    
    await page.fill('input[type="text"]', '01066699000');
    await page.fill('input[type="password"]', '66699000');
    
    // 제출 버튼 클릭
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('✅ 로그인 완료\n');

    // 2. 갤러리 페이지로 이동
    console.log('2️⃣ 갤러리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/gallery');
    await page.waitForTimeout(2000);
    console.log('✅ 갤러리 페이지 로드 완료\n');

    // 3. 이미지 찾기 및 클릭
    console.log('3️⃣ 이미지 찾기 및 클릭...');
    await page.waitForTimeout(5000); // 이미지 로딩 대기 (5초로 증가)
    
    // 여러 선택자 시도
    let imageFound = false;
    const imageSelectors = [
      'img[src*="blog-images"]',
      'img[src*="supabase"]',
      'div[class*="cursor-pointer"] img',
      'div[class*="border-2"] img',
      'div[class*="group"] img'
    ];
    
    // 이미지에 마우스 호버하여 확대 버튼 표시
    for (const selector of imageSelectors) {
      const images = await page.$$(selector);
      if (images.length > 0) {
        console.log(`   ✅ "${selector}" 선택자로 이미지 ${images.length}개 발견`);
        
        // 이미지에 마우스 호버
        await images[0].hover();
        await page.waitForTimeout(1000);
        
        // 확대 버튼(🔍) 찾기 및 클릭
        const zoomButtons = await page.$$('button[title="확대"], button:has-text("🔍")');
        if (zoomButtons.length > 0) {
          console.log(`   ✅ 확대 버튼 발견, 클릭...`);
          await zoomButtons[0].click();
          await page.waitForTimeout(3000);
          imageFound = true;
          break;
        }
        
        // 확대 버튼이 없으면 이미지 컨테이너 클릭
        const imageElement = images[0];
        const container = await imageElement.evaluateHandle(el => {
          let parent = el.parentElement;
          while (parent && !parent.classList.contains('cursor-pointer')) {
            parent = parent.parentElement;
          }
          return parent || el;
        });
        
        if (container) {
          await container.click();
          await page.waitForTimeout(3000);
          imageFound = true;
          break;
        }
      }
    }
    
    if (!imageFound) {
      // 이미지 컨테이너에 마우스 호버 후 확대 버튼 클릭
      const containers = await page.$$('div[class*="cursor-pointer"][class*="border-2"]');
      if (containers.length > 0) {
        console.log(`   ✅ 이미지 컨테이너 ${containers.length}개 발견`);
        await containers[0].hover();
        await page.waitForTimeout(1000);
        
        // 확대 버튼 찾기
        const zoomButtons = await page.$$('button[title="확대"], button:has-text("🔍")');
        if (zoomButtons.length > 0) {
          console.log(`   ✅ 확대 버튼 발견, 클릭...`);
          await zoomButtons[0].click();
          await page.waitForTimeout(3000);
          imageFound = true;
        } else {
          // 확대 버튼이 없으면 컨테이너 클릭
          await containers[0].click();
          await page.waitForTimeout(3000);
          imageFound = true;
        }
      }
    }
    
    if (!imageFound) {
      console.log('   ⚠️ 이미지를 찾을 수 없습니다. 페이지 스크린샷 저장...');
      await page.screenshot({ path: 'test-gallery-no-images.png', fullPage: true });
      throw new Error('갤러리에 이미지가 없습니다.');
    }
    
    console.log('✅ 이미지 클릭 완료\n');
    
    // 모달이 완전히 로드될 때까지 대기
    await page.waitForTimeout(3000);
    
    // 모달 확인 (여러 선택자 시도)
    let modal = null;
    const modalSelectors = [
      'div[class*="fixed"][class*="inset-0"][class*="z-50"]',
      'div[class*="fixed"][class*="inset-0"]',
      'div[class*="bg-black"][class*="bg-opacity"]',
      'div:has-text("편집")',
      'div:has-text("복사")'
    ];
    
    for (const selector of modalSelectors) {
      modal = await page.$(selector);
      if (modal) {
        console.log(`   ✅ 모달 발견: "${selector}"`);
        break;
      }
    }
    
    if (!modal) {
      console.log('   ⚠️ 모달이 열리지 않았습니다. 스크린샷 저장...');
      await page.screenshot({ path: 'test-modal-not-opened.png', fullPage: true });
      // 모달이 없어도 계속 진행 (버튼이 페이지에 있을 수 있음)
      console.log('   ⚠️ 모달 없이 계속 진행...\n');
    } else {
      console.log('   ✅ 모달 확인됨\n');
    }

    // 4. 업스케일링 버튼 테스트 (모달 내부에서만 검색)
    console.log('4️⃣ 업스케일링 버튼 테스트...');
    await page.waitForTimeout(2000);
    
    // API 응답 리스너 설정
    let upscaleApiResponse = null;
    page.on('response', async response => {
      if (response.url().includes('/api/admin/upscale-image') && response.request().method() === 'POST') {
        try {
          upscaleApiResponse = await response.json();
          console.log('   📦 업스케일링 API 응답:', JSON.stringify(upscaleApiResponse, null, 2));
        } catch (e) {
          console.log('   ⚠️ API 응답 파싱 실패:', e.message);
        }
      }
    });
    
    // 모달 내부의 버튼만 찾기 (여러 선택자 시도)
    let modalButtons = await page.$$('div[class*="fixed"][class*="inset-0"] button');
    if (modalButtons.length === 0) {
      // 다른 선택자 시도
      modalButtons = await page.$$('div[class*="bg-black"][class*="bg-opacity"] button');
    }
    if (modalButtons.length === 0) {
      // 모달 헤더 영역의 버튼 찾기
      modalButtons = await page.$$('div[class*="flex"][class*="items-center"][class*="gap-2"] button');
    }
    if (modalButtons.length === 0) {
      // 모든 버튼 중에서 모달 내부 버튼 찾기
      const allButtons = await page.$$('button');
      const buttonsInModal = [];
      for (const btn of allButtons) {
        const text = await btn.textContent();
        if (text && (text.includes('편집') || text.includes('복사') || text.includes('저장') || text.includes('삭제') || text.includes('변형') || text.includes('업스케일'))) {
          buttonsInModal.push(btn);
        }
      }
      modalButtons = buttonsInModal;
    }
    console.log(`   모달 내부 버튼 ${modalButtons.length}개 발견`);
    
    let upscaleButton = null;
    for (const btn of modalButtons) {
      const text = await btn.textContent();
      const title = await btn.getAttribute('title');
      if (text && (text.includes('업스케일') || text.includes('⬆️'))) {
        console.log(`   ✅ 업스케일 버튼 발견: "${text.trim()}"`);
        upscaleButton = btn;
        break;
      }
      if (title && title.includes('업스케일')) {
        console.log(`   ✅ 업스케일 버튼 발견 (title): "${title}"`);
        upscaleButton = btn;
        break;
      }
    }
    
    if (!upscaleButton) {
      console.log('   ⚠️ 업스케일 버튼을 찾을 수 없습니다. 모달 내부 버튼 텍스트:');
      for (let i = 0; i < Math.min(modalButtons.length, 15); i++) {
        const text = await modalButtons[i].textContent();
        const title = await modalButtons[i].getAttribute('title');
        console.log(`      버튼 ${i + 1}: "${text?.trim()}" (title: "${title}")`);
      }
      await page.screenshot({ path: 'test-upscale-button-not-found.png', fullPage: true });
      throw new Error('업스케일 버튼을 찾을 수 없습니다.');
    }
    
    console.log('   업스케일 버튼 클릭...');
    
    // 확인 다이얼로그 리스너 설정 (버튼 클릭 전에 설정)
    page.once('dialog', async dialog => {
      console.log(`   다이얼로그: ${dialog.message()}`);
      await dialog.accept();
    });
    
    await upscaleButton.click();
    await page.waitForTimeout(2000); // 다이얼로그 대기
    
    // 업스케일링 진행 상태 확인
    console.log('   ⏳ 업스케일링 진행 중...');
    
    // 최대 120초 대기 (업스케일링은 시간이 걸릴 수 있음)
    let upscaleCompleted = false;
    let upscaleError = false;
    
    for (let i = 0; i < 120; i++) {
      await page.waitForTimeout(2000);
      
      // 버튼 상태 확인
      const buttons = await page.$$('button');
      let foundUpscaleButton = false;
      let isProcessing = false;
      
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && (text.includes('업스케일') || text.includes('⬆️'))) {
          foundUpscaleButton = true;
          const isDisabled = await btn.isDisabled();
          const btnText = text.trim();
          
          if (btnText.includes('업스케일링 중') || btnText.includes('⏳')) {
            isProcessing = true;
            if (i % 10 === 0) { // 20초마다 로그
              console.log(`   ⏳ 업스케일링 진행 중... (${i * 2}초 경과)`);
            }
          } else if (!isDisabled && !isProcessing) {
            upscaleCompleted = true;
            console.log('   ✅ 업스케일 버튼이 다시 활성화됨 (완료 또는 실패)');
            break;
          }
        }
      }
      
      if (upscaleCompleted) break;
      
      // 알림 확인 (페이지의 alert는 직접 확인할 수 없지만, 콘솔 로그로 확인)
      const consoleLogs = [];
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('업스케일') || text.includes('오류') || text.includes('에러')) {
          consoleLogs.push(text);
          console.log(`   [콘솔]: ${text}`);
        }
      });
    }
    
    if (upscaleCompleted) {
      console.log('   ✅ 업스케일링 완료 (또는 실패)');
      if (upscaleApiResponse) {
        if (upscaleApiResponse.success) {
          console.log(`   ✅ 저장 성공: ${upscaleApiResponse.imageUrl || upscaleApiResponse.fileName}`);
          if (upscaleApiResponse.imageUrl) {
            const urlParts = upscaleApiResponse.imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const folderMatch = upscaleApiResponse.imageUrl.match(/originals\/(\d{4}-\d{2}-\d{2})\//);
            if (folderMatch) {
              console.log(`   📁 저장 위치: originals/${folderMatch[1]}/${fileName}`);
            } else {
              console.log(`   📁 저장 위치: ${upscaleApiResponse.imageUrl}`);
            }
          }
        } else {
          console.log(`   ❌ 저장 실패: ${upscaleApiResponse.error || '알 수 없는 오류'}`);
        }
      }
      console.log('');
    } else {
      console.log('   ⚠️ 업스케일링 타임아웃 (240초 초과)\n');
    }

    // 5. 변형 버튼 테스트 (모달 내부에서만 검색)
    console.log('5️⃣ 변형 버튼 테스트...');
    await page.waitForTimeout(2000);
    
    // 모달 내부의 버튼 다시 찾기 (업스케일링 후 모달이 다시 로드되었을 수 있음)
    let modalButtons2 = await page.$$('div[class*="fixed"][class*="inset-0"] button');
    if (modalButtons2.length === 0) {
      const allButtons2 = await page.$$('button');
      const buttonsInModal2 = [];
      for (const btn of allButtons2) {
        const text = await btn.textContent();
        if (text && (text.includes('편집') || text.includes('복사') || text.includes('저장') || text.includes('삭제') || text.includes('변형') || text.includes('업스케일'))) {
          buttonsInModal2.push(btn);
        }
      }
      modalButtons2 = buttonsInModal2;
    }
    
    let variationButton = null;
    for (const btn of modalButtons2) {
      const text = await btn.textContent();
      const title = await btn.getAttribute('title');
      if (text && (text.includes('변형') || text.includes('🔄'))) {
        console.log(`   ✅ 변형 버튼 발견: "${text.trim()}"`);
        variationButton = btn;
        break;
      }
      if (title && title.includes('변형')) {
        console.log(`   ✅ 변형 버튼 발견 (title): "${title}"`);
        variationButton = btn;
        break;
      }
    }
    
    if (!variationButton) {
      console.log('   ⚠️ 변형 버튼을 찾을 수 없습니다. 모달 내부 버튼 텍스트:');
      for (let i = 0; i < Math.min(modalButtons2.length, 15); i++) {
        const text = await modalButtons2[i].textContent();
        const title = await modalButtons2[i].getAttribute('title');
        console.log(`      버튼 ${i + 1}: "${text?.trim()}" (title: "${title}")`);
      }
      await page.screenshot({ path: 'test-variation-button-not-found.png', fullPage: true });
      throw new Error('변형 버튼을 찾을 수 없습니다.');
    }
    
    console.log('   변형 버튼 클릭...');
    await variationButton.click();
    await page.waitForTimeout(2000);
    
    // 변형 모달 확인
    const variationModal = await page.$('text=기존 이미지 변형');
    if (!variationModal) {
      throw new Error('변형 모달이 열리지 않았습니다.');
    }
    console.log('   ✅ 변형 모달 열림\n');
    
    // 6. 변형 모달에서 이미지 선택 (갤러리 탭)
    console.log('6️⃣ 변형 모달에서 이미지 선택...');
    await page.waitForTimeout(2000);
    
    const galleryTab = await page.$('button:has-text("🖼️ 갤러리에서 선택")');
    if (galleryTab) {
      await galleryTab.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ 갤러리 탭 선택\n');
      
      // 갤러리에서 첫 번째 이미지 선택 (컨테이너 클릭)
      const galleryContainers = await page.$$('div[class*="cursor-pointer"][class*="border-2"]');
      if (galleryContainers.length > 0) {
        console.log(`   ✅ 갤러리 이미지 컨테이너 ${galleryContainers.length}개 발견`);
        // JavaScript로 클릭 이벤트 트리거 (pointer events 문제 해결)
        await galleryContainers[0].evaluate(el => {
          el.click();
        });
        await page.waitForTimeout(2000);
        console.log('   ✅ 이미지 선택 완료\n');
      } else {
        // 이미지 직접 클릭 시도
        const galleryImages = await page.$$('div[class*="cursor-pointer"] img');
        if (galleryImages.length > 0) {
          await galleryImages[0].evaluate(el => {
            const container = el.closest('div[class*="cursor-pointer"]');
            if (container) {
              container.click();
            }
          });
          await page.waitForTimeout(2000);
          console.log('   ✅ 이미지 선택 완료\n');
        }
      }
    }
    
    // 7. 프롬프트 입력 (선택사항)
    console.log('7️⃣ 프롬프트 입력...');
    const promptTextarea = await page.$('textarea[placeholder*="밝게"]');
    if (promptTextarea) {
      await promptTextarea.fill('원본과 동일하게 유지하되 약간 더 선명하게');
      await page.waitForTimeout(500);
      console.log('   ✅ 프롬프트 입력 완료\n');
    }
    
    // 8. 변형 실행
    console.log('8️⃣ 변형 실행...');
    
    // API 응답 리스너 설정
    let variationApiResponse = null;
    page.on('response', async response => {
      if (response.url().includes('/api/vary-existing-image') && response.request().method() === 'POST') {
        try {
          variationApiResponse = await response.json();
          console.log('   📦 변형 API 응답:', JSON.stringify(variationApiResponse, null, 2));
        } catch (e) {
          console.log('   ⚠️ API 응답 파싱 실패:', e.message);
        }
      }
    });
    
    const generateButton = await page.$('button:has-text("이미지 변형하기")');
    if (!generateButton) {
      throw new Error('변형하기 버튼을 찾을 수 없습니다.');
    }
    
    const isDisabled = await generateButton.isDisabled();
    if (isDisabled) {
      console.log('   ⚠️ 변형하기 버튼이 비활성화되어 있습니다.');
    } else {
      await generateButton.click();
      await page.waitForTimeout(1000);
      console.log('   ⏳ 변형 진행 중...\n');
      
      // 최대 120초 대기 (변형은 시간이 더 걸릴 수 있음)
      let variationCompleted = false;
      for (let i = 0; i < 120; i++) {
        await page.waitForTimeout(1000);
        const button = await page.$('button:has-text("변형 중")');
        if (!button) {
          variationCompleted = true;
          break;
        }
      }
      
      if (variationCompleted) {
        console.log('   ✅ 변형 완료 (또는 실패)');
        if (variationApiResponse) {
          if (variationApiResponse.success) {
            console.log(`   ✅ 저장 성공: ${variationApiResponse.imageUrl || variationApiResponse.fileName}`);
            if (variationApiResponse.imageUrl) {
              const urlParts = variationApiResponse.imageUrl.split('/');
              const fileName = urlParts[urlParts.length - 1];
              const folderMatch = variationApiResponse.imageUrl.match(/originals\/(\d{4}-\d{2}-\d{2})\//);
              if (folderMatch) {
                console.log(`   📁 저장 위치: originals/${folderMatch[1]}/${fileName}`);
              } else {
                console.log(`   📁 저장 위치: ${variationApiResponse.imageUrl}`);
              }
            }
          } else {
            console.log(`   ❌ 저장 실패: ${variationApiResponse.error || '알 수 없는 오류'}`);
          }
        }
        console.log('');
      } else {
        console.log('   ⚠️ 변형 타임아웃 (120초 초과)\n');
      }
    }

    // 9. 콘솔 로그 확인
    console.log('9️⃣ 콘솔 로그 확인...');
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('업스케일') || text.includes('변형') || text.includes('오류') || text.includes('에러')) {
        logs.push(text);
        console.log(`   콘솔: ${text}`);
      }
    });
    
    await page.waitForTimeout(2000);
    console.log('   ✅ 콘솔 로그 확인 완료\n');

    // 10. 스크린샷 저장
    console.log('🔟 스크린샷 저장...');
    await page.screenshot({ path: 'test-gallery-upscale-variation-result.png', fullPage: true });
    console.log('   ✅ 스크린샷 저장 완료: test-gallery-upscale-variation-result.png\n');

    console.log('✅ 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    await page.screenshot({ path: 'test-gallery-upscale-variation-error.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();

