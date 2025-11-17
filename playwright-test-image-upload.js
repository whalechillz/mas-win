/**
 * Playwright 이미지 업로드 테스트 스크립트
 * 갤러리 페이지에서 이미지 업로드 기능 테스트 및 오류 확인
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const LOCAL_URL = 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

// 테스트용 이미지 파일 생성 (1x1 픽셀 PNG)
function createTestImage() {
  const testImagePath = path.join(__dirname, 'test-image-upload.png');
  
  // 간단한 1x1 픽셀 PNG 이미지 (Base64)
  const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(base64Image, 'base64');
  
  fs.writeFileSync(testImagePath, buffer);
  return testImagePath;
}

async function testImageUpload() {
  console.log('🚀 이미지 업로드 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 디버깅을 위해 느리게 실행
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 네트워크 요청/응답 로깅
  const networkErrors = [];
  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('/api/upload-image-supabase')) {
      console.log(`\n📡 업로드 API 응답: ${url}`);
      console.log(`   상태 코드: ${status}`);
      
      if (status >= 400) {
        networkErrors.push({ url, status });
        console.log(`❌ API 오류: ${url} - ${status}`);
        try {
          const text = await response.text();
          console.log(`   응답 내용: ${text.substring(0, 500)}`);
        } catch (e) {
          console.log(`   응답 읽기 실패: ${e.message}`);
        }
      } else {
        try {
          const json = await response.json();
          console.log(`✅ 업로드 성공:`);
          console.log(`   URL: ${json.url || json.data?.url || 'N/A'}`);
          console.log(`   파일명: ${json.fileName || json.data?.fileName || 'N/A'}`);
        } catch (e) {
          console.log(`   JSON 파싱 실패: ${e.message}`);
        }
      }
    }
  });
  
  // 요청 실패 로깅
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (url.includes('/api/upload-image-supabase')) {
      console.log(`\n❌ 요청 실패: ${url}`);
      console.log(`   실패 이유: ${request.failure()?.errorText || 'Unknown'}`);
      networkErrors.push({ url, error: request.failure()?.errorText });
    }
  });
  
  // 콘솔 로그 캡처
  const consoleErrors = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error') {
      console.log(`🔴 브라우저 콘솔 오류: ${text}`);
      consoleErrors.push(text);
    } else if (text.includes('업로드') || text.includes('upload') || text.includes('❌')) {
      console.log(`📝 콘솔 [${type}]: ${text}`);
    }
  });
  
  // 페이지 오류 캡처
  page.on('pageerror', error => {
    console.log(`🔴 페이지 오류: ${error.message}`);
    consoleErrors.push(error.message);
  });
  
  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto(`${LOCAL_URL}/api/auth/signin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 로그인 폼 찾기
    const phoneInput = await page.locator('input[type="tel"], input[name="phone"], input[name="login"], input[type="text"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인")').first();
    
    if (await phoneInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('   ✅ 로그인 폼 발견');
      await phoneInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      await loginButton.click();
      await page.waitForTimeout(3000);
      
      // 로그인 성공 확인
      try {
        await page.waitForURL('**/admin/**', { timeout: 5000 });
        console.log('   ✅ 로그인 완료');
      } catch (error) {
        console.log('   ⚠️ 로그인 후 리다이렉트 확인 실패, 계속 진행...');
      }
    } else {
      console.log('   ⚠️ 로그인 폼을 찾을 수 없습니다. 이미 로그인되어 있을 수 있습니다.');
    }
    console.log('');
    
    // 2. 갤러리 페이지로 이동
    console.log('2️⃣ 갤러리 페이지로 이동 중...');
    await page.goto(`${LOCAL_URL}/admin/gallery`, { waitUntil: 'domcontentloaded' });
    console.log('   페이지 로드 완료, 폴더 구조 로딩 대기 중...');
    await page.waitForTimeout(5000); // 폴더 구조 로드 대기 (5초)
    console.log('✅ 갤러리 페이지 로드 완료\n');
    
    // 3. "이미지 추가" 버튼 찾기 및 클릭
    console.log('3️⃣ 이미지 추가 모달 열기...');
    const addImageButton = page.locator('button:has-text("이미지 추가"), button:has-text("+ 이미지 추가")').first();
    
    if (await addImageButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      await addImageButton.click();
      console.log('✅ 이미지 추가 버튼 클릭 완료');
    } else {
      console.log('⚠️ 이미지 추가 버튼을 찾을 수 없습니다. 직접 파일 입력 필드 찾기 시도...');
    }
    
    // 4. 파일 업로드 모달이 열릴 때까지 대기
    console.log('   모달 열림 대기 중...');
    await page.waitForTimeout(2000); // 모달 애니메이션 대기
    
    // 5. 파일 입력 필드 찾기
    console.log('4️⃣ 파일 입력 필드 찾기...');
    const fileInput = page.locator('input[type="file"][accept*="image"]').first();
    
    if (await fileInput.isVisible({ timeout: 10000 }).catch(() => false)) {
      console.log('✅ 파일 입력 필드 찾음');
    } else {
      // 숨겨진 파일 입력 필드일 수 있음
      const hiddenFileInput = page.locator('input[type="file"]').first();
      if (await hiddenFileInput.count() > 0) {
        console.log('✅ 숨겨진 파일 입력 필드 찾음');
      } else {
        console.log('❌ 파일 입력 필드를 찾을 수 없습니다.');
        throw new Error('파일 입력 필드를 찾을 수 없습니다.');
      }
    }
    
    // 6. 테스트 이미지 파일 생성
    console.log('5️⃣ 테스트 이미지 파일 생성...');
    const testImagePath = createTestImage();
    console.log(`✅ 테스트 이미지 생성 완료: ${testImagePath}\n`);
    
    // 7. 파일 업로드
    console.log('6️⃣ 파일 업로드 시작...');
    const fileInputSelector = 'input[type="file"][accept*="image"], input[type="file"]';
    await page.setInputFiles(fileInputSelector, testImagePath);
    console.log('✅ 파일 선택 완료');
    
    // 8. 업로드 완료 대기 (최대 30초)
    console.log('7️⃣ 업로드 완료 대기 중...');
    let uploadCompleted = false;
    let uploadError = null;
    
    // 성공 메시지 또는 에러 메시지 대기
    try {
      // alert 대기 (업로드 완료 또는 실패)
      page.on('dialog', async dialog => {
        const message = dialog.message();
        console.log(`\n💬 Alert 메시지: ${message}`);
        if (message.includes('완료') || message.includes('성공')) {
          uploadCompleted = true;
        } else if (message.includes('실패') || message.includes('오류') || message.includes('에러')) {
          uploadError = message;
        }
        await dialog.accept();
      });
      
      // 네트워크 응답으로 업로드 완료 확인
      await page.waitForResponse(
        response => response.url().includes('/api/upload-image-supabase') && response.status() < 400,
        { timeout: 30000 }
      ).then(() => {
        uploadCompleted = true;
        console.log('✅ 업로드 API 응답 수신 (성공)');
      }).catch(() => {
        console.log('⚠️ 업로드 API 성공 응답을 받지 못했습니다.');
      });
      
      // 추가 대기 (이미지 목록 새로고침 등)
      console.log('   이미지 목록 새로고침 대기 중...');
      await page.waitForTimeout(5000); // 폴더 구조 및 이미지 목록 로드 대기 (5초)
      
    } catch (error) {
      console.log(`⚠️ 업로드 대기 중 오류: ${error.message}`);
    }
    
    // 9. 결과 확인
    console.log('\n8️⃣ 결과 확인...');
    console.log(`   업로드 완료: ${uploadCompleted ? '✅' : '❌'}`);
    console.log(`   네트워크 오류: ${networkErrors.length}개`);
    console.log(`   콘솔 오류: ${consoleErrors.length}개`);
    
    if (uploadError) {
      console.log(`   업로드 에러 메시지: ${uploadError}`);
    }
    
    if (networkErrors.length > 0) {
      console.log('\n❌ 네트워크 오류 상세:');
      networkErrors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.url} - ${err.status || err.error}`);
      });
    }
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ 콘솔 오류 상세:');
      consoleErrors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err}`);
      });
    }
    
    // 10. 스크린샷 저장
    const screenshotPath = path.join(__dirname, 'playwright-upload-test-result.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 스크린샷 저장: ${screenshotPath}`);
    
    // 11. 최종 결과
    if (uploadCompleted && networkErrors.length === 0 && consoleErrors.length === 0) {
      console.log('\n✅ 이미지 업로드 테스트 성공!');
      return { success: true };
    } else {
      console.log('\n❌ 이미지 업로드 테스트 실패 또는 오류 발생');
      return { 
        success: false, 
        networkErrors, 
        consoleErrors,
        uploadError 
      };
    }
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    const screenshotPath = path.join(__dirname, 'playwright-upload-test-error.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 에러 스크린샷 저장: ${screenshotPath}`);
    throw error;
  } finally {
    // 테스트 이미지 파일 정리
    const testImagePath = path.join(__dirname, 'test-image-upload.png');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
    await browser.close();
  }
}

// 테스트 실행
testImageUpload()
  .then(result => {
    console.log('\n📊 테스트 결과:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 테스트 실패:', error);
    process.exit(1);
  });

