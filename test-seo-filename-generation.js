const { chromium } = require('playwright');

(async () => {
  console.log('🚀 SEO 파일명 생성 테스트 시작...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000/admin/blog/');
    await page.waitForLoadState('networkidle');

    // 네이버 스크래퍼 버튼 클릭
    await page.click('button:has-text("🔵 네이버 블로그 스크래퍼")');
    await page.waitForTimeout(2000);

    // URL 입력
    const textarea = await page.locator('textarea').first();
    await textarea.fill('https://blog.naver.com/massgoogolf/223958579134');

    // 스크래핑 시작
    const scrapeButton = await page.locator('button:has-text("스크래핑 시작")').first();
    await scrapeButton.click();
    await page.waitForTimeout(8000);

    // 스크래핑 결과에서 첫 번째 포스트 선택
    console.log('📝 첫 번째 포스트 선택...');
    const firstPostCheckbox = await page.locator('input[type="checkbox"]').first();
    if (await firstPostCheckbox.isVisible()) {
      await firstPostCheckbox.check();
      console.log('✅ 첫 번째 포스트 선택 완료');
    }

    // 마이그레이션 버튼 클릭
    console.log('🔄 마이그레이션 시작...');
    const migrateButton = await page.locator('button:has-text("마이그레이션")').first();
    if (await migrateButton.isVisible()) {
      await migrateButton.click();
      console.log('✅ 마이그레이션 버튼 클릭 완료');
      await page.waitForTimeout(5000);
    }

    // 게시물 편집 페이지로 이동
    console.log('✏️ 게시물 편집 페이지로 이동...');
    const editButton = await page.locator('button:has-text("수정")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(3000);
    }

    // 이미지 갤러리 섹션 찾기
    console.log('🖼️ 이미지 갤러리 섹션 찾기...');
    const gallerySection = await page.locator('text=스크래핑 이미지').first();
    if (await gallerySection.isVisible()) {
      console.log('✅ 이미지 갤러리 섹션 발견');
    }

    // "Supabase에 저장" 버튼 찾기 및 클릭
    console.log('💾 Supabase 저장 버튼 찾기...');
    const saveButtons = await page.locator('button:has-text("Supabase에 저장")').all();
    console.log(`📊 발견된 Supabase 저장 버튼 개수: ${saveButtons.length}`);

    if (saveButtons.length > 0) {
      await saveButtons[0].click();
      console.log('✅ 첫 번째 이미지 Supabase 저장 시작');
      
      // 저장 완료 대기 (AI 분석 포함)
      console.log('⏳ 이미지 저장 및 AI 분석 대기...');
      await page.waitForTimeout(15000);
    }

    // 전체 이미지 갤러리 확인
    console.log('📁 전체 이미지 갤러리 확인...');
    const allImagesButton = await page.locator('button:has-text("전체 이미지 보기")').first();
    if (await allImagesButton.isVisible()) {
      await allImagesButton.click();
      await page.waitForTimeout(3000);
    }

    // 저장된 이미지의 파일명 확인
    console.log('🔍 저장된 이미지 파일명 확인...');
    const imageElements = await page.locator('img').all();
    console.log(`📊 발견된 이미지 개수: ${imageElements.length}`);
    
    for (let i = 0; i < Math.min(imageElements.length, 5); i++) {
      const alt = await imageElements[i].getAttribute('alt');
      const src = await imageElements[i].getAttribute('src');
      console.log(`🖼️ 이미지 ${i + 1}:`);
      console.log(`  alt: ${alt}`);
      if (src) {
        const fileName = src.split('/').pop();
        console.log(`  파일명: ${fileName}`);
        
        // 마쓰구 SEO 키워드 확인
        const masgooKeywords = ['masgoo', 'massgoo', 'masgolf', 'golf', 'driver'];
        const hasMasgooKeyword = masgooKeywords.some(keyword => 
          fileName.toLowerCase().includes(keyword.toLowerCase())
        );
        console.log(`  마쓰구 SEO 키워드 포함: ${hasMasgooKeyword ? '✅' : '❌'}`);
      }
    }

    // 스크린샷 촬영
    await page.screenshot({ path: 'seo-filename-test-result.png', fullPage: true });
    console.log('📸 테스트 결과 스크린샷 저장: seo-filename-test-result.png');

    await browser.close();
    console.log('✅ SEO 파일명 생성 테스트 완료');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    await browser.close();
  }
})();
