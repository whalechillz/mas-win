/**
 * Playwright로 갤러리 피커 이미지 로딩 에러 재현 및 원인 분석
 */

const { chromium } = require('playwright');

(async () => {
  console.log('🔍 갤러리 피커 이미지 로딩 에러 재현 테스트 시작...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  // 콘솔 메시지 수집
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });
    
    // 모든 메시지 출력
    console.log(`[${msg.type()}] ${text}`);
  });
  
  // 네트워크 요청/응답 모니터링
  const networkLogs = [];
  page.on('request', request => {
    if (request.url().includes('/api/admin/all-images')) {
      const url = request.url();
      networkLogs.push({
        type: 'request',
        url: url,
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      console.log(`\n📡 [REQUEST] ${request.method()} ${url}`);
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/admin/all-images')) {
      const status = response.status();
      const url = response.url();
      console.log(`📥 [RESPONSE] ${status} ${url}`);
      
      if (status === 200) {
        try {
          const data = await response.json();
          networkLogs.push({
            type: 'response',
            status: status,
            url: url,
            data: data,
            timestamp: new Date().toISOString()
          });
          
          console.log(`📊 [RESPONSE DATA]`, {
            imagesCount: data.images?.length || 0,
            total: data.total || 0,
            count: data.count || 0
          });
          
          // 문제 감지
          if ((!data.images || data.images.length === 0) && data.total > 0) {
            console.error('❌ [문제 감지] 이미지가 없는데 total이 0보다 큼');
          } else if ((!data.images || data.images.length === 0) && data.total === 0) {
            console.warn('⚠️ [문제 감지] 이미지가 0개, total도 0개 - 실제로 파일이 없는지 확인 필요');
          }
        } catch (e) {
          console.error('❌ 응답 파싱 실패:', e.message);
          const text = await response.text().catch(() => '');
          console.error('응답 텍스트:', text.substring(0, 500));
        }
      } else {
        const text = await response.text().catch(() => '');
        console.error(`❌ [ERROR] ${status}`, text.substring(0, 500));
        networkLogs.push({
          type: 'error',
          status: status,
          url: url,
          error: text.substring(0, 500),
          timestamp: new Date().toISOString()
        });
      }
    }
  });
  
  try {
    // 1. 로그인
    console.log('\n1️⃣ 로그인 중...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    await page.waitForSelector('input[type="text"], input[type="tel"]', { timeout: 10000 });
    await page.fill('input[type="text"], input[type="tel"]', '01066699000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('✅ 로그인 완료\n');
    
    // 2. 카카오 콘텐츠 페이지로 이동
    console.log('2️⃣ 카카오 콘텐츠 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000); // 페이지 로드 대기
    console.log('✅ 카카오 콘텐츠 페이지 로드 완료\n');
    
    // 3. 날짜 선택 (2026-01-13)
    console.log('3️⃣ 날짜 선택 (2026-01-13)...');
    const dateInputs = page.locator('input[type="date"]');
    const dateInputCount = await dateInputs.count();
    console.log(`   발견된 날짜 입력 필드: ${dateInputCount}개`);
    
    if (dateInputCount > 0) {
      await dateInputs.first().fill('2026-01-13');
      await page.waitForTimeout(2000);
      console.log('✅ 날짜 선택 완료\n');
    }
    
    // 4. "갤러리에서 선택" 버튼 클릭 (배경 이미지)
    console.log('4️⃣ "갤러리에서 선택" 버튼 클릭 (배경 이미지)...');
    await page.waitForTimeout(2000);
    
    const galleryButtons = page.locator('button:has-text("갤러리에서 선택")');
    const buttonCount = await galleryButtons.count();
    console.log(`   발견된 "갤러리에서 선택" 버튼: ${buttonCount}개`);
    
    if (buttonCount > 0) {
      // 첫 번째 버튼 클릭 (배경 이미지)
      await galleryButtons.first().click();
      await page.waitForTimeout(3000); // 모달 열림 대기
      console.log('✅ 갤러리 모달 열림\n');
    } else {
      throw new Error('"갤러리에서 선택" 버튼을 찾을 수 없습니다.');
    }
    
    // 5. 모달 확인 및 상태 확인
    console.log('5️⃣ 갤러리 모달 상태 확인...');
    await page.waitForTimeout(3000); // 이미지 로딩 대기
    
    const modalTitle = page.locator('text=갤러리에서 이미지 선택');
    if (await modalTitle.isVisible({ timeout: 5000 })) {
      console.log('✅ 갤러리 모달 확인됨');
    }
    
    // 현재 폴더 경로 확인
    const breadcrumb = await page.locator('nav[aria-label="폴더 경로"]').textContent().catch(() => null);
    console.log(`📁 현재 폴더: ${breadcrumb || '확인 불가'}`);
    
    // "이미지가 없습니다" 메시지 확인
    const noImageMessage = page.locator('text=이미지가 없습니다');
    const hasNoImageMessage = await noImageMessage.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`📭 "이미지가 없습니다" 메시지 표시: ${hasNoImageMessage}`);
    
    // 이미지 요소 확인
    const imageElements = await page.$$('img[src*="blog-images"], img[src*="supabase"]');
    console.log(`📸 발견된 이미지 요소: ${imageElements.length}개`);
    
    // 총 이미지 개수 확인
    const totalText = await page.locator('text=/총.*개 이미지/').textContent().catch(() => null);
    console.log(`📊 총 이미지 개수 표시: ${totalText || '확인 불가'}`);
    
    // 6. 추가 대기 후 재확인
    console.log('\n6️⃣ 5초 대기 후 재확인...');
    await page.waitForTimeout(5000);
    
    const imageElementsAfter = await page.$$('img[src*="blog-images"], img[src*="supabase"]');
    const hasNoImageMessageAfter = await noImageMessage.isVisible({ timeout: 1000 }).catch(() => false);
    const totalTextAfter = await page.locator('text=/총.*개 이미지/').textContent().catch(() => null);
    
    console.log(`   대기 후 이미지 요소: ${imageElementsAfter.length}개`);
    console.log(`   대기 후 "이미지가 없습니다" 메시지: ${hasNoImageMessageAfter ? '표시됨' : '표시 안 됨'}`);
    console.log(`   대기 후 총 이미지 개수: ${totalTextAfter || '확인 불가'}`);
    
    // 7. 네트워크 로그 분석
    console.log('\n7️⃣ 네트워크 로그 분석...');
    const allImagesRequests = networkLogs.filter(log => log.url && log.url.includes('/api/admin/all-images'));
    console.log(`   총 API 요청: ${allImagesRequests.filter(l => l.type === 'request').length}개`);
    console.log(`   총 API 응답: ${allImagesRequests.filter(l => l.type === 'response').length}개`);
    
    allImagesRequests.forEach((log, idx) => {
      if (log.type === 'request') {
        console.log(`\n   요청 ${idx + 1}:`);
        const urlObj = new URL(log.url);
        console.log(`      - prefix: ${urlObj.searchParams.get('prefix')}`);
        console.log(`      - includeChildren: ${urlObj.searchParams.get('includeChildren')}`);
        console.log(`      - forceRefresh: ${urlObj.searchParams.get('forceRefresh')}`);
        console.log(`      - _t: ${urlObj.searchParams.get('_t')}`);
      } else if (log.type === 'response' && log.data) {
        console.log(`\n   응답 ${idx + 1}:`);
        console.log(`      - images: ${log.data.images?.length || 0}개`);
        console.log(`      - total: ${log.data.total || 0}`);
        console.log(`      - count: ${log.data.count || 0}`);
        
        // 문제 분석
        if (log.data.images && log.data.images.length === 0 && log.data.total === 0) {
          console.log(`      ⚠️ 문제: 이미지 0개, total 0개 - 실제로 파일이 없거나 조회 실패`);
        }
      }
    });
    
    // 8. 콘솔 로그 분석
    console.log('\n8️⃣ 콘솔 로그 분석...');
    const debugLogs = consoleMessages.filter(msg => 
      msg.text.includes('[DEBUG]') || 
      msg.text.includes('이미지 로드') ||
      msg.text.includes('불일치') ||
      msg.text.includes('에러') ||
      msg.text.includes('ERROR')
    );
    
    console.log(`   디버깅 관련 로그: ${debugLogs.length}개`);
    debugLogs.forEach((log, idx) => {
      if (idx < 10) { // 처음 10개만 출력
        console.log(`   ${idx + 1}. [${log.type}] ${log.text.substring(0, 200)}`);
      }
    });
    
    // 9. 스크린샷 저장
    console.log('\n9️⃣ 스크린샷 저장...');
    await page.screenshot({ 
      path: 'test-gallery-picker-error-reproduction.png', 
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장 완료: test-gallery-picker-error-reproduction.png\n');
    
    // 10. 문제 요약
    console.log('\n📋 문제 요약:');
    const lastResponse = allImagesRequests.filter(l => l.type === 'response' && l.data).pop();
    if (lastResponse && lastResponse.data) {
      const { images, total, count } = lastResponse.data;
      console.log(`   - API 응답: images=${images?.length || 0}, total=${total}, count=${count}`);
      
      if (images && images.length === 0 && total === 0) {
        console.log('   ❌ 문제: 이미지가 0개로 반환됨');
        console.log('   가능한 원인:');
        console.log('     1. Supabase Storage에 실제로 파일이 없음');
        console.log('     2. 폴더 경로가 잘못됨');
        console.log('     3. includeChildren 로직 문제');
        console.log('     4. 파일 필터링 로직 문제 (확장자, temp 폴더 등)');
      } else if (images && images.length === 0 && total > 0) {
        console.log('   ❌ 문제: total은 있지만 images 배열이 비어있음');
        console.log('   가능한 원인:');
        console.log('     1. 페이지네이션 문제 (offset이 잘못됨)');
        console.log('     2. 이미지 URL 변환 실패');
        console.log('     3. 메타데이터 조회 실패');
      }
    }
    
    // 모달 닫기
    const closeButton = page.locator('button:has-text("닫기")').last();
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(1000);
    }
    
    console.log('\n✅ 테스트 완료\n');
    console.log('💡 브라우저는 수동으로 닫아주세요 (디버깅용)');
    console.log('💡 서버 콘솔 로그도 확인해주세요\n');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    await page.screenshot({ 
      path: 'test-gallery-picker-error.png', 
      fullPage: true 
    });
    console.log('✅ 에러 스크린샷 저장: test-gallery-picker-error.png');
    throw error;
  } finally {
    // 브라우저는 수동으로 닫도록 유지 (디버깅용)
    // await browser.close();
  }
})();
