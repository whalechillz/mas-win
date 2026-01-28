/**
 * OCR 라디오 버튼 표시 상세 테스트
 * 실제 사용자 플로우를 따라가며 OCR 옵션이 나타나는지 확인
 */

const { chromium } = require('playwright');

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 동작을 천천히 해서 확인 가능
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // 콘솔 로그 캡처
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('문서') || text.includes('OCR') || text.includes('감지') || text.includes('isDocument')) {
      consoleLogs.push(text);
      console.log('📋 콘솔:', text);
    }
  });

  try {
    console.log('🚀 OCR 라디오 버튼 상세 테스트 시작\n');

    // 1. 로그인 페이지로 이동
    console.log('1️⃣ 로그인 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);

    // 2. 로그인 수행
    console.log('2️⃣ 로그인 수행...');
    console.log(`   아이디: ${ADMIN_LOGIN}`);
    
    // 로그인 입력 필드 찾기
    const loginInputSelectors = [
      'input[name="login"]',
      'input[type="text"]',
      'input[placeholder*="아이디"]',
      'input[placeholder*="전화번호"]'
    ];

    let loginInput = null;
    for (const selector of loginInputSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          loginInput = element;
          console.log(`✅ 로그인 입력 필드 발견: ${selector}`);
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }

    if (!loginInput) {
      throw new Error('로그인 입력 필드를 찾을 수 없습니다');
    }

    // 아이디 입력
    await loginInput.fill(ADMIN_LOGIN);
    await page.waitForTimeout(500);

    // 비밀번호 입력 필드 찾기
    const passwordInputSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="비밀번호"]'
    ];

    let passwordInput = null;
    for (const selector of passwordInputSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          passwordInput = element;
          console.log(`✅ 비밀번호 입력 필드 발견: ${selector}`);
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }

    if (!passwordInput) {
      throw new Error('비밀번호 입력 필드를 찾을 수 없습니다');
    }

    // 비밀번호 입력
    await passwordInput.fill(ADMIN_PASSWORD);
    await page.waitForTimeout(500);

    // 로그인 버튼 클릭
    const loginButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("로그인")',
      'button:has-text("Login")',
      'form button'
    ];

    let loginButton = null;
    for (const selector of loginButtonSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          loginButton = element;
          console.log(`✅ 로그인 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }

    if (!loginButton) {
      throw new Error('로그인 버튼을 찾을 수 없습니다');
    }

    await loginButton.click();
    console.log('✅ 로그인 버튼 클릭 완료');
    await page.waitForTimeout(3000);

    // 로그인 성공 확인 (URL이 변경되었는지 확인)
    const currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('⚠️ 아직 로그인 페이지에 있습니다. 로그인 실패 가능성');
      // 에러 메시지 확인
      const errorMessage = page.locator('text=/.*오류.*/, text=/.*실패.*/, text=/.*잘못.*/').first();
      if (await errorMessage.count() > 0) {
        const errorText = await errorMessage.textContent();
        console.log(`❌ 로그인 오류: ${errorText}`);
      }
    } else {
      console.log('✅ 로그인 성공 (페이지 이동됨)');
    }

    // 3. 고객 관리 페이지로 이동
    console.log('3️⃣ 고객 관리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/customers', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(3000);

    // 4. 고객 찾기 및 클릭
    console.log('4️⃣ 고객 찾기...');
    const customerName = '최태섭';
    
    // 고객 이름으로 검색 또는 직접 클릭
    try {
      // 고객 이름이 포함된 요소 찾기
      const customerSelector = `text=${customerName}`;
      await page.waitForSelector(customerSelector, { timeout: 5000 });
      
      // 고객 행 클릭 (이미지 업로드 버튼이 있는 행)
      const customerRow = page.locator(customerSelector).first();
      await customerRow.click({ force: true });
      await page.waitForTimeout(2000);
      
      console.log(`✅ 고객 "${customerName}" 클릭 완료`);
    } catch (error) {
      console.log('⚠️ 고객 직접 클릭 실패, 이미지 업로드 버튼 직접 찾기');
    }

    // 5. 이미지 업로드 영역 찾기
    console.log('5️⃣ 이미지 업로드 영역 찾기...');
    await page.waitForTimeout(2000);

    // 여러 가능한 업로드 버튼/영역 찾기
    const uploadButtonSelectors = [
      'button:has-text("이미지 업로드")',
      'button:has-text("업로드")',
      '[class*="upload"]',
      '[data-testid*="upload"]',
      'input[type="file"]'
    ];

    let fileInput = null;
    for (const selector of uploadButtonSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`✅ 업로드 요소 발견: ${selector} (${count}개)`);
          fileInput = elements.first();
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }

    if (!fileInput) {
      // 파일 입력 직접 찾기
      fileInput = page.locator('input[type="file"]').first();
      const count = await fileInput.count();
      if (count === 0) {
        console.log('❌ 파일 입력 요소를 찾을 수 없습니다');
        await page.screenshot({ path: 'e2e-test/ocr-no-file-input.png', fullPage: true });
        throw new Error('파일 입력 요소를 찾을 수 없음');
      }
    }

    // 6. 테스트용 더미 파일 생성 (주문사양서.png)
    console.log('6️⃣ 테스트 파일 준비 (주문사양서.png)...');
    
    // 파일 입력에 파일 설정 (더미 파일)
    const testFilePath = '/tmp/test-주문사양서.png';
    const fs = require('fs');
    // 더미 PNG 파일 생성 (1x1 픽셀)
    const dummyPng = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG 시그니처
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR 청크
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND
    ]);
    fs.writeFileSync(testFilePath, dummyPng);

    // 파일 입력에 파일 설정
    await fileInput.setInputFiles(testFilePath);
    await page.waitForTimeout(2000);

    console.log('✅ 파일 선택 완료');

    // 7. 업로드 설정 모달 확인
    console.log('7️⃣ 업로드 설정 모달 확인...');
    await page.waitForTimeout(3000);

    // 모달이 열렸는지 확인
    const modalSelectors = [
      'text=이미지 업로드 설정',
      'text=업로드 설정',
      '[class*="modal"]',
      '[class*="Modal"]'
    ];

    let modalFound = false;
    for (const selector of modalSelectors) {
      try {
        const modal = page.locator(selector).first();
        if (await modal.count() > 0 && await modal.isVisible()) {
          console.log(`✅ 모달 발견: ${selector}`);
          modalFound = true;
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }

    if (!modalFound) {
      console.log('❌ 업로드 설정 모달을 찾을 수 없습니다');
      await page.screenshot({ path: 'e2e-test/ocr-modal-not-found.png', fullPage: true });
      
      // 페이지의 모든 텍스트 확인
      const bodyText = await page.locator('body').textContent();
      console.log('📄 페이지 텍스트 일부:', bodyText?.substring(0, 500));
      
      throw new Error('업로드 설정 모달이 열리지 않음');
    }

    // 8. 파일명 확인
    console.log('8️⃣ 선택된 파일명 확인...');
    const fileNameSelectors = [
      'text=주문사양서',
      'text=사양서',
      '[class*="file"]',
      'text=/.*주문.*/',
      'text=/.*사양서.*/'
    ];

    let fileNameFound = false;
    for (const selector of fileNameSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          const text = await element.textContent();
          console.log(`✅ 파일명 발견: ${text?.trim()}`);
          fileNameFound = true;
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }

    if (!fileNameFound) {
      console.log('⚠️ 파일명이 표시되지 않음 (계속 진행)');
    }

    // 9. 메타데이터 생성 방식 섹션 확인
    console.log('9️⃣ 메타데이터 생성 방식 섹션 확인...');
    
    // 섹션 제목 확인
    const sectionTitle = page.locator('text=메타데이터 생성 방식').first();
    if (await sectionTitle.count() > 0) {
      console.log('✅ "메타데이터 생성 방식" 섹션 발견');
    } else {
      console.log('❌ "메타데이터 생성 방식" 섹션을 찾을 수 없음');
    }

    // 10. 모든 라디오 버튼 확인
    console.log('🔟 라디오 버튼 확인...');
    
    // metadataType 라디오 버튼 찾기
    const radioButtons = page.locator('input[type="radio"][name="metadataType"]');
    const radioCount = await radioButtons.count();
    console.log(`📊 라디오 버튼 개수: ${radioCount}`);

    if (radioCount === 0) {
      console.log('❌ 라디오 버튼을 찾을 수 없습니다');
      
      // 대안: 모든 라디오 버튼 찾기
      const allRadios = page.locator('input[type="radio"]');
      const allRadioCount = await allRadios.count();
      console.log(`📊 전체 라디오 버튼 개수: ${allRadioCount}`);
      
      if (allRadioCount > 0) {
        console.log('⚠️ metadataType 라디오 버튼이 없지만 다른 라디오 버튼이 있습니다');
      }
    }

    // 각 라디오 버튼의 정보 출력
    for (let i = 0; i < radioCount; i++) {
      const radio = radioButtons.nth(i);
      const value = await radio.getAttribute('value');
      const checked = await radio.isChecked();
      const visible = await radio.isVisible();
      
      // 라벨 찾기
      let labelText = '';
      try {
        // 라디오 버튼의 부모 label 찾기
        const parent = radio.locator('xpath=ancestor::label');
        if (await parent.count() > 0) {
          labelText = await parent.textContent() || '';
        } else {
          // 또는 다음 형제 요소 찾기
          const label = page.locator(`label:has(input[value="${value}"])`).first();
          if (await label.count() > 0) {
            labelText = await label.textContent() || '';
          }
        }
      } catch (e) {
        // 라벨 찾기 실패
      }
      
      console.log(`  라디오 ${i + 1}:`);
      console.log(`    - value: "${value}"`);
      console.log(`    - checked: ${checked}`);
      console.log(`    - visible: ${visible}`);
      console.log(`    - label: "${labelText?.trim()}"`);
    }

    // 11. OCR 옵션 특별 확인
    console.log('1️⃣1️⃣ OCR 옵션 특별 확인...');
    
    // value="ocr" 라디오 버튼 찾기
    const ocrRadio = page.locator('input[type="radio"][value="ocr"]').first();
    const ocrRadioCount = await ocrRadio.count();
    
    if (ocrRadioCount > 0) {
      console.log('✅ OCR 라디오 버튼 발견!');
      const isVisible = await ocrRadio.isVisible();
      const isChecked = await ocrRadio.isChecked();
      
      console.log(`  - 표시 여부: ${isVisible}`);
      console.log(`  - 선택 여부: ${isChecked}`);
      
      // 부모 요소 확인
      try {
        const parent = ocrRadio.locator('xpath=ancestor::label | ancestor::div').first();
        const parentClass = await parent.getAttribute('class');
        const parentStyle = await parent.evaluate(el => window.getComputedStyle(el).display);
        console.log(`  - 부모 클래스: ${parentClass}`);
        console.log(`  - 부모 display: ${parentStyle}`);
      } catch (e) {
        console.log('  - 부모 요소 확인 실패');
      }
    } else {
      console.log('❌ OCR 라디오 버튼을 찾을 수 없습니다');
      
      // 페이지 소스에서 "ocr" 검색
      const pageContent = await page.content();
      const hasOcrInSource = pageContent.includes('value="ocr"') || 
                            pageContent.includes('metadataType.*ocr') ||
                            pageContent.includes('OCR');
      
      console.log(`📄 페이지 소스에 OCR 포함: ${hasOcrInSource}`);
      
      if (!hasOcrInSource) {
        console.log('⚠️ 페이지 소스에 OCR 관련 코드가 없습니다');
        
        // 메타데이터 생성 방식 섹션의 HTML 확인
        try {
          const section = page.locator('text=메타데이터 생성 방식').locator('xpath=ancestor::div').first();
          if (await section.count() > 0) {
            const sectionHtml = await section.innerHTML();
            console.log('📋 메타데이터 생성 방식 섹션 HTML:');
            console.log(sectionHtml.substring(0, 1000));
          }
        } catch (e) {
          console.log('섹션 HTML 확인 실패');
        }
      }
    }

    // 12. 문서 감지 로직 테스트 (JavaScript 실행)
    console.log('1️⃣2️⃣ 문서 감지 로직 테스트 (브라우저에서 실행)...');
    
    const detectionTest = await page.evaluate(() => {
      const testFileNames = [
        '주문사양서.png',
        '주문사양서.jpg',
        'order-spec.png',
        'document.pdf',
        'scan.jpg',
        'seukaen.png'
      ];

      const results = testFileNames.map(fileName => {
        const lower = fileName.toLowerCase();
        const isDoc = 
          lower.includes('doc') ||
          lower.includes('사양서') ||
          lower.includes('문서') ||
          lower.includes('scan') ||
          lower.includes('seukaen') ||
          lower.includes('주문') ||
          lower.includes('order') ||
          lower.includes('spec') ||
          lower.includes('specification');
        
        return { fileName, isDoc };
      });

      return results;
    });

    console.log('브라우저에서 실행한 문서 감지 테스트 결과:');
    detectionTest.forEach(({ fileName, isDoc }) => {
      console.log(`  - "${fileName}": ${isDoc ? '✅ 문서' : '❌ 일반'}`);
    });

    // 13. 현재 선택된 파일명으로 문서 감지 확인
    console.log('1️⃣3️⃣ 현재 선택된 파일로 문서 감지 확인...');
    
    const currentFileDetection = await page.evaluate(() => {
      // React 컴포넌트의 상태를 직접 접근할 수는 없지만,
      // DOM에서 파일명을 찾아서 감지 로직 테스트
      const fileElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return text.includes('주문') || text.includes('사양서') || text.includes('.png') || text.includes('.jpg');
      });

      if (fileElements.length > 0) {
        const fileText = fileElements[0].textContent || '';
        const lower = fileText.toLowerCase();
        const isDoc = 
          lower.includes('doc') ||
          lower.includes('사양서') ||
          lower.includes('문서') ||
          lower.includes('scan') ||
          lower.includes('seukaen') ||
          lower.includes('주문') ||
          lower.includes('order') ||
          lower.includes('spec') ||
          lower.includes('specification');
        
        return { fileText, isDoc };
      }
      
      return { fileText: '파일명을 찾을 수 없음', isDoc: false };
    });

    console.log(`현재 파일: "${currentFileDetection.fileText}"`);
    console.log(`문서 감지 결과: ${currentFileDetection.isDoc ? '✅ 문서' : '❌ 일반'}`);

    // 14. 스크린샷 저장
    console.log('1️⃣4️⃣ 스크린샷 저장...');
    await page.screenshot({ 
      path: 'e2e-test/ocr-radio-button-detailed-test.png', 
      fullPage: true 
    });

    // 15. 콘솔 로그 요약
    console.log('\n📋 콘솔 로그 요약:');
    if (consoleLogs.length > 0) {
      consoleLogs.forEach((log, i) => {
        console.log(`  ${i + 1}. ${log}`);
      });
    } else {
      console.log('  (문서/OCR 관련 콘솔 로그 없음)');
    }

    console.log('\n✅ 테스트 완료');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    await page.screenshot({ 
      path: 'e2e-test/ocr-test-error.png', 
      fullPage: true 
    });
    throw error;
  } finally {
    // 브라우저는 수동으로 닫도록 (headless: false이므로)
    console.log('\n⏸️ 브라우저를 수동으로 닫아주세요 (테스트 결과 확인용)');
    // await browser.close();
  }
})();
