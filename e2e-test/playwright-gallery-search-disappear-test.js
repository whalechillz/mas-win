const { chromium } = require('playwright');

async function testGallerySearchDisappear() {
  console.log('🚀 갤러리 검색 이미지 사라짐 문제 재현 테스트 시작...');
  
  // 브라우저 실행 (headless: false로 브라우저 창 표시)
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // 각 동작 사이 0.1초 대기
  });
  
  const page = await browser.newPage();
  
  // 콘솔 로그 수집 (검색 디버깅 로그 포함)
  const consoleLogs = [];
  const searchDebugLogs = [];
  const imageStateLogs = [];
  
  page.on('console', msg => {
    const text = msg.text();
    const timestamp = new Date().toISOString();
    
    consoleLogs.push({
      type: msg.type(),
      text: text,
      timestamp: timestamp
    });
    
    // 검색 디버깅 로그 수집
    if (text.includes('[검색 디버깅]')) {
      searchDebugLogs.push({ text, timestamp });
      console.log(`🔍 [검색 디버깅] ${text}`);
    }
    
    // 이미지 상태 변경 로그 수집
    if (text.includes('이미지 상태 업데이트') || text.includes('filteredImages useMemo')) {
      imageStateLogs.push({ text, timestamp });
      console.log(`📊 [이미지 상태] ${text}`);
    }
  });
  
  // 네트워크 요청 수집
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/admin/all-images')) {
      const url = request.url();
      const urlObj = new URL(url);
      const searchQuery = urlObj.searchParams.get('searchQuery') || '';
      
      networkRequests.push({
        url: url,
        searchQuery: searchQuery,
        timestamp: new Date().toISOString()
      });
      
      console.log(`🌐 [API 요청] searchQuery="${searchQuery}"`);
    }
  });
  
  // 네트워크 응답 수집
  const networkResponses = [];
  page.on('response', async response => {
    if (response.url().includes('/api/admin/all-images')) {
      try {
        const data = await response.json();
        const imageCount = data.images?.length || 0;
        
        networkResponses.push({
          url: response.url(),
          imageCount: imageCount,
          total: data.total || 0,
          timestamp: new Date().toISOString()
        });
        
        console.log(`📥 [API 응답] 이미지 ${imageCount}개 반환 (총 ${data.total || 0}개)`);
      } catch (e) {
        // JSON 파싱 실패 시 무시
      }
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
    
    // 6. 초기 이미지 로딩 대기
    console.log('⏳ 초기 이미지 로딩 대기 중... (10초)');
    await page.waitForTimeout(10000);
    
    // 7. 초기 이미지 개수 확인
    const initialImageCount = await page.$$eval('img[src*="supabase"]', imgs => imgs.length);
    console.log(`📸 초기 이미지 개수: ${initialImageCount}개`);
    
    // 8. 검색 입력 필드 찾기
    console.log('🔍 검색 입력 필드 찾기...');
    const searchInput = await page.waitForSelector('input[placeholder*="파일명, ALT 텍스트, 키워드"]', { timeout: 10000 });
    console.log('✅ 검색 입력 필드 찾음');
    
    // 9. 검색어 입력 ("진" 입력)
    console.log('⌨️ "진" 검색어 입력 중...');
    await searchInput.fill('');
    await page.waitForTimeout(500);
    await searchInput.type('진', { delay: 100 });
    await page.waitForTimeout(1000);
    console.log('✅ 검색어 입력 완료');
    
    // 10. 이미지 개수 추적 (0.5초마다 체크, 총 15초)
    const imageCountHistory = [];
    const checkInterval = 500; // 0.5초
    const totalCheckTime = 15000; // 15초
    const checkCount = totalCheckTime / checkInterval;
    
    console.log(`📊 이미지 개수 추적 시작 (${checkCount}회, ${checkInterval}ms 간격)...`);
    
    for (let i = 0; i < checkCount; i++) {
      await page.waitForTimeout(checkInterval);
      
      const currentImageCount = await page.$$eval('img[src*="supabase"]', imgs => imgs.length);
      const hasNoImagesMessage = await page.$('text=이미지가 없습니다').catch(() => null);
      const isLoading = await page.$('text=이미지 로딩 중').catch(() => null);
      
      imageCountHistory.push({
        time: i * checkInterval,
        imageCount: currentImageCount,
        hasNoImagesMessage: !!hasNoImagesMessage,
        isLoading: !!isLoading,
        timestamp: new Date().toISOString()
      });
      
      if (i % 2 === 0) { // 1초마다 출력
        console.log(`  [${i * checkInterval}ms] 이미지 ${currentImageCount}개, "이미지가 없습니다": ${hasNoImagesMessage ? '예' : '아니오'}`);
      }
    }
    
    // 11. Enter 키 입력 (즉시 검색)
    console.log('⌨️ Enter 키 입력 (즉시 검색)...');
    await searchInput.press('Enter');
    
    // 12. Enter 키 입력 후 이미지 개수 추적 (추가 10초)
    console.log('📊 Enter 키 입력 후 이미지 개수 추적 (10초)...');
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(checkInterval);
      
      const currentImageCount = await page.$$eval('img[src*="supabase"]', imgs => imgs.length);
      const hasNoImagesMessage = await page.$('text=이미지가 없습니다').catch(() => null);
      const isLoading = await page.$('text=이미지 로딩 중').catch(() => null);
      
      imageCountHistory.push({
        time: (checkCount + i) * checkInterval,
        imageCount: currentImageCount,
        hasNoImagesMessage: !!hasNoImagesMessage,
        isLoading: !!isLoading,
        timestamp: new Date().toISOString()
      });
      
      if (i % 2 === 0) {
        console.log(`  [${(checkCount + i) * checkInterval}ms] 이미지 ${currentImageCount}개, "이미지가 없습니다": ${hasNoImagesMessage ? '예' : '아니오'}`);
      }
    }
    
    // 13. 최종 대기 (추가 5초)
    console.log('⏳ 최종 대기 (5초)...');
    await page.waitForTimeout(5000);
    
    const finalImageCount = await page.$$eval('img[src*="supabase"]', imgs => imgs.length);
    console.log(`📸 최종 이미지 개수: ${finalImageCount}개`);
    
    // 14. 결과 분석
    console.log('\n📋 이미지 개수 변화 분석:');
    let maxCount = 0;
    let minCount = Infinity;
    let disappeared = false;
    
    imageCountHistory.forEach((entry, index) => {
      if (entry.imageCount > maxCount) maxCount = entry.imageCount;
      if (entry.imageCount < minCount) minCount = entry.imageCount;
      
      // 이미지가 나타났다가 사라진 경우 감지
      if (index > 0 && imageCountHistory[index - 1].imageCount > 0 && entry.imageCount === 0) {
        disappeared = true;
        console.log(`  ⚠️ [${entry.time}ms] 이미지가 사라짐! (이전: ${imageCountHistory[index - 1].imageCount}개 → 현재: 0개)`);
      }
    });
    
    console.log(`  - 최대 이미지 개수: ${maxCount}개`);
    console.log(`  - 최소 이미지 개수: ${minCount}개`);
    console.log(`  - 이미지 사라짐 감지: ${disappeared ? '✅ 예' : '❌ 아니오'}`);
    
    // 15. 검색 디버깅 로그 분석
    console.log('\n📋 검색 디버깅 로그 분석:');
    console.log(`  - 총 검색 디버깅 로그: ${searchDebugLogs.length}개`);
    console.log(`  - 총 이미지 상태 로그: ${imageStateLogs.length}개`);
    console.log(`  - 총 API 요청: ${networkRequests.length}개`);
    console.log(`  - 총 API 응답: ${networkResponses.length}개`);
    
    // 16. API 요청/응답 분석
    console.log('\n📋 API 요청/응답 분석:');
    networkRequests.forEach((req, index) => {
      console.log(`  [${index + 1}] searchQuery="${req.searchQuery}" (${req.timestamp})`);
    });
    
    networkResponses.forEach((resp, index) => {
      console.log(`  [${index + 1}] 응답: ${resp.imageCount}개 이미지 (총 ${resp.total}개) (${resp.timestamp})`);
    });
    
    // 17. 스크린샷 저장
    await page.screenshot({ path: 'e2e-test/gallery-search-disappear-test-result.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: e2e-test/gallery-search-disappear-test-result.png');
    
    // 18. 결과 요약
    console.log('\n📋 테스트 결과 요약:');
    console.log(`  - 초기 이미지 개수: ${initialImageCount}개`);
    console.log(`  - 최종 이미지 개수: ${finalImageCount}개`);
    console.log(`  - 최대 이미지 개수: ${maxCount}개`);
    console.log(`  - 이미지 사라짐 감지: ${disappeared ? '✅ 예 - 문제 발견!' : '❌ 아니오'}`);
    
    if (disappeared) {
      console.log('\n❌ 문제 발견: 이미지가 잠깐 나타났다가 사라지는 현상이 감지되었습니다!');
      console.log('   원인 분석:');
      console.log('   1. filteredImages useMemo가 실행되어 추가 필터링이 적용되었을 수 있습니다.');
      console.log('   2. 폴더 필터가 검색 결과를 필터링하여 사라졌을 수 있습니다.');
      console.log('   3. 여러 useEffect가 동시에 실행되어 상태가 여러 번 업데이트되었을 수 있습니다.');
      console.log('   4. 검색 결과와 현재 폴더 필터가 일치하지 않아 필터링되었을 수 있습니다.');
    }
    
    // 19. 이미지 개수 변화 그래프 데이터 저장
    const fs = require('fs');
    fs.writeFileSync(
      'e2e-test/gallery-search-disappear-image-count-history.json',
      JSON.stringify(imageCountHistory, null, 2)
    );
    console.log('\n💾 이미지 개수 변화 데이터 저장: e2e-test/gallery-search-disappear-image-count-history.json');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    await page.screenshot({ path: 'e2e-test/gallery-search-disappear-test-error.png', fullPage: true });
    throw error;
  } finally {
    // 브라우저를 닫지 않고 유지 (수동 확인용)
    console.log('\n🏁 테스트 완료 (브라우저는 수동으로 닫아주세요)');
    // await browser.close();
  }
}

// 테스트 실행
testGallerySearchDisappear().catch(console.error);
