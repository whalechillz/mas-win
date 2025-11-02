// 검색 기능 종합 테스트
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 검색 기능 종합 테스트 시작...\n');

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

    // 3. 검색 입력 필드 찾기
    console.log('3️⃣ 검색 입력 필드 확인 중...');
    const searchInput = await page.waitForSelector('input[type="text"][placeholder*="검색"], input[placeholder*="파일명"]');
    console.log('✅ 검색 입력 필드 찾음\n');

    // 4. "마쓰구" 빠르게 입력 (디바운싱 테스트)
    console.log('4️⃣ "마쓰구" 빠르게 입력 중 (디바운싱 테스트)...');
    const networkRequests = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/admin/all-images')) {
        networkRequests.push({
          url: request.url(),
          timestamp: Date.now()
        });
      }
    });
    
    await searchInput.fill(''); // 초기화
    await page.waitForTimeout(100);
    
    // 빠르게 입력 (각 글자 사이 100ms 대기)
    await searchInput.type('마', { delay: 50 });
    await page.waitForTimeout(100);
    
    await searchInput.type('쓰', { delay: 50 });
    await page.waitForTimeout(100);
    
    await searchInput.type('구', { delay: 50 });
    
    // 디바운스 완료 대기 (500ms + 여유시간)
    await page.waitForTimeout(1000);
    
    console.log(`   📊 총 API 호출 횟수: ${networkRequests.length}회`);
    if (networkRequests.length === 1) {
      console.log('   ✅ 디바운싱 정상 작동 (1회만 호출)\n');
    } else {
      console.log(`   ⚠️ 디바운싱 동작 확인 필요 (${networkRequests.length}회 호출)\n`);
    }

    // 5. 검색어 표시 확인
    console.log('5️⃣ 검색어 표시 확인 중...');
    const searchValue = await searchInput.inputValue();
    console.log(`   검색어: "${searchValue}"`);
    if (searchValue === '마쓰구') {
      console.log('   ✅ 검색어 입력 필드에 정상 표시\n');
    } else {
      console.log(`   ❌ 검색어 표시 문제 (예상: "마쓰구", 실제: "${searchValue}")\n`);
    }

    // 6. 검색 결과 확인
    console.log('6️⃣ 검색 결과 확인 중...');
    await page.waitForTimeout(2000); // 결과 렌더링 대기
    
    const resultText = await page.evaluate(() => {
      const text = document.body.innerText;
      const match = text.match(/(\d+)개 표시/);
      return match ? parseInt(match[1]) : 0;
    });
    
    console.log(`   검색 결과: ${resultText}개 이미지`);
    if (resultText > 0) {
      console.log('   ✅ 검색 결과 정상 표시\n');
    } else {
      console.log('   ⚠️ 검색 결과 표시 확인 필요\n');
    }

    // 7. Enter 키로 즉시 검색 테스트
    console.log('7️⃣ Enter 키로 즉시 검색 테스트 중...');
    await searchInput.fill('해변');
    await page.waitForTimeout(100);
    
    const requestsBeforeEnter = networkRequests.length;
    await searchInput.press('Enter');
    await page.waitForTimeout(1500);
    
    const requestsAfterEnter = networkRequests.length;
    console.log(`   Enter 키 입력 전: ${requestsBeforeEnter}회`);
    console.log(`   Enter 키 입력 후: ${requestsAfterEnter}회`);
    
    if (requestsAfterEnter > requestsBeforeEnter) {
      console.log('   ✅ Enter 키로 즉시 검색 작동\n');
    } else {
      console.log('   ⚠️ Enter 키 검색 확인 필요\n');
    }

    // 8. 최종 검색 결과 확인
    console.log('8️⃣ 최종 검색 결과 확인 중...');
    await page.waitForTimeout(2000);
    
    const finalResult = await page.evaluate(() => {
      const text = document.body.innerText;
      const match = text.match(/(\d+)개 표시/);
      return match ? parseInt(match[1]) : 0;
    });
    
    console.log(`   최종 검색 결과: ${finalResult}개 이미지`);
    console.log(finalResult > 0 ? '   ✅ 검색 성공\n' : '   ⚠️ 검색 결과 확인 필요\n');

    // 9. 스크린샷
    await page.screenshot({ path: 'playwright-results/search-complete-test.png', fullPage: true });
    console.log('📸 스크린샷 저장: playwright-results/search-complete-test.png');

    console.log('✅ 테스트 완료!');
    console.log('\n📊 최종 결과 요약:');
    console.log(`   - 디바운싱: ${networkRequests.length <= 2 ? '✅ 정상' : '⚠️ 확인 필요'}`);
    console.log(`   - 검색어 표시: ${searchValue === '마쓰구' || searchValue === '해변' ? '✅ 정상' : '⚠️ 확인 필요'}`);
    console.log(`   - 검색 결과: ${finalResult > 0 ? '✅ 정상' : '⚠️ 확인 필요'}`);
    console.log(`   - Enter 키 검색: ${requestsAfterEnter > requestsBeforeEnter ? '✅ 정상' : '⚠️ 확인 필요'}`);

    await page.waitForTimeout(3000);
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
    await page.screenshot({ path: 'playwright-results/search-complete-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();

