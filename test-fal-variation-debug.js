const { chromium } = require('playwright');

(async () => {
  console.log('🔍 FAL AI 변형 디버깅 테스트 시작...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForTimeout(3000);
    
    // 로그인 필드 찾기 (숨겨진 필드도 처리)
    const phoneInput = await page.$('input#login, input[name="login"]');
    if (phoneInput) {
      await phoneInput.fill('01066699000', { force: true });
      await page.waitForTimeout(1000);
    }
    
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill('66699000', { force: true });
      await page.waitForTimeout(1000);
    }
    
    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
      await page.waitForTimeout(3000);
    }
    
    await page.goto('http://localhost:3000/admin/gallery');
    await page.waitForTimeout(3000);
    console.log('   ✅ 로그인 완료\n');

    // 2. 이미지 찾기
    console.log('2️⃣ 이미지 찾기...');
    await page.waitForTimeout(5000);
    
    const imageSelectors = [
      'img[src*="blog-images"]',
      'img[src*="supabase"]',
      'div[class*="cursor-pointer"] img',
      'div[class*="border-2"] img',
      'div[class*="group"] img',
      'img[class*="object-cover"]'
    ];
    
    let images = [];
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

    // 3. 확대 모달 열기
    console.log('3️⃣ 확대 모달 열기...');
    const firstImage = images[0];
    const imageContainer = await firstImage.evaluateHandle(el => {
      let parent = el.parentElement;
      while (parent && !parent.classList.contains('group')) {
        parent = parent.parentElement;
      }
      return parent || el.parentElement;
    });
    
    try {
      if (imageContainer) {
        await imageContainer.hover();
        await page.waitForTimeout(1000);
      } else {
        await firstImage.hover();
        await page.waitForTimeout(1000);
      }
      
      const zoomButtons = await page.$$('button[title="확대"], button:has-text("🔍")');
      if (zoomButtons.length > 0) {
        console.log('   ✅ 확대 버튼 발견, 클릭...');
        await zoomButtons[0].click();
        await page.waitForTimeout(3000);
      } else {
        await firstImage.click();
        await page.waitForTimeout(3000);
      }
    } catch (error) {
      console.log('   ⚠️ hover 실패, 직접 클릭 시도...');
      await firstImage.click();
      await page.waitForTimeout(3000);
    }
    
    const modal = await page.$('div[class*="fixed"][class*="inset-0"]');
    if (!modal) {
      throw new Error('확대 모달을 열 수 없습니다.');
    }
    
    console.log('   ✅ 확대 모달 열림\n');

    // 4. FAL AI 변형 버튼 클릭
    console.log('4️⃣ FAL AI 변형 버튼 클릭...');
    await page.waitForTimeout(2000);
    
    const falButton = await page.$('button[title*="FAL"], button:has-text("🔄 변형 (FAL)")');
    if (!falButton) {
      throw new Error('FAL AI 변형 버튼을 찾을 수 없습니다.');
    }
    
    console.log('   ✅ FAL AI 변형 버튼 발견');
    await falButton.click();
    await page.waitForTimeout(2000);
    
    // 5. 모달에서 이미지 선택 및 변형 실행
    console.log('5️⃣ 변형 모달에서 이미지 선택 및 변형 실행...');
    await page.waitForTimeout(2000);
    
    // 갤러리 탭 클릭
    const galleryTab = await page.$('button:has-text("갤러리"), button:has-text("갤러리에서 선택")');
    if (galleryTab) {
      await galleryTab.click();
      await page.waitForTimeout(2000);
    }
    
    // 첫 번째 이미지 선택 (컨테이너 클릭)
    const galleryContainers = await page.$$('div[class*="cursor-pointer"][class*="border"]');
    if (galleryContainers.length > 0) {
      console.log(`   ✅ 갤러리 컨테이너 ${galleryContainers.length}개 발견`);
      // JavaScript로 직접 클릭 (포인터 이벤트 문제 우회)
      await galleryContainers[0].evaluate(el => el.click());
      await page.waitForTimeout(2000);
    } else {
      // 컨테이너가 없으면 이미지 직접 클릭
      const galleryImages = await page.$$('div[class*="cursor-pointer"] img, img[src*="blog-images"]');
      if (galleryImages.length > 0) {
        console.log(`   ✅ 갤러리 이미지 ${galleryImages.length}개 발견`);
        await galleryImages[0].evaluate(el => el.click());
        await page.waitForTimeout(2000);
      }
    }
    
    // 프롬프트 입력
    const promptInput = await page.$('textarea[placeholder*="프롬프트"], textarea[placeholder*="변형"]');
    if (promptInput) {
      await promptInput.fill('아시아 인으로 변경');
      await page.waitForTimeout(1000);
      console.log('   ✅ 프롬프트 입력: "아시아 인으로 변경"');
    }
    
    // 변형 버튼 찾기
    let transformButton = null;
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = await btn.textContent();
      if (text && (text.includes('변형') || text.includes('이미지 변형'))) {
        transformButton = btn;
        console.log(`   ✅ 변형 버튼 발견: "${text.trim()}"`);
        break;
      }
    }
    
    if (!transformButton) {
      throw new Error('변형 버튼을 찾을 수 없습니다.');
    }
    
    // API 응답 리스너 설정 (상세 로깅)
    let apiRequest = null;
    let apiResponse = null;
    let apiError = null;
    
    page.on('request', request => {
      if (request.url().includes('/api/vary-existing-image') && request.method() === 'POST') {
        apiRequest = {
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        };
        console.log('   📤 API 요청:', {
          url: apiRequest.url,
          method: apiRequest.method,
          postData: apiRequest.postData ? JSON.parse(apiRequest.postData) : null
        });
      }
    });
    
    page.on('response', async response => {
      if (response.url().includes('/api/vary-existing-image') && response.request().method() === 'POST') {
        apiResponse = {
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          url: response.url()
        };
        
        try {
          const responseText = await response.text();
          try {
            apiResponse.body = JSON.parse(responseText);
            console.log('   📥 API 응답:', {
              status: apiResponse.status,
              statusText: apiResponse.statusText,
              body: JSON.stringify(apiResponse.body, null, 2)
            });
          } catch (e) {
            apiResponse.body = responseText;
            console.log('   📥 API 응답 (텍스트):', {
              status: apiResponse.status,
              statusText: apiResponse.statusText,
              body: apiResponse.body.substring(0, 500)
            });
          }
        } catch (e) {
          console.log('   ⚠️ API 응답 파싱 실패:', e.message);
        }
      }
    });
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('FAL AI') || text.includes('변형') || text.includes('오류') || text.includes('에러') || text.includes('API')) {
        console.log(`   📋 콘솔: ${text}`);
      }
    });
    
    // JavaScript로 직접 클릭 (포인터 이벤트 문제 우회)
    console.log('   ✅ 변형 버튼 클릭...');
    try {
      await transformButton.evaluate(btn => btn.click());
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('   ⚠️ evaluate 클릭 실패, 일반 클릭 시도...');
      await transformButton.click({ force: true });
      await page.waitForTimeout(2000);
    }
    await page.waitForTimeout(10000); // 10초 대기
    
    // 에러 메시지 확인
    const errorModal = await page.$('div:has-text("오류"), div:has-text("실패"), div:has-text("에러")');
    if (errorModal) {
      const errorText = await errorModal.textContent();
      console.log('   ❌ 에러 메시지 발견:', errorText);
    }
    
    // 최대 60초 대기 (변형 완료 또는 에러 확인)
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(5000);
      
      // 버튼 상태 확인
      const buttons = await page.$$('button');
      let isProcessing = false;
      
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && (text.includes('변형 중') || text.includes('⏳'))) {
          isProcessing = true;
          console.log(`   ⏳ 변형 진행 중... (${(i + 1) * 5}초 경과)`);
          break;
        }
      }
      
      if (!isProcessing && apiResponse) {
        break;
      }
    }
    
    console.log('\n📊 최종 결과:');
    if (apiRequest) {
      console.log('   ✅ API 요청 확인됨');
    }
    if (apiResponse) {
      console.log('   ✅ API 응답 확인됨');
      if (apiResponse.status !== 200) {
        console.log('   ❌ API 오류 상태:', apiResponse.status);
      }
    }
    
    console.log('\n✅ 디버깅 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'test-fal-debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();

