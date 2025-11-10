const { chromium } = require('playwright');

(async () => {
  console.log('🧪 저장 버튼 버그 테스트 시작...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 네트워크 요청/응답 캡처
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      networkRequests.push({
        method: request.method(),
        url: request.url(),
        timestamp: Date.now()
      });
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/')) {
      const request = networkRequests.find(r => r.url === response.url());
      if (request) {
        request.status = response.status();
        request.timestamp = Date.now() - request.timestamp;
      }
    }
  });

  // 콘솔 로그 캡처
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('저장') || text.includes('검증') || text.includes('오류') || text.includes('에러') || text.includes('validation')) {
      console.log(`[브라우저 콘솔 ${msg.type()}]: ${text}`);
    }
  });

  // 페이지 에러 캡처
  page.on('pageerror', error => {
    console.error(`[페이지 에러]: ${error.message}`);
  });

  try {
    // 1. 빠른 로그인 (최소 대기 시간)
    console.log('1️⃣ 빠른 로그인 시도...');
    console.log('  전화번호: 010-6669-9000');
    console.log('  비밀번호: 66699000');
    
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    
    // 폼 필드 채우기
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    console.log('✅ 로그인 완료');

    // 3. 갤러리 관리 페이지로 이동
    console.log('3️⃣ 갤러리 관리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/gallery', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // 4. 첫 번째 이미지 편집 버튼 클릭하여 모달 열기
    console.log('4️⃣ 첫 번째 이미지 편집 버튼 클릭하여 모달 열기...');
    
    const imageSelectors = [
      'div[class*="border-2"][class*="rounded-lg"][class*="cursor-pointer"]',
      'div[class*="group"][class*="border-2"]',
    ];
    
    let imageFound = false;
    for (const selector of imageSelectors) {
      const images = page.locator(selector);
      const count = await images.count();
      
      if (count > 0) {
        console.log(`✅ "${selector}" 선택자로 이미지 ${count}개 발견`);
        
        // 이미지에 마우스 호버하여 편집 버튼 표시
        console.log(`  첫 번째 이미지에 마우스 호버...`);
        await images.first().hover();
        await page.waitForTimeout(1000);
        
        // 편집 버튼(✏️) 찾기 및 클릭
        const editButton = page.locator('button[title="편집"], button:has-text("✏️")').first();
        const editButtonCount = await editButton.count();
        
        if (editButtonCount > 0) {
          console.log(`  편집 버튼 발견, 클릭...`);
          await editButton.click();
          await page.waitForTimeout(2000);
          
          // 모달이 열렸는지 확인
          const modalTitle = page.locator('text="이미지 메타데이터 편집"');
          const modalCount = await modalTitle.count();
          if (modalCount > 0) {
            console.log('✅ 모달이 열렸습니다.');
            imageFound = true;
            break;
          }
        }
      }
    }
    
    if (!imageFound) {
      console.log('❌ 모달을 열 수 없습니다.');
      await page.screenshot({ path: 'test-modal-not-opened.png', fullPage: true });
      await browser.close();
      return;
    }

    // 5. "⛳ 골프 AI 생성" 버튼 클릭
    console.log('5️⃣ "⛳ 골프 AI 생성" 버튼 클릭...');
    const golfButton = page.locator('button:has-text("골프 AI 생성"), button:has-text("⛳")').first();
    await golfButton.click();
    console.log('  AI 생성 대기 중... (5-10초 예상)');
    
    // AI 생성 완료 대기 (최대 30초, 5-10초 정도 소요 예상)
    let aiGenerationComplete = false;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      
      // 필드에 값이 채워졌는지 확인
      const altText = page.locator('input[name="alt_text"], textarea[name="alt_text"]').first();
      const altTextValue = await altText.inputValue().catch(() => '');
      
      // 키워드도 확인
      const keywords = page.locator('input[name="keywords"]').first();
      const keywordsValue = await keywords.inputValue().catch(() => '');
      
      // 제목도 확인
      const title = page.locator('input[name="title"]').first();
      const titleValue = await title.inputValue().catch(() => '');
      
      // 설명도 확인
      const description = page.locator('textarea[name="description"]').first();
      const descriptionValue = await description.inputValue().catch(() => '');
      
      // 하나라도 값이 채워지면 생성 완료로 간주
      if ((altTextValue && altTextValue.length > 0) || 
          (keywordsValue && keywordsValue.length > 0) || 
          (titleValue && titleValue.length > 0) || 
          (descriptionValue && descriptionValue.length > 0)) {
        console.log(`✅ AI 생성 완료 (${i + 1}초 소요)`);
        console.log(`  ALT 텍스트: ${altTextValue ? altTextValue.substring(0, 30) + '...' : '(비어있음)'}`);
        console.log(`  키워드: ${keywordsValue || '(비어있음)'}`);
        console.log(`  제목: ${titleValue || '(비어있음)'}`);
        aiGenerationComplete = true;
        break;
      }
      
      // 5초마다 상태 출력
      if (i > 0 && (i + 1) % 5 === 0) {
        console.log(`  ⏳ ${i + 1}초 경과... (계속 대기 중)`);
      }
    }
    
    if (!aiGenerationComplete) {
      console.log('⚠️ AI 생성이 완료되지 않았습니다. (30초 초과)');
    }
    
    // AI 생성 완료 후 추가 대기 (안정화 및 검증 오류 초기화 대기)
    console.log('  AI 생성 완료 후 안정화 대기 (5초)...');
    console.log('  (검증 오류가 초기화되고 저장 버튼이 활성화될 때까지 대기)');
    await page.waitForTimeout(5000);
    
    // 저장 버튼이 활성화될 때까지 대기 (최대 10초)
    console.log('  저장 버튼 활성화 대기 중...');
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000);
      
      // 저장 버튼 찾기
      const buttons = await page.locator('button').all();
      let saveButtonFound = false;
      let saveButtonEnabled = false;
      
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && (text.includes('저장') || text.includes('💾'))) {
          saveButtonFound = true;
          const isDisabled = await btn.isDisabled();
          if (!isDisabled) {
            saveButtonEnabled = true;
            console.log(`  ✅ 저장 버튼 활성화됨 (${i + 1}초 후)`);
            break;
          }
        }
      }
      
      if (saveButtonEnabled) {
        break;
      }
      
      if (i === 9) {
        console.log('  ⚠️ 저장 버튼이 여전히 비활성화되어 있습니다.');
      }
    }

    // 6. 저장 버튼 찾기 및 상태 확인
    console.log('\n6️⃣ 저장 버튼 찾기 및 상태 확인...');
    
    // 여러 방법으로 저장 버튼 찾기
    let saveButton = null;
    const saveButtonSelectors = [
      'button:has-text("저장")',
      'button:has-text("💾")',
      'button[class*="bg-blue-500"]',
      'button[class*="blue-500"]',
      'button:has-text("💾 저장")',
      'button:has-text("저장")',
    ];
    
    for (const selector of saveButtonSelectors) {
      const buttons = page.locator(selector);
      const count = await buttons.count();
      console.log(`  선택자 "${selector}": ${count}개 발견`);
      
      if (count > 0) {
        // 모든 버튼 확인
        for (let i = 0; i < count; i++) {
          const btn = buttons.nth(i);
          const text = await btn.textContent();
          const isDisabled = await btn.isDisabled();
          console.log(`    버튼 ${i + 1}: "${text}" - ${isDisabled ? '비활성화' : '활성화'}`);
          
          // "저장" 텍스트가 포함된 활성화된 버튼 찾기
          if (text && (text.includes('저장') || text.includes('💾')) && !isDisabled) {
            saveButton = btn;
            console.log(`  ✅ 저장 버튼 발견: "${text}"`);
            break;
          }
        }
        
        if (saveButton) break;
      }
    }
    
    // 저장 버튼을 찾지 못한 경우, 모든 버튼 확인
    if (!saveButton) {
      console.log('  모든 버튼 확인 중...');
      const allButtons = await page.locator('button').all();
      console.log(`  총 ${allButtons.length}개 버튼 발견`);
      
      for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
        const btn = allButtons[i];
        const text = await btn.textContent();
        const isDisabled = await btn.isDisabled();
        const className = await btn.getAttribute('class');
        
        if (text && (text.includes('저장') || text.includes('💾'))) {
          console.log(`  버튼 ${i + 1}: "${text}" - ${isDisabled ? '비활성화' : '활성화'} - ${className}`);
          if (!isDisabled) {
            saveButton = page.locator(`button`).nth(i);
            break;
          }
        }
      }
    }
    
    if (!saveButton) {
      console.log('❌ 저장 버튼을 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-save-button-not-found.png', fullPage: true });
      await browser.close();
      return;
    }
    
    const buttonText = await saveButton.textContent();
    const buttonClass = await saveButton.getAttribute('class');
    const isDisabled = await saveButton.isDisabled();
    
    console.log(`\n📊 저장 버튼 정보:`);
    console.log(`  텍스트: ${buttonText}`);
    console.log(`  비활성화 여부: ${isDisabled ? '❌ 비활성화됨' : '✅ 활성화됨'}`);
    console.log(`  클래스: ${buttonClass}`);
    
    // 필드 값 확인
    const altText = await page.locator('input[name="alt_text"], textarea[name="alt_text"]').first().inputValue().catch(() => '');
    const keywords = await page.locator('input[name="keywords"]').first().inputValue().catch(() => '');
    const title = await page.locator('input[name="title"]').first().inputValue().catch(() => '');
    const description = await page.locator('textarea[name="description"]').first().inputValue().catch(() => '');
    
    console.log(`\n📊 현재 필드 값:`);
    console.log(`  ALT 텍스트: ${altText ? altText.substring(0, 50) + '...' : '(비어있음)'} (${altText.length}자)`);
    console.log(`  키워드: ${keywords || '(비어있음)'} (${keywords.length}자)`);
    console.log(`  제목: ${title || '(비어있음)'} (${title.length}자)`);
    console.log(`  설명: ${description ? description.substring(0, 50) + '...' : '(비어있음)'} (${description.length}자)`);
    
    // 검증 오류 확인
    const errorMessages = await page.locator('.text-red-600, .text-red-700, [class*="error"], [class*="Error"]').all();
    console.log(`\n🔍 검증 오류 확인:`);
    if (errorMessages.length > 0) {
      console.log(`  발견된 오류 메시지 수: ${errorMessages.length}`);
      for (let i = 0; i < errorMessages.length; i++) {
        const errorText = await errorMessages[i].textContent();
        const errorClass = await errorMessages[i].getAttribute('class');
        console.log(`  ${i + 1}. [${errorClass}] ${errorText}`);
      }
    } else {
      console.log('  검증 오류 메시지 없음');
    }
    
    // JavaScript로 React 상태 확인
    console.log(`\n🔍 React 상태 확인 (JavaScript 실행)...`);
    const reactState = await page.evaluate(() => {
      // React DevTools를 통해 상태 확인 시도
      const reactFiber = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (reactFiber) {
        return { hasReactDevTools: true };
      }
      
      // 저장 버튼 찾기
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveButton = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.includes('저장') || text.includes('💾');
      });
      
      if (!saveButton) {
        return { error: '저장 버튼을 찾을 수 없음' };
      }
      
      return {
        disabled: saveButton.disabled,
        ariaDisabled: saveButton.getAttribute('aria-disabled'),
        className: saveButton.className,
        hasDisabledClass: saveButton.className.includes('disabled'),
        hasCursorNotAllowed: saveButton.className.includes('cursor-not-allowed')
      };
    });
    
    console.log('  React 상태:', JSON.stringify(reactState, null, 2));
    
    // validationErrors 확인을 위한 추가 검사
    const validationErrorsInDOM = await page.evaluate(() => {
      const errors = [];
      // 모든 오류 메시지 요소 찾기
      const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], .text-red-600, .text-red-700');
      errorElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 0) {
          errors.push({
            text,
            className: el.className,
            tagName: el.tagName
          });
        }
      });
      return errors;
    });
    
    if (validationErrorsInDOM.length > 0) {
      console.log(`\n🔍 DOM에서 발견된 오류 메시지:`);
      validationErrorsInDOM.forEach((err, i) => {
        console.log(`  ${i + 1}. [${err.tagName}.${err.className}] ${err.text}`);
      });
    }
    
    // 저장 버튼 클릭 시도
    if (!isDisabled) {
      console.log('\n7️⃣ 저장 버튼 클릭 시도...');
      
      // 버튼이 보이는지 확인
      const isVisible = await saveButton.isVisible();
      console.log(`  버튼 가시성: ${isVisible ? '✅ 보임' : '❌ 안 보임'}`);
      
      if (!isVisible) {
        // 스크롤하여 버튼 보이게 하기
        console.log('  버튼이 보이지 않아 스크롤 중...');
        await saveButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
      }
      
      // 클릭 전 스크린샷
      await page.screenshot({ path: 'test-before-save-click.png', fullPage: true });
      console.log('  📸 클릭 전 스크린샷 저장: test-before-save-click.png');
      
      // 저장 버튼 클릭
      await saveButton.click({ force: true });
      console.log('  ✅ 저장 버튼 클릭 완료');
      await page.waitForTimeout(3000);
      
      // 모달이 닫혔는지 확인
      const modalTitle = page.locator('text="이미지 메타데이터 편집"');
      const modalCount = await modalTitle.count();
      
      if (modalCount === 0) {
        console.log('✅ 모달이 닫혔습니다. 저장 성공으로 추정됩니다.');
      } else {
        console.log('⚠️ 모달이 아직 열려있습니다.');
        
        // 저장 완료 확인
        const successMessage = await page.locator('text=/저장|성공|완료/i').first().textContent().catch(() => '');
        const errorMessage = await page.locator('text=/오류|에러|실패/i').first().textContent().catch(() => '');
        
        if (successMessage) {
          console.log(`✅ 저장 성공: ${successMessage}`);
        } else if (errorMessage) {
          console.log(`❌ 저장 실패: ${errorMessage}`);
        } else {
          console.log('⚠️ 저장 결과를 확인할 수 없습니다.');
        }
      }
      
      // 클릭 후 스크린샷
      await page.screenshot({ path: 'test-after-save-click.png', fullPage: true });
      console.log('  📸 클릭 후 스크린샷 저장: test-after-save-click.png');
      
    } else {
      console.log('\n❌ 저장 버튼이 비활성화되어 있어 클릭할 수 없습니다.');
      console.log('🔍 비활성화 원인 확인 중...');
      
      // JavaScript로 validationErrors 확인
      const validationErrors = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const saveButton = buttons.find(btn => {
          const text = btn.textContent || '';
          return text.includes('저장') || text.includes('💾');
        });
        
        if (saveButton) {
          return {
            disabled: saveButton.disabled,
            className: saveButton.className,
            ariaDisabled: saveButton.getAttribute('aria-disabled'),
            hasDisabledClass: saveButton.className.includes('disabled'),
            hasCursorNotAllowed: saveButton.className.includes('cursor-not-allowed')
          };
        }
        return { error: '저장 버튼을 찾을 수 없음' };
      });
      
      console.log('  저장 버튼 상태:', JSON.stringify(validationErrors, null, 2));
      
      // 강제 클릭 시도 (비활성화된 버튼도)
      console.log('\n8️⃣ 강제 클릭 시도 (비활성화된 버튼도)...');
      try {
        await saveButton.click({ force: true });
        await page.waitForTimeout(2000);
        console.log('  강제 클릭 완료');
      } catch (error) {
        console.log(`  강제 클릭 실패: ${error.message}`);
      }
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'test-save-button-bug.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: test-save-button-bug.png');

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'test-save-button-error.png', fullPage: true });
    console.log('📸 오류 스크린샷 저장: test-save-button-error.png');
  } finally {
    await browser.close();
    console.log('\n✅ 테스트 완료');
  }
})();

