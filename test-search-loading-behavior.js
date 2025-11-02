// 검색 시 여러 번 로딩되는 현상 테스트
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const networkRequests = [];
  const consoleMessages = [];

  // 네트워크 요청 추적
  page.on('request', request => {
    if (request.url().includes('/api/admin/all-images')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      console.log(`   📡 API 요청 #${networkRequests.length}: ${request.method()} ${request.url()}`);
    }
  });

  // 응답 추적
  page.on('response', async response => {
    if (response.url().includes('/api/admin/all-images')) {
      try {
        const data = await response.json();
        console.log(`   📥 API 응답 #${networkRequests.length}: ${response.status()} - total: ${data.total}, images: ${data.images?.length || 0}`);
      } catch (e) {
        console.log(`   📥 API 응답 #${networkRequests.length}: ${response.status()} (JSON 파싱 실패)`);
      }
    }
  });

  // 콘솔 메시지 추적
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('fetchImages') || text.includes('검색') || text.includes('API')) {
      consoleMessages.push(text);
      console.log(`   📝 콘솔: ${text}`);
    }
  });

  try {
    console.log('🔍 검색 로딩 동작 테스트 시작...\n');

    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('https://www.masgolf.co.kr/admin/login');
    await page.waitForTimeout(2000);
    
    const phoneInput = await page.waitForSelector('input[type="tel"], input[placeholder*="전화번호"], input[name*="phone"]', { timeout: 5000 });
    await phoneInput.fill('010-6669-9000');
    await page.waitForTimeout(500);
    
    const passwordInput = await page.waitForSelector('input[type="password"], input[placeholder*="비밀번호"], input[name*="password"]');
    await passwordInput.fill('66699000');
    await page.waitForTimeout(500);
    
    const loginButton = await page.waitForSelector('button[type="submit"], button:has-text("로그인"), button:has-text("Login")');
    await loginButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ 로그인 완료\n');

    // 2. 갤러리 페이지로 이동
    console.log('2️⃣ 갤러리 페이지로 이동 중...');
    await page.goto('https://www.masgolf.co.kr/admin/gallery');
    await page.waitForTimeout(3000);
    console.log('✅ 갤러리 페이지 로드 완료\n');

    // 3. "전체 폴더" 확인
    console.log('3️⃣ "전체 폴더" 확인 중...');
    const folderSelect = await page.waitForSelector('select:has(option[value="all"]), select');
    const currentFolder = await folderSelect.inputValue();
    if (currentFolder !== 'all') {
      await folderSelect.selectOption('all');
      await page.waitForTimeout(2000);
    }
    console.log(`   현재 폴더: ${currentFolder === 'all' ? '전체 폴더' : currentFolder}\n`);

    // 4. 검색 입력 필드 찾기
    console.log('4️⃣ 검색 입력 필드 확인 중...');
    const searchInput = await page.waitForSelector('input[type="text"][placeholder*="검색"], input[placeholder*="파일명"]');
    console.log('✅ 검색 입력 필드 찾음\n');

    // 5. "마쓰구" 입력 (한 글자씩)
    console.log('5️⃣ "마쓰구" 입력 중 (한 글자씩)...');
    networkRequests.length = 0; // 카운터 리셋
    consoleMessages.length = 0;
    
    await searchInput.fill(''); // 초기화
    await page.waitForTimeout(500);
    
    await searchInput.type('마', { delay: 100 });
    await page.waitForTimeout(1000);
    console.log(`   "마" 입력 후 API 호출 횟수: ${networkRequests.length}`);
    
    await searchInput.type('쓰', { delay: 100 });
    await page.waitForTimeout(1000);
    console.log(`   "쓰" 입력 후 API 호출 횟수: ${networkRequests.length}`);
    
    await searchInput.type('구', { delay: 100 });
    await page.waitForTimeout(3000); // 최종 검색 대기
    console.log(`   "구" 입력 후 API 호출 횟수: ${networkRequests.length}`);
    
    console.log(`\n   📊 총 API 호출 횟수: ${networkRequests.length}회`);
    console.log(`   📊 콘솔 메시지 수: ${consoleMessages.length}개\n`);

    // 6. 최종 검색 결과 확인
    console.log('6️⃣ 최종 검색 결과 확인 중...');
    const finalValue = await searchInput.inputValue();
    const imageCount = await page.evaluate(() => {
      const countText = document.body.innerText.match(/(\d+)개 표시/);
      return countText ? parseInt(countText[1]) : 0;
    });
    
    console.log(`   검색어: "${finalValue}"`);
    console.log(`   검색 결과: ${imageCount}개 이미지`);
    console.log(imageCount > 0 ? '   ✅ 검색 성공\n' : '   ❌ 검색 실패\n');

    // 7. 네트워크 요청 상세 로그
    console.log('7️⃣ 네트워크 요청 상세:');
    networkRequests.forEach((req, index) => {
      const searchQueryMatch = req.url.match(/searchQuery=([^&]*)/);
      const searchQuery = searchQueryMatch ? decodeURIComponent(searchQueryMatch[1]) : '없음';
      console.log(`   ${index + 1}. ${req.method || 'GET'} - searchQuery: ${searchQuery}`);
    });

    // 8. 스크린샷
    await page.screenshot({ path: 'playwright-results/search-loading-behavior.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: playwright-results/search-loading-behavior.png');

    console.log('\n✅ 테스트 완료!');
    console.log(`\n📊 결과 요약:`);
    console.log(`   - 총 API 호출 횟수: ${networkRequests.length}회`);
    console.log(`   - 최종 검색어: "${finalValue}"`);
    console.log(`   - 검색 결과: ${imageCount}개 이미지`);
    
    if (networkRequests.length > 3) {
      console.log(`\n⚠️ 주의: API 호출이 ${networkRequests.length}회 발생했습니다. 디바운싱이 필요할 수 있습니다.`);
    } else {
      console.log(`\n✅ API 호출 횟수가 적절합니다 (${networkRequests.length}회).`);
    }

    await page.waitForTimeout(5000);
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
    await page.screenshot({ path: 'playwright-results/search-loading-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();

