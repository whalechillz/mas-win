const { chromium } = require('playwright');

async function testScraperUI() {
  console.log('🚀 웹페이지 스크래퍼 UI 최종 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 관리자 페이지로 이동
    console.log('📝 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog', { waitUntil: 'networkidle' });
    
    // 2. 새 게시물 작성 탭 클릭
    console.log('✍️ 새 게시물 작성 탭 클릭...');
    const newPostButton = page.locator('button').filter({ hasText: '새 게시물 작성' }).first();
    await newPostButton.click();
    await page.waitForTimeout(2000);
    
    // 3. 이미지 갤러리 섹션 찾기
    console.log('🖼️ 이미지 갤러리 섹션 확인...');
    const imageGalleryText = page.locator('text=이미지 갤러리').first();
    await imageGalleryText.waitFor({ timeout: 10000 });
    
    // 4. 전체 이미지 보기 버튼 클릭
    console.log('👁️ 전체 이미지 보기 버튼 클릭...');
    const viewAllButton = page.locator('button').filter({ hasText: '전체 이미지 보기' }).first();
    await viewAllButton.click();
    await page.waitForTimeout(2000);
    
    // 5. 웹페이지 이미지 수집 버튼 찾기 및 클릭
    console.log('🌐 웹페이지 이미지 수집 버튼 찾기...');
    const scraperButton = page.locator('button').filter({ hasText: '웹페이지 이미지 수집' }).first();
    await scraperButton.waitFor({ timeout: 10000 });
    await scraperButton.click();
    await page.waitForTimeout(2000);
    
    // 6. 성공하는 URL로 테스트
    const testUrl = 'https://n.news.naver.com/article/050/0000096697';
    console.log(`🔍 테스트 URL: ${testUrl}`);
    
    // URL 입력 필드 찾기
    const urlInputs = page.locator('input[type="url"]');
    const urlInputCount = await urlInputs.count();
    console.log(`📝 발견된 URL 입력 필드 수: ${urlInputCount}개`);
    
    // 웹페이지 스크래퍼 섹션 내의 URL 입력 필드 찾기
    const scraperSection = page.locator('div:has-text("🌐 웹페이지 이미지 수집")');
    const scraperUrlInput = scraperSection.locator('input[type="url"]').first();
    
    await scraperUrlInput.fill(testUrl);
    console.log('📝 URL 입력 완료');
    
    // 스크래핑 시작 버튼 클릭
    console.log('▶️ 스크래핑 시작...');
    const startButton = scraperSection.locator('button').filter({ hasText: '이미지 수집 시작' }).first();
    await startButton.click();
    
    // 결과 대기
    console.log('⏳ 결과 대기 중...');
    await page.waitForTimeout(8000);
    
    // 결과 확인
    const successMessage = page.locator('text=개의 이미지를 발견했습니다').first();
    const errorMessage = page.locator('text=오류가 발생').first();
    
    try {
      await successMessage.waitFor({ timeout: 5000 });
      const messageText = await successMessage.textContent();
      console.log(`✅ 성공: ${messageText}`);
      
      // 이미지 목록 확인
      const imageItems = scraperSection.locator('.grid .border');
      const imageCount = await imageItems.count();
      console.log(`🖼️ 발견된 이미지 수: ${imageCount}개`);
      
      if (imageCount > 0) {
        console.log('🎉 UI 테스트 성공! 웹페이지 스크래퍼가 정상적으로 작동합니다.');
      } else {
        console.log('⚠️ 이미지가 발견되지 않았습니다.');
      }
      
    } catch (error) {
      try {
        await errorMessage.waitFor({ timeout: 2000 });
        const errorText = await errorMessage.textContent();
        console.log(`❌ 실패: ${errorText}`);
      } catch (error2) {
        console.log('❓ 결과를 확인할 수 없음');
      }
    }
    
    console.log('\n🎉 UI 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testScraperUI().catch(console.error);
