const { chromium } = require('playwright');

(async () => {
  console.log('🚀 이미지 그룹 썸네일 UI 테스트 시작...');
  const browser = await chromium.launch({ headless: false }); // 시각적 확인을 위해 headless: false
  const page = await browser.newPage();

  try {
    // 1. 블로그 관리자 페이지로 이동
    console.log('📝 블로그 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog/');
    await page.waitForSelector('h1', { timeout: 10000 });

    // 2. 이미지 갤러리 섹션 찾기
    console.log('🔍 이미지 갤러리 섹션 찾기...');
    const gallerySection = await page.locator('text=이미지 갤러리').first();
    if (await gallerySection.isVisible()) {
      console.log('✅ 이미지 갤러리 섹션 발견');
    } else {
      throw new Error('❌ 이미지 갤러리 섹션을 찾을 수 없습니다.');
    }

    // 3. "전체 이미지 보기" 버튼 클릭
    console.log('📁 전체 이미지 갤러리 열기...');
    const allImagesButton = await page.locator('button:has-text("전체 이미지 보기")').first();
    if (await allImagesButton.isVisible()) {
      await allImagesButton.click();
      console.log('✅ 전체 이미지 갤러리 열기 완료');
    } else {
      console.log('⚠️ 전체 이미지 갤러리 버튼을 찾을 수 없습니다.');
    }

    // 4. 이미지 그룹 정보 확인
    console.log('📊 이미지 그룹 정보 확인...');
    await page.waitForTimeout(2000);
    
    // "5개씩 그룹" 텍스트 확인
    const groupInfo = await page.locator('text=5개씩 그룹').first();
    if (await groupInfo.isVisible()) {
      console.log('✅ 이미지 그룹 정보 발견');
    } else {
      console.log('⚠️ 이미지 그룹 정보를 찾을 수 없습니다.');
    }

    // 5. 이미지 개수 확인
    console.log('🔢 이미지 개수 확인...');
    const imageCount = await page.locator('text=개 이미지').first();
    if (await imageCount.isVisible()) {
      const countText = await imageCount.textContent();
      console.log(`📊 이미지 개수: ${countText}`);
    }

    // 6. 이미지 그룹 썸네일 확인 (새로운 UI)
    console.log('🖼️ 이미지 그룹 썸네일 확인...');
    
    // 그룹 썸네일 요소 찾기
    const groupThumbnails = await page.locator('[class*="group"], [class*="thumbnail"]').all();
    console.log(`📦 발견된 썸네일 요소 개수: ${groupThumbnails.length}`);
    
    // 그룹 정보 배지 확인
    const groupBadges = await page.locator('text=그룹').all();
    console.log(`🏷️ 발견된 그룹 배지 개수: ${groupBadges.length}`);

    // 7. 썸네일 클릭 테스트 (첫 번째 그룹이 있다면)
    if (groupThumbnails.length > 0) {
      console.log('🖱️ 첫 번째 그룹 썸네일 클릭 테스트...');
      try {
        await groupThumbnails[0].click();
        console.log('✅ 그룹 썸네일 클릭 완료');
        
        // 확장된 이미지 그룹 확인
        await page.waitForTimeout(2000);
        const expandedGroup = await page.locator('text=개 이미지').first();
        if (await expandedGroup.isVisible()) {
          console.log('✅ 확장된 이미지 그룹 확인');
        }
        
        // 모달/팝업 닫기 (있다면)
        const closeButton = await page.locator('button:has-text("✕"), button:has-text("닫기")').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          console.log('✅ 모달 닫기 완료');
        }
        
      } catch (clickError) {
        console.log('⚠️ 썸네일 클릭 테스트 실패:', clickError.message);
      }
    }

    // 8. 이미지 액션 버튼 확인
    console.log('🔘 이미지 액션 버튼 확인...');
    const actionButtons = await page.locator('button:has-text("대표"), button:has-text("복사"), button:has-text("삽입")').all();
    console.log(`🔘 발견된 액션 버튼 개수: ${actionButtons.length}`);

    // 9. 스크린샷 촬영
    console.log('📸 테스트 결과 스크린샷 촬영...');
    await page.screenshot({ path: 'image-group-thumbnail-test-result.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: image-group-thumbnail-test-result.png');

    // 10. UI 개선 제안
    console.log('💡 UI 개선 제안:');
    console.log('  - 이미지 그룹을 하나의 썸네일로 표시');
    console.log('  - 썸네일 클릭 시 5개 이미지 슬라이더 표시');
    console.log('  - 그룹별 액션 버튼 (전체 삽입, 전체 복사 등)');
    console.log('  - 반응형 디자인 적용');

    console.log('✅ 이미지 그룹 썸네일 UI 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    
    // 오류 발생 시 스크린샷 촬영
    await page.screenshot({ path: 'image-group-thumbnail-test-error.png', fullPage: true });
    console.log('📸 오류 스크린샷 저장: image-group-thumbnail-test-error.png');
  } finally {
    await browser.close();
  }
})();
