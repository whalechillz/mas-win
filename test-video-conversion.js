const { chromium } = require('playwright');

(async () => {
  console.log('🎬 동영상 변환 오류 재현 테스트 시작...\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 콘솔 로그 수집
  const consoleLogs = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
    
    if (type === 'error') {
      console.log(`❌ [콘솔 에러] ${text}`);
    } else if (text.includes('변환') || text.includes('ffmpeg') || text.includes('동영상')) {
      console.log(`📝 [콘솔] ${text}`);
    }
  });
  
  // 네트워크 요청/응답 로깅
  page.on('request', request => {
    const url = request.url();
    if (url.includes('convert-video') || url.includes('compress-video') || url.includes('extract-video-segment')) {
      console.log(`📤 [요청] ${request.method()} ${url}`);
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('convert-video') || url.includes('compress-video') || url.includes('extract-video-segment')) {
      const status = response.status();
      console.log(`📥 [응답] ${status} ${url}`);
      
      if (status >= 400) {
        networkErrors.push({ url, status, timestamp: new Date().toISOString() });
        try {
          const text = await response.text();
          console.log(`❌ [응답 본문] ${text.substring(0, 1000)}`);
          
          // JSON 파싱 시도
          try {
            const json = JSON.parse(text);
            console.log(`❌ [응답 JSON]`, JSON.stringify(json, null, 2));
          } catch (e) {
            // JSON이 아니면 텍스트 그대로 출력
          }
        } catch (err) {
          console.log(`❌ [응답 읽기 실패] ${err.message}`);
        }
      } else if (status === 200) {
        try {
          const text = await response.text();
          console.log(`✅ [응답 성공] ${text.substring(0, 500)}`);
        } catch (err) {
          console.log(`⚠️ [응답 읽기 실패] ${err.message}`);
        }
      }
    }
  });
  
  try {
    // 1. 갤러리 페이지로 직접 이동 (로그인은 수동으로)
    console.log('1️⃣ 갤러리 페이지로 이동 (로그인은 수동으로 진행해주세요)...');
    await page.goto('http://localhost:3000/admin/gallery', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 로그인 페이지로 리다이렉트되었는지 확인
    const currentUrl = page.url();
    if (currentUrl.includes('/api/auth/signin') || currentUrl.includes('/login')) {
      console.log('⚠️ 로그인이 필요합니다. 브라우저에서 수동으로 로그인해주세요.');
      console.log('⏳ 60초 대기 중... (로그인 완료 후 자동 진행)');
      console.log('   💡 팁: 로그인 후 갤러리 페이지로 이동하면 자동으로 계속 진행됩니다.');
      await page.waitForTimeout(60000);
      
      // 현재 URL 확인
      const newUrl = page.url();
      console.log(`   📍 현재 URL: ${newUrl}`);
      
      // 갤러리 페이지가 아니면 다시 이동
      if (!newUrl.includes('/admin/gallery')) {
        await page.goto('http://localhost:3000/admin/gallery', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
      }
    }
    
    // 로그인 상태 확인 (401 에러가 없으면 로그인된 것으로 간주)
    console.log('   🔍 로그인 상태 확인 중...');
    await page.waitForTimeout(2000);
    
    // 2. 동영상 파일 찾기
    console.log('2️⃣ 동영상 파일 검색...');
    await page.waitForTimeout(2000);
    
    // 스크린샷으로 현재 상태 확인
    await page.screenshot({ path: 'test-gallery-page.png', fullPage: true });
    console.log('   📸 현재 페이지 스크린샷 저장: test-gallery-page.png');
    
    // 폴더 트리에서 originals/customers 폴더 찾기
    const customersFolder = page.locator('text=/customers|고객/i').first();
    if (await customersFolder.isVisible({ timeout: 5000 })) {
      await customersFolder.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ customers 폴더 클릭');
    } else {
      console.log('   ⚠️ customers 폴더를 찾을 수 없습니다. 폴더 트리를 확인하세요.');
    }
    
    // 동영상 파일명으로 검색
    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"], input[placeholder*="Search"]');
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('swing-video');
      await page.waitForTimeout(2000);
      console.log('   ✅ 검색어 입력: swing-video');
    } else {
      console.log('   ⚠️ 검색 입력창을 찾을 수 없습니다.');
    }
    
    // 3. 동영상 썸네일 클릭하여 상세 정보 열기
    console.log('3️⃣ 동영상 썸네일 클릭...');
    await page.waitForTimeout(2000);
    
    // video 태그 찾기
    const videoElements = page.locator('video');
    const videoCount = await videoElements.count();
    console.log(`   📊 동영상 요소 개수: ${videoCount}`);
    
    if (videoCount > 0) {
      // 첫 번째 동영상 클릭
      await videoElements.first().click();
      await page.waitForTimeout(2000);
      console.log('   ✅ 동영상 상세 정보 열림');
    } else {
      // 대안: mp4 파일명이 포함된 이미지 찾기
      const allImages = page.locator('img[src*=".mp4"], img[alt*=".mp4"], img[alt*="swing-video"]');
      const imgCount = await allImages.count();
      console.log(`   📊 동영상 이미지 개수: ${imgCount}`);
      
      if (imgCount > 0) {
        await allImages.first().click();
        await page.waitForTimeout(2000);
        console.log('   ✅ 동영상 상세 정보 열림 (이미지 클릭)');
      } else {
        // 모든 이미지 클릭 시도
        const allMedia = page.locator('img, video');
        const totalCount = await allMedia.count();
        console.log(`   📊 총 미디어 요소: ${totalCount}개`);
        
        for (let i = 0; i < Math.min(totalCount, 20); i++) {
          const media = allMedia.nth(i);
          const alt = await media.getAttribute('alt').catch(() => '');
          const src = await media.getAttribute('src').catch(() => '');
          
          console.log(`   🔍 [${i}] alt: ${alt?.substring(0, 50)}, src: ${src?.substring(0, 50)}`);
          
          if (src && (src.includes('swing-video') || src.includes('.mp4'))) {
            console.log(`   🎯 동영상 발견 (${i}번째)`);
            await media.click();
            await page.waitForTimeout(2000);
            break;
          }
        }
      }
    }
    
    // 4. 변환 버튼 클릭
    console.log('4️⃣ 변환 버튼 클릭...');
    await page.waitForTimeout(2000);
    
    // 상세 정보 모달이 열렸는지 확인
    const detailModal = page.locator('text=/동영상 상세 정보|이미지 상세 정보/i');
    if (!(await detailModal.isVisible({ timeout: 5000 }))) {
      console.log('   ⚠️ 상세 정보 모달이 열리지 않았습니다. 스크린샷 저장...');
      await page.screenshot({ path: 'test-no-modal.png', fullPage: true });
      throw new Error('상세 정보 모달이 열리지 않았습니다.');
    }
    
    const convertButton = page.locator('button:has-text("변환"), button[data-convert-button]');
    
    if (await convertButton.isVisible({ timeout: 5000 })) {
      await convertButton.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ 변환 메뉴 열림');
    } else {
      console.log('   ⚠️ 변환 버튼을 찾을 수 없습니다. 스크린샷 저장...');
      await page.screenshot({ path: 'test-no-convert-button.png', fullPage: true });
      throw new Error('변환 버튼을 찾을 수 없습니다.');
    }
    
    // 5. 프롬프트 핸들러 설정 (FPS, 길이, 해상도 입력)
    console.log('5️⃣ 프롬프트 핸들러 설정...');
    let promptCount = 0;
    
    const promptHandler = async (dialog) => {
      if (dialog.type() === 'prompt') {
        promptCount++;
        const message = dialog.message();
        console.log(`   💬 [프롬프트 ${promptCount}] ${message}`);
        
        if (message.includes('FPS')) {
          await dialog.accept('10');
          console.log('   ✅ FPS 입력: 10');
        } else if (message.includes('길이') || message.includes('초')) {
          await dialog.accept('5');
          console.log('   ✅ 길이 입력: 5초');
        } else if (message.includes('너비') || message.includes('해상도')) {
          await dialog.accept('320');
          console.log('   ✅ 너비 입력: 320px');
        } else {
          await dialog.accept('');
        }
      }
    };
    page.on('dialog', promptHandler);
    
    // 6. GIF 변환 옵션 클릭
    console.log('6️⃣ GIF 변환 옵션 클릭...');
    await page.waitForTimeout(1000);
    
    const gifOption = page.locator('button:has-text("GIF"), button:has-text("gif"), button:has-text("GIF로 변환")').first();
    
    if (await gifOption.isVisible({ timeout: 5000 })) {
      await gifOption.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ GIF 변환 옵션 클릭됨');
      
      // 프롬프트가 나타날 때까지 대기
      if (promptCount === 0) {
        console.log('   ⏳ 프롬프트 대기 중...');
        await page.waitForTimeout(3000);
      }
    } else {
      console.log('   ⚠️ GIF 변환 옵션을 찾을 수 없습니다. 스크린샷 저장...');
      await page.screenshot({ path: 'test-no-gif-option.png', fullPage: true });
      
      // 변환 메뉴의 모든 옵션 확인
      const allOptions = page.locator('[data-convert-menu] button, button:has-text("WebP"), button:has-text("JPG"), button:has-text("PNG")');
      const optionCount = await allOptions.count();
      console.log(`   📊 변환 메뉴 옵션 개수: ${optionCount}`);
      
      for (let i = 0; i < optionCount; i++) {
        const option = allOptions.nth(i);
        const text = await option.textContent();
        console.log(`   📋 옵션 ${i}: ${text}`);
      }
      
      throw new Error('GIF 변환 옵션을 찾을 수 없습니다.');
    }
    
    // 7. 에러 대기 및 로그 수집
    console.log('7️⃣ 변환 프로세스 대기 및 에러 확인...');
    await page.waitForTimeout(8000);
    
    // 8. 에러 메시지 확인
    console.log('8️⃣ 에러 메시지 확인...');
    
    // alert 핸들러 (이미 설정된 핸들러와 중복 방지)
    let alertHandled = false;
    const alertHandler = async (dialog) => {
      if (dialog.type() === 'alert' && !alertHandled) {
        alertHandled = true;
        const message = dialog.message();
        console.log(`   ⚠️ [Alert] ${message}`);
        await dialog.accept();
      }
    };
    page.on('dialog', alertHandler);
    
    // 에러 모달 확인
    const errorModal = page.locator('text=/변환 실패|GIF 변환 실패|오류|에러|ffmpeg|command not found/i');
    if (await errorModal.isVisible({ timeout: 5000 })) {
      const errorText = await errorModal.textContent();
      console.log(`   ❌ 에러 메시지 발견: ${errorText}`);
    }
    
    // 9. 콘솔 로그 및 네트워크 에러 요약
    console.log('\n📊 테스트 결과 요약:');
    console.log(`   - 총 콘솔 로그: ${consoleLogs.length}개`);
    console.log(`   - 네트워크 에러: ${networkErrors.length}개`);
    console.log(`   - 프롬프트 입력: ${promptCount}개`);
    
    if (networkErrors.length > 0) {
      console.log('\n❌ 네트워크 에러 상세:');
      networkErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.status} ${error.url}`);
      });
    }
    
    // 관련 콘솔 로그 필터링
    const relevantLogs = consoleLogs.filter(log => 
      log.text.includes('ffmpeg') || 
      log.text.includes('변환') || 
      log.text.includes('동영상') ||
      log.text.includes('GIF') ||
      log.text.includes('오류') ||
      log.text.includes('에러') ||
      log.text.includes('convert-video') ||
      log.text.includes('500') ||
      log.text.includes('Internal Server Error') ||
      log.type === 'error'
    );
    
    if (relevantLogs.length > 0) {
      console.log('\n📝 관련 콘솔 로그:');
      relevantLogs.forEach((log, index) => {
        const truncatedText = log.text.length > 300 ? log.text.substring(0, 300) + '...' : log.text;
        console.log(`   ${index + 1}. [${log.type}] ${truncatedText}`);
      });
    }
    
    // API 응답 상세 로그
    const apiLogs = consoleLogs.filter(log => 
      log.text.includes('API') || 
      log.text.includes('응답') ||
      log.text.includes('요청')
    );
    
    if (apiLogs.length > 0) {
      console.log('\n📡 API 관련 로그:');
      apiLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. [${log.type}] ${log.text.substring(0, 200)}`);
      });
    }
    
    // 11. 스크린샷 저장
    console.log('\n📸 스크린샷 저장...');
    await page.screenshot({ path: 'test-video-conversion-error.png', fullPage: true });
    console.log('   ✅ 스크린샷 저장 완료: test-video-conversion-error.png');
    
    // 12. 추가 테스트: 압축 및 구간 추출도 시도
    console.log('\n🔄 추가 테스트: 압축 및 구간 추출...');
    
    // 변환 메뉴 다시 열기
    if (await convertButton.isVisible({ timeout: 3000 })) {
      await convertButton.click();
      await page.waitForTimeout(1000);
      
      // 압축 옵션 클릭
      const compressOption = page.locator('button:has-text("압축")').first();
      if (await compressOption.isVisible({ timeout: 3000 })) {
        console.log('   📦 압축 옵션 클릭...');
        await compressOption.click();
        await page.waitForTimeout(3000);
      }
      
      // 변환 메뉴 다시 열기
      if (await convertButton.isVisible({ timeout: 3000 })) {
        await convertButton.click();
        await page.waitForTimeout(1000);
        
        // 구간 추출 옵션 클릭
        const extractOption = page.locator('button:has-text("구간 추출")').first();
        if (await extractOption.isVisible({ timeout: 3000 })) {
          console.log('   ✂️ 구간 추출 옵션 클릭...');
          await extractOption.click();
          await page.waitForTimeout(3000);
        }
      }
    }
    
    console.log('\n✅ 테스트 완료!');
    console.log('\n📋 수집된 정보:');
    console.log(`   - 콘솔 로그: ${consoleLogs.length}개`);
    console.log(`   - 네트워크 에러: ${networkErrors.length}개`);
    console.log(`   - 관련 로그: ${relevantLogs.length}개`);
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'test-video-conversion-error.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})();
