const { chromium } = require('playwright');

(async () => {
  console.log('🚀 마쓰구 SEO 최적화 테스트 시작...');
  const browser = await chromium.launch({ headless: false }); // 시각적 확인을 위해 headless: false
  const page = await browser.newPage();

  try {
    // 1. 블로그 관리자 페이지로 이동
    console.log('📝 블로그 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog/');
    await page.waitForSelector('h1', { timeout: 10000 });

    // 2. 네이버 블로그 스크래퍼 섹션 찾기
    console.log('🔍 네이버 블로그 스크래퍼 섹션 찾기...');
    const naverSection = await page.locator('text=네이버 블로그 스크래퍼').first();
    if (await naverSection.isVisible()) {
      console.log('✅ 네이버 블로그 스크래퍼 섹션 발견');
    } else {
      throw new Error('❌ 네이버 블로그 스크래퍼 섹션을 찾을 수 없습니다.');
    }

    // 3. URL 입력 필드 찾기 및 테스트 URL 입력
    console.log('📝 테스트 URL 입력...');
    const urlInput = await page.locator('input[type="url"]').first();
    if (await urlInput.isVisible()) {
      await urlInput.fill('https://blog.naver.com/massgoogolf/223958579134');
      console.log('✅ 테스트 URL 입력 완료');
    } else {
      throw new Error('❌ URL 입력 필드를 찾을 수 없습니다.');
    }

    // 4. 스크래핑 버튼 클릭
    console.log('🔄 스크래핑 시작...');
    const scrapeButton = await page.locator('button:has-text("스크래핑 시작")').first();
    if (await scrapeButton.isVisible()) {
      await scrapeButton.click();
      console.log('✅ 스크래핑 버튼 클릭 완료');
    } else {
      throw new Error('❌ 스크래핑 버튼을 찾을 수 없습니다.');
    }

    // 5. 스크래핑 완료 대기
    console.log('⏳ 스크래핑 완료 대기...');
    await page.waitForTimeout(5000); // 5초 대기

    // 6. 스크래핑된 이미지 확인
    console.log('🖼️ 스크래핑된 이미지 확인...');
    const scrapedImages = await page.locator('text=네이버 블로그에서 가져온 이미지들').first();
    if (await scrapedImages.isVisible()) {
      console.log('✅ 스크래핑된 이미지 섹션 발견');
    } else {
      console.log('⚠️ 스크래핑된 이미지 섹션을 찾을 수 없습니다.');
    }

    // 7. "슈파베이스에 저장" 버튼 클릭 (첫 번째 이미지)
    console.log('💾 첫 번째 이미지 Supabase 저장...');
    const saveButton = await page.locator('button:has-text("Supabase에 저장")').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      console.log('✅ Supabase 저장 버튼 클릭 완료');
    } else {
      console.log('⚠️ Supabase 저장 버튼을 찾을 수 없습니다.');
    }

    // 8. 저장 완료 대기
    console.log('⏳ 이미지 저장 완료 대기...');
    await page.waitForTimeout(10000); // 10초 대기 (AI 분석 포함)

    // 9. 전체 이미지 갤러리 확인
    console.log('📁 전체 이미지 갤러리 확인...');
    const allImagesButton = await page.locator('button:has-text("전체 이미지 보기")').first();
    if (await allImagesButton.isVisible()) {
      await allImagesButton.click();
      console.log('✅ 전체 이미지 갤러리 열기 완료');
    } else {
      console.log('⚠️ 전체 이미지 갤러리 버튼을 찾을 수 없습니다.');
    }

    // 10. 저장된 이미지의 파일명 확인
    console.log('🔍 저장된 이미지 파일명 확인...');
    await page.waitForTimeout(3000);
    
    // 파일명이 마쓰구 SEO 키워드를 포함하는지 확인
    const imageElements = await page.locator('img[alt*="masgoo"], img[alt*="massgoo"], img[alt*="golf"]').all();
    console.log(`📊 발견된 이미지 개수: ${imageElements.length}`);
    
    for (let i = 0; i < Math.min(imageElements.length, 3); i++) {
      const alt = await imageElements[i].getAttribute('alt');
      console.log(`🖼️ 이미지 ${i + 1} alt: ${alt}`);
    }

    // 11. 스크린샷 촬영
    console.log('📸 테스트 결과 스크린샷 촬영...');
    await page.screenshot({ path: 'masgoo-seo-test-result.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: masgoo-seo-test-result.png');

    // 12. 콘솔 로그 확인
    console.log('📋 브라우저 콘솔 로그 확인...');
    const logs = await page.evaluate(() => {
      return window.console.logs || [];
    });
    
    if (logs.length > 0) {
      console.log('🔍 브라우저 로그:');
      logs.slice(-10).forEach(log => console.log(`  ${log}`));
    }

    console.log('✅ 마쓰구 SEO 최적화 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    
    // 오류 발생 시 스크린샷 촬영
    await page.screenshot({ path: 'masgoo-seo-test-error.png', fullPage: true });
    console.log('📸 오류 스크린샷 저장: masgoo-seo-test-error.png');
  } finally {
    await browser.close();
  }
})();
