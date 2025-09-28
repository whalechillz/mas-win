const { chromium } = require('playwright');

(async () => {
  console.log('🚀 완전한 워크플로우 테스트 시작...');
  const browser = await chromium.launch({ headless: false }); // 시각적 확인
  const page = await browser.newPage();

  try {
    // 1. 블로그 관리자 페이지로 이동
    console.log('📝 블로그 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog/');
    await page.waitForLoadState('networkidle');

    // 2. 네이버 블로그 스크래퍼 버튼 클릭
    console.log('🔵 네이버 블로그 스크래퍼 버튼 클릭...');
    await page.click('button:has-text("🔵 네이버 블로그 스크래퍼")');
    await page.waitForTimeout(2000);

    // 3. URL 입력
    console.log('📝 URL 입력...');
    const textarea = await page.locator('textarea').first();
    await textarea.fill('https://blog.naver.com/massgoogolf/223958579134');

    // 4. 스크래핑 시작
    console.log('🔄 스크래핑 시작...');
    const scrapeButton = await page.locator('button:has-text("스크래핑 시작")').first();
    await scrapeButton.click();
    await page.waitForTimeout(8000);

    // 5. 첫 번째 포스트 마이그레이션
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

    // 6. 게시물 편집 페이지로 이동
    console.log('✏️ 게시물 편집 페이지로 이동...');
    const editButton = await page.locator('button:has-text("수정")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(3000);
    }

    // 7. 스크래핑된 이미지 섹션 확인
    console.log('🖼️ 스크래핑된 이미지 섹션 확인...');
    const scrapedImagesSection = await page.locator('text=네이버 블로그에서 가져온 이미지들').first();
    if (await scrapedImagesSection.isVisible()) {
      console.log('✅ 스크래핑된 이미지 섹션 발견');
      
      // 8. "Supabase에 저장" 버튼 클릭
      console.log('💾 Supabase 저장 버튼 클릭...');
      const saveButtons = await page.locator('button:has-text("Supabase에 저장")').all();
      console.log(`📊 발견된 저장 버튼 개수: ${saveButtons.length}`);
      
      if (saveButtons.length > 0) {
        console.log('💾 첫 번째 이미지 저장 시작...');
        await saveButtons[0].click();
        
        // 저장 완료 대기
        console.log('⏳ 이미지 저장 완료 대기...');
        await page.waitForTimeout(10000);
        
        // 성공 메시지 확인
        const successMessage = await page.locator('text=이미지가 Supabase에 성공적으로 저장되었습니다').first();
        if (await successMessage.isVisible()) {
          console.log('✅ 이미지 저장 성공 메시지 확인');
        }
      } else {
        console.log('❌ Supabase 저장 버튼을 찾을 수 없습니다.');
      }
    } else {
      console.log('❌ 스크래핑된 이미지 섹션을 찾을 수 없습니다.');
    }

    // 9. 이미지 그룹 썸네일 확인
    console.log('📦 이미지 그룹 썸네일 확인...');
    const groupThumbnails = await page.locator('[class*="group"], [class*="thumbnail"]').all();
    console.log(`📦 발견된 그룹 썸네일 개수: ${groupThumbnails.length}`);

    // 10. 전체 이미지 갤러리 확인
    console.log('📁 전체 이미지 갤러리 확인...');
    const allImagesButton = await page.locator('button:has-text("전체 이미지 보기")').first();
    if (await allImagesButton.isVisible()) {
      await allImagesButton.click();
      await page.waitForTimeout(3000);
      
      // 저장된 이미지 확인
      const savedImages = await page.locator('img').count();
      console.log(`📊 저장된 이미지 개수: ${savedImages}`);
    }

    // 11. 마쓰구 SEO 키워드 확인
    console.log('🎯 마쓰구 SEO 키워드 확인...');
    const pageContent = await page.content();
    const masgooKeywords = ['masgoo', 'massgoo', 'masgolf', '마쓰구', '마스골프'];
    
    masgooKeywords.forEach(keyword => {
      const count = (pageContent.match(new RegExp(keyword, 'gi')) || []).length;
      if (count > 0) {
        console.log(`  ✅ "${keyword}": ${count}개 발견`);
      }
    });

    // 12. 스크린샷 촬영
    console.log('📸 최종 결과 스크린샷 촬영...');
    await page.screenshot({ path: 'complete-workflow-test-result.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: complete-workflow-test-result.png');

    await browser.close();
    console.log('✅ 완전한 워크플로우 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    await browser.close();
  }
})();
