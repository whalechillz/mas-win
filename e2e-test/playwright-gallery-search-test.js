const { chromium } = require('playwright');

async function testGallerySearch() {
  console.log('🚀 갤러리 검색 테스트 시작...');
  
  // 브라우저 실행 (headless: false로 브라우저 창 표시)
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 각 동작 사이 0.5초 대기
  });
  
  const page = await browser.newPage();
  
  // 콘솔 로그 수집
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });
    // 검색 관련 로그만 출력
    if (text.includes('검색 디버깅') || text.includes('fetchImages') || text.includes('김진권')) {
      console.log(`[${msg.type()}] ${text}`);
    }
  });
  
  try {
    // 1. 관리자 페이지 접속
    console.log('📱 관리자 페이지 접속 중...');
    await page.goto('http://localhost:3000/admin');
    
    // 2. 로그인 폼 대기
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    console.log('✅ 로그인 폼 로드됨');
    
    // 3. 로그인 정보 입력
    console.log('🔑 로그인 정보 입력 중...');
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    
    // 4. 로그인 버튼 클릭
    console.log('👆 로그인 버튼 클릭...');
    await page.click('button[type="submit"]');
    
    // 5. 갤러리 페이지로 이동
    console.log('📂 갤러리 페이지로 이동 중...');
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:3000/admin/gallery');
    
    // 6. 이미지 로딩 대기 (30초)
    console.log('⏳ 이미지 로딩 대기 중... (30초)');
    await page.waitForTimeout(30000);
    console.log('✅ 30초 대기 완료');
    
    // 7. 검색 입력 필드 찾기
    console.log('🔍 검색 입력 필드 찾기...');
    const searchInput = await page.waitForSelector('input[placeholder*="파일명, ALT 텍스트, 키워드"]', { timeout: 10000 });
    console.log('✅ 검색 입력 필드 찾음');
    
    // 8. 검색어 입력 (천천히)
    console.log('⌨️ "김진권" 검색어 입력 중... (천천히)');
    await searchInput.fill('');
    await page.waitForTimeout(500);
    await searchInput.type('김진권', { delay: 200 }); // 각 문자마다 200ms 대기
    await page.waitForTimeout(1000);
    console.log('✅ 검색어 입력 완료');
    
    // 9. Enter 키 입력
    console.log('⌨️ Enter 키 입력...');
    await searchInput.press('Enter');
    console.log('⏳ 검색 결과 대기 중... (10초)');
    await page.waitForTimeout(10000);
    console.log('✅ 검색 결과 대기 완료');
    
    // 10. 검색 결과 확인 (천천히)
    console.log('📊 검색 결과 확인 중... (천천히)');
    await page.waitForTimeout(2000);
    
    // 검색 관련 콘솔 로그 필터링
    const searchLogs = consoleLogs.filter(log => 
      log.text.includes('검색 디버깅') || 
      log.text.includes('fetchImages') || 
      log.text.includes('김진권') ||
      log.text.includes('searchQuery')
    );
    
    console.log('\n📋 검색 관련 콘솔 로그:');
    searchLogs.forEach(log => {
      console.log(`  [${log.type}] ${log.text}`);
    });
    
    // 11. API 호출 URL 확인
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/admin/all-images')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
    });
    
    // 12. 검색 결과 이미지 확인
    const images = await page.$$eval('img', imgs => imgs.map(img => ({
      src: img.src,
      alt: img.alt
    })));
    
    console.log(`\n📸 검색 결과 이미지 개수: ${images.length}개`);
    
    // 13. 검색 결과 텍스트 확인
    const noImagesText = await page.$eval('text=이미지가 없습니다', el => el.textContent).catch(() => null);
    const loadingText = await page.$eval('text=이미지 로딩 중', el => el.textContent).catch(() => null);
    
    console.log('\n📊 검색 결과 상태:');
    console.log(`  - "이미지가 없습니다" 표시: ${noImagesText ? '예' : '아니오'}`);
    console.log(`  - "이미지 로딩 중" 표시: ${loadingText ? '예' : '아니오'}`);
    
    // 14. 네트워크 요청 확인
    console.log('\n🌐 API 요청 URL:');
    networkRequests.forEach((req, index) => {
      console.log(`  ${index + 1}. ${req.url}`);
      if (req.url.includes('searchQuery')) {
        const urlObj = new URL(req.url);
        const searchQuery = urlObj.searchParams.get('searchQuery');
        console.log(`     ✅ searchQuery 파라미터: "${searchQuery}"`);
      } else {
        console.log(`     ❌ searchQuery 파라미터 없음`);
      }
    });
    
    // 15. 스크린샷 저장
    await page.screenshot({ path: 'e2e-test/gallery-search-test-result.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: e2e-test/gallery-search-test-result.png');
    
    // 16. 결과 요약
    console.log('\n📋 테스트 결과 요약:');
    const hasSearchQuery = networkRequests.some(req => req.url.includes('searchQuery=김진권'));
    console.log(`  - searchQuery 파라미터 전달: ${hasSearchQuery ? '✅ 성공' : '❌ 실패'}`);
    console.log(`  - 검색 결과 이미지: ${images.length}개`);
    console.log(`  - 검색 관련 로그: ${searchLogs.length}개`);
    
    if (!hasSearchQuery) {
      console.log('\n❌ 문제 발견: searchQuery 파라미터가 API 요청에 포함되지 않았습니다!');
      console.log('   원인 분석:');
      console.log('   1. 검색어 입력 후 Enter 키가 제대로 전달되지 않았을 수 있습니다.');
      console.log('   2. fetchImages 함수에서 searchQuery 파라미터가 누락되었을 수 있습니다.');
      console.log('   3. 검색어 상태 업데이트가 비동기적으로 처리되어 이전 값이 사용되었을 수 있습니다.');
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    await page.screenshot({ path: 'e2e-test/gallery-search-test-error.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
    console.log('\n🏁 테스트 완료');
  }
}

// 테스트 실행
testGallerySearch().catch(console.error);
