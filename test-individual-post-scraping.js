const { chromium } = require('playwright');

async function testIndividualPostScraping() {
  console.log('🚀 개별 포스트 수집 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 로컬 관리자 페이지로 이동
    console.log('📝 로컬 관리자 페이지로 이동...');
    await page.goto('http://localhost:3001/admin/blog', { waitUntil: 'networkidle' });
    
    // 2. 네이버 블로그 스크래퍼 탭 클릭
    console.log('🔵 네이버 블로그 스크래퍼 탭 클릭...');
    const naverScraperTab = page.locator('button').filter({ hasText: '네이버 블로그 스크래퍼' }).first();
    await naverScraperTab.click();
    await page.waitForTimeout(2000);
    
    // 3. URL 직접 입력 모드 선택
    console.log('🔄 URL 직접 입력 모드 선택...');
    const urlModeRadio = page.locator('input[value="urls"]');
    await urlModeRadio.click();
    await page.waitForTimeout(1000);
    
    // 4. 개별 포스트 URL 입력 (간단한 URL로 테스트)
    console.log('📝 개별 포스트 URL 입력...');
    const urlTextarea = page.locator('textarea[placeholder*="네이버 블로그 포스트 URL"]');
    await urlTextarea.waitFor({ timeout: 5000 });
    
    // 테스트용 URL들 (다양한 URL로 테스트)
    const testUrls = [
      'https://blog.naver.com/massgoogolf/223958579134',
      'https://blog.naver.com/massgoogolf/223996487636'
    ];
    
    for (const testUrl of testUrls) {
      console.log(`\n🔍 테스트 URL: ${testUrl}`);
      
      // URL 입력
      await urlTextarea.clear();
      await urlTextarea.fill(testUrl);
      
      // 5. 스크래핑 시작
      console.log('🔍 스크래핑 시작...');
      const scrapeButton = page.locator('button').filter({ hasText: '스크래핑 시작' }).first();
      await scrapeButton.click();
      
      // 6. 결과 대기
      console.log('⏳ 결과 대기...');
      await page.waitForTimeout(8000);
      
      // 7. 결과 확인
      const resultSection = page.locator('text=스크래핑 결과').first();
      
      try {
        await resultSection.waitFor({ timeout: 3000 });
        console.log('✅ 스크래핑 결과 표시됨');
        
        // 결과 개수 확인
        const resultCount = page.locator('text=개 포스트').first();
        const countText = await resultCount.textContent();
        console.log(`📈 ${countText}`);
        
        // 포스트 제목 확인
        const postTitle = page.locator('h4').first();
        const titleText = await postTitle.textContent();
        console.log(`📄 포스트 제목: ${titleText}`);
        
      } catch (error) {
        console.log('⚠️ 스크래핑 결과가 표시되지 않음');
      }
      
      // 다음 테스트를 위해 잠시 대기
      await page.waitForTimeout(2000);
    }
    
    console.log('\n🎉 개별 포스트 수집 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testIndividualPostScraping().catch(console.error);
