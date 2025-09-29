const { chromium } = require('playwright');

async function testImageAspectRatio() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 이미지 비율 테스트 시작...');
    
    // 관리자 페이지로 이동
    await page.goto('http://localhost:3000/admin/blog');
    console.log('✅ 관리자 페이지 로드 완료');
    
    // 페이지 로딩 대기
    await page.waitForTimeout(5000);
    
    // 스크린샷 촬영
    await page.screenshot({ path: 'test-page-screenshot.png' });
    console.log('📸 페이지 스크린샷 저장됨');
    
    // "전체 이미지 보기" 버튼 클릭
    const showAllImagesBtn = await page.locator('button:has-text("전체 이미지 보기")').first();
    if (await showAllImagesBtn.isVisible()) {
      await showAllImagesBtn.click();
      console.log('✅ 전체 이미지 보기 버튼 클릭');
      await page.waitForTimeout(2000);
    }
    
    // 이미지 그룹 썸네일 확인 (다양한 선택자 시도)
    let imageGroups = await page.locator('[class*="bg-white border-2 border-blue-200"]').all();
    if (imageGroups.length === 0) {
      imageGroups = await page.locator('[class*="border-2 border-blue-200"]').all();
    }
    if (imageGroups.length === 0) {
      imageGroups = await page.locator('img[class*="object-contain"]').all();
    }
    if (imageGroups.length === 0) {
      imageGroups = await page.locator('img').all();
    }
    console.log(`📊 발견된 이미지 요소: ${imageGroups.length}개`);
    
    for (let i = 0; i < Math.min(imageGroups.length, 3); i++) {
      const group = imageGroups[i];
      
      // 썸네일 이미지 확인
      const thumbnailImg = group.locator('img').first();
      if (await thumbnailImg.isVisible()) {
        const src = await thumbnailImg.getAttribute('src');
        const className = await thumbnailImg.getAttribute('class');
        
        console.log(`🖼️ 그룹 ${i + 1} 썸네일:`);
        console.log(`   - src: ${src?.substring(0, 50)}...`);
        console.log(`   - class: ${className}`);
        
        // object-contain이 포함되어 있는지 확인
        if (className?.includes('object-contain')) {
          console.log('   ✅ object-contain 사용됨 (원본 비율)');
        } else {
          console.log('   ❌ object-contain 없음 (비율 왜곡 가능)');
        }
      }
      
      // 이미지 그룹 클릭하여 모달 열기
      await group.click();
      console.log(`✅ 그룹 ${i + 1} 클릭하여 모달 열기`);
      await page.waitForTimeout(1000);
      
      // 모달의 메인 이미지 확인
      const modalMainImg = page.locator('[class*="max-w-full max-h-full object-contain"]').first();
      if (await modalMainImg.isVisible()) {
        const modalClassName = await modalMainImg.getAttribute('class');
        console.log(`🖼️ 모달 메인 이미지:`);
        console.log(`   - class: ${modalClassName}`);
        
        if (modalClassName?.includes('object-contain')) {
          console.log('   ✅ 모달에서 object-contain 사용됨 (원본 비율)');
        } else {
          console.log('   ❌ 모달에서 object-contain 없음');
        }
      }
      
      // 모달 닫기
      const closeBtn = page.locator('button:has-text("✕")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        console.log(`✅ 모달 닫기`);
        await page.waitForTimeout(500);
      }
    }
    
    console.log('🎉 이미지 비율 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testImageAspectRatio();
