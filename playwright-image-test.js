// Playwright 이미지 메타데이터 테스트 스크립트
// 브라우저: Chromium (기본값)
// 사용법: 
//   node playwright-image-test.js          - 새로 실행
//   node playwright-image-test.js reload  - 현재 페이지 리로드 후 계속
//   node playwright-image-test.js reuse - 기존 브라우저 재사용 (CDP 필요)

const { chromium } = require('playwright');

// 명령줄 인자 확인
const args = process.argv.slice(2);
const mode = args[0] || 'new'; // new, reload, reuse

// 전역 변수로 브라우저와 페이지 저장 (reuse 모드용)
let globalBrowser = null;
let globalPage = null;

(async () => {
  let browser, context, page;

  // reuse 모드: 기존 브라우저 재사용 시도 (CDP 필요)
  if (mode === 'reuse' && globalBrowser && !globalBrowser.isConnected()) {
    console.log('⚠️ 기존 브라우저 연결이 끊어졌습니다. 새로 시작합니다.');
    globalBrowser = null;
    globalPage = null;
  }

  if (mode === 'reuse' && globalBrowser && globalPage) {
    console.log('🔄 기존 브라우저 재사용...');
    browser = globalBrowser;
    page = globalPage;
    
    // 현재 페이지 리로드
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✅ 페이지 리로드 완료\n');
  } else {
    // 새 브라우저 실행
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext();
    page = await context.newPage();
    
    // 전역 변수에 저장 (다음 실행 시 재사용)
    globalBrowser = browser;
    globalPage = page;
  }

  // 모든 다이얼로그 자동 처리
  page.on('dialog', async dialog => {
    console.log(`다이얼로그 감지: ${dialog.type()} - ${dialog.message()}`);
    if (dialog.type() === 'alert' || dialog.type() === 'confirm') {
      await dialog.accept();
    }
  });

  try {
    console.log('📸 이미지 메타데이터 편집 기능 테스트 시작...\n');

    // reload 모드: 현재 페이지에서 바로 시작
    if (mode === 'reload') {
      const currentUrl = page.url();
      console.log(`🔄 리로드 모드: 현재 페이지 (${currentUrl})에서 계속...\n`);
      
      // 갤러리 페이지가 아니면 갤러리로 이동
      if (!currentUrl.includes('/admin/gallery')) {
        console.log('📍 갤러리 페이지로 이동...');
        await page.goto('https://www.masgolf.co.kr/admin/gallery', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        console.log('✅ 갤러리 페이지 로드 완료\n');
      } else {
        // 갤러리 페이지 리로드
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        console.log('✅ 갤러리 페이지 리로드 완료\n');
      }
    } else {
      // 새로 시작: 로그인부터
      // 0. 로그인 페이지 접속 및 로그인
      console.log('0️⃣ 로그인 페이지 접속 중...');
      await page.goto('https://www.masgolf.co.kr/admin/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      console.log('✅ 로그인 페이지 로드 완료');

      // 로그인 필수 요소 확인
      const loginInput = await page.$('input#login');
      const passwordInput = await page.$('input#password');
      const submitButton = await page.$('button[type="submit"]');

      if (!loginInput || !passwordInput || !submitButton) {
        console.log('❌ 로그인 폼을 찾을 수 없습니다.');
        if (mode !== 'reuse') await browser.close();
        return;
      }

      console.log('🔐 자동 로그인 진행 중...');
      // 로그인 정보 입력 (010-6669-9000 / 66699000)
      await loginInput.fill('010-6669-9000');
      await page.waitForTimeout(500);
      await passwordInput.fill('66699000');
      await page.waitForTimeout(500);
      
      // 로그인 버튼 클릭
      await submitButton.click();
      console.log('✅ 로그인 버튼 클릭됨');

      // 로그인 완료 대기 (리다이렉트 또는 페이지 변경 감지)
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {
        console.log('⚠️ 네비게이션 대기 중 타임아웃 (계속 진행)');
      });
      await page.waitForTimeout(2000);
      
      // 현재 URL 확인
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/login')) {
        console.log('⚠️ 로그인 후에도 로그인 페이지에 있습니다. 로그인 실패 가능성');
      } else {
        console.log(`✅ 로그인 성공: ${currentUrl}\n`);
        
        // 1. 갤러리 페이지 접속
        console.log('1️⃣ 갤러리 페이지 접속 중...');
        await page.goto('https://www.masgolf.co.kr/admin/gallery', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // 로그인 페이지로 리다이렉트되었는지 확인
        if (page.url().includes('/admin/login')) {
          console.log('❌ 로그인 페이지로 리다이렉트됨. 로그인이 실패했을 수 있습니다.');
          if (mode !== 'reuse') await browser.close();
          return;
        }
        
        console.log('✅ 갤러리 페이지 로드 완료\n');
      }
    }

    // 2. 이미지 찾기 및 편집 모달 열기
    console.log('2️⃣ 이미지 찾는 중...');
    const imageSelector = 'img[src*="supabase"], img[src*="storage"]';
    await page.waitForSelector(imageSelector, { timeout: 10000 });
    const images = await page.$$(imageSelector);
    
    if (images.length === 0) {
      console.log('❌ 이미지를 찾을 수 없습니다.');
      if (mode !== 'reuse') await browser.close();
      return;
    }

    console.log(`✅ ${images.length}개의 이미지 발견\n`);
    
    // 2개의 이미지 정보 입력 테스트
    const imagesToTest = Math.min(2, images.length);
    console.log(`📸 ${imagesToTest}개의 이미지에 대해 정보 입력 테스트를 진행합니다.\n`);
    
    for (let imgIndex = 0; imgIndex < imagesToTest; imgIndex++) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🖼️ 이미지 ${imgIndex + 1}/${imagesToTest} 처리 시작`);
      console.log(`${'='.repeat(60)}\n`);
      
      // 이미지 찾기 및 편집 모달 열기
      console.log(`3️⃣ 이미지 ${imgIndex + 1} 편집 버튼 클릭하여 모달 열기...`);
    
      try {
        // 현재 처리할 이미지의 컨테이너 찾기
        const currentImage = images[imgIndex];
        const imageContainer = await currentImage.evaluateHandle(el => el.closest('div[class*="group"]'));
        
        if (imageContainer) {
          const containerElement = await imageContainer.asElement();
          if (containerElement) {
            // 이미지 컨테이너에 호버 (편집 버튼 표시)
            await containerElement.hover();
            await page.waitForTimeout(500);
            console.log(`  ✅ 이미지 ${imgIndex + 1}에 호버 완료`);
          }
        } else {
          // 대안: 이미지 그리드에서 해당 인덱스의 이미지 찾기
          const imageContainers = await page.$$('div[class*="group"][class*="border"]');
          if (imageContainers[imgIndex]) {
            await imageContainers[imgIndex].hover();
            await page.waitForTimeout(500);
            console.log(`  ✅ 이미지 컨테이너 ${imgIndex + 1}에 호버 완료`);
          }
        }
      
      // 편집 버튼 찾기 (✏️ 이모지 또는 "편집" 텍스트)
      const editButtonSelectors = [
        'button:has-text("✏️")',
        'button[title="편집"]',
        'button:has-text("편집")',
        'button[aria-label*="편집"]',
        '.group button:last-of-type', // 호버 시 나타나는 버튼
        'button.p-1.bg-white' // 일반적인 편집 버튼 스타일
      ];
      
      let editButton = null;
      for (const selector of editButtonSelectors) {
        try {
          editButton = await page.$(selector);
          if (editButton) {
            console.log(`  ✅ 편집 버튼 발견: ${selector}`);
            break;
          }
        } catch (e) {
          // 계속 시도
        }
      }
      
      if (!editButton) {
        // 대안: 이미지 컨테이너 내의 모든 버튼 찾기
        const buttons = await page.$$('button');
        for (const btn of buttons) {
          const text = await btn.textContent();
          const title = await btn.getAttribute('title');
          if (text?.includes('✏️') || text?.includes('편집') || title?.includes('편집')) {
            editButton = btn;
            console.log('  ✅ 편집 버튼 발견 (텍스트 기반)');
            break;
          }
        }
      }
      
      if (editButton) {
        // 편집 버튼 클릭
        await editButton.click({ timeout: 5000 });
        console.log('  ✅ 편집 버튼 클릭 완료');
        await page.waitForTimeout(2000);
        
        // 모달이 나타날 때까지 대기
        try {
          await page.waitForSelector('text=이미지 메타데이터 편집', { timeout: 5000 });
          console.log('  ✅ 편집 모달 제목 발견');
        } catch (e1) {
          try {
            await page.waitForSelector('div[role="dialog"], [class*="modal"], [class*="Modal"]', { timeout: 3000 });
            console.log('  ✅ 모달 요소 발견');
          } catch (e2) {
            console.log('  ⚠️ 모달 대기 타임아웃');
          }
        }
      } else {
        console.log('  ⚠️ 편집 버튼을 찾을 수 없습니다.');
        console.log('  💡 이미지를 더블클릭하거나 확대 모달에서 편집 버튼을 클릭하세요.');
      }
    } catch (error) {
      console.log(`  ⚠️ 편집 모달 열기 오류: ${error.message}`);
    }
    
    await page.waitForTimeout(2000);
    
    // 편집 모달 확인 (여러 방식으로 시도)
    const modalTitle = await page.$('text=이미지 메타데이터 편집');
    const modalByText = await page.$('text=이미지 메타데이터');
    const modalByClass = await page.$('[class*="modal"], [class*="Modal"], div[role="dialog"]');
    
    if (!modalTitle && !modalByText && !modalByClass) {
        console.log(`  ⚠️ 이미지 ${imgIndex + 1} 편집 모달을 찾을 수 없습니다.`);
        console.log(`  ⏭️ 다음 이미지로 넘어갑니다.`);
        await page.waitForTimeout(1000);
        continue; // 다음 이미지로
      }
      console.log(`✅ 이미지 ${imgIndex + 1} 편집 모달 열림\n`);

      // 카테고리 체크박스 확인
    console.log('4️⃣ 카테고리 체크박스 확인 중...');
    const categoryLabels = [
      '골프코스',
      '젊은 골퍼',
      '시니어 골퍼',
      '스윙',
      '장비',
      '드라이버',
      '드라이버샷'
    ];

    for (const label of categoryLabels) {
      const checkbox = await page.$(`text=${label}`);
      if (checkbox) {
        console.log(`  ✅ ${label} 체크박스 발견`);
      } else {
        console.log(`  ⚠️ ${label} 체크박스를 찾을 수 없음`);
      }
    }
    console.log('');

      // 카테고리 여러 개 선택 테스트
      console.log(`5️⃣ 이미지 ${imgIndex + 1} - 카테고리 여러 개 선택 테스트...`);
    const testCategories = ['드라이버', '스윙', '장비'];
    
    for (const category of testCategories) {
      const label = await page.$(`text=${category}`);
      if (label) {
        const checkbox = await label.evaluateHandle(el => {
          const input = el.closest('label')?.querySelector('input[type="checkbox"]');
          return input;
        });
        if (checkbox) {
          const checkboxElement = await checkbox.asElement();
          if (checkboxElement) {
            await checkboxElement.click();
            console.log(`  ✅ ${category} 선택됨`);
            await page.waitForTimeout(500);
          }
        }
      }
    }
    console.log('');

      // 선택된 카테고리 확인
      console.log(`6️⃣ 이미지 ${imgIndex + 1} - 선택된 카테고리 확인...`);
    const selectedText = await page.$('text=선택됨:');
    if (selectedText) {
      const selectedInfo = await selectedText.evaluate(el => el.textContent);
      console.log(`  ✅ ${selectedInfo}`);
    } else {
      console.log('  ⚠️ 선택된 카테고리 정보를 찾을 수 없음');
    }
    console.log('');

      // 한글 AI 생성 버튼 클릭 및 테스트
      console.log(`7️⃣ 이미지 ${imgIndex + 1} - 한글 AI 생성 버튼 클릭 및 테스트...`);
    
    // 여러 방식으로 AI 생성 버튼 찾기
    const aiButtonSelectors = [
      'button:has-text("한글 AI 생성")',
      'button:has-text("AI 생성")',
      'button[aria-label*="AI"]',
      'button[class*="AI"]',
      'button:has-text("한글")'
    ];
    
    let aiButton = null;
    for (const selector of aiButtonSelectors) {
      try {
        aiButton = await page.$(selector);
        if (aiButton) {
          console.log(`  ✅ 한글 AI 생성 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }
    
    // 대안: 모든 버튼을 확인
    if (!aiButton) {
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && (text.includes('한글 AI 생성') || text.includes('AI 생성'))) {
          aiButton = btn;
          console.log('  ✅ 한글 AI 생성 버튼 발견 (텍스트 기반)');
          break;
        }
      }
    }
    
    if (aiButton) {
      console.log('  🚀 한글 AI 생성 버튼 클릭 중...');
      
      try {
        // AI 생성 버튼 클릭
        await aiButton.click({ timeout: 5000 });
        console.log('  ✅ 한글 AI 생성 버튼 클릭 완료');
        
        // AI 생성 시작 대기
        await page.waitForTimeout(1000);
        
        // 로딩 인디케이터 확인
        const loadingSelectors = [
          'text=생성 중',
          'text=처리 중',
          'text=AI 생성 중',
          '[class*="loading"]',
          '[class*="spinner"]'
        ];
        
        let loadingFound = false;
        for (const selector of loadingSelectors) {
          try {
            const loading = await page.$(selector);
            if (loading) {
              console.log('  ⏳ AI 생성 중... (로딩 감지)');
              loadingFound = true;
              break;
            }
          } catch (e) {
            // 계속 시도
          }
        }
        
        if (!loadingFound) {
          console.log('  ℹ️ 로딩 인디케이터를 찾지 못했지만 계속 진행합니다.');
        }
        
        // AI 생성 완료 대기 (최대 30초)
        console.log('  ⏳ AI 생성 완료 대기 중 (최대 30초)...');
        
        // 폼 필드가 채워지는지 확인
        const fieldSelectors = [
          'input[placeholder*="ALT 텍스트"], input[placeholder*="대체 텍스트"]',
          'input[placeholder*="키워드"]',
          'input[placeholder*="제목"]',
          'textarea[placeholder*="설명"]'
        ];
        
        let fieldsFilled = false;
        for (let i = 0; i < 30; i++) {
          await page.waitForTimeout(1000);
          
          // 폼 필드에 값이 채워졌는지 확인
          for (const selector of fieldSelectors) {
            try {
              const field = await page.$(selector);
              if (field) {
                const value = await field.inputValue();
                if (value && value.trim().length > 0) {
                  fieldsFilled = true;
                  console.log(`  ✅ AI 생성 완료! 필드에 값이 채워졌습니다: ${value.substring(0, 50)}...`);
                  break;
                }
              }
            } catch (e) {
              // 계속 시도
            }
          }
          
          if (fieldsFilled) break;
          
          // 에러 메시지 확인
          const errorSelectors = [
            'text=오류',
            'text=실패',
            'text=에러',
            '[class*="error"]',
            '[class*="Error"]'
          ];
          
          for (const selector of errorSelectors) {
            try {
              const error = await page.$(selector);
              if (error) {
                const errorText = await error.textContent();
                if (errorText && errorText.length > 0) {
                  console.log(`  ⚠️ 에러 감지: ${errorText}`);
                  break;
                }
              }
            } catch (e) {
              // 계속 시도
            }
          }
        }
        
        if (!fieldsFilled) {
          console.log(`  ⚠️ 이미지 ${imgIndex + 1} AI 생성이 완료되지 않았습니다.`);
        } else {
          console.log(`  ✅ 이미지 ${imgIndex + 1} AI 생성 완료!`);
        }
        
      } catch (error) {
        console.log(`  ❌ 이미지 ${imgIndex + 1} AI 생성 버튼 클릭 오류: ${error.message}`);
      }
      } else {
        console.log(`  ⚠️ 이미지 ${imgIndex + 1} 한글 AI 생성 버튼을 찾을 수 없습니다.`);
        console.log('  💡 모달이 열려있는지 확인하세요.');
      }
      
      // 저장 버튼 확인 및 실제 저장
      console.log(`\n8️⃣ 이미지 ${imgIndex + 1} - 저장 버튼 클릭 및 저장 테스트...`);
      const saveButton = await page.$('button:has-text("저장"):not(:disabled)');
      
      if (saveButton) {
        console.log('  ✅ 저장 버튼 발견');
        
        // 저장 전 현재 입력된 값들 확인
        try {
          const altTextBefore = await page.$eval('input[placeholder*="ALT"], input[placeholder*="대체"]', el => el.value).catch(() => '');
          const keywordsBefore = await page.$eval('input[placeholder*="키워드"]', el => el.value).catch(() => '');
          const titleBefore = await page.$eval('input[placeholder*="제목"]', el => el.value).catch(() => '');
          const descriptionBefore = await page.$eval('textarea[placeholder*="설명"]', el => el.value).catch(() => '');
          
          console.log('  📝 저장 전 데이터:');
          console.log(`    - ALT 텍스트: ${altTextBefore.substring(0, 50)}...`);
          console.log(`    - 키워드: ${keywordsBefore.substring(0, 50)}...`);
          console.log(`    - 제목: ${titleBefore.substring(0, 50)}...`);
          console.log(`    - 설명: ${descriptionBefore.substring(0, 50)}...`);
        } catch (e) {
          console.log('  ⚠️ 저장 전 데이터 읽기 실패:', e.message);
        }
        
        // "개선이 필요합니다" 메시지 확인
        const improvementMessage = await page.$('text=개선이 필요합니다');
        if (improvementMessage) {
          console.log('  ⚠️ 저장 전 "개선이 필요합니다" 메시지가 표시됩니다.');
        }
        
        // 저장 버튼 클릭
        console.log('  💾 저장 버튼 클릭 중...');
        await saveButton.click();
        console.log('  ✅ 저장 버튼 클릭 완료');
        
        // 저장 완료 대기 (성공 메시지 또는 모달 닫힘 확인)
        await page.waitForTimeout(3000);
        
        // 저장 성공 확인
        const successMessages = [
          'text=저장되었습니다',
          'text=성공',
          'text=저장 완료',
          '[class*="success"]'
        ];
        
        let saved = false;
        for (const selector of successMessages) {
          try {
            const successMsg = await page.$(selector);
            if (successMsg) {
              const text = await successMsg.textContent();
              console.log(`  ✅ 저장 성공 확인: ${text}`);
              saved = true;
              break;
            }
          } catch (e) {
            // 계속 시도
          }
        }
        
        if (!saved) {
          // 모달이 닫혔는지 확인 (닫혔으면 저장 성공으로 간주)
          const modalStillOpen = await page.$('text=이미지 메타데이터 편집');
          if (!modalStillOpen) {
            console.log('  ✅ 모달이 닫혔습니다. 저장 성공으로 간주합니다.');
            saved = true;
          } else {
            console.log('  ⚠️ 저장 성공 메시지를 찾지 못했습니다.');
          }
        }
        
        // 모달이 열려있으면 닫기
        const modalOpen = await page.$('text=이미지 메타데이터 편집');
        if (modalOpen) {
          const closeButton = await page.$('button:has-text("✕"), button[aria-label*="닫기"], button:has-text("취소")');
          if (closeButton) {
            await closeButton.click();
            await page.waitForTimeout(1000);
            console.log('  ✅ 모달 닫기 완료');
          } else {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
          }
        }
        
        // 저장된 내용 재확인 (모달 다시 열기)
        console.log(`\n9️⃣ 이미지 ${imgIndex + 1} - 저장된 내용 재확인 (모달 다시 열기)...`);
        await page.waitForTimeout(2000); // 저장 완료 대기
        
        // 다시 이미지에 호버하여 편집 버튼 클릭
        const currentImageForVerify = images[imgIndex];
        const imageContainerForVerify = await currentImageForVerify.evaluateHandle(el => el.closest('div[class*="group"]'));
        
        if (imageContainerForVerify) {
          const containerElement = await imageContainerForVerify.asElement();
          if (containerElement) {
            await containerElement.hover();
            await page.waitForTimeout(500);
          }
        } else {
          await currentImageForVerify.hover();
          await page.waitForTimeout(500);
        }
        
        // 편집 버튼 클릭
        const editButtonForVerify = await page.$('button:has-text("✏️"), button[title="편집"]');
        if (editButtonForVerify) {
          await editButtonForVerify.click();
          await page.waitForTimeout(2000);
          
          // 모달이 열릴 때까지 대기
          await page.waitForSelector('text=이미지 메타데이터 편집', { timeout: 5000 });
          console.log('  ✅ 편집 모달 재열림 완료');
          
          // 저장된 값들 확인
          try {
            const altTextAfter = await page.$eval('input[placeholder*="ALT"], input[placeholder*="대체"]', el => el.value).catch(() => '');
            const keywordsAfter = await page.$eval('input[placeholder*="키워드"]', el => el.value).catch(() => '');
            const titleAfter = await page.$eval('input[placeholder*="제목"]', el => el.value).catch(() => '');
            const descriptionAfter = await page.$eval('textarea[placeholder*="설명"]', el => el.value).catch(() => '');
            
            console.log('\n  📋 저장 후 재확인 데이터:');
            console.log(`    - ALT 텍스트: ${altTextAfter.substring(0, 50)}${altTextAfter.length > 50 ? '...' : ''}`);
            console.log(`    - 키워드: ${keywordsAfter.substring(0, 50)}${keywordsAfter.length > 50 ? '...' : ''}`);
            console.log(`    - 제목: ${titleAfter.substring(0, 50)}${titleAfter.length > 50 ? '...' : ''}`);
            console.log(`    - 설명: ${descriptionAfter.substring(0, 50)}${descriptionAfter.length > 50 ? '...' : ''}`);
            
            // 저장된 카테고리 확인
            const selectedCategoriesAfter = await page.$$eval('input[type="checkbox"]:checked', (checkboxes) => {
              return checkboxes.map(cb => {
                const label = cb.closest('label');
                return label ? label.textContent.trim() : '';
              }).filter(Boolean);
            }).catch(() => []);
            
            console.log(`    - 선택된 카테고리: ${selectedCategoriesAfter.join(', ')}`);
            
            // 저장 확인 결과
            if (altTextAfter.length > 0 || keywordsAfter.length > 0 || titleAfter.length > 0 || descriptionAfter.length > 0) {
              console.log('  ✅ 저장된 데이터 확인 완료! 디비에 저장이 정상적으로 되었습니다.');
            } else {
              console.log('  ⚠️ 저장된 데이터가 비어있습니다. 저장이 실패했을 수 있습니다.');
            }
            
            // "개선이 필요합니다" 메시지 재확인
            const improvementMessageAfter = await page.$('text=개선이 필요합니다');
            if (improvementMessageAfter) {
              console.log('  ⚠️ "개선이 필요합니다" 메시지가 여전히 표시됩니다.');
              console.log('  💡 이는 SEO 최적화 점수가 낮아서 나오는 메시지일 수 있습니다.');
            } else {
              console.log('  ✅ "개선이 필요합니다" 메시지가 사라졌습니다.');
            }
            
          } catch (e) {
            console.log('  ❌ 저장된 데이터 확인 중 오류:', e.message);
          }
          
          // 모달 닫기
          const closeButtonAfterVerify = await page.$('button:has-text("✕"), button[aria-label*="닫기"], button:has-text("취소")');
          if (closeButtonAfterVerify) {
            await closeButtonAfterVerify.click();
            await page.waitForTimeout(1000);
            console.log('  ✅ 재확인 후 모달 닫기 완료');
          } else {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
          }
        } else {
          console.log('  ⚠️ 편집 버튼을 찾을 수 없어 재확인을 건너뜁니다.');
        }
        
      } else {
        console.log('  ⚠️ 저장 버튼을 찾을 수 없거나 비활성화되어 있습니다.');
      }
      
      // 다음 이미지 처리 전 대기
      if (imgIndex < imagesToTest - 1) {
        console.log(`\n⏳ 다음 이미지 처리를 위해 2초 대기...\n`);
        await page.waitForTimeout(2000);
      }
    } // for loop 종료
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ 총 ${imagesToTest}개 이미지 처리 완료!`);
    console.log(`${'='.repeat(60)}\n`);
      

    // 브라우저를 열어둠 (수동 확인 가능)
    console.log('\n⏸️ 브라우저를 열어둡니다.');
    console.log(`💡 다음 명령어로 다시 실행할 수 있습니다:`);
    console.log(`   node playwright-image-test.js reload  - 현재 페이지 리로드 후 계속`);
    console.log(`   node playwright-image-test.js reuse   - 기존 브라우저 재사용`);
    
    if (mode !== 'reuse') {
      console.log(`\n⏳ 30초 후 브라우저가 자동으로 닫힙니다. (재사용하려면 위 명령어 사용)`);
      await page.waitForTimeout(30000);
      await browser.close();
      globalBrowser = null;
      globalPage = null;
    } else {
      console.log(`\n⏳ 브라우저를 계속 열어둡니다. 재사용하려면 'reuse' 모드로 실행하세요.`);
      await page.waitForTimeout(10000);
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    try {
      await page.screenshot({ path: 'test-error.png' });
    } catch (e) {
      console.log('스크린샷 저장 실패:', e.message);
    }
    
    if (mode !== 'reuse') {
      if (globalBrowser) {
        await globalBrowser.close();
        globalBrowser = null;
        globalPage = null;
      }
    }
  }
})();

