const { chromium } = require('playwright');

async function testSimpleImageCheck() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 간단한 이미지 확인 테스트 시작...');
    
    // 관리자 페이지로 이동
    await page.goto('http://localhost:3000/admin/blog');
    console.log('✅ 관리자 페이지 로드 완료');
    
    // 페이지 로딩 대기
    await page.waitForTimeout(3000);
    
    // 모든 이미지 요소 찾기
    const allImages = await page.locator('img').all();
    console.log(`📊 발견된 모든 이미지: ${allImages.length}개`);
    
    for (let i = 0; i < Math.min(allImages.length, 5); i++) {
      const img = allImages[i];
      const src = await img.getAttribute('src');
      const className = await img.getAttribute('class');
      const alt = await img.getAttribute('alt');
      
      console.log(`🖼️ 이미지 ${i + 1}:`);
      console.log(`   - src: ${src?.substring(0, 60)}...`);
      console.log(`   - alt: ${alt}`);
      console.log(`   - class: ${className}`);
      
      if (className?.includes('object-contain')) {
        console.log('   ✅ object-contain 사용됨 (원본 비율)');
      } else if (className?.includes('object-cover')) {
        console.log('   ❌ object-cover 사용됨 (비율 왜곡)');
      } else {
        console.log('   ⚠️ object 속성 없음');
      }
      console.log('');
    }
    
    // "전체 이미지 보기" 버튼이 있는지 확인
    const showAllBtn = await page.locator('button:has-text("전체 이미지 보기")').first();
    if (await showAllBtn.isVisible()) {
      console.log('✅ "전체 이미지 보기" 버튼 발견');
      await showAllBtn.click();
      console.log('✅ 버튼 클릭');
      await page.waitForTimeout(2000);
      
      // 클릭 후 이미지 다시 확인
      const newImages = await page.locator('img').all();
      console.log(`📊 클릭 후 이미지: ${newImages.length}개`);
    } else {
      console.log('❌ "전체 이미지 보기" 버튼을 찾을 수 없음');
    }
    
    console.log('🎉 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testSimpleImageCheck();
