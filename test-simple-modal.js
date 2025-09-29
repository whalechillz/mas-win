const { chromium } = require('playwright');

async function testSimpleModal() {
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome'
  });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 간단한 모달 테스트 시작...');
    
    // 관리자 페이지로 이동
    await page.goto('http://localhost:3000/admin/blog');
    console.log('✅ 관리자 페이지 로드 완료');
    
    // 페이지 로딩 대기
    await page.waitForTimeout(5000);
    
    // 스크린샷 촬영
    await page.screenshot({ path: 'test-simple-modal.png' });
    console.log('📸 페이지 스크린샷 저장됨');
    
    // "전체 이미지 보기" 버튼 찾기
    const showAllBtn = await page.locator('button:has-text("전체 이미지 보기")').first();
    if (await showAllBtn.isVisible()) {
      console.log('✅ "전체 이미지 보기" 버튼 발견');
      await showAllBtn.click();
      console.log('✅ 버튼 클릭');
      await page.waitForTimeout(2000);
      
      // 이미지 그룹 찾기
      const imageGroups = await page.locator('[class*="bg-white border-2 border-blue-200"]').all();
      console.log(`📊 발견된 이미지 그룹: ${imageGroups.length}개`);
      
      if (imageGroups.length > 0) {
        console.log('✅ 이미지 그룹 발견, 첫 번째 그룹 클릭 시도...');
        await imageGroups[0].click();
        console.log('✅ 이미지 그룹 클릭');
        await page.waitForTimeout(2000);
        
        // 모달이 열렸는지 확인
        const modal = await page.locator('[class*="absolute top-0 left-0 z-50"]').first();
        if (await modal.isVisible()) {
          console.log('✅ 이미지 그룹 모달이 열렸습니다!');
          
          // 모달 스크린샷
          await page.screenshot({ path: 'test-modal-open.png' });
          console.log('📸 모달 스크린샷 저장됨');
          
          // 모달 닫기
          const closeBtn = await modal.locator('button:has-text("✕")').first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            console.log('✅ 모달 닫기');
          }
        } else {
          console.log('❌ 이미지 그룹 모달이 열리지 않았습니다');
        }
      } else {
        console.log('❌ 이미지 그룹을 찾을 수 없습니다');
      }
    } else {
      console.log('❌ "전체 이미지 보기" 버튼을 찾을 수 없습니다');
    }
    
    console.log('🎉 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testSimpleModal();
