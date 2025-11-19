const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🎭 Playwright 이미지 업로드 에러 상세 점검 시작...\n');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인 페이지 접속
    console.log('🔐 로그인 페이지 접속 중...');
    await page.goto('http://localhost:3000/admin/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('✅ 로그인 페이지 로드 완료\n');

    // 2. 로그인 수행
    console.log('🔑 로그인 시도 중...');
    
    // 로그인 폼 필드 찾기
    const loginInput = page.locator('input[type="text"], input[name="login"], input[placeholder*="아이디"], input[placeholder*="전화번호"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("로그인")').first();
    
    // 로그인 정보 입력
    const loginId = process.env.ADMIN_LOGIN || '010-6669-9000';
    const loginPassword = process.env.ADMIN_PASSWORD || '66699000';
    
    if (await loginInput.count() > 0 && await passwordInput.count() > 0) {
      await loginInput.fill(loginId);
      await passwordInput.fill(loginPassword);
      console.log('✅ 로그인 정보 입력 완료');
      
      // 로그인 버튼 클릭
      if (await loginButton.count() > 0) {
        await loginButton.click();
        console.log('✅ 로그인 버튼 클릭');
        
        // 로그인 완료 대기 (리다이렉트 또는 에러 메시지)
        await page.waitForTimeout(2000);
        
        // 에러 메시지 확인
        const errorMessage = page.locator('text=오류, text=실패, text=잘못').first();
        if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
          const errorText = await errorMessage.textContent();
          console.log('❌ 로그인 실패:', errorText);
          throw new Error(`로그인 실패: ${errorText}`);
        }
        
        console.log('✅ 로그인 완료\n');
      } else {
        console.log('⚠️ 로그인 버튼을 찾을 수 없음');
      }
    } else {
      console.log('⚠️ 로그인 폼을 찾을 수 없음 - 이미 로그인되어 있을 수 있음');
    }

    // 3. SMS 편집 페이지로 이동
    console.log('📡 SMS 편집 페이지 접속 중...');
    await page.goto('http://localhost:3000/admin/sms', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('✅ SMS 편집 페이지 로드 완료\n');

    // 2. 테스트 이미지 파일 생성 (JPG)
    console.log('📦 테스트 이미지 파일 생성 중...');
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    const base64Image = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==';
    fs.writeFileSync(testImagePath, Buffer.from(base64Image, 'base64'));
    console.log('✅ 테스트 이미지 생성 완료\n');

    // 3. 네트워크 응답 상세 모니터링
    console.log('📡 네트워크 응답 상세 모니터링 시작...\n');
    
    let responseData = null;
    page.on('response', async response => {
      if (response.url().includes('/api/solapi/upload-image')) {
        console.log('📥 업로드 응답 수신:');
        console.log('   URL:', response.url());
        console.log('   상태:', response.status(), response.statusText());
        
        try {
          const body = await response.json();
          responseData = body;
          console.log('   응답 본문:', JSON.stringify(body, null, 2));
        } catch (e) {
          const text = await response.text();
          console.log('   응답 텍스트:', text);
        }
      }
    });

    // 4. 페이지가 완전히 로드될 때까지 대기
    console.log('⏳ 페이지 완전 로드 대기 중...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 5. MMS 타입 선택 (이미지 업로드는 MMS에서만 가능)
    console.log('📝 MMS 타입 선택 중...');
    
    // "메시지 타입" 섹션 찾기
    const messageTypeSection = page.locator('text=메시지 타입').first();
    if (await messageTypeSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ 메시지 타입 섹션 발견');
      
      // MMS 버튼 찾기 - 여러 방법 시도
      let mmsButton = null;
      
      // 방법 1: "MMS" 텍스트가 있는 버튼
      const buttonsWithMMS = page.locator('button:has-text("MMS")');
      const mmsButtonCount = await buttonsWithMMS.count();
      console.log(`   MMS 텍스트가 있는 버튼 수: ${mmsButtonCount}`);
      
      if (mmsButtonCount > 0) {
        // "2000자"도 포함하는 버튼 찾기
        for (let i = 0; i < mmsButtonCount; i++) {
          const btn = buttonsWithMMS.nth(i);
          const text = await btn.textContent().catch(() => '');
          if (text.includes('2000자') || text.trim() === 'MMS') {
            mmsButton = btn;
            break;
          }
        }
        
        if (!mmsButton && mmsButtonCount > 0) {
          mmsButton = buttonsWithMMS.first();
        }
      }
      
      // 방법 2: 메시지 타입 섹션 내의 모든 버튼 확인
      if (!mmsButton) {
        const allButtons = page.locator('button');
        const buttonCount = await allButtons.count();
        console.log(`   전체 버튼 수: ${buttonCount}`);
        
        for (let i = 0; i < Math.min(buttonCount, 30); i++) {
          const button = allButtons.nth(i);
          const text = await button.textContent().catch(() => '');
          if (text && (text.includes('MMS') && text.includes('2000자'))) {
            mmsButton = button;
            console.log(`   MMS 버튼 발견 (인덱스 ${i}): ${text.trim()}`);
            break;
          }
        }
      }
      
      if (mmsButton) {
        await mmsButton.click();
        await page.waitForTimeout(2000); // 상태 업데이트 대기
        console.log('✅ MMS 타입 선택 완료');
      } else {
        console.log('⚠️ MMS 버튼을 찾을 수 없음');
        // 스크린샷으로 현재 상태 확인
        await page.screenshot({ 
          path: path.join(__dirname, 'before-mms-selection.png'),
          fullPage: true 
        });
      }
    } else {
      console.log('⚠️ 메시지 타입 섹션을 찾을 수 없음');
    }

    // 5. 이미지 업로드 영역이 나타날 때까지 대기
    console.log('\n⏳ 이미지 업로드 영역 대기 중...');
    await page.waitForTimeout(1000);
    
    // 6. 이미지 업로드 시도
    console.log('🚀 이미지 업로드 시도...\n');
    
    // 파일 입력 필드 찾기 (숨겨진 필드도 찾을 수 있도록)
    const fileInputById = page.locator('#image-upload');
    const fileInputCount = await fileInputById.count();
    
    if (fileInputCount > 0) {
      console.log('✅ 파일 입력 필드 발견 (ID: image-upload)');
    } else {
      // 대체 방법: 모든 파일 입력 찾기
      const allFileInputs = page.locator('input[type="file"]');
      const count = await allFileInputs.count();
      console.log(`⚠️ #image-upload를 찾을 수 없음. 파일 입력 필드 수: ${count}`);
      
      if (count === 0) {
        // 페이지 구조 확인을 위한 스크린샷
        await page.screenshot({ 
          path: path.join(__dirname, 'page-structure.png'),
          fullPage: true 
        });
        console.log('📸 페이지 구조 스크린샷 저장: e2e-test/page-structure.png');
        throw new Error('파일 입력 필드를 찾을 수 없습니다. MMS 타입이 선택되었는지 확인하세요.');
      }
    }

    // 파일 업로드
    await fileInputById.setInputFiles(testImagePath);
    console.log('✅ 파일 선택 완료\n');

    // 7. 응답 대기
    console.log('⏳ 응답 대기 중...');
    await page.waitForTimeout(3000);

    // 8. 에러 모달 확인
    console.log('\n🔍 에러 모달 확인...');
    const errorSelectors = [
      'text=이미지 업로드',
      'text=실패',
      'text=오류',
      '[role="dialog"]',
      '.modal',
      '[class*="modal"]'
    ];

    for (const selector of errorSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await element.textContent();
        console.log('❌ 에러 모달 발견:', text);
        break;
      }
    }

    // 9. 결과 분석
    console.log('\n' + '='.repeat(60));
    console.log('📊 상세 에러 분석');
    console.log('='.repeat(60));
    
    if (responseData) {
      console.log('응답 데이터:');
      console.log(JSON.stringify(responseData, null, 2));
      
      if (responseData.debug) {
        console.log('\n디버그 정보:');
        console.log('  - Solapi API Key 존재:', responseData.debug.hasSolapiKey);
        console.log('  - Solapi API Secret 존재:', responseData.debug.hasSolapiSecret);
        console.log('  - Node 환경:', responseData.debug.nodeEnv);
      }
      
      if (responseData.error) {
        console.log('\n에러 메시지:', responseData.error);
      }
      
      if (responseData.errorName) {
        console.log('에러 타입:', responseData.errorName);
      }
      
      if (responseData.stack) {
        console.log('\n스택 트레이스:');
        console.log(responseData.stack);
      }
    } else {
      console.log('⚠️ 응답 데이터를 받지 못함');
    }
    
    console.log('='.repeat(60));

    // 10. 스크린샷 저장
    await page.screenshot({ 
      path: path.join(__dirname, 'image-upload-error-detailed.png'),
      fullPage: true 
    });
    console.log('\n✅ 스크린샷 저장: e2e-test/image-upload-error-detailed.png');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('   스택:', error.stack);
    
    await page.screenshot({ 
      path: path.join(__dirname, 'image-upload-error-exception.png'),
      fullPage: true 
    });
  } finally {
    // 테스트 파일 정리
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    await browser.close();
    console.log('\n✅ Playwright 상세 점검 완료');
  }
})();


const path = require('path');

(async () => {
  console.log('🎭 Playwright 이미지 업로드 에러 상세 점검 시작...\n');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인 페이지 접속
    console.log('🔐 로그인 페이지 접속 중...');
    await page.goto('http://localhost:3000/admin/login', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('✅ 로그인 페이지 로드 완료\n');

    // 2. 로그인 수행
    console.log('🔑 로그인 시도 중...');
    
    // 로그인 폼 필드 찾기
    const loginInput = page.locator('input[type="text"], input[name="login"], input[placeholder*="아이디"], input[placeholder*="전화번호"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("로그인")').first();
    
    // 로그인 정보 입력
    const loginId = process.env.ADMIN_LOGIN || '010-6669-9000';
    const loginPassword = process.env.ADMIN_PASSWORD || '66699000';
    
    if (await loginInput.count() > 0 && await passwordInput.count() > 0) {
      await loginInput.fill(loginId);
      await passwordInput.fill(loginPassword);
      console.log('✅ 로그인 정보 입력 완료');
      
      // 로그인 버튼 클릭
      if (await loginButton.count() > 0) {
        await loginButton.click();
        console.log('✅ 로그인 버튼 클릭');
        
        // 로그인 완료 대기 (리다이렉트 또는 에러 메시지)
        await page.waitForTimeout(2000);
        
        // 에러 메시지 확인
        const errorMessage = page.locator('text=오류, text=실패, text=잘못').first();
        if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
          const errorText = await errorMessage.textContent();
          console.log('❌ 로그인 실패:', errorText);
          throw new Error(`로그인 실패: ${errorText}`);
        }
        
        console.log('✅ 로그인 완료\n');
      } else {
        console.log('⚠️ 로그인 버튼을 찾을 수 없음');
      }
    } else {
      console.log('⚠️ 로그인 폼을 찾을 수 없음 - 이미 로그인되어 있을 수 있음');
    }

    // 3. SMS 편집 페이지로 이동
    console.log('📡 SMS 편집 페이지 접속 중...');
    await page.goto('http://localhost:3000/admin/sms', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('✅ SMS 편집 페이지 로드 완료\n');

    // 2. 테스트 이미지 파일 생성 (JPG)
    console.log('📦 테스트 이미지 파일 생성 중...');
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    const base64Image = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==';
    fs.writeFileSync(testImagePath, Buffer.from(base64Image, 'base64'));
    console.log('✅ 테스트 이미지 생성 완료\n');

    // 3. 네트워크 응답 상세 모니터링
    console.log('📡 네트워크 응답 상세 모니터링 시작...\n');
    
    let responseData = null;
    page.on('response', async response => {
      if (response.url().includes('/api/solapi/upload-image')) {
        console.log('📥 업로드 응답 수신:');
        console.log('   URL:', response.url());
        console.log('   상태:', response.status(), response.statusText());
        
        try {
          const body = await response.json();
          responseData = body;
          console.log('   응답 본문:', JSON.stringify(body, null, 2));
        } catch (e) {
          const text = await response.text();
          console.log('   응답 텍스트:', text);
        }
      }
    });

    // 4. 페이지가 완전히 로드될 때까지 대기
    console.log('⏳ 페이지 완전 로드 대기 중...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 5. MMS 타입 선택 (이미지 업로드는 MMS에서만 가능)
    console.log('📝 MMS 타입 선택 중...');
    
    // "메시지 타입" 섹션 찾기
    const messageTypeSection = page.locator('text=메시지 타입').first();
    if (await messageTypeSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ 메시지 타입 섹션 발견');
      
      // MMS 버튼 찾기 - 여러 방법 시도
      let mmsButton = null;
      
      // 방법 1: "MMS" 텍스트가 있는 버튼
      const buttonsWithMMS = page.locator('button:has-text("MMS")');
      const mmsButtonCount = await buttonsWithMMS.count();
      console.log(`   MMS 텍스트가 있는 버튼 수: ${mmsButtonCount}`);
      
      if (mmsButtonCount > 0) {
        // "2000자"도 포함하는 버튼 찾기
        for (let i = 0; i < mmsButtonCount; i++) {
          const btn = buttonsWithMMS.nth(i);
          const text = await btn.textContent().catch(() => '');
          if (text.includes('2000자') || text.trim() === 'MMS') {
            mmsButton = btn;
            break;
          }
        }
        
        if (!mmsButton && mmsButtonCount > 0) {
          mmsButton = buttonsWithMMS.first();
        }
      }
      
      // 방법 2: 메시지 타입 섹션 내의 모든 버튼 확인
      if (!mmsButton) {
        const allButtons = page.locator('button');
        const buttonCount = await allButtons.count();
        console.log(`   전체 버튼 수: ${buttonCount}`);
        
        for (let i = 0; i < Math.min(buttonCount, 30); i++) {
          const button = allButtons.nth(i);
          const text = await button.textContent().catch(() => '');
          if (text && (text.includes('MMS') && text.includes('2000자'))) {
            mmsButton = button;
            console.log(`   MMS 버튼 발견 (인덱스 ${i}): ${text.trim()}`);
            break;
          }
        }
      }
      
      if (mmsButton) {
        await mmsButton.click();
        await page.waitForTimeout(2000); // 상태 업데이트 대기
        console.log('✅ MMS 타입 선택 완료');
      } else {
        console.log('⚠️ MMS 버튼을 찾을 수 없음');
        // 스크린샷으로 현재 상태 확인
        await page.screenshot({ 
          path: path.join(__dirname, 'before-mms-selection.png'),
          fullPage: true 
        });
      }
    } else {
      console.log('⚠️ 메시지 타입 섹션을 찾을 수 없음');
    }

    // 5. 이미지 업로드 영역이 나타날 때까지 대기
    console.log('\n⏳ 이미지 업로드 영역 대기 중...');
    await page.waitForTimeout(1000);
    
    // 6. 이미지 업로드 시도
    console.log('🚀 이미지 업로드 시도...\n');
    
    // 파일 입력 필드 찾기 (숨겨진 필드도 찾을 수 있도록)
    const fileInputById = page.locator('#image-upload');
    const fileInputCount = await fileInputById.count();
    
    if (fileInputCount > 0) {
      console.log('✅ 파일 입력 필드 발견 (ID: image-upload)');
    } else {
      // 대체 방법: 모든 파일 입력 찾기
      const allFileInputs = page.locator('input[type="file"]');
      const count = await allFileInputs.count();
      console.log(`⚠️ #image-upload를 찾을 수 없음. 파일 입력 필드 수: ${count}`);
      
      if (count === 0) {
        // 페이지 구조 확인을 위한 스크린샷
        await page.screenshot({ 
          path: path.join(__dirname, 'page-structure.png'),
          fullPage: true 
        });
        console.log('📸 페이지 구조 스크린샷 저장: e2e-test/page-structure.png');
        throw new Error('파일 입력 필드를 찾을 수 없습니다. MMS 타입이 선택되었는지 확인하세요.');
      }
    }

    // 파일 업로드
    await fileInputById.setInputFiles(testImagePath);
    console.log('✅ 파일 선택 완료\n');

    // 7. 응답 대기
    console.log('⏳ 응답 대기 중...');
    await page.waitForTimeout(3000);

    // 8. 에러 모달 확인
    console.log('\n🔍 에러 모달 확인...');
    const errorSelectors = [
      'text=이미지 업로드',
      'text=실패',
      'text=오류',
      '[role="dialog"]',
      '.modal',
      '[class*="modal"]'
    ];

    for (const selector of errorSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await element.textContent();
        console.log('❌ 에러 모달 발견:', text);
        break;
      }
    }

    // 9. 결과 분석
    console.log('\n' + '='.repeat(60));
    console.log('📊 상세 에러 분석');
    console.log('='.repeat(60));
    
    if (responseData) {
      console.log('응답 데이터:');
      console.log(JSON.stringify(responseData, null, 2));
      
      if (responseData.debug) {
        console.log('\n디버그 정보:');
        console.log('  - Solapi API Key 존재:', responseData.debug.hasSolapiKey);
        console.log('  - Solapi API Secret 존재:', responseData.debug.hasSolapiSecret);
        console.log('  - Node 환경:', responseData.debug.nodeEnv);
      }
      
      if (responseData.error) {
        console.log('\n에러 메시지:', responseData.error);
      }
      
      if (responseData.errorName) {
        console.log('에러 타입:', responseData.errorName);
      }
      
      if (responseData.stack) {
        console.log('\n스택 트레이스:');
        console.log(responseData.stack);
      }
    } else {
      console.log('⚠️ 응답 데이터를 받지 못함');
    }
    
    console.log('='.repeat(60));

    // 10. 스크린샷 저장
    await page.screenshot({ 
      path: path.join(__dirname, 'image-upload-error-detailed.png'),
      fullPage: true 
    });
    console.log('\n✅ 스크린샷 저장: e2e-test/image-upload-error-detailed.png');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('   스택:', error.stack);
    
    await page.screenshot({ 
      path: path.join(__dirname, 'image-upload-error-exception.png'),
      fullPage: true 
    });
  } finally {
    // 테스트 파일 정리
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    await browser.close();
    console.log('\n✅ Playwright 상세 점검 완료');
  }
})();


