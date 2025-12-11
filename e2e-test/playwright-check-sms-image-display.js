const { chromium } = require('playwright');

const LOCAL_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function checkSMSImageDisplay() {
  console.log('🔍 SMS 이미지 표시 확인 테스트 시작...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  const errors = [];
  const consoleLogs = [];
  const networkErrors = [];

  // 콘솔 로그 수집
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
    
    if (type === 'error') {
      errors.push(text);
      console.log(`🔴 콘솔 오류: ${text}`);
    } else if (text.includes('AIImagePicker') || text.includes('이미지')) {
      console.log(`📝 ${type}: ${text}`);
    }
  });

  // 네트워크 오류 수집
  page.on('response', response => {
    const url = response.url();
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
      if (!response.ok()) {
        networkErrors.push({
          url: url.substring(0, 100),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`❌ 이미지 로드 실패: ${response.status} ${url.substring(0, 80)}...`);
      }
    }
  });

  try {
    // ==========================================
    // 1단계: 로그인
    // ==========================================
    console.log('📄 1단계: 관리자 로그인...');
    await page.goto(`${LOCAL_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/login')) {
      console.log('   ✅ 이미 로그인되어 있음');
    } else {
      const loginInput = await page.locator('input[name="login"]').first();
      const passwordInput = await page.locator('input[name="password"]').first();
      const submitButton = await page.locator('button[type="submit"]').first();

      if (await loginInput.isVisible({ timeout: 3000 })) {
        await loginInput.fill(ADMIN_LOGIN);
        await passwordInput.fill(ADMIN_PASSWORD);
        await page.waitForTimeout(1000);
        await submitButton.click();
        await page.waitForTimeout(3000);
        console.log('   ✅ 로그인 완료');
      } else {
        throw new Error('로그인 입력 필드를 찾을 수 없습니다.');
      }
    }

    // ==========================================
    // 2단계: SMS 관리 페이지로 이동
    // ==========================================
    console.log('\n📋 2단계: SMS 관리 페이지로 이동...');
    await page.goto(`${LOCAL_URL}/admin/sms`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // MMS 타입 선택 확인
    console.log('\n🔍 3단계: MMS 타입 확인...');
    const mmsButton = page.locator('button:has-text("MMS"), button:has-text("2000자")').first();
    if (await mmsButton.isVisible({ timeout: 5000 })) {
      const isSelected = await mmsButton.evaluate(el => {
        return el.classList.contains('bg-blue') || 
               el.classList.contains('border-blue') ||
               getComputedStyle(el).borderColor.includes('blue');
      });
      
      if (!isSelected) {
        console.log('   MMS 버튼 클릭...');
        await mmsButton.click();
        await page.waitForTimeout(2000);
      }
      console.log('   ✅ MMS 타입 선택됨');
    }

    // ==========================================
    // 4단계: 이미지 선택 영역 확인
    // ==========================================
    console.log('\n🖼️ 4단계: 이미지 선택 영역 확인...');
    
    // "이미지 선택" 또는 "선택된 이미지" 텍스트 찾기
    const imageSection = page.locator('text=이미지 선택, text=선택된 이미지').first();
    
    if (await imageSection.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 이미지 선택 영역 발견');
      
      // 이미지 요소 찾기
      const imageElement = page.locator('img[alt="선택된 이미지"]').first();
      
      if (await imageElement.isVisible({ timeout: 3000 })) {
        console.log('   ✅ 이미지 요소 발견');
        
        // 이미지 src 확인
        const imageSrc = await imageElement.getAttribute('src');
        console.log(`   이미지 URL: ${imageSrc ? imageSrc.substring(0, 100) : '(없음)'}`);
        
        // 이미지 로드 상태 확인
        const imageLoaded = await imageElement.evaluate((img) => {
          return img.complete && img.naturalHeight !== 0;
        });
        
        if (imageLoaded) {
          console.log('   ✅ 이미지가 정상적으로 로드됨');
          
          // 이미지 크기 확인
          const imageSize = await imageElement.evaluate((img) => {
            return {
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              clientWidth: img.clientWidth,
              clientHeight: img.clientHeight
            };
          });
          console.log(`   이미지 크기: ${imageSize.naturalWidth}x${imageSize.naturalHeight} (표시: ${imageSize.clientWidth}x${imageSize.clientHeight})`);
        } else {
          console.log('   ⚠️ 이미지가 로드되지 않음');
          
          // 에러 상태 확인
          const hasError = await imageElement.evaluate((img) => {
            return img.style.display === 'none' || 
                   img.offsetWidth === 0 || 
                   img.offsetHeight === 0;
          });
          
          if (hasError) {
            console.log('   ❌ 이미지 로드 오류 감지');
          }
        }
      } else {
        console.log('   ⚠️ 이미지 요소를 찾을 수 없음');
        
        // "선택된 이미지" 텍스트만 있는지 확인
        const selectedImageText = page.locator('text=선택된 이미지').first();
        if (await selectedImageText.isVisible({ timeout: 2000 })) {
          console.log('   ❌ "선택된 이미지" 텍스트만 보이고 이미지는 없음');
          
          // 플레이스홀더나 에러 메시지 확인
          const errorMessage = page.locator('text=이미지를 불러올 수 없습니다, text=이미지 로드 실패').first();
          if (await errorMessage.isVisible({ timeout: 1000 })) {
            console.log('   ✅ 에러 메시지 표시됨 (개선된 UI 작동 중)');
          }
        }
      }
    } else {
      console.log('   ⚠️ 이미지 선택 영역을 찾을 수 없음');
    }

    // ==========================================
    // 5단계: 콘솔 로그 분석
    // ==========================================
    console.log('\n📊 5단계: 콘솔 로그 분석...');
    const imageLogs = consoleLogs.filter(log => 
      log.text.includes('AIImagePicker') || 
      log.text.includes('이미지') ||
      log.text.includes('image')
    );
    
    console.log(`   발견된 이미지 관련 로그: ${imageLogs.length}개`);
    imageLogs.forEach(log => {
      console.log(`   [${log.type}] ${log.text.substring(0, 100)}`);
    });

    // ==========================================
    // 6단계: 스크린샷 저장
    // ==========================================
    console.log('\n📸 6단계: 스크린샷 저장...');
    await page.screenshot({
      path: 'e2e-test/screenshots/sms-image-display-check.png',
      fullPage: true
    });
    console.log('   ✅ 스크린샷 저장: e2e-test/screenshots/sms-image-display-check.png');

    // 이미지 영역만 스크린샷
    const imageSectionElement = page.locator('text=이미지 선택, text=선택된 이미지').first();
    if (await imageSectionElement.isVisible({ timeout: 3000 })) {
      const boundingBox = await imageSectionElement.boundingBox();
      if (boundingBox) {
        await page.screenshot({
          path: 'e2e-test/screenshots/sms-image-section.png',
          clip: {
            x: boundingBox.x - 20,
            y: boundingBox.y - 20,
            width: boundingBox.width + 40,
            height: Math.min(boundingBox.height + 400, 800)
          }
        });
        console.log('   ✅ 이미지 영역 스크린샷 저장: e2e-test/screenshots/sms-image-section.png');
      }
    }

    // ==========================================
    // 7단계: 결과 요약
    // ==========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과 요약:');
    console.log(`   - 콘솔 오류: ${errors.length}개`);
    console.log(`   - 네트워크 오류: ${networkErrors.length}개`);
    console.log(`   - 이미지 관련 로그: ${imageLogs.length}개`);
    console.log('='.repeat(60));

    if (networkErrors.length > 0) {
      console.log('\n❌ 네트워크 오류:');
      networkErrors.forEach(err => {
        console.log(`   - ${err.status} ${err.statusText}: ${err.url}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ 콘솔 오류:');
      errors.forEach(err => {
        console.log(`   - ${err}`);
      });
    }

    console.log('\n✅ 테스트 완료');
    console.log('\n📱 다음 단계:');
    console.log('   1. 스크린샷 확인: e2e-test/screenshots/sms-image-display-check.png');
    console.log('   2. 콘솔 로그에서 이미지 URL 확인');
    console.log('   3. Network 탭에서 이미지 요청 상태 확인');

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({
      path: 'e2e-test/screenshots/sms-image-display-check-error.png',
      fullPage: true
    });
    process.exit(1);
  } finally {
    // 브라우저는 수동으로 닫도록 유지 (확인용)
    console.log('\n⏸️ 브라우저를 열어둡니다. 확인 후 수동으로 닫아주세요.');
    // await browser.close();
  }
}

checkSMSImageDisplay();


const LOCAL_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function checkSMSImageDisplay() {
  console.log('🔍 SMS 이미지 표시 확인 테스트 시작...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  const errors = [];
  const consoleLogs = [];
  const networkErrors = [];

  // 콘솔 로그 수집
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
    
    if (type === 'error') {
      errors.push(text);
      console.log(`🔴 콘솔 오류: ${text}`);
    } else if (text.includes('AIImagePicker') || text.includes('이미지')) {
      console.log(`📝 ${type}: ${text}`);
    }
  });

  // 네트워크 오류 수집
  page.on('response', response => {
    const url = response.url();
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
      if (!response.ok()) {
        networkErrors.push({
          url: url.substring(0, 100),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`❌ 이미지 로드 실패: ${response.status} ${url.substring(0, 80)}...`);
      }
    }
  });

  try {
    // ==========================================
    // 1단계: 로그인
    // ==========================================
    console.log('📄 1단계: 관리자 로그인...');
    await page.goto(`${LOCAL_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/login')) {
      console.log('   ✅ 이미 로그인되어 있음');
    } else {
      const loginInput = await page.locator('input[name="login"]').first();
      const passwordInput = await page.locator('input[name="password"]').first();
      const submitButton = await page.locator('button[type="submit"]').first();

      if (await loginInput.isVisible({ timeout: 3000 })) {
        await loginInput.fill(ADMIN_LOGIN);
        await passwordInput.fill(ADMIN_PASSWORD);
        await page.waitForTimeout(1000);
        await submitButton.click();
        await page.waitForTimeout(3000);
        console.log('   ✅ 로그인 완료');
      } else {
        throw new Error('로그인 입력 필드를 찾을 수 없습니다.');
      }
    }

    // ==========================================
    // 2단계: SMS 관리 페이지로 이동
    // ==========================================
    console.log('\n📋 2단계: SMS 관리 페이지로 이동...');
    await page.goto(`${LOCAL_URL}/admin/sms`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // MMS 타입 선택 확인
    console.log('\n🔍 3단계: MMS 타입 확인...');
    const mmsButton = page.locator('button:has-text("MMS"), button:has-text("2000자")').first();
    if (await mmsButton.isVisible({ timeout: 5000 })) {
      const isSelected = await mmsButton.evaluate(el => {
        return el.classList.contains('bg-blue') || 
               el.classList.contains('border-blue') ||
               getComputedStyle(el).borderColor.includes('blue');
      });
      
      if (!isSelected) {
        console.log('   MMS 버튼 클릭...');
        await mmsButton.click();
        await page.waitForTimeout(2000);
      }
      console.log('   ✅ MMS 타입 선택됨');
    }

    // ==========================================
    // 4단계: 이미지 선택 영역 확인
    // ==========================================
    console.log('\n🖼️ 4단계: 이미지 선택 영역 확인...');
    
    // "이미지 선택" 또는 "선택된 이미지" 텍스트 찾기
    const imageSection = page.locator('text=이미지 선택, text=선택된 이미지').first();
    
    if (await imageSection.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 이미지 선택 영역 발견');
      
      // 이미지 요소 찾기
      const imageElement = page.locator('img[alt="선택된 이미지"]').first();
      
      if (await imageElement.isVisible({ timeout: 3000 })) {
        console.log('   ✅ 이미지 요소 발견');
        
        // 이미지 src 확인
        const imageSrc = await imageElement.getAttribute('src');
        console.log(`   이미지 URL: ${imageSrc ? imageSrc.substring(0, 100) : '(없음)'}`);
        
        // 이미지 로드 상태 확인
        const imageLoaded = await imageElement.evaluate((img) => {
          return img.complete && img.naturalHeight !== 0;
        });
        
        if (imageLoaded) {
          console.log('   ✅ 이미지가 정상적으로 로드됨');
          
          // 이미지 크기 확인
          const imageSize = await imageElement.evaluate((img) => {
            return {
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              clientWidth: img.clientWidth,
              clientHeight: img.clientHeight
            };
          });
          console.log(`   이미지 크기: ${imageSize.naturalWidth}x${imageSize.naturalHeight} (표시: ${imageSize.clientWidth}x${imageSize.clientHeight})`);
        } else {
          console.log('   ⚠️ 이미지가 로드되지 않음');
          
          // 에러 상태 확인
          const hasError = await imageElement.evaluate((img) => {
            return img.style.display === 'none' || 
                   img.offsetWidth === 0 || 
                   img.offsetHeight === 0;
          });
          
          if (hasError) {
            console.log('   ❌ 이미지 로드 오류 감지');
          }
        }
      } else {
        console.log('   ⚠️ 이미지 요소를 찾을 수 없음');
        
        // "선택된 이미지" 텍스트만 있는지 확인
        const selectedImageText = page.locator('text=선택된 이미지').first();
        if (await selectedImageText.isVisible({ timeout: 2000 })) {
          console.log('   ❌ "선택된 이미지" 텍스트만 보이고 이미지는 없음');
          
          // 플레이스홀더나 에러 메시지 확인
          const errorMessage = page.locator('text=이미지를 불러올 수 없습니다, text=이미지 로드 실패').first();
          if (await errorMessage.isVisible({ timeout: 1000 })) {
            console.log('   ✅ 에러 메시지 표시됨 (개선된 UI 작동 중)');
          }
        }
      }
    } else {
      console.log('   ⚠️ 이미지 선택 영역을 찾을 수 없음');
    }

    // ==========================================
    // 5단계: 콘솔 로그 분석
    // ==========================================
    console.log('\n📊 5단계: 콘솔 로그 분석...');
    const imageLogs = consoleLogs.filter(log => 
      log.text.includes('AIImagePicker') || 
      log.text.includes('이미지') ||
      log.text.includes('image')
    );
    
    console.log(`   발견된 이미지 관련 로그: ${imageLogs.length}개`);
    imageLogs.forEach(log => {
      console.log(`   [${log.type}] ${log.text.substring(0, 100)}`);
    });

    // ==========================================
    // 6단계: 스크린샷 저장
    // ==========================================
    console.log('\n📸 6단계: 스크린샷 저장...');
    await page.screenshot({
      path: 'e2e-test/screenshots/sms-image-display-check.png',
      fullPage: true
    });
    console.log('   ✅ 스크린샷 저장: e2e-test/screenshots/sms-image-display-check.png');

    // 이미지 영역만 스크린샷
    const imageSectionElement = page.locator('text=이미지 선택, text=선택된 이미지').first();
    if (await imageSectionElement.isVisible({ timeout: 3000 })) {
      const boundingBox = await imageSectionElement.boundingBox();
      if (boundingBox) {
        await page.screenshot({
          path: 'e2e-test/screenshots/sms-image-section.png',
          clip: {
            x: boundingBox.x - 20,
            y: boundingBox.y - 20,
            width: boundingBox.width + 40,
            height: Math.min(boundingBox.height + 400, 800)
          }
        });
        console.log('   ✅ 이미지 영역 스크린샷 저장: e2e-test/screenshots/sms-image-section.png');
      }
    }

    // ==========================================
    // 7단계: 결과 요약
    // ==========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과 요약:');
    console.log(`   - 콘솔 오류: ${errors.length}개`);
    console.log(`   - 네트워크 오류: ${networkErrors.length}개`);
    console.log(`   - 이미지 관련 로그: ${imageLogs.length}개`);
    console.log('='.repeat(60));

    if (networkErrors.length > 0) {
      console.log('\n❌ 네트워크 오류:');
      networkErrors.forEach(err => {
        console.log(`   - ${err.status} ${err.statusText}: ${err.url}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ 콘솔 오류:');
      errors.forEach(err => {
        console.log(`   - ${err}`);
      });
    }

    console.log('\n✅ 테스트 완료');
    console.log('\n📱 다음 단계:');
    console.log('   1. 스크린샷 확인: e2e-test/screenshots/sms-image-display-check.png');
    console.log('   2. 콘솔 로그에서 이미지 URL 확인');
    console.log('   3. Network 탭에서 이미지 요청 상태 확인');

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({
      path: 'e2e-test/screenshots/sms-image-display-check-error.png',
      fullPage: true
    });
    process.exit(1);
  } finally {
    // 브라우저는 수동으로 닫도록 유지 (확인용)
    console.log('\n⏸️ 브라우저를 열어둡니다. 확인 후 수동으로 닫아주세요.');
    // await browser.close();
  }
}

checkSMSImageDisplay();


const LOCAL_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function checkSMSImageDisplay() {
  console.log('🔍 SMS 이미지 표시 확인 테스트 시작...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  const errors = [];
  const consoleLogs = [];
  const networkErrors = [];

  // 콘솔 로그 수집
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
    
    if (type === 'error') {
      errors.push(text);
      console.log(`🔴 콘솔 오류: ${text}`);
    } else if (text.includes('AIImagePicker') || text.includes('이미지')) {
      console.log(`📝 ${type}: ${text}`);
    }
  });

  // 네트워크 오류 수집
  page.on('response', response => {
    const url = response.url();
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
      if (!response.ok()) {
        networkErrors.push({
          url: url.substring(0, 100),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`❌ 이미지 로드 실패: ${response.status} ${url.substring(0, 80)}...`);
      }
    }
  });

  try {
    // ==========================================
    // 1단계: 로그인
    // ==========================================
    console.log('📄 1단계: 관리자 로그인...');
    await page.goto(`${LOCAL_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/login')) {
      console.log('   ✅ 이미 로그인되어 있음');
    } else {
      const loginInput = await page.locator('input[name="login"]').first();
      const passwordInput = await page.locator('input[name="password"]').first();
      const submitButton = await page.locator('button[type="submit"]').first();

      if (await loginInput.isVisible({ timeout: 3000 })) {
        await loginInput.fill(ADMIN_LOGIN);
        await passwordInput.fill(ADMIN_PASSWORD);
        await page.waitForTimeout(1000);
        await submitButton.click();
        await page.waitForTimeout(3000);
        console.log('   ✅ 로그인 완료');
      } else {
        throw new Error('로그인 입력 필드를 찾을 수 없습니다.');
      }
    }

    // ==========================================
    // 2단계: SMS 관리 페이지로 이동
    // ==========================================
    console.log('\n📋 2단계: SMS 관리 페이지로 이동...');
    await page.goto(`${LOCAL_URL}/admin/sms`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // MMS 타입 선택 확인
    console.log('\n🔍 3단계: MMS 타입 확인...');
    const mmsButton = page.locator('button:has-text("MMS"), button:has-text("2000자")').first();
    if (await mmsButton.isVisible({ timeout: 5000 })) {
      const isSelected = await mmsButton.evaluate(el => {
        return el.classList.contains('bg-blue') || 
               el.classList.contains('border-blue') ||
               getComputedStyle(el).borderColor.includes('blue');
      });
      
      if (!isSelected) {
        console.log('   MMS 버튼 클릭...');
        await mmsButton.click();
        await page.waitForTimeout(2000);
      }
      console.log('   ✅ MMS 타입 선택됨');
    }

    // ==========================================
    // 4단계: 이미지 선택 영역 확인
    // ==========================================
    console.log('\n🖼️ 4단계: 이미지 선택 영역 확인...');
    
    // "이미지 선택" 또는 "선택된 이미지" 텍스트 찾기
    const imageSection = page.locator('text=이미지 선택, text=선택된 이미지').first();
    
    if (await imageSection.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 이미지 선택 영역 발견');
      
      // 이미지 요소 찾기
      const imageElement = page.locator('img[alt="선택된 이미지"]').first();
      
      if (await imageElement.isVisible({ timeout: 3000 })) {
        console.log('   ✅ 이미지 요소 발견');
        
        // 이미지 src 확인
        const imageSrc = await imageElement.getAttribute('src');
        console.log(`   이미지 URL: ${imageSrc ? imageSrc.substring(0, 100) : '(없음)'}`);
        
        // 이미지 로드 상태 확인
        const imageLoaded = await imageElement.evaluate((img) => {
          return img.complete && img.naturalHeight !== 0;
        });
        
        if (imageLoaded) {
          console.log('   ✅ 이미지가 정상적으로 로드됨');
          
          // 이미지 크기 확인
          const imageSize = await imageElement.evaluate((img) => {
            return {
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              clientWidth: img.clientWidth,
              clientHeight: img.clientHeight
            };
          });
          console.log(`   이미지 크기: ${imageSize.naturalWidth}x${imageSize.naturalHeight} (표시: ${imageSize.clientWidth}x${imageSize.clientHeight})`);
        } else {
          console.log('   ⚠️ 이미지가 로드되지 않음');
          
          // 에러 상태 확인
          const hasError = await imageElement.evaluate((img) => {
            return img.style.display === 'none' || 
                   img.offsetWidth === 0 || 
                   img.offsetHeight === 0;
          });
          
          if (hasError) {
            console.log('   ❌ 이미지 로드 오류 감지');
          }
        }
      } else {
        console.log('   ⚠️ 이미지 요소를 찾을 수 없음');
        
        // "선택된 이미지" 텍스트만 있는지 확인
        const selectedImageText = page.locator('text=선택된 이미지').first();
        if (await selectedImageText.isVisible({ timeout: 2000 })) {
          console.log('   ❌ "선택된 이미지" 텍스트만 보이고 이미지는 없음');
          
          // 플레이스홀더나 에러 메시지 확인
          const errorMessage = page.locator('text=이미지를 불러올 수 없습니다, text=이미지 로드 실패').first();
          if (await errorMessage.isVisible({ timeout: 1000 })) {
            console.log('   ✅ 에러 메시지 표시됨 (개선된 UI 작동 중)');
          }
        }
      }
    } else {
      console.log('   ⚠️ 이미지 선택 영역을 찾을 수 없음');
    }

    // ==========================================
    // 5단계: 콘솔 로그 분석
    // ==========================================
    console.log('\n📊 5단계: 콘솔 로그 분석...');
    const imageLogs = consoleLogs.filter(log => 
      log.text.includes('AIImagePicker') || 
      log.text.includes('이미지') ||
      log.text.includes('image')
    );
    
    console.log(`   발견된 이미지 관련 로그: ${imageLogs.length}개`);
    imageLogs.forEach(log => {
      console.log(`   [${log.type}] ${log.text.substring(0, 100)}`);
    });

    // ==========================================
    // 6단계: 스크린샷 저장
    // ==========================================
    console.log('\n📸 6단계: 스크린샷 저장...');
    await page.screenshot({
      path: 'e2e-test/screenshots/sms-image-display-check.png',
      fullPage: true
    });
    console.log('   ✅ 스크린샷 저장: e2e-test/screenshots/sms-image-display-check.png');

    // 이미지 영역만 스크린샷
    const imageSectionElement = page.locator('text=이미지 선택, text=선택된 이미지').first();
    if (await imageSectionElement.isVisible({ timeout: 3000 })) {
      const boundingBox = await imageSectionElement.boundingBox();
      if (boundingBox) {
        await page.screenshot({
          path: 'e2e-test/screenshots/sms-image-section.png',
          clip: {
            x: boundingBox.x - 20,
            y: boundingBox.y - 20,
            width: boundingBox.width + 40,
            height: Math.min(boundingBox.height + 400, 800)
          }
        });
        console.log('   ✅ 이미지 영역 스크린샷 저장: e2e-test/screenshots/sms-image-section.png');
      }
    }

    // ==========================================
    // 7단계: 결과 요약
    // ==========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과 요약:');
    console.log(`   - 콘솔 오류: ${errors.length}개`);
    console.log(`   - 네트워크 오류: ${networkErrors.length}개`);
    console.log(`   - 이미지 관련 로그: ${imageLogs.length}개`);
    console.log('='.repeat(60));

    if (networkErrors.length > 0) {
      console.log('\n❌ 네트워크 오류:');
      networkErrors.forEach(err => {
        console.log(`   - ${err.status} ${err.statusText}: ${err.url}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ 콘솔 오류:');
      errors.forEach(err => {
        console.log(`   - ${err}`);
      });
    }

    console.log('\n✅ 테스트 완료');
    console.log('\n📱 다음 단계:');
    console.log('   1. 스크린샷 확인: e2e-test/screenshots/sms-image-display-check.png');
    console.log('   2. 콘솔 로그에서 이미지 URL 확인');
    console.log('   3. Network 탭에서 이미지 요청 상태 확인');

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({
      path: 'e2e-test/screenshots/sms-image-display-check-error.png',
      fullPage: true
    });
    process.exit(1);
  } finally {
    // 브라우저는 수동으로 닫도록 유지 (확인용)
    console.log('\n⏸️ 브라우저를 열어둡니다. 확인 후 수동으로 닫아주세요.');
    // await browser.close();
  }
}

checkSMSImageDisplay();


const LOCAL_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function checkSMSImageDisplay() {
  console.log('🔍 SMS 이미지 표시 확인 테스트 시작...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  const errors = [];
  const consoleLogs = [];
  const networkErrors = [];

  // 콘솔 로그 수집
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
    
    if (type === 'error') {
      errors.push(text);
      console.log(`🔴 콘솔 오류: ${text}`);
    } else if (text.includes('AIImagePicker') || text.includes('이미지')) {
      console.log(`📝 ${type}: ${text}`);
    }
  });

  // 네트워크 오류 수집
  page.on('response', response => {
    const url = response.url();
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
      if (!response.ok()) {
        networkErrors.push({
          url: url.substring(0, 100),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`❌ 이미지 로드 실패: ${response.status} ${url.substring(0, 80)}...`);
      }
    }
  });

  try {
    // ==========================================
    // 1단계: 로그인
    // ==========================================
    console.log('📄 1단계: 관리자 로그인...');
    await page.goto(`${LOCAL_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/login')) {
      console.log('   ✅ 이미 로그인되어 있음');
    } else {
      const loginInput = await page.locator('input[name="login"]').first();
      const passwordInput = await page.locator('input[name="password"]').first();
      const submitButton = await page.locator('button[type="submit"]').first();

      if (await loginInput.isVisible({ timeout: 3000 })) {
        await loginInput.fill(ADMIN_LOGIN);
        await passwordInput.fill(ADMIN_PASSWORD);
        await page.waitForTimeout(1000);
        await submitButton.click();
        await page.waitForTimeout(3000);
        console.log('   ✅ 로그인 완료');
      } else {
        throw new Error('로그인 입력 필드를 찾을 수 없습니다.');
      }
    }

    // ==========================================
    // 2단계: SMS 관리 페이지로 이동
    // ==========================================
    console.log('\n📋 2단계: SMS 관리 페이지로 이동...');
    await page.goto(`${LOCAL_URL}/admin/sms`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // MMS 타입 선택 확인
    console.log('\n🔍 3단계: MMS 타입 확인...');
    const mmsButton = page.locator('button:has-text("MMS"), button:has-text("2000자")').first();
    if (await mmsButton.isVisible({ timeout: 5000 })) {
      const isSelected = await mmsButton.evaluate(el => {
        return el.classList.contains('bg-blue') || 
               el.classList.contains('border-blue') ||
               getComputedStyle(el).borderColor.includes('blue');
      });
      
      if (!isSelected) {
        console.log('   MMS 버튼 클릭...');
        await mmsButton.click();
        await page.waitForTimeout(2000);
      }
      console.log('   ✅ MMS 타입 선택됨');
    }

    // ==========================================
    // 4단계: 이미지 선택 영역 확인
    // ==========================================
    console.log('\n🖼️ 4단계: 이미지 선택 영역 확인...');
    
    // "이미지 선택" 또는 "선택된 이미지" 텍스트 찾기
    const imageSection = page.locator('text=이미지 선택, text=선택된 이미지').first();
    
    if (await imageSection.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 이미지 선택 영역 발견');
      
      // 이미지 요소 찾기
      const imageElement = page.locator('img[alt="선택된 이미지"]').first();
      
      if (await imageElement.isVisible({ timeout: 3000 })) {
        console.log('   ✅ 이미지 요소 발견');
        
        // 이미지 src 확인
        const imageSrc = await imageElement.getAttribute('src');
        console.log(`   이미지 URL: ${imageSrc ? imageSrc.substring(0, 100) : '(없음)'}`);
        
        // 이미지 로드 상태 확인
        const imageLoaded = await imageElement.evaluate((img) => {
          return img.complete && img.naturalHeight !== 0;
        });
        
        if (imageLoaded) {
          console.log('   ✅ 이미지가 정상적으로 로드됨');
          
          // 이미지 크기 확인
          const imageSize = await imageElement.evaluate((img) => {
            return {
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              clientWidth: img.clientWidth,
              clientHeight: img.clientHeight
            };
          });
          console.log(`   이미지 크기: ${imageSize.naturalWidth}x${imageSize.naturalHeight} (표시: ${imageSize.clientWidth}x${imageSize.clientHeight})`);
        } else {
          console.log('   ⚠️ 이미지가 로드되지 않음');
          
          // 에러 상태 확인
          const hasError = await imageElement.evaluate((img) => {
            return img.style.display === 'none' || 
                   img.offsetWidth === 0 || 
                   img.offsetHeight === 0;
          });
          
          if (hasError) {
            console.log('   ❌ 이미지 로드 오류 감지');
          }
        }
      } else {
        console.log('   ⚠️ 이미지 요소를 찾을 수 없음');
        
        // "선택된 이미지" 텍스트만 있는지 확인
        const selectedImageText = page.locator('text=선택된 이미지').first();
        if (await selectedImageText.isVisible({ timeout: 2000 })) {
          console.log('   ❌ "선택된 이미지" 텍스트만 보이고 이미지는 없음');
          
          // 플레이스홀더나 에러 메시지 확인
          const errorMessage = page.locator('text=이미지를 불러올 수 없습니다, text=이미지 로드 실패').first();
          if (await errorMessage.isVisible({ timeout: 1000 })) {
            console.log('   ✅ 에러 메시지 표시됨 (개선된 UI 작동 중)');
          }
        }
      }
    } else {
      console.log('   ⚠️ 이미지 선택 영역을 찾을 수 없음');
    }

    // ==========================================
    // 5단계: 콘솔 로그 분석
    // ==========================================
    console.log('\n📊 5단계: 콘솔 로그 분석...');
    const imageLogs = consoleLogs.filter(log => 
      log.text.includes('AIImagePicker') || 
      log.text.includes('이미지') ||
      log.text.includes('image')
    );
    
    console.log(`   발견된 이미지 관련 로그: ${imageLogs.length}개`);
    imageLogs.forEach(log => {
      console.log(`   [${log.type}] ${log.text.substring(0, 100)}`);
    });

    // ==========================================
    // 6단계: 스크린샷 저장
    // ==========================================
    console.log('\n📸 6단계: 스크린샷 저장...');
    await page.screenshot({
      path: 'e2e-test/screenshots/sms-image-display-check.png',
      fullPage: true
    });
    console.log('   ✅ 스크린샷 저장: e2e-test/screenshots/sms-image-display-check.png');

    // 이미지 영역만 스크린샷
    const imageSectionElement = page.locator('text=이미지 선택, text=선택된 이미지').first();
    if (await imageSectionElement.isVisible({ timeout: 3000 })) {
      const boundingBox = await imageSectionElement.boundingBox();
      if (boundingBox) {
        await page.screenshot({
          path: 'e2e-test/screenshots/sms-image-section.png',
          clip: {
            x: boundingBox.x - 20,
            y: boundingBox.y - 20,
            width: boundingBox.width + 40,
            height: Math.min(boundingBox.height + 400, 800)
          }
        });
        console.log('   ✅ 이미지 영역 스크린샷 저장: e2e-test/screenshots/sms-image-section.png');
      }
    }

    // ==========================================
    // 7단계: 결과 요약
    // ==========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과 요약:');
    console.log(`   - 콘솔 오류: ${errors.length}개`);
    console.log(`   - 네트워크 오류: ${networkErrors.length}개`);
    console.log(`   - 이미지 관련 로그: ${imageLogs.length}개`);
    console.log('='.repeat(60));

    if (networkErrors.length > 0) {
      console.log('\n❌ 네트워크 오류:');
      networkErrors.forEach(err => {
        console.log(`   - ${err.status} ${err.statusText}: ${err.url}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ 콘솔 오류:');
      errors.forEach(err => {
        console.log(`   - ${err}`);
      });
    }

    console.log('\n✅ 테스트 완료');
    console.log('\n📱 다음 단계:');
    console.log('   1. 스크린샷 확인: e2e-test/screenshots/sms-image-display-check.png');
    console.log('   2. 콘솔 로그에서 이미지 URL 확인');
    console.log('   3. Network 탭에서 이미지 요청 상태 확인');

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({
      path: 'e2e-test/screenshots/sms-image-display-check-error.png',
      fullPage: true
    });
    process.exit(1);
  } finally {
    // 브라우저는 수동으로 닫도록 유지 (확인용)
    console.log('\n⏸️ 브라우저를 열어둡니다. 확인 후 수동으로 닫아주세요.');
    // await browser.close();
  }
}

checkSMSImageDisplay();


const LOCAL_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function checkSMSImageDisplay() {
  console.log('🔍 SMS 이미지 표시 확인 테스트 시작...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  const errors = [];
  const consoleLogs = [];
  const networkErrors = [];

  // 콘솔 로그 수집
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
    
    if (type === 'error') {
      errors.push(text);
      console.log(`🔴 콘솔 오류: ${text}`);
    } else if (text.includes('AIImagePicker') || text.includes('이미지')) {
      console.log(`📝 ${type}: ${text}`);
    }
  });

  // 네트워크 오류 수집
  page.on('response', response => {
    const url = response.url();
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
      if (!response.ok()) {
        networkErrors.push({
          url: url.substring(0, 100),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`❌ 이미지 로드 실패: ${response.status} ${url.substring(0, 80)}...`);
      }
    }
  });

  try {
    // ==========================================
    // 1단계: 로그인
    // ==========================================
    console.log('📄 1단계: 관리자 로그인...');
    await page.goto(`${LOCAL_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/login')) {
      console.log('   ✅ 이미 로그인되어 있음');
    } else {
      const loginInput = await page.locator('input[name="login"]').first();
      const passwordInput = await page.locator('input[name="password"]').first();
      const submitButton = await page.locator('button[type="submit"]').first();

      if (await loginInput.isVisible({ timeout: 3000 })) {
        await loginInput.fill(ADMIN_LOGIN);
        await passwordInput.fill(ADMIN_PASSWORD);
        await page.waitForTimeout(1000);
        await submitButton.click();
        await page.waitForTimeout(3000);
        console.log('   ✅ 로그인 완료');
      } else {
        throw new Error('로그인 입력 필드를 찾을 수 없습니다.');
      }
    }

    // ==========================================
    // 2단계: SMS 관리 페이지로 이동
    // ==========================================
    console.log('\n📋 2단계: SMS 관리 페이지로 이동...');
    await page.goto(`${LOCAL_URL}/admin/sms`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // MMS 타입 선택 확인
    console.log('\n🔍 3단계: MMS 타입 확인...');
    const mmsButton = page.locator('button:has-text("MMS"), button:has-text("2000자")').first();
    if (await mmsButton.isVisible({ timeout: 5000 })) {
      const isSelected = await mmsButton.evaluate(el => {
        return el.classList.contains('bg-blue') || 
               el.classList.contains('border-blue') ||
               getComputedStyle(el).borderColor.includes('blue');
      });
      
      if (!isSelected) {
        console.log('   MMS 버튼 클릭...');
        await mmsButton.click();
        await page.waitForTimeout(2000);
      }
      console.log('   ✅ MMS 타입 선택됨');
    }

    // ==========================================
    // 4단계: 이미지 선택 영역 확인
    // ==========================================
    console.log('\n🖼️ 4단계: 이미지 선택 영역 확인...');
    
    // "이미지 선택" 또는 "선택된 이미지" 텍스트 찾기
    const imageSection = page.locator('text=이미지 선택, text=선택된 이미지').first();
    
    if (await imageSection.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 이미지 선택 영역 발견');
      
      // 이미지 요소 찾기
      const imageElement = page.locator('img[alt="선택된 이미지"]').first();
      
      if (await imageElement.isVisible({ timeout: 3000 })) {
        console.log('   ✅ 이미지 요소 발견');
        
        // 이미지 src 확인
        const imageSrc = await imageElement.getAttribute('src');
        console.log(`   이미지 URL: ${imageSrc ? imageSrc.substring(0, 100) : '(없음)'}`);
        
        // 이미지 로드 상태 확인
        const imageLoaded = await imageElement.evaluate((img) => {
          return img.complete && img.naturalHeight !== 0;
        });
        
        if (imageLoaded) {
          console.log('   ✅ 이미지가 정상적으로 로드됨');
          
          // 이미지 크기 확인
          const imageSize = await imageElement.evaluate((img) => {
            return {
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              clientWidth: img.clientWidth,
              clientHeight: img.clientHeight
            };
          });
          console.log(`   이미지 크기: ${imageSize.naturalWidth}x${imageSize.naturalHeight} (표시: ${imageSize.clientWidth}x${imageSize.clientHeight})`);
        } else {
          console.log('   ⚠️ 이미지가 로드되지 않음');
          
          // 에러 상태 확인
          const hasError = await imageElement.evaluate((img) => {
            return img.style.display === 'none' || 
                   img.offsetWidth === 0 || 
                   img.offsetHeight === 0;
          });
          
          if (hasError) {
            console.log('   ❌ 이미지 로드 오류 감지');
          }
        }
      } else {
        console.log('   ⚠️ 이미지 요소를 찾을 수 없음');
        
        // "선택된 이미지" 텍스트만 있는지 확인
        const selectedImageText = page.locator('text=선택된 이미지').first();
        if (await selectedImageText.isVisible({ timeout: 2000 })) {
          console.log('   ❌ "선택된 이미지" 텍스트만 보이고 이미지는 없음');
          
          // 플레이스홀더나 에러 메시지 확인
          const errorMessage = page.locator('text=이미지를 불러올 수 없습니다, text=이미지 로드 실패').first();
          if (await errorMessage.isVisible({ timeout: 1000 })) {
            console.log('   ✅ 에러 메시지 표시됨 (개선된 UI 작동 중)');
          }
        }
      }
    } else {
      console.log('   ⚠️ 이미지 선택 영역을 찾을 수 없음');
    }

    // ==========================================
    // 5단계: 콘솔 로그 분석
    // ==========================================
    console.log('\n📊 5단계: 콘솔 로그 분석...');
    const imageLogs = consoleLogs.filter(log => 
      log.text.includes('AIImagePicker') || 
      log.text.includes('이미지') ||
      log.text.includes('image')
    );
    
    console.log(`   발견된 이미지 관련 로그: ${imageLogs.length}개`);
    imageLogs.forEach(log => {
      console.log(`   [${log.type}] ${log.text.substring(0, 100)}`);
    });

    // ==========================================
    // 6단계: 스크린샷 저장
    // ==========================================
    console.log('\n📸 6단계: 스크린샷 저장...');
    await page.screenshot({
      path: 'e2e-test/screenshots/sms-image-display-check.png',
      fullPage: true
    });
    console.log('   ✅ 스크린샷 저장: e2e-test/screenshots/sms-image-display-check.png');

    // 이미지 영역만 스크린샷
    const imageSectionElement = page.locator('text=이미지 선택, text=선택된 이미지').first();
    if (await imageSectionElement.isVisible({ timeout: 3000 })) {
      const boundingBox = await imageSectionElement.boundingBox();
      if (boundingBox) {
        await page.screenshot({
          path: 'e2e-test/screenshots/sms-image-section.png',
          clip: {
            x: boundingBox.x - 20,
            y: boundingBox.y - 20,
            width: boundingBox.width + 40,
            height: Math.min(boundingBox.height + 400, 800)
          }
        });
        console.log('   ✅ 이미지 영역 스크린샷 저장: e2e-test/screenshots/sms-image-section.png');
      }
    }

    // ==========================================
    // 7단계: 결과 요약
    // ==========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과 요약:');
    console.log(`   - 콘솔 오류: ${errors.length}개`);
    console.log(`   - 네트워크 오류: ${networkErrors.length}개`);
    console.log(`   - 이미지 관련 로그: ${imageLogs.length}개`);
    console.log('='.repeat(60));

    if (networkErrors.length > 0) {
      console.log('\n❌ 네트워크 오류:');
      networkErrors.forEach(err => {
        console.log(`   - ${err.status} ${err.statusText}: ${err.url}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ 콘솔 오류:');
      errors.forEach(err => {
        console.log(`   - ${err}`);
      });
    }

    console.log('\n✅ 테스트 완료');
    console.log('\n📱 다음 단계:');
    console.log('   1. 스크린샷 확인: e2e-test/screenshots/sms-image-display-check.png');
    console.log('   2. 콘솔 로그에서 이미지 URL 확인');
    console.log('   3. Network 탭에서 이미지 요청 상태 확인');

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({
      path: 'e2e-test/screenshots/sms-image-display-check-error.png',
      fullPage: true
    });
    process.exit(1);
  } finally {
    // 브라우저는 수동으로 닫도록 유지 (확인용)
    console.log('\n⏸️ 브라우저를 열어둡니다. 확인 후 수동으로 닫아주세요.');
    // await browser.close();
  }
}

checkSMSImageDisplay();







