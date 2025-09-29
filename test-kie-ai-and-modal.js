const { chromium } = require('playwright');

async function testKieAIAndModal() {
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome' // Chrome 사용
  });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Kie AI 및 이미지 모달 테스트 시작...');
    
    // 관리자 페이지로 이동
    await page.goto('http://localhost:3000/admin/blog');
    console.log('✅ 관리자 페이지 로드 완료');
    
    // 페이지 로딩 대기
    await page.waitForTimeout(3000);
    
    // 스크린샷 촬영
    await page.screenshot({ path: 'test-page-debug.png' });
    console.log('📸 페이지 스크린샷 저장됨');
    
    // 모든 버튼 찾기
    const allButtons = await page.locator('button').all();
    console.log(`📊 발견된 모든 버튼: ${allButtons.length}개`);
    
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const button = allButtons[i];
      const buttonText = await button.textContent();
      console.log(`🔘 버튼 ${i + 1}: "${buttonText}"`);
    }
    
    // 제목 입력
    const titleInput = await page.locator('input[placeholder*="제목"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('테스트 게시물');
      console.log('✅ 제목 입력 완료');
    }
    
    // Kie AI 이미지 생성 버튼 클릭
    const kieAIButton = await page.locator('button:has-text("Kie AI GPT-4O")').first();
    if (await kieAIButton.isVisible()) {
      console.log('🎨 Kie AI 이미지 생성 버튼 클릭...');
      await kieAIButton.click();
      await page.waitForTimeout(5000); // 더 긴 대기 시간
      
      // 모달이나 알림 확인
      const modal = await page.locator('[role="dialog"], .modal, .alert').first();
      if (await modal.isVisible()) {
        const modalText = await modal.textContent();
        console.log('📱 모달/알림 내용:', modalText);
      }
    } else {
      console.log('❌ Kie AI 버튼을 찾을 수 없음');
    }
    
    // "전체 이미지 보기" 버튼 클릭
    const showAllImagesBtn = await page.locator('button:has-text("전체 이미지 보기")').first();
    if (await showAllImagesBtn.isVisible()) {
      await showAllImagesBtn.click();
      console.log('✅ 전체 이미지 보기 버튼 클릭');
      await page.waitForTimeout(2000);
    }
    
    // 이미지 그룹 썸네일 찾기 및 클릭
    const imageGroups = await page.locator('[class*="bg-white border-2 border-blue-200"]').all();
    console.log(`📊 발견된 이미지 그룹: ${imageGroups.length}개`);
    
    if (imageGroups.length > 0) {
      const firstGroup = imageGroups[0];
      
      // 썸네일 클릭하여 모달 열기
      await firstGroup.click();
      console.log('✅ 이미지 그룹 클릭하여 모달 열기');
      await page.waitForTimeout(1000);
      
      // 모달이 열렸는지 확인
      const modal = await page.locator('[class*="absolute top-0 left-0 z-50"]').first();
      if (await modal.isVisible()) {
        console.log('✅ 이미지 그룹 모달이 열렸습니다');
        
        // 모달 내부의 메인 이미지 확인
        const mainImage = await modal.locator('img').first();
        if (await mainImage.isVisible()) {
          const imageSrc = await mainImage.getAttribute('src');
          const imageClass = await mainImage.getAttribute('class');
          console.log('🖼️ 모달 메인 이미지:');
          console.log(`   - src: ${imageSrc?.substring(0, 60)}...`);
          console.log(`   - class: ${imageClass}`);
          
          if (imageClass?.includes('object-contain')) {
            console.log('   ✅ object-contain 사용됨 (원본 비율)');
          } else {
            console.log('   ❌ object-contain 없음');
          }
        }
        
        // 모달 닫기
        const closeBtn = await modal.locator('button:has-text("✕")').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          console.log('✅ 모달 닫기');
        }
      } else {
        console.log('❌ 이미지 그룹 모달이 열리지 않았습니다');
      }
    }
    
    // AI 생성 이미지 섹션 확인
    const aiGeneratedSection = await page.locator('text=AI 생성 이미지 선택').first();
    if (await aiGeneratedSection.isVisible()) {
      console.log('✅ AI 생성 이미지 섹션 발견');
      
      // AI 생성 이미지 클릭하여 확대 모달 테스트
      const aiImages = await page.locator('[class*="cursor-pointer border-2 border-gray-200"]').all();
      console.log(`📊 발견된 AI 생성 이미지: ${aiImages.length}개`);
      
      if (aiImages.length > 0) {
        const firstAIImage = aiImages[0];
        await firstAIImage.click();
        console.log('✅ AI 생성 이미지 클릭');
        await page.waitForTimeout(1000);
        
        // AI 이미지 확대 모달 확인
        const aiModal = await page.locator('text=AI 생성 이미지 확대 보기').first();
        if (await aiModal.isVisible()) {
          console.log('✅ AI 이미지 확대 모달이 열렸습니다');
          
          // 모달 닫기
          const closeBtn = await page.locator('button:has-text("닫기")').first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            console.log('✅ AI 이미지 모달 닫기');
          }
        } else {
          console.log('❌ AI 이미지 확대 모달이 열리지 않았습니다');
        }
      }
    }
    
    console.log('🎉 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testKieAIAndModal();
