const { chromium } = require('playwright');

(async () => {
  console.log('🚀 마쓰구 SEO 최적화 테스트 v2 시작...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 1. 블로그 관리자 페이지로 이동
    console.log('📝 블로그 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog/');
    await page.waitForLoadState('networkidle');

    // 2. 네이버 블로그 스크래퍼 버튼 클릭
    console.log('🔵 네이버 블로그 스크래퍼 버튼 클릭...');
    const naverButton = await page.locator('button:has-text("🔵 네이버 블로그 스크래퍼")').first();
    if (await naverButton.isVisible()) {
      await naverButton.click();
      console.log('✅ 네이버 블로그 스크래퍼 버튼 클릭 완료');
      await page.waitForTimeout(2000); // 섹션 로딩 대기
    } else {
      throw new Error('❌ 네이버 블로그 스크래퍼 버튼을 찾을 수 없습니다.');
    }

    // 3. URL 입력 필드 찾기 및 테스트 URL 입력
    console.log('📝 테스트 URL 입력...');
    const urlInput = await page.locator('input[type="url"], input[placeholder*="URL"], input[placeholder*="url"]').first();
    if (await urlInput.isVisible()) {
      await urlInput.fill('https://blog.naver.com/massgoogolf/223958579134');
      console.log('✅ 테스트 URL 입력 완료');
    } else {
      // 다른 방법으로 입력 필드 찾기
      const textInputs = await page.locator('input[type="text"]').all();
      if (textInputs.length > 0) {
        await textInputs[0].fill('https://blog.naver.com/massgoogolf/223958579134');
        console.log('✅ 텍스트 입력 필드에 URL 입력 완료');
      } else {
        throw new Error('❌ URL 입력 필드를 찾을 수 없습니다.');
      }
    }

    // 4. 스크래핑 버튼 클릭
    console.log('🔄 스크래핑 시작...');
    const scrapeButton = await page.locator('button:has-text("스크래핑"), button:has-text("시작"), button:has-text("추출")').first();
    if (await scrapeButton.isVisible()) {
      await scrapeButton.click();
      console.log('✅ 스크래핑 버튼 클릭 완료');
    } else {
      // 다른 방법으로 버튼 찾기
      const buttons = await page.locator('button').all();
      for (let button of buttons) {
        const text = await button.textContent();
        if (text && (text.includes('스크래핑') || text.includes('시작') || text.includes('추출'))) {
          await button.click();
          console.log('✅ 스크래핑 버튼 클릭 완료');
          break;
        }
      }
    }

    // 5. 스크래핑 완료 대기
    console.log('⏳ 스크래핑 완료 대기...');
    await page.waitForTimeout(8000); // 8초 대기

    // 6. 스크래핑된 이미지 확인
    console.log('🖼️ 스크래핑된 이미지 확인...');
    const scrapedImages = await page.locator('text=네이버, text=이미지, text=가져온').first();
    if (await scrapedImages.isVisible()) {
      console.log('✅ 스크래핑된 이미지 섹션 발견');
    } else {
      console.log('⚠️ 스크래핑된 이미지 섹션을 찾을 수 없습니다.');
    }

    // 7. "슈파베이스에 저장" 버튼 클릭 (첫 번째 이미지)
    console.log('💾 첫 번째 이미지 Supabase 저장...');
    const saveButton = await page.locator('button:has-text("Supabase"), button:has-text("저장")').first();
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
    const allImagesButton = await page.locator('button:has-text("전체"), button:has-text("갤러리")').first();
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
    const imageElements = await page.locator('img').all();
    console.log(`📊 발견된 이미지 개수: ${imageElements.length}`);
    
    for (let i = 0; i < Math.min(imageElements.length, 5); i++) {
      const alt = await imageElements[i].getAttribute('alt');
      const src = await imageElements[i].getAttribute('src');
      console.log(`🖼️ 이미지 ${i + 1}:`);
      console.log(`  alt: ${alt}`);
      console.log(`  src: ${src ? src.substring(0, 100) + '...' : 'N/A'}`);
    }

    // 11. 스크린샷 촬영
    console.log('📸 테스트 결과 스크린샷 촬영...');
    await page.screenshot({ path: 'masgoo-seo-test-result-v2.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: masgoo-seo-test-result-v2.png');

    // 12. 마쓰구 SEO 키워드 확인
    console.log('🎯 마쓰구 SEO 키워드 확인:');
    const pageContent = await page.content();
    const masgooKeywords = ['masgoo', 'massgoo', 'masgolf', '마쓰구', '마스골프'];
    
    masgooKeywords.forEach(keyword => {
      const count = (pageContent.match(new RegExp(keyword, 'gi')) || []).length;
      if (count > 0) {
        console.log(`  ✅ "${keyword}": ${count}개 발견`);
      }
    });

    console.log('✅ 마쓰구 SEO 최적화 테스트 v2 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    
    // 오류 발생 시 스크린샷 촬영
    await page.screenshot({ path: 'masgoo-seo-test-error-v2.png', fullPage: true });
    console.log('📸 오류 스크린샷 저장: masgoo-seo-test-error-v2.png');
  } finally {
    await browser.close();
  }
})();
