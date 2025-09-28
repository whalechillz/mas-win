const { chromium } = require('playwright');

(async () => {
  console.log('🚀 수정된 검증 테스트 시작...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000/admin/blog/');
    await page.waitForLoadState('networkidle');

    // 네이버 스크래퍼 버튼 클릭
    console.log('🔵 네이버 스크래퍼 버튼 클릭...');
    await page.click('button:has-text("🔵 네이버 블로그 스크래퍼")');
    await page.waitForTimeout(2000);

    // URL 입력 필드 찾기 (text 타입만)
    console.log('📝 URL 입력 필드 찾기...');
    const urlInput = await page.locator('input[type="text"]').first();
    if (await urlInput.isVisible()) {
      await urlInput.fill('https://blog.naver.com/massgoogolf/223958579134');
      console.log('✅ URL 입력 완료');
    } else {
      console.log('⚠️ URL 입력 필드를 찾을 수 없습니다.');
    }

    // 스크래핑 버튼 클릭
    console.log('🔄 스크래핑 시작...');
    const buttons = await page.locator('button').all();
    let scrapeClicked = false;
    
    for (let button of buttons) {
      const text = await button.textContent();
      if (text && (text.includes('스크래핑') || text.includes('시작') || text.includes('추출'))) {
        await button.click();
        console.log('✅ 스크래핑 버튼 클릭 완료');
        scrapeClicked = true;
        break;
      }
    }
    
    if (!scrapeClicked) {
      console.log('⚠️ 스크래핑 버튼을 찾을 수 없습니다.');
    }

    // 결과 대기 및 확인
    console.log('⏳ 스크래핑 결과 대기...');
    await page.waitForTimeout(8000);

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

    // Supabase 저장 버튼 확인
    const saveButtons = await page.locator('button:has-text("Supabase"), button:has-text("저장")').count();
    console.log('💾 Supabase 저장 버튼 개수:', saveButtons);

    await browser.close();
    console.log('✅ 검증 테스트 완료');

  } catch (error) {
    console.error('❌ 검증 실패:', error.message);
    await browser.close();
  }
})();
