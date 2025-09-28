const { chromium } = require('playwright');

(async () => {
  console.log('🚀 SEO API 직접 테스트 시작...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. 네이버 블로그 스크래핑
    console.log('📝 네이버 블로그 스크래핑...');
    await page.goto('http://localhost:3000/admin/blog/');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("🔵 네이버 블로그 스크래퍼")');
    await page.waitForTimeout(2000);

    const textarea = await page.locator('textarea').first();
    await textarea.fill('https://blog.naver.com/massgoogolf/223958579134');

    const scrapeButton = await page.locator('button:has-text("스크래핑 시작")').first();
    await scrapeButton.click();
    await page.waitForTimeout(8000);

    // 2. 첫 번째 포스트 마이그레이션
    console.log('🔄 포스트 마이그레이션...');
    const firstPostCheckbox = await page.locator('input[type="checkbox"]').first();
    if (await firstPostCheckbox.isVisible()) {
      await firstPostCheckbox.check();
    }

    const migrateButton = await page.locator('button:has-text("마이그레이션")').first();
    if (await migrateButton.isVisible()) {
      await migrateButton.click();
      await page.waitForTimeout(5000);
    }

    // 3. 게시물 편집 페이지로 이동
    console.log('✏️ 게시물 편집 페이지로 이동...');
    const editButton = await page.locator('button:has-text("수정")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(3000);
    }

    // 4. 네트워크 요청 모니터링 시작
    console.log('🔍 네트워크 요청 모니터링 시작...');
    const requests = [];
    const responses = [];

    page.on('request', request => {
      if (request.url().includes('/api/admin/save-external-image')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
        console.log('📤 요청 감지:', request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/admin/save-external-image')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers()
        });
        console.log('📥 응답 감지:', response.url(), response.status());
      }
    });

    // 5. 이미지 저장 버튼 찾기 및 클릭
    console.log('🖼️ 이미지 저장 버튼 찾기...');
    
    // 페이지 새로고침 후 다시 시도
    await page.reload();
    await page.waitForTimeout(3000);

    // 스크래핑된 이미지 섹션 찾기
    const scrapedImagesSection = await page.locator('text=네이버 블로그에서 가져온 이미지들').first();
    if (await scrapedImagesSection.isVisible()) {
      console.log('✅ 스크래핑된 이미지 섹션 발견');
      
      // "Supabase에 저장" 버튼 찾기
      const saveButtons = await page.locator('button:has-text("Supabase에 저장")').all();
      console.log(`📊 발견된 저장 버튼 개수: ${saveButtons.length}`);
      
      if (saveButtons.length > 0) {
        console.log('💾 첫 번째 이미지 저장 시작...');
        await saveButtons[0].click();
        
        // 저장 완료 대기
        console.log('⏳ 이미지 저장 완료 대기...');
        await page.waitForTimeout(10000);
        
        console.log('📊 요청/응답 통계:');
        console.log(`  요청 개수: ${requests.length}`);
        console.log(`  응답 개수: ${responses.length}`);
        
        if (responses.length > 0) {
          console.log('✅ 이미지 저장 API 호출 성공');
        } else {
          console.log('⚠️ 이미지 저장 API 호출이 감지되지 않음');
        }
      } else {
        console.log('❌ Supabase 저장 버튼을 찾을 수 없습니다.');
      }
    } else {
      console.log('❌ 스크래핑된 이미지 섹션을 찾을 수 없습니다.');
    }

    // 6. 전체 이미지 갤러리에서 결과 확인
    console.log('📁 전체 이미지 갤러리 확인...');
    const allImagesButton = await page.locator('button:has-text("전체 이미지 보기")').first();
    if (await allImagesButton.isVisible()) {
      await allImagesButton.click();
      await page.waitForTimeout(3000);
      
      // 저장된 이미지 확인
      const savedImages = await page.locator('img').count();
      console.log(`📊 저장된 이미지 개수: ${savedImages}`);
    }

    await browser.close();
    console.log('✅ SEO API 직접 테스트 완료');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    await browser.close();
  }
})();
