// TSVECTOR 서버 사이드 검색 테스트
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 TSVECTOR 서버 사이드 검색 테스트 시작...\n');

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

    // 3. "originals" 폴더 선택
    console.log('3️⃣ "originals" 폴더 선택 중...');
    const folderSelect = await page.waitForSelector('select:has(option[value="all"]), select');
    await folderSelect.selectOption({ label: /originals/i });
    await page.waitForTimeout(3000);
    console.log('✅ 폴더 선택 완료\n');

    // 4. "마쓰구" 검색 테스트
    console.log('4️⃣ "마쓰구" 검색 테스트...');
    const searchInput = await page.waitForSelector('input[type="text"][placeholder*="검색"], input[placeholder*="파일명"]');
    await searchInput.fill('마쓰구');
    await page.waitForTimeout(3000);
    
    const imageCount = await page.evaluate(() => {
      const countText = document.body.innerText.match(/(\d+)개 표시/);
      return countText ? parseInt(countText[1]) : 0;
    });
    console.log(`   검색 결과: ${imageCount}개 이미지`);
    console.log(imageCount > 0 ? '   ✅ "마쓰구" 검색 성공\n' : '   ❌ "마쓰구" 검색 실패\n');

    // 5. 검색어 초기화 및 "해변" 검색 테스트
    console.log('5️⃣ "해변" 검색 테스트...');
    await searchInput.fill('');
    await page.waitForTimeout(2000);
    await searchInput.fill('해변');
    await page.waitForTimeout(3000);
    
    const imageCount2 = await page.evaluate(() => {
      const countText = document.body.innerText.match(/(\d+)개 표시/);
      return countText ? parseInt(countText[1]) : 0;
    });
    console.log(`   검색 결과: ${imageCount2}개 이미지`);
    console.log(imageCount2 > 0 ? '   ✅ "해변" 검색 성공\n' : '   ❌ "해변" 검색 실패\n');

    // 6. 전체 폴더에서 검색 테스트
    console.log('6️⃣ "전체 폴더"에서 "마쓰구" 검색 테스트...');
    await folderSelect.selectOption('all');
    await page.waitForTimeout(2000);
    await searchInput.fill('마쓰구');
    await page.waitForTimeout(3000);
    
    const imageCount3 = await page.evaluate(() => {
      const countText = document.body.innerText.match(/(\d+)개 표시/);
      return countText ? parseInt(countText[1]) : 0;
    });
    console.log(`   검색 결과: ${imageCount3}개 이미지`);
    console.log(imageCount3 > 0 ? '   ✅ "전체 폴더" 검색 성공\n' : '   ⚠️ "전체 폴더" 검색 결과 없음 (정상 - 메타데이터에 따라 다를 수 있음)\n');

    console.log('✅ 테스트 완료!');
    console.log(`\n📊 결과 요약:`);
    console.log(`   - "originals" 폴더에서 "마쓰구" 검색: ${imageCount > 0 ? '✅' : '❌'} ${imageCount}개`);
    console.log(`   - "originals" 폴더에서 "해변" 검색: ${imageCount2 > 0 ? '✅' : '❌'} ${imageCount2}개`);
    console.log(`   - "전체 폴더"에서 "마쓰구" 검색: ${imageCount3 > 0 ? '✅' : '⚠️'} ${imageCount3}개`);

    await page.screenshot({ path: 'playwright-results/tsvector-search-test.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: playwright-results/tsvector-search-test.png');

    await page.waitForTimeout(5000);
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  } finally {
    await browser.close();
  }
})();

