const { chromium } = require('playwright');

(async () => {
  console.log('🚀 갤러리 두 가지 변형 방식 테스트 시작...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForTimeout(2000);
    
    // 로그인 필드 찾기 및 입력
    await page.waitForSelector('input[type="text"], input[type="tel"]', { timeout: 10000 });
    const phoneInput = await page.$('input[type="tel"], input[type="text"]');
    if (phoneInput) {
      await phoneInput.fill('01066699000');
      await page.waitForTimeout(1000);
    }
    
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill('66699000');
      await page.waitForTimeout(1000);
    }
    
    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
      await page.waitForTimeout(3000);
    }
    
    // 갤러리 페이지로 이동
    await page.goto('http://localhost:3000/admin/gallery');
    await page.waitForTimeout(3000);
    console.log('   ✅ 로그인 완료\n');

    // 2. 첫 번째 이미지 찾기
    console.log('2️⃣ 이미지 찾기...');
    await page.waitForTimeout(5000); // 이미지 로딩 대기
    
    // 여러 선택자 시도
    let images = [];
    const imageSelectors = [
      'img[src*="blog-images"]',
      'img[src*="supabase"]',
      'div[class*="cursor-pointer"] img',
      'div[class*="border-2"] img',
      'div[class*="group"] img',
      'img[class*="object-cover"]'
    ];
    
    for (const selector of imageSelectors) {
      images = await page.$$(selector);
      if (images.length > 0) {
        console.log(`   ✅ "${selector}" 선택자로 이미지 ${images.length}개 발견`);
        break;
      }
    }
    
    if (images.length === 0) {
      throw new Error('이미지를 찾을 수 없습니다.');
    }
    
    console.log(`   ✅ 총 ${images.length}개의 이미지 발견\n`);

    // 3. Replicate 변형 테스트 (썸네일 hover 버튼)
    console.log('3️⃣ Replicate 변형 테스트 (썸네일 hover 버튼)...');
    
    // 첫 번째 이미지 컨테이너 찾기
    const firstImage = images[0];
    const imageContainer = await firstImage.evaluateHandle(el => {
      let parent = el.parentElement;
      while (parent && !parent.classList.contains('group')) {
        parent = parent.parentElement;
      }
      return parent || el.parentElement;
    });
    
    // 이미지 컨테이너에 hover
    if (imageContainer) {
      await imageContainer.hover();
      await page.waitForTimeout(1500);
    } else {
      await firstImage.hover();
      await page.waitForTimeout(1500);
    }
    
    // 🎨 변형 버튼 찾기 (여러 방법 시도)
    let replicateButton = null;
    const buttonSelectors = [
      'button[title*="Replicate"]',
      'button[title*="변형 (Replicate")]',
      'button:has-text("🎨")',
      'button.p-1.bg-purple-500',
      'button:has-text("🎨")'
    ];
    
    for (const selector of buttonSelectors) {
      try {
        replicateButton = await page.$(selector);
        if (replicateButton) {
          const text = await replicateButton.textContent();
          const title = await replicateButton.getAttribute('title');
          if (text && text.includes('🎨') || title && title.includes('Replicate')) {
            console.log(`   ✅ Replicate 변형 버튼 발견: "${text?.trim()}" (title: "${title}")`);
            break;
          }
        }
      } catch (e) {
        // 계속 시도
      }
    }
    
    // 모든 버튼을 확인
    if (!replicateButton) {
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        const text = await btn.textContent();
        const title = await btn.getAttribute('title');
        if (text && text.includes('🎨') || title && title.includes('Replicate')) {
          replicateButton = btn;
          console.log(`   ✅ Replicate 변형 버튼 발견: "${text?.trim()}" (title: "${title}")`);
          break;
        }
      }
    }
    
    if (!replicateButton) {
      console.log('   ⚠️ Replicate 변형 버튼을 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-replicate-button-not-found.png', fullPage: true });
    } else {
      console.log('   ✅ Replicate 변형 버튼 발견');
      
      // API 응답 리스너 설정
      let replicateApiResponse = null;
      page.on('response', async response => {
        if (response.url().includes('/api/generate-blog-image-replicate-flux') && response.request().method() === 'POST') {
          try {
            replicateApiResponse = await response.json();
            console.log('   📦 Replicate API 응답:', JSON.stringify(replicateApiResponse, null, 2));
          } catch (e) {
            console.log('   ⚠️ API 응답 파싱 실패:', e.message);
          }
        }
      });
      
      // 확인 다이얼로그 리스너 설정
      page.once('dialog', async dialog => {
        console.log(`   다이얼로그: ${dialog.message()}`);
        await dialog.accept();
      });
      
      await replicateButton.click();
      await page.waitForTimeout(2000);
      
      // 변형 진행 상태 확인
      console.log('   ⏳ Replicate 변형 진행 중...');
      
      // 최대 120초 대기
      let replicateCompleted = false;
      for (let i = 0; i < 120; i++) {
        await page.waitForTimeout(2000);
        
        // 버튼 상태 확인
        const buttons = await page.$$('button');
        let isProcessing = false;
        
        for (const btn of buttons) {
          const text = await btn.textContent();
          if (text && (text.includes('변형 중') || text.includes('⏳'))) {
            isProcessing = true;
            if (i % 10 === 0) {
              console.log(`   ⏳ Replicate 변형 진행 중... (${i * 2}초 경과)`);
            }
            break;
          }
        }
        
        if (!isProcessing && replicateApiResponse) {
          replicateCompleted = true;
          break;
        }
      }
      
      if (replicateCompleted) {
        console.log('   ✅ Replicate 변형 완료');
        if (replicateApiResponse) {
          if (replicateApiResponse.images && replicateApiResponse.images.length > 0) {
            console.log(`   ✅ Replicate 변형 성공: ${replicateApiResponse.images.length}개 이미지 생성`);
          } else {
            console.log(`   ⚠️ Replicate 변형 응답: ${JSON.stringify(replicateApiResponse)}`);
          }
        }
      } else {
        console.log('   ⚠️ Replicate 변형 타임아웃 (240초 초과)');
      }
    }
    
    console.log('');

    // 4. 확대 모달 열기
    console.log('4️⃣ 확대 모달 열기...');
    await page.waitForTimeout(3000); // Replicate 변형 완료 후 대기
    
    // 페이지 새로고침 또는 이미지 다시 찾기
    await page.goto('http://localhost:3000/admin/gallery');
    await page.waitForTimeout(5000);
    
    // 이미지 다시 찾기
    let images2 = [];
    for (const selector of imageSelectors) {
      images2 = await page.$$(selector);
      if (images2.length > 0) {
        console.log(`   ✅ 이미지 ${images2.length}개 발견`);
        break;
      }
    }
    
    if (images2.length === 0) {
      throw new Error('이미지를 다시 찾을 수 없습니다.');
    }
    
    // 첫 번째 이미지 컨테이너 찾기
    const firstImage2 = images2[0];
    const imageContainer2 = await firstImage2.evaluateHandle(el => {
      let parent = el.parentElement;
      while (parent && !parent.classList.contains('group')) {
        parent = parent.parentElement;
      }
      return parent || el.parentElement;
    });
    
    // 이미지 컨테이너에 hover 후 확대 버튼 클릭
    try {
      if (imageContainer2) {
        await imageContainer2.hover();
        await page.waitForTimeout(1000);
      } else {
        await firstImage2.hover();
        await page.waitForTimeout(1000);
      }
      
      // 확대 버튼 찾기
      const zoomButtons = await page.$$('button[title="확대"], button:has-text("🔍")');
      if (zoomButtons.length > 0) {
        console.log('   ✅ 확대 버튼 발견, 클릭...');
        await zoomButtons[0].click();
        await page.waitForTimeout(3000);
      } else {
        // 확대 버튼이 없으면 이미지 클릭
        await firstImage2.click();
        await page.waitForTimeout(3000);
      }
    } catch (error) {
      // hover 실패 시 직접 클릭
      console.log('   ⚠️ hover 실패, 직접 클릭 시도...');
      await firstImage2.click();
      await page.waitForTimeout(3000);
    }
    
    // 확대 모달 확인
    const modal = await page.$('div[class*="fixed"][class*="inset-0"]');
    if (!modal) {
      console.log('   ⚠️ 확대 모달을 찾을 수 없습니다. 재시도...');
      await page.waitForTimeout(2000);
    } else {
      console.log('   ✅ 확대 모달 열림\n');
    }

    // 5. FAL AI 변형 테스트 (확대 모달 버튼)
    console.log('5️⃣ FAL AI 변형 테스트 (확대 모달 버튼)...');
    await page.waitForTimeout(2000);
    
    // 🔄 변형 (FAL) 버튼 찾기
    const falButton = await page.$('button[title*="FAL"], button:has-text("🔄 변형 (FAL)")');
    if (!falButton) {
      console.log('   ⚠️ FAL AI 변형 버튼을 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-fal-button-not-found.png', fullPage: true });
    } else {
      console.log('   ✅ FAL AI 변형 버튼 발견');
      
      // API 응답 리스너 설정
      let falApiResponse = null;
      page.on('response', async response => {
        if (response.url().includes('/api/vary-existing-image') && response.request().method() === 'POST') {
          try {
            falApiResponse = await response.json();
            console.log('   📦 FAL AI API 응답:', JSON.stringify(falApiResponse, null, 2));
          } catch (e) {
            console.log('   ⚠️ API 응답 파싱 실패:', e.message);
          }
        }
      });
      
      await falButton.click();
      await page.waitForTimeout(2000);
      
      // 모달이 열렸는지 확인
      const variationModal = await page.$('div[class*="fixed"] h3:has-text("기존 이미지 변형"), h3:has-text("🔄 기존 이미지 변형")');
      if (variationModal) {
        console.log('   ✅ FAL AI 변형 모달 열림');
        console.log('   ℹ️ FAL AI 변형은 모달에서 프롬프트 입력 후 진행됩니다.');
        
        // 모달 닫기 (ESC 키 사용)
        try {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
          console.log('   ✅ FAL AI 변형 모달 닫기 완료');
        } catch (e) {
          console.log('   ⚠️ 모달 닫기 실패 (계속 진행)');
        }
      } else {
        console.log('   ⚠️ FAL AI 변형 모달을 찾을 수 없습니다.');
      }
    }
    
    console.log('');

    // 6. Replicate 변형 테스트 (확대 모달 버튼)
    console.log('6️⃣ Replicate 변형 테스트 (확대 모달 버튼)...');
    await page.waitForTimeout(2000);
    
    // FAL AI 변형 모달이 열려있으면 닫기
    const falModal = await page.$('div[class*="fixed"] h3:has-text("기존 이미지 변형"), h3:has-text("🔄 기존 이미지 변형")');
    if (falModal) {
      console.log('   ℹ️ FAL AI 변형 모달이 열려있습니다. 닫기...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(2000);
    }
    
    // 확대 모달이 열려있는지 확인
    const zoomModal = await page.$('div[class*="fixed"][class*="inset-0"]');
    if (!zoomModal) {
      console.log('   ⚠️ 확대 모달이 열려있지 않습니다. 다시 열기...');
      // 이미지 다시 찾기 및 클릭
      await page.goto('http://localhost:3000/admin/gallery');
      await page.waitForTimeout(5000);
      
      let images3 = [];
      for (const selector of imageSelectors) {
        images3 = await page.$$(selector);
        if (images3.length > 0) break;
      }
      
      if (images3.length > 0) {
        await images3[0].hover();
        await page.waitForTimeout(1000);
        const zoomButtons2 = await page.$$('button[title="확대"], button:has-text("🔍")');
        if (zoomButtons2.length > 0) {
          await zoomButtons2[0].click();
          await page.waitForTimeout(3000);
        }
      }
    } else {
      console.log('   ✅ 확대 모달이 열려있습니다.');
    }
    
    // 🎨 변형 (Replicate) 버튼 찾기
    let replicateModalButton = null;
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = await btn.textContent();
      const title = await btn.getAttribute('title');
      if (text && text.includes('🎨 변형 (Replicate)') || title && title.includes('Replicate')) {
        replicateModalButton = btn;
        console.log(`   ✅ Replicate 변형 버튼(모달) 발견: "${text?.trim()}" (title: "${title}")`);
        break;
      }
    }
    
    if (!replicateModalButton) {
      console.log('   ⚠️ Replicate 변형 버튼(모달)을 찾을 수 없습니다.');
    } else {
      console.log('   ✅ Replicate 변형 버튼(모달) 발견');
      
      // API 응답 리스너 설정
      let replicateModalApiResponse = null;
      page.on('response', async response => {
        if (response.url().includes('/api/generate-blog-image-replicate-flux') && response.request().method() === 'POST') {
          try {
            replicateModalApiResponse = await response.json();
            console.log('   📦 Replicate API 응답(모달):', JSON.stringify(replicateModalApiResponse, null, 2));
          } catch (e) {
            console.log('   ⚠️ API 응답 파싱 실패:', e.message);
          }
        }
      });
      
      // 확인 다이얼로그 리스너 설정
      page.once('dialog', async dialog => {
        console.log(`   다이얼로그: ${dialog.message()}`);
        await dialog.accept();
      });
      
      // JavaScript로 직접 클릭 (포인터 이벤트 문제 우회)
      try {
        await replicateModalButton.evaluate(btn => btn.click());
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('   ⚠️ evaluate 클릭 실패, 일반 클릭 시도...');
        await replicateModalButton.click({ force: true });
        await page.waitForTimeout(2000);
      }
      await page.waitForTimeout(2000);
      
      // 변형 진행 상태 확인
      console.log('   ⏳ Replicate 변형 진행 중...');
      
      // 최대 120초 대기
      let replicateModalCompleted = false;
      for (let i = 0; i < 120; i++) {
        await page.waitForTimeout(2000);
        
        // 버튼 상태 확인
        const buttons = await page.$$('button');
        let isProcessing = false;
        
        for (const btn of buttons) {
          const text = await btn.textContent();
          if (text && (text.includes('변형 중') || text.includes('⏳'))) {
            isProcessing = true;
            if (i % 10 === 0) {
              console.log(`   ⏳ Replicate 변형 진행 중... (${i * 2}초 경과)`);
            }
            break;
          }
        }
        
        if (!isProcessing && replicateModalApiResponse) {
          replicateModalCompleted = true;
          break;
        }
      }
      
      if (replicateModalCompleted) {
        console.log('   ✅ Replicate 변형 완료');
        if (replicateModalApiResponse) {
          if (replicateModalApiResponse.images && replicateModalApiResponse.images.length > 0) {
            console.log(`   ✅ Replicate 변형 성공: ${replicateModalApiResponse.images.length}개 이미지 생성`);
          } else {
            console.log(`   ⚠️ Replicate 변형 응답: ${JSON.stringify(replicateModalApiResponse)}`);
          }
        }
      } else {
        console.log('   ⚠️ Replicate 변형 타임아웃 (240초 초과)');
      }
    }
    
    console.log('\n✅ 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();

