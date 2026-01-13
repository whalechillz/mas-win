/**
 * Playwright로 갤러리 피커 이미지 로딩 문제 재현 테스트
 * 문제: 이미지가 분명히 있는데 안 보이는 현상
 */

const { chromium } = require('playwright');

(async () => {
  console.log('🔍 갤러리 피커 이미지 로딩 문제 재현 테스트 시작...\n');
  
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
    
    // 디버깅 관련 메시지만 출력
    if (text.includes('[DEBUG]') || text.includes('이미지 로드') || text.includes('GalleryPicker')) {
      console.log(`[${msg.type()}] ${text}`);
    }
  });
  
  // 네트워크 요청 모니터링
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/admin/all-images')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      console.log(`📡 [REQUEST] ${request.method()} ${request.url()}`);
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
          console.log(`📊 [RESPONSE DATA]`, {
            imagesCount: data.images?.length || 0,
            total: data.total || 0,
            count: data.count || 0
          });
          
          // 문제 감지: 이미지가 없는데 total이 있는 경우
          if ((!data.images || data.images.length === 0) && data.total > 0) {
            console.error('❌ [문제 감지] 이미지가 없는데 total이 0보다 큼:', {
              imagesCount: data.images?.length || 0,
              total: data.total,
              url: url
            });
          }
        } catch (e) {
          console.error('❌ 응답 파싱 실패:', e.message);
        }
      }
    }
  });
  
  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
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
    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log('✅ 카카오 콘텐츠 페이지 로드 완료\n');
    
    // 3. 날짜 선택 (2026-01-12)
    console.log('3️⃣ 날짜 선택 (2026-01-12)...');
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2026-01-12');
      await page.waitForTimeout(1000);
      console.log('✅ 날짜 선택 완료\n');
    }
    
    // 4. "갤러리에서 선택" 버튼 클릭 (배경 이미지)
    console.log('4️⃣ "갤러리에서 선택" 버튼 클릭 (배경 이미지)...');
    await page.waitForTimeout(2000);
    
    // 배경 이미지 섹션의 "갤러리에서 선택" 버튼 찾기
    const galleryButtons = page.locator('button:has-text("갤러리에서 선택")');
    const buttonCount = await galleryButtons.count();
    console.log(`   발견된 "갤러리에서 선택" 버튼: ${buttonCount}개`);
    
    if (buttonCount > 0) {
      // 첫 번째 버튼 클릭 (배경 이미지)
      await galleryButtons.first().click();
      await page.waitForTimeout(2000);
      console.log('✅ 갤러리 모달 열림\n');
    } else {
      throw new Error('"갤러리에서 선택" 버튼을 찾을 수 없습니다.');
    }
    
    // 5. 갤러리 모달에서 이미지 확인
    console.log('5️⃣ 갤러리 모달에서 이미지 확인...');
    await page.waitForTimeout(3000); // 이미지 로딩 대기
    
    // 모달이 열렸는지 확인
    const modalTitle = page.locator('text=갤러리에서 이미지 선택');
    if (await modalTitle.isVisible()) {
      console.log('✅ 갤러리 모달 확인됨');
    }
    
    // 현재 폴더 경로 확인
    const breadcrumb = await page.locator('nav[aria-label="폴더 경로"]').textContent().catch(() => null);
    console.log(`📁 현재 폴더: ${breadcrumb || '확인 불가'}`);
    
    // 이미지 개수 확인
    const imageElements = await page.$$('img[src*="blog-images"], img[src*="supabase"]');
    console.log(`📸 발견된 이미지 요소: ${imageElements.length}개`);
    
    // "이미지가 없습니다" 메시지 확인
    const noImageMessage = page.locator('text=이미지가 없습니다');
    const hasNoImageMessage = await noImageMessage.isVisible().catch(() => false);
    console.log(`📭 "이미지가 없습니다" 메시지 표시: ${hasNoImageMessage}`);
    
    // 총 이미지 개수 확인 (하단)
    const totalText = await page.locator('text=/총.*개 이미지/').textContent().catch(() => null);
    console.log(`📊 총 이미지 개수 표시: ${totalText || '확인 불가'}`);
    
    // 6. 콘솔 로그에서 디버깅 정보 확인
    console.log('\n6️⃣ 콘솔 로그 분석...');
    const debugLogs = consoleMessages.filter(msg => 
      msg.text.includes('[DEBUG]') || 
      msg.text.includes('이미지 로드 성공') || 
      msg.text.includes('이미지 불일치')
    );
    
    console.log(`\n📋 디버깅 로그 (${debugLogs.length}개):`);
    debugLogs.forEach((log, idx) => {
      console.log(`   ${idx + 1}. [${log.type}] ${log.text}`);
    });
    
    // 7. 네트워크 요청 분석
    console.log(`\n7️⃣ 네트워크 요청 분석 (${networkRequests.length}개):`);
    networkRequests.forEach((req, idx) => {
      console.log(`   ${idx + 1}. ${req.method} ${req.url}`);
      const urlObj = new URL(req.url);
      console.log(`      - forceRefresh: ${urlObj.searchParams.get('forceRefresh')}`);
      console.log(`      - prefix: ${urlObj.searchParams.get('prefix')}`);
      console.log(`      - includeChildren: ${urlObj.searchParams.get('includeChildren')}`);
      console.log(`      - _t: ${urlObj.searchParams.get('_t')}`);
    });
    
    // 8. 스크린샷 저장
    console.log('\n8️⃣ 스크린샷 저장...');
    await page.screenshot({ 
      path: 'test-gallery-picker-debug.png', 
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장 완료: test-gallery-picker-debug.png\n');
    
    // 9. 문제 요약
    console.log('\n📋 문제 요약:');
    if (hasNoImageMessage && imageElements.length === 0) {
      console.log('   ❌ 문제 확인: 이미지가 없습니다 메시지 표시');
      console.log('   - 이미지 요소: 0개');
      console.log('   - "이미지가 없습니다" 메시지: 표시됨');
      
      // total이 0보다 큰지 확인
      if (totalText && totalText.includes('1')) {
        console.log('   ⚠️ 불일치: total이 1개인데 이미지가 없음');
      }
    } else if (imageElements.length > 0) {
      console.log('   ✅ 정상: 이미지가 표시됨');
      console.log(`   - 이미지 요소: ${imageElements.length}개`);
    } else {
      console.log('   ⚠️ 상태 불명확');
    }
    
    // 10. 추가 대기 후 재확인
    console.log('\n10️⃣ 5초 대기 후 재확인...');
    await page.waitForTimeout(5000);
    
    const imageElementsAfter = await page.$$('img[src*="blog-images"], img[src*="supabase"]');
    const hasNoImageMessageAfter = await noImageMessage.isVisible().catch(() => false);
    
    console.log(`   대기 후 이미지 요소: ${imageElementsAfter.length}개`);
    console.log(`   대기 후 "이미지가 없습니다" 메시지: ${hasNoImageMessageAfter ? '표시됨' : '표시 안 됨'}`);
    
    if (imageElementsAfter.length > imageElements.length) {
      console.log('   ✅ 이미지가 추가로 로드됨 (지연 로딩 가능성)');
    }
    
    // 모달 닫기
    const closeButton = page.locator('button:has-text("닫기")').last();
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(1000);
    }
    
    console.log('\n✅ 테스트 완료\n');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    await page.screenshot({ 
      path: 'test-gallery-picker-error.png', 
      fullPage: true 
    });
    throw error;
  } finally {
    // 브라우저는 수동으로 닫도록 유지 (디버깅용)
    console.log('💡 브라우저는 수동으로 닫아주세요 (디버깅용)');
    // await browser.close();
  }
})();
