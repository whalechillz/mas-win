const { chromium } = require('playwright');

(async () => {
  console.log('🚀 에러 수정 테스트 시작...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 1. 블로그 관리자 페이지로 이동
    console.log('📝 블로그 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog/');
    await page.waitForLoadState('networkidle');

    // 2. 페이지 로딩 확인
    console.log('⏳ 페이지 로딩 대기...');
    await page.waitForTimeout(5000);

    // 3. 에러가 없는지 확인
    console.log('🔍 에러 확인...');
    const errorElements = await page.locator('text=Unhandled Runtime Error').count();
    if (errorElements > 0) {
      console.log('❌ 에러가 여전히 존재합니다.');
    } else {
      console.log('✅ 에러가 해결되었습니다!');
    }

    // 4. 이미지 갤러리 섹션 확인
    console.log('🖼️ 이미지 갤러리 섹션 확인...');
    const gallerySection = await page.locator('text=이미지 갤러리').count();
    if (gallerySection > 0) {
      console.log('✅ 이미지 갤러리 섹션이 정상적으로 표시됩니다.');
    } else {
      console.log('❌ 이미지 갤러리 섹션을 찾을 수 없습니다.');
    }

    // 5. 전체 이미지 갤러리 버튼 확인
    console.log('📁 전체 이미지 갤러리 버튼 확인...');
    const allImagesButton = await page.locator('button:has-text("전체 이미지 보기")').count();
    if (allImagesButton > 0) {
      console.log('✅ 전체 이미지 보기 버튼이 정상적으로 표시됩니다.');
      
      // 버튼 클릭 테스트
      console.log('🖱️ 전체 이미지 보기 버튼 클릭 테스트...');
      await page.click('button:has-text("전체 이미지 보기")');
      await page.waitForTimeout(2000);
      
      // 이미지 그룹이 표시되는지 확인
      const imageGroups = await page.locator('text=개 버전 그룹').count();
      console.log(`📦 발견된 이미지 그룹: ${imageGroups}개`);
    } else {
      console.log('❌ 전체 이미지 보기 버튼을 찾을 수 없습니다.');
    }

    // 6. 스크린샷 촬영
    console.log('📸 최종 결과 스크린샷 촬영...');
    await page.screenshot({ path: 'test-error-fix-result.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: test-error-fix-result.png');

    await browser.close();
    console.log('✅ 에러 수정 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    await browser.close();
  }
})();
