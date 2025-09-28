const { chromium } = require('playwright');

(async () => {
  console.log('🚀 올바른 입력 필드 테스트 시작...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000/admin/blog/');
    await page.waitForLoadState('networkidle');

    // 네이버 스크래퍼 버튼 클릭
    console.log('🔵 네이버 스크래퍼 버튼 클릭...');
    await page.click('button:has-text("🔵 네이버 블로그 스크래퍼")');
    await page.waitForTimeout(2000);

    // URL 직접 입력 모드 선택 (기본값이어야 함)
    console.log('📝 URL 직접 입력 모드 확인...');
    const urlModeRadio = await page.locator('input[value="urls"]').first();
    if (await urlModeRadio.isVisible()) {
      console.log('✅ URL 직접 입력 모드가 선택되어 있음');
    } else {
      await urlModeRadio.click();
      console.log('✅ URL 직접 입력 모드 선택');
    }

    // textarea 입력 필드 찾기
    console.log('📝 textarea 입력 필드 찾기...');
    const textarea = await page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('https://blog.naver.com/massgoogolf/223958579134');
      console.log('✅ URL 입력 완료');
    } else {
      console.log('❌ textarea 입력 필드를 찾을 수 없습니다.');
      return;
    }

    // 스크래핑 버튼 상태 확인
    console.log('🔍 스크래핑 버튼 상태 확인...');
    const scrapeButton = await page.locator('button:has-text("스크래핑 시작")').first();
    const isDisabled = await scrapeButton.isDisabled();
    console.log(`스크래핑 버튼 비활성화 상태: ${isDisabled}`);

    if (!isDisabled) {
      // 스크래핑 시작
      console.log('🔄 스크래핑 시작...');
      await scrapeButton.click();
      console.log('✅ 스크래핑 버튼 클릭 완료');

      // 결과 대기
      console.log('⏳ 스크래핑 결과 대기...');
      await page.waitForTimeout(10000);

      // 결과 확인
      const scrapedPosts = await page.locator('text=스크래핑 결과').count();
      console.log('📊 스크래핑 결과 섹션 개수:', scrapedPosts);

      // 이미지 개수 확인
      const images = await page.locator('img').count();
      console.log('📊 발견된 이미지 개수:', images);

      // 마쓰구 키워드 확인
      const pageContent = await page.content();
      const masgooKeywords = ['masgoo', 'massgoo', 'masgolf', '마쓰구', '마스골프'];
      
      console.log('🎯 마쓰구 키워드 확인:');
      masgooKeywords.forEach(keyword => {
        const count = (pageContent.match(new RegExp(keyword, 'gi')) || []).length;
        if (count > 0) {
          console.log(`  ✅ "${keyword}": ${count}개 발견`);
        }
      });

    } else {
      console.log('❌ 스크래핑 버튼이 여전히 비활성화 상태입니다.');
    }

    await browser.close();
    console.log('✅ 테스트 완료');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    await browser.close();
  }
})();
