const { chromium } = require('playwright');

(async () => {
  console.log('🚀 그룹화 수정 테스트 시작...');
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
      await page.waitForTimeout(15000); // 5개 버전 생성 시간 대기
    }

    // 8. "전체 이미지 보기" 버튼 클릭
    console.log('📁 전체 이미지 갤러리 열기...');
    const allImagesButton = await page.locator('button:has-text("전체 이미지 보기")').first();
    if (await allImagesButton.isVisible()) {
      await allImagesButton.click();
      await page.waitForTimeout(3000);
    }

    // 9. 콘솔 로그 확인 (그룹화 로그)
    console.log('🔍 콘솔 로그에서 그룹화 정보 확인...');
    
    // 10. 5개 버전 그룹 확인
    console.log('🔍 5개 버전 그룹 확인...');
    const groupElements = await page.locator('text=5개').all();
    console.log(`📦 발견된 5개 그룹 요소 개수: ${groupElements.length}`);
    
    const versionCountElements = await page.locator('text=5개 버전 그룹').all();
    console.log(`📊 발견된 5개 버전 그룹 요소: ${versionCountElements.length}`);

    // 11. 그룹 썸네일 클릭 테스트
    console.log('🖱️ 그룹 썸네일 클릭 테스트...');
    const groupThumbnails = await page.locator('img').all();
    console.log(`🖼️ 발견된 썸네일 개수: ${groupThumbnails.length}`);
    
    if (groupThumbnails.length > 0) {
      console.log('🖱️ 첫 번째 그룹 썸네일 클릭...');
      await groupThumbnails[0].click();
      await page.waitForTimeout(2000);
      
      // 모달이 열렸는지 확인
      const modal = await page.locator('text=이미지 그룹').first();
      if (await modal.isVisible()) {
        console.log('✅ 이미지 그룹 모달이 성공적으로 열렸습니다!');
        
        // 모달 내부의 이미지들 확인
        const modalImages = await page.locator('img').all();
        console.log(`📦 모달 내부 이미지 개수: ${modalImages.length}`);
        
        // 5개 버전이 모두 있는지 확인
        if (modalImages.length >= 5) {
          console.log('✅ 5개 버전이 모두 생성되었습니다!');
        } else {
          console.log(`❌ 예상된 5개 버전이 아닙니다. 실제: ${modalImages.length}개`);
        }
        
        // 모달 닫기
        const closeButton = await page.locator('button:has-text("×")').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(1000);
        }
      } else {
        console.log('❌ 이미지 그룹 모달이 열리지 않았습니다.');
      }
    }

    // 12. 스크린샷 촬영
    console.log('📸 최종 결과 스크린샷 촬영...');
    await page.screenshot({ path: 'test-grouping-fix-result.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: test-grouping-fix-result.png');

    await browser.close();
    console.log('✅ 그룹화 수정 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    await browser.close();
  }
})();
