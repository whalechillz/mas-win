const { chromium } = require('playwright');

async function testRemoteNaverScraper() {
  console.log('🚀 원격 네이버 블로그 스크래퍼 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 원격 관리자 페이지로 이동
    console.log('📝 원격 관리자 페이지로 이동...');
    await page.goto('https://masgolf.co.kr/admin/blog', { waitUntil: 'networkidle' });
    
    // 2. 네이버 블로그 스크래퍼 탭 클릭
    console.log('🔵 네이버 블로그 스크래퍼 탭 클릭...');
    const naverScraperTab = page.locator('button').filter({ hasText: '네이버 블로그 스크래퍼' }).first();
    await naverScraperTab.click();
    await page.waitForTimeout(2000);
    
    // 3. 탭이 활성화되었는지 확인
    console.log('✅ 탭 활성화 확인...');
    const activeTab = page.locator('button[class*="border-blue-500"]').filter({ hasText: '네이버 블로그 스크래퍼' });
    await activeTab.waitFor({ timeout: 5000 });
    
    // 4. 블로그 ID 입력 테스트
    console.log('📝 블로그 ID 입력 테스트...');
    const blogIdInput = page.locator('input[placeholder*="massgoogolf"]');
    await blogIdInput.waitFor({ timeout: 5000 });
    await blogIdInput.fill('massgoogolf');
    
    // 5. 스크래핑 시작 버튼 클릭
    console.log('🔍 스크래핑 시작 버튼 클릭...');
    const scrapeButton = page.locator('button').filter({ hasText: '스크래핑 시작' }).first();
    await scrapeButton.click();
    
    // 6. 스크래핑 진행 대기
    console.log('⏳ 스크래핑 진행 대기...');
    await page.waitForTimeout(15000); // 15초 대기 (원격은 더 오래 걸릴 수 있음)
    
    // 7. 결과 확인
    console.log('📊 결과 확인...');
    const resultSection = page.locator('text=스크래핑 결과').first();
    
    try {
      await resultSection.waitFor({ timeout: 5000 });
      console.log('✅ 원격 스크래핑 결과 섹션이 표시되었습니다.');
      
      // 결과 개수 확인
      const resultCount = page.locator('text=개 포스트').first();
      const countText = await resultCount.textContent();
      console.log(`📈 ${countText}`);
      
    } catch (error) {
      console.log('⚠️ 원격 스크래핑 결과가 아직 표시되지 않았습니다.');
    }
    
    // 8. URL 직접 입력 모드 테스트
    console.log('🔄 URL 직접 입력 모드 테스트...');
    const urlModeRadio = page.locator('input[value="urls"]');
    await urlModeRadio.click();
    await page.waitForTimeout(1000);
    
    // 9. URL 입력 필드 확인
    const urlTextarea = page.locator('textarea[placeholder*="네이버 블로그 포스트 URL"]');
    await urlTextarea.waitFor({ timeout: 5000 });
    await urlTextarea.fill('https://blog.naver.com/massgoogolf/223958579134');
    
    // 10. URL 모드로 스크래핑 테스트
    console.log('🔍 URL 모드 스크래핑 테스트...');
    await scrapeButton.click();
    await page.waitForTimeout(12000);
    
    // 11. 최종 결과 확인
    console.log('🎯 최종 결과 확인...');
    const finalResult = page.locator('text=스크래핑 결과').first();
    
    try {
      await finalResult.waitFor({ timeout: 3000 });
      console.log('✅ 원격 URL 모드 스크래핑도 성공적으로 완료되었습니다.');
    } catch (error) {
      console.log('⚠️ 원격 URL 모드 스크래핑 결과가 아직 표시되지 않았습니다.');
    }
    
    console.log('\n🎉 원격 네이버 블로그 스크래퍼 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 원격 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testRemoteNaverScraper().catch(console.error);
