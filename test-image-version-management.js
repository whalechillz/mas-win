const { chromium } = require('playwright');

(async () => {
  console.log('🚀 이미지 버전 관리 테스트 시작...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 1. 블로그 관리자 페이지로 이동
    console.log('📝 블로그 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog/');
    await page.waitForLoadState('networkidle');

    // 2. 네이버 블로그 스크래퍼로 이미지 가져오기
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

    // 7. "Supabase에 저장" 버튼 클릭
    console.log('💾 Supabase 저장 버튼 클릭...');
    const saveButtons = await page.locator('button:has-text("Supabase에 저장")').all();
    console.log(`📊 발견된 저장 버튼 개수: ${saveButtons.length}`);
    
    if (saveButtons.length > 0) {
      console.log('💾 첫 번째 이미지 저장 시작...');
      await saveButtons[0].click();
      await page.waitForTimeout(10000);
    }

    // 8. "전체 이미지 보기" 버튼 클릭
    console.log('📁 전체 이미지 갤러리 열기...');
    const allImagesButton = await page.locator('button:has-text("전체 이미지 보기")').first();
    if (await allImagesButton.isVisible()) {
      await allImagesButton.click();
      await page.waitForTimeout(3000);
    }

    // 9. 이미지 버전 정보 확인
    console.log('🔍 이미지 버전 정보 확인...');
    const versionInfoElements = await page.locator('text=🖼️').all();
    console.log(`📊 발견된 버전 정보 개수: ${versionInfoElements.length}`);
    
    versionInfoElements.forEach(async (element, index) => {
      const text = await element.textContent();
      console.log(`  ${index + 1}. ${text}`);
    });

    // 10. 버튼 기능 테스트
    console.log('🔧 버튼 기능 테스트...');
    
    // 삽입 버튼 테스트
    const insertButtons = await page.locator('button:has-text("📝 삽입")').all();
    console.log(`📝 삽입 버튼 개수: ${insertButtons.length}`);
    
    // 대표 버튼 테스트
    const representativeButtons = await page.locator('button:has-text("⭐ 대표")').all();
    console.log(`⭐ 대표 버튼 개수: ${representativeButtons.length}`);
    
    // 복사 버튼 테스트
    const copyButtons = await page.locator('button:has-text("📋 복사")').all();
    console.log(`📋 복사 버튼 개수: ${copyButtons.length}`);
    
    // 링크제거 버튼 테스트
    const linkRemoveButtons = await page.locator('button:has-text("🔗 링크제거")').all();
    console.log(`🔗 링크제거 버튼 개수: ${linkRemoveButtons.length}`);
    
    // 완전삭제 버튼 테스트
    const deleteButtons = await page.locator('button:has-text("🗑️ 완전삭제")').all();
    console.log(`🗑️ 완전삭제 버튼 개수: ${deleteButtons.length}`);

    // 11. 스크린샷 촬영
    console.log('📸 최종 결과 스크린샷 촬영...');
    await page.screenshot({ path: 'image-version-management-test-result.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: image-version-management-test-result.png');

    await browser.close();
    console.log('✅ 이미지 버전 관리 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    await browser.close();
  }
})();
