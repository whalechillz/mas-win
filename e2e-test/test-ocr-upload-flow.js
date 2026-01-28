/**
 * OCR 업로드 플로우 전체 테스트
 * 문서 파일 업로드부터 OCR 처리까지 전체 과정 테스트
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

// 테스트용 더미 이미지 파일 생성
function createTestImage(fileName = '주문사양서.jpeg') {
  const testImagePath = path.join(__dirname, fileName);
  
  // 간단한 1x1 픽셀 JPEG 이미지 (Base64)
  const base64Image = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==';
  const buffer = Buffer.from(base64Image, 'base64');
  
  fs.writeFileSync(testImagePath, buffer);
  return testImagePath;
}

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // 콘솔 로그 및 네트워크 요청 캡처
  const consoleLogs = [];
  const networkRequests = [];
  const networkErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('OCR') || text.includes('API') || text.includes('오류') || text.includes('에러') || text.includes('401') || text.includes('403')) {
      consoleLogs.push({ type: msg.type(), text });
      console.log(`[콘솔 ${msg.type()}]`, text);
    }
  });

  page.on('request', request => {
    const url = request.url();
    if (url.includes('extract-document-text') || url.includes('create-customer-image-metadata') || url.includes('vision.googleapis.com')) {
      networkRequests.push({
        url: url.substring(0, 200),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      console.log(`📤 [요청] ${request.method()} ${url.substring(0, 100)}`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('extract-document-text') || url.includes('create-customer-image-metadata') || url.includes('vision.googleapis.com')) {
      const status = response.status();
      const statusText = response.statusText();
      
      let responseBody = '';
      try {
        responseBody = await response.text();
      } catch (e) {
        responseBody = '응답 본문을 읽을 수 없습니다';
      }

      const responseInfo = {
        url: url.substring(0, 200),
        status,
        statusText,
        ok: response.ok,
        body: responseBody.substring(0, 500),
        timestamp: new Date().toISOString()
      };

      if (!response.ok) {
        networkErrors.push(responseInfo);
        console.error(`❌ [응답 오류] ${status} ${statusText} - ${url.substring(0, 100)}`);
        console.error(`   본문: ${responseBody.substring(0, 300)}`);
      } else {
        console.log(`✅ [응답 성공] ${status} ${statusText} - ${url.substring(0, 100)}`);
      }
    }
  });

  try {
    console.log('🚀 OCR 업로드 플로우 테스트 시작\n');

    // 1. 로그인
    console.log('1️⃣ 로그인...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.fill('input[name="login"]', ADMIN_LOGIN);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('로그인 실패');
    }
    console.log('✅ 로그인 성공\n');

    // 2. 고객 관리 페이지로 이동
    console.log('2️⃣ 고객 관리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/customers', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 3. 고객 찾기 및 이미지 관리 모달 열기
    console.log('3️⃣ 고객 찾기 및 이미지 관리 모달 열기...');
    const customerName = '최태섭';
    
    await page.waitForSelector(`text=${customerName}`, { timeout: 10000 });
    
    // "이미지" 버튼 찾기 및 클릭
    const imageButton = page.locator('button:has-text("이미지"):not(:has-text("위치"))').first();
    if (await imageButton.count() > 0) {
      await imageButton.click();
      console.log('✅ 이미지 관리 버튼 클릭');
      await page.waitForTimeout(3000);
    } else {
      throw new Error('이미지 관리 버튼을 찾을 수 없습니다');
    }

    // 4. 파일 업로드
    console.log('4️⃣ 파일 업로드...');
    const testImagePath = createTestImage('주문사양서.jpeg');
    console.log(`   테스트 파일 생성: ${testImagePath}`);

    // 파일 입력 찾기
    const fileInput = page.locator('#customer-image-upload, input[type="file"]').first();
    if (await fileInput.count() === 0) {
      // label 클릭
      const label = page.locator('label[for="customer-image-upload"], label:has-text("파일 선택")').first();
      if (await label.count() > 0) {
        await label.click();
        await page.waitForTimeout(1000);
      }
    }

    const fileInputFinal = page.locator('input[type="file"]').first();
    if (await fileInputFinal.count() > 0) {
      await fileInputFinal.setInputFiles(testImagePath);
      console.log('✅ 파일 선택 완료');
      await page.waitForTimeout(2000);
    } else {
      throw new Error('파일 입력 요소를 찾을 수 없습니다');
    }

    // 5. 업로드 설정 모달 확인
    console.log('5️⃣ 업로드 설정 모달 확인...');
    await page.waitForSelector('text=이미지 업로드 설정', { timeout: 5000 });
    console.log('✅ 업로드 설정 모달 열림');

    // 6. OCR 옵션 선택
    console.log('6️⃣ OCR 옵션 선택...');
    const ocrRadio = page.locator('input[type="radio"][value="ocr"]').first();
    
    if (await ocrRadio.count() > 0) {
      const isVisible = await ocrRadio.isVisible();
      console.log(`   OCR 라디오 버튼 표시 여부: ${isVisible}`);
      
      if (isVisible) {
        await ocrRadio.click();
        console.log('✅ OCR 옵션 선택 완료');
        await page.waitForTimeout(1000);
      } else {
        console.log('⚠️ OCR 라디오 버튼이 보이지 않습니다');
      }
    } else {
      console.log('❌ OCR 라디오 버튼을 찾을 수 없습니다');
      
      // 현재 선택된 옵션 확인
      const selectedRadio = page.locator('input[type="radio"][name="metadataType"]:checked').first();
      if (await selectedRadio.count() > 0) {
        const value = await selectedRadio.getAttribute('value');
        console.log(`   현재 선택된 옵션: ${value}`);
      }
    }

    // 7. 업로드 버튼 클릭
    console.log('7️⃣ 업로드 버튼 클릭...');
    const uploadButton = page.locator('button:has-text("메타데이터 생성 및 업로드"), button:has-text("확인")').first();
    
    if (await uploadButton.count() > 0) {
      await uploadButton.click();
      console.log('✅ 업로드 버튼 클릭 완료');
      
      // 응답 대기 (최대 30초)
      await page.waitForTimeout(30000);
    } else {
      throw new Error('업로드 버튼을 찾을 수 없습니다');
    }

    // 8. 결과 확인
    console.log('\n8️⃣ 결과 확인...');
    console.log(`\n📊 네트워크 요청 개수: ${networkRequests.length}`);
    console.log(`📊 네트워크 오류 개수: ${networkErrors.length}`);
    console.log(`📊 콘솔 로그 개수: ${consoleLogs.length}`);

    if (networkErrors.length > 0) {
      console.log('\n❌ 네트워크 오류 발생:');
      networkErrors.forEach((error, i) => {
        console.log(`\n  오류 ${i + 1}:`);
        console.log(`    URL: ${error.url}`);
        console.log(`    상태: ${error.status} ${error.statusText}`);
        console.log(`    본문: ${error.body.substring(0, 300)}`);
      });
    }

    // 9. 스크린샷 저장
    console.log('\n9️⃣ 스크린샷 저장...');
    await page.screenshot({ 
      path: 'e2e-test/ocr-upload-flow-test-result.png', 
      fullPage: true 
    });

    // 10. 최종 결과 요약
    console.log('\n📋 테스트 결과 요약:');
    const hasOcrRequest = networkRequests.some(r => r.url.includes('extract-document-text'));
    const hasVisionApiRequest = networkRequests.some(r => r.url.includes('vision.googleapis.com'));
    const hasSuccess = networkRequests.some(r => {
      const response = networkErrors.find(e => e.url === r.url);
      return response && response.ok;
    });

    console.log(`  - OCR API 호출: ${hasOcrRequest ? '✅' : '❌'}`);
    console.log(`  - Google Vision API 호출: ${hasVisionApiRequest ? '✅' : '❌'}`);
    console.log(`  - 성공한 요청: ${hasSuccess ? '✅' : '❌'}`);
    console.log(`  - 오류 발생: ${networkErrors.length > 0 ? '❌' : '✅'}`);

    if (networkErrors.length > 0) {
      console.log('\n❌ 테스트 실패: 네트워크 오류 발생');
      throw new Error('OCR 업로드 플로우 테스트 실패');
    } else {
      console.log('\n✅ 테스트 성공!');
    }

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    await page.screenshot({ 
      path: 'e2e-test/ocr-upload-flow-test-error.png', 
      fullPage: true 
    });
    throw error;
  } finally {
    // 브라우저는 수동으로 닫도록
    console.log('\n⏸️ 브라우저를 수동으로 닫아주세요 (테스트 결과 확인용)');
    // await browser.close();
  }
})();
