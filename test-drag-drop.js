const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Playwright 테스트 시작 (Chromium 사용)...');
  
  // Chromium 브라우저 사용
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // 동작을 천천히 실행하여 관찰 가능
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 콘솔 로그 수집
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });
    console.log(`[브라우저 콘솔 ${msg.type()}]`, text);
  });
  
  // 네트워크 요청 모니터링
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('update-image-scene')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData(),
        timestamp: new Date().toISOString()
      });
      console.log('📤 [네트워크 요청]', request.method(), request.url());
      if (request.postData()) {
        try {
          console.log('📤 [요청 본문]', JSON.parse(request.postData()));
        } catch (e) {}
      }
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('update-image-scene')) {
      console.log('📥 [네트워크 응답]', response.status(), response.url());
      try {
        const data = await response.json();
        console.log('📥 [응답 데이터]', JSON.stringify(data, null, 2));
      } catch (e) {
        const text = await response.text();
        console.log('📥 [응답 텍스트]', text);
      }
    }
  });
  
  try {
    // 로그인 페이지로 이동 (필요한 경우)
    console.log('📍 페이지 로드 중...');
    await page.goto('http://localhost:3000/admin/customers', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('⏳ 페이지 로드 완료, 고객 선택 대기 중...');
    await page.waitForTimeout(2000);
    
    // 고객 "조성대" 찾기 및 클릭
    await page.waitForSelector('text=조성대', { timeout: 10000 });
    const customerLink = page.locator('text=조성대').first();
    await customerLink.click();
    
    console.log('✅ 고객 선택 완료, 스토리 모달 대기 중...');
    await page.waitForTimeout(2000);
    
    // "스토리" 버튼 클릭
    await page.waitForSelector('button:has-text("스토리")', { timeout: 10000 });
    await page.click('button:has-text("스토리")');
    
    console.log('✅ 스토리 모달 열림, 미할당 이미지 대기 중...');
    await page.waitForTimeout(2000);
    
    // 미할당 이미지 섹션 대기
    await page.waitForSelector('text=미할당 이미지', { timeout: 10000 });
    
    // 미할당 이미지 찾기 - 더 정확한 선택자 사용
    const unassignedSection = page.locator('text=미할당 이미지').locator('..').locator('..');
    const unassignedImages = unassignedSection.locator('[draggable="true"]');
    
    const imageCount = await unassignedImages.count();
    console.log(`🔍 미할당 이미지 개수: ${imageCount}`);
    
    if (imageCount === 0) {
      console.error('❌ 미할당 이미지를 찾을 수 없습니다');
      await page.screenshot({ path: 'test-no-unassigned-images.png', fullPage: true });
      return;
    }
    
    // GIF 파일이 있는 이미지 찾기 (joseotdae_s3_swing-scene_02.gif)
    let targetImage = null;
    for (let i = 0; i < imageCount; i++) {
      const img = unassignedImages.nth(i);
      const imgText = await img.textContent();
      if (imgText && (imgText.includes('swing-scene_02') || imgText.includes('.gif'))) {
        targetImage = img;
        console.log(`✅ GIF 이미지 찾음 (인덱스 ${i}):`, imgText);
        break;
      }
    }
    
    // GIF를 찾지 못하면 첫 번째 이미지 사용
    if (!targetImage) {
      targetImage = unassignedImages.first();
      console.log('⚠️ GIF 이미지를 찾지 못해 첫 번째 이미지 사용');
    }
    
    const imageBoundingBox = await targetImage.boundingBox();
    const imageText = await targetImage.textContent();
    console.log('✅ 드래그할 이미지:', {
      text: imageText,
      boundingBox: imageBoundingBox
    });
    
    // 장면 1 드롭 영역 찾기
    await page.waitForSelector('text=장면 1: 행복한 주인공', { timeout: 10000 });
    const scene1Section = page.locator('text=장면 1: 행복한 주인공').locator('..').locator('..');
    const scene1DropZone = scene1Section.locator('[class*="border-dashed"], [class*="border-2"]').last();
    
    const dropZoneCount = await scene1DropZone.count();
    console.log(`🔍 장면 1 드롭 영역 개수: ${dropZoneCount}`);
    
    if (dropZoneCount === 0) {
      console.error('❌ 장면 1 드롭 영역을 찾을 수 없습니다');
      await page.screenshot({ path: 'test-no-scene1-dropzone.png', fullPage: true });
      return;
    }
    
    const dropZoneBoundingBox = await scene1DropZone.boundingBox();
    console.log('✅ 장면 1 드롭 영역 찾음:', dropZoneBoundingBox);
    
    // 드래그 앤 드롭 실행
    console.log('🔄 드래그 앤 드롭 실행 중...');
    await targetImage.dragTo(scene1DropZone, {
      force: true
    });
    
    console.log('✅ 드래그 앤 드롭 완료, 결과 대기 중...');
    await page.waitForTimeout(5000);
    
    // 스크린샷 저장
    await page.screenshot({ path: 'test-drag-drop-result.png', fullPage: true });
    
    console.log('\n📊 테스트 결과 요약:');
    console.log(`- 콘솔 로그 개수: ${consoleLogs.length}`);
    console.log(`- 네트워크 요청 개수: ${networkRequests.length}`);
    
    // 에러 로그 필터링
    const errorLogs = consoleLogs.filter(log => 
      log.type === 'error' || log.text.includes('❌') || log.text.includes('실패')
    );
    
    if (errorLogs.length > 0) {
      console.log('\n❌ 에러 로그:');
      errorLogs.forEach(log => {
        console.log(`  [${log.timestamp}] ${log.text}`);
      });
    }
    
    // 성공 로그 필터링
    const successLogs = consoleLogs.filter(log => 
      log.text.includes('✅') || log.text.includes('성공')
    );
    
    if (successLogs.length > 0) {
      console.log('\n✅ 성공 로그:');
      successLogs.forEach(log => {
        console.log(`  [${log.timestamp}] ${log.text}`);
      });
    }
    
    // 드롭 관련 로그 필터링
    const dropLogs = consoleLogs.filter(log => 
      log.text.includes('드롭') || log.text.includes('드래그') || log.text.includes('API') || log.text.includes('🔍')
    );
    
    if (dropLogs.length > 0) {
      console.log('\n🔍 드래그/드롭/API 관련 로그:');
      dropLogs.forEach(log => {
        console.log(`  [${log.timestamp}] ${log.text}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    console.error('스택:', error.stack);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    console.log('\n⏳ 10초 후 브라우저 종료...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();
