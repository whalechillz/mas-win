// 검색어 입력 표시 문제 테스트
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 검색어 입력 표시 문제 테스트 시작...\n');

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

    // 3. 검색 입력 필드 찾기 및 상태 확인
    console.log('3️⃣ 검색 입력 필드 확인 중...');
    const searchInput = await page.waitForSelector('input[type="text"][placeholder*="검색"], input[placeholder*="파일명"]');
    
    // 초기 상태 확인
    const initialValue = await searchInput.inputValue();
    console.log(`   초기 검색어 값: "${initialValue}"`);
    
    // 4. "마쓰구" 입력 테스트
    console.log('4️⃣ "마쓰구" 입력 테스트...');
    await searchInput.fill('마쓰구');
    await page.waitForTimeout(500); // 짧은 대기
    
    // 입력 후 즉시 값 확인
    const afterFillValue = await searchInput.inputValue();
    console.log(`   fill() 후 검색어 값: "${afterFillValue}"`);
    
    // API 호출 대기
    await page.waitForTimeout(3000);
    
    // API 호출 후 값 확인
    const afterApiValue = await searchInput.inputValue();
    console.log(`   API 호출 후 검색어 값: "${afterApiValue}"`);
    
    // 5. 한 글자씩 입력 테스트
    console.log('\n5️⃣ 한 글자씩 입력 테스트...');
    await searchInput.fill('');
    await page.waitForTimeout(500);
    
    await searchInput.type('마', { delay: 100 });
    await page.waitForTimeout(200);
    const afterChar1 = await searchInput.inputValue();
    console.log(`   "마" 입력 후: "${afterChar1}"`);
    
    await searchInput.type('쓰', { delay: 100 });
    await page.waitForTimeout(200);
    const afterChar2 = await searchInput.inputValue();
    console.log(`   "쓰" 입력 후: "${afterChar2}"`);
    
    await searchInput.type('구', { delay: 100 });
    await page.waitForTimeout(200);
    const afterChar3 = await searchInput.inputValue();
    console.log(`   "구" 입력 후: "${afterChar3}"`);
    
    // 최종 상태 확인
    await page.waitForTimeout(2000);
    const finalValue = await searchInput.inputValue();
    console.log(`   최종 검색어 값: "${finalValue}"`);
    
    // 6. 검색 결과 확인
    const imageCount = await page.evaluate(() => {
      const countText = document.body.innerText.match(/(\d+)개 표시/);
      return countText ? parseInt(countText[1]) : 0;
    });
    console.log(`\n6️⃣ 검색 결과: ${imageCount}개 이미지`);
    
    // 7. 스크린샷
    await page.screenshot({ path: 'playwright-results/search-input-display-test.png', fullPage: true });
    console.log('📸 스크린샷 저장: playwright-results/search-input-display-test.png');
    
    // 8. 콘솔 로그 확인
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('fetchImages') || text.includes('검색') || text.includes('searchQuery')) {
        consoleMessages.push(text);
        console.log(`   📝 콘솔: ${text}`);
      }
    });
    
    console.log('\n✅ 테스트 완료!');
    console.log(`\n📊 결과 요약:`);
    console.log(`   - 초기 검색어: "${initialValue}"`);
    console.log(`   - fill() 후 검색어: "${afterFillValue}"`);
    console.log(`   - API 호출 후 검색어: "${afterApiValue}"`);
    console.log(`   - 한 글자씩 입력 최종: "${finalValue}"`);
    console.log(`   - 검색 결과: ${imageCount}개 이미지`);
    
    if (finalValue !== '마쓰구') {
      console.log('\n⚠️ 문제 발견: 검색어가 입력 후 사라짐!');
    } else {
      console.log('\n✅ 검색어 입력 정상');
    }
    
    await page.waitForTimeout(5000);
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
    await page.screenshot({ path: 'playwright-results/search-input-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();

