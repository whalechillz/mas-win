/**
 * OCR 라디오 버튼 표시 테스트
 * 문서 파일 업로드 시 OCR 옵션이 나타나는지 확인
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 OCR 라디오 버튼 테스트 시작');

    // 1. 로그인 페이지로 이동
    console.log('📄 로그인 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/customers', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 2. 고객 선택 (최태섭)
    console.log('👤 고객 선택...');
    const customerName = '최태섭';
    
    // 고객 검색 또는 클릭
    try {
      await page.fill('input[placeholder*="검색"], input[type="search"], input[placeholder*="이름"]', customerName);
      await page.waitForTimeout(1000);
      
      // 고객 행 클릭
      const customerRow = page.locator(`text=${customerName}`).first();
      if (await customerRow.count() > 0) {
        await customerRow.click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('⚠️ 고객 검색 실패, 직접 이미지 업로드 버튼 찾기');
    }

    // 3. 이미지 업로드 버튼 찾기
    console.log('📤 이미지 업로드 버튼 찾기...');
    
    // 여러 가능한 선택자 시도
    const uploadSelectors = [
      'button:has-text("이미지 업로드")',
      'button:has-text("업로드")',
      'input[type="file"]',
      '[data-testid="image-upload"]',
      'button >> text=이미지',
      'button >> text=업로드'
    ];

    let fileInput = null;
    for (const selector of uploadSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          console.log(`✅ 업로드 요소 발견: ${selector}`);
          fileInput = element;
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }

    if (!fileInput) {
      // 파일 입력 직접 찾기
      fileInput = page.locator('input[type="file"]').first();
    }

    // 4. 테스트 파일 생성 (주문사양서.png 시뮬레이션)
    console.log('📄 테스트 파일 준비...');
    
    // 파일 선택 (실제 파일이 없으면 시뮬레이션)
    const testFileName = '주문사양서.png';
    
    // 파일 입력이 있으면 파일 선택
    if (await fileInput.count() > 0) {
      // 파일 입력 클릭하여 모달 열기
      await fileInput.click({ force: true });
      await page.waitForTimeout(1000);
    } else {
      // 드래그 앤 드롭 영역 찾기
      const dropZone = page.locator('[class*="upload"], [class*="drop"], [data-testid="upload"]').first();
      if (await dropZone.count() > 0) {
        await dropZone.click();
        await page.waitForTimeout(1000);
      }
    }

    // 5. 업로드 설정 모달 확인
    console.log('🔍 업로드 설정 모달 확인...');
    await page.waitForTimeout(2000);

    // 모달이 열렸는지 확인
    const modalTitle = page.locator('text=이미지 업로드 설정, text=업로드 설정').first();
    if (await modalTitle.count() === 0) {
      console.log('❌ 업로드 설정 모달이 열리지 않았습니다');
      
      // 스크린샷 저장
      await page.screenshot({ path: 'e2e-test/ocr-modal-not-found.png', fullPage: true });
      
      // 페이지 HTML 확인
      const html = await page.content();
      console.log('📄 페이지 내용 일부:', html.substring(0, 1000));
      
      throw new Error('업로드 설정 모달이 열리지 않음');
    }

    console.log('✅ 업로드 설정 모달 발견');

    // 6. 파일명 확인
    console.log('📋 선택된 파일명 확인...');
    const fileNameText = page.locator('text=주문사양서, text=사양서').first();
    if (await fileNameText.count() > 0) {
      const fileName = await fileNameText.textContent();
      console.log(`✅ 파일명 확인: ${fileName}`);
    } else {
      console.log('⚠️ 파일명이 표시되지 않음');
    }

    // 7. 메타데이터 생성 방식 옵션 확인
    console.log('🔍 메타데이터 생성 방식 옵션 확인...');
    
    // 모든 라디오 버튼 찾기
    const radioButtons = page.locator('input[type="radio"][name="metadataType"]');
    const radioCount = await radioButtons.count();
    console.log(`📊 라디오 버튼 개수: ${radioCount}`);

    // 각 라디오 버튼의 라벨 확인
    for (let i = 0; i < radioCount; i++) {
      const radio = radioButtons.nth(i);
      const value = await radio.getAttribute('value');
      const checked = await radio.isChecked();
      
      // 라벨 찾기
      const label = page.locator(`label:has(input[value="${value}"])`).first();
      const labelText = await label.textContent();
      
      console.log(`  - 옵션 ${i + 1}: value="${value}", checked=${checked}, label="${labelText?.trim()}"`);
    }

    // 8. OCR 옵션 확인
    console.log('🔍 OCR 옵션 확인...');
    const ocrOption = page.locator('text=OCR, text=구글 비전, text=텍스트 추출').first();
    const ocrRadio = page.locator('input[type="radio"][value="ocr"]').first();
    
    if (await ocrRadio.count() > 0) {
      console.log('✅ OCR 라디오 버튼 발견!');
      const isVisible = await ocrRadio.isVisible();
      console.log(`  - 표시 여부: ${isVisible}`);
      
      // 부모 요소 확인
      const parent = ocrRadio.locator('..');
      const parentClass = await parent.getAttribute('class');
      console.log(`  - 부모 클래스: ${parentClass}`);
    } else {
      console.log('❌ OCR 라디오 버튼을 찾을 수 없습니다');
      
      // 문서 감지 로직 확인을 위한 콘솔 로그 확인
      console.log('📋 브라우저 콘솔 로그 확인...');
      const logs = [];
      page.on('console', msg => {
        if (msg.text().includes('문서') || msg.text().includes('OCR') || msg.text().includes('감지')) {
          logs.push(msg.text());
          console.log('  콘솔:', msg.text());
        }
      });
    }

    // 9. 문서 감지 로직 테스트
    console.log('🧪 문서 감지 로직 테스트...');
    
    // 파일명이 "주문사양서"인 경우 isDocument가 true여야 함
    const testFileNames = [
      '주문사양서.png',
      '주문사양서.jpg',
      'order-spec.png',
      'document.pdf',
      'scan.jpg'
    ];

    console.log('테스트 파일명 감지 결과:');
    testFileNames.forEach(fileName => {
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
      
      console.log(`  - "${fileName}": ${isDoc ? '✅ 문서' : '❌ 일반'}`);
    });

    // 10. 스크린샷 저장
    console.log('📸 스크린샷 저장...');
    await page.screenshot({ 
      path: 'e2e-test/ocr-radio-button-test.png', 
      fullPage: true 
    });

    // 11. 페이지 소스 일부 확인
    const pageContent = await page.content();
    const hasOcr = pageContent.includes('value="ocr"') || pageContent.includes('OCR');
    console.log(`📄 페이지 소스에 OCR 포함: ${hasOcr}`);

    if (!hasOcr) {
      console.log('⚠️ 페이지 소스에 OCR 관련 코드가 없습니다');
      console.log('📋 메타데이터 생성 방식 섹션 HTML:');
      const metadataSection = page.locator('text=메타데이터 생성 방식').locator('..');
      if (await metadataSection.count() > 0) {
        const sectionHtml = await metadataSection.innerHTML();
        console.log(sectionHtml.substring(0, 500));
      }
    }

    console.log('✅ 테스트 완료');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    await page.screenshot({ 
      path: 'e2e-test/ocr-test-error.png', 
      fullPage: true 
    });
    throw error;
  } finally {
    await browser.close();
  }
})();
