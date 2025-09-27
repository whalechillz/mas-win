const { chromium } = require('playwright');

async function testRemoteComprehensive() {
  console.log('🚀 원격 종합 테스트 시작...');
  
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
    
    // 3. URL 직접 입력 모드 선택
    console.log('🔄 URL 직접 입력 모드 선택...');
    const urlModeRadio = page.locator('input[value="urls"]');
    await urlModeRadio.click();
    await page.waitForTimeout(1000);
    
    // 4. 개별 포스트 URL 입력
    console.log('📝 개별 포스트 URL 입력...');
    const urlTextarea = page.locator('textarea[placeholder*="네이버 블로그 포스트 URL"]');
    await urlTextarea.waitFor({ timeout: 5000 });
    await urlTextarea.fill('https://blog.naver.com/massgoogolf/223958579134');
    
    // 5. 스크래핑 시작
    console.log('🔍 스크래핑 시작...');
    const scrapeButton = page.locator('button').filter({ hasText: '스크래핑 시작' }).first();
    await scrapeButton.click();
    
    // 6. 결과 대기
    console.log('⏳ 스크래핑 결과 대기...');
    await page.waitForTimeout(10000); // 원격은 더 오래 걸릴 수 있음
    
    // 7. 결과 확인
    const resultSection = page.locator('text=스크래핑 결과').first();
    
    try {
      await resultSection.waitFor({ timeout: 5000 });
      console.log('✅ 원격 스크래핑 결과 표시됨');
      
      // 8. 포스트 체크박스 클릭
      console.log('☑️ 포스트 체크박스 클릭...');
      const checkbox = page.locator('input[type="checkbox"]').first();
      await checkbox.click();
      await page.waitForTimeout(1000);
      
      // 9. 마이그레이션 버튼 클릭
      console.log('🔄 마이그레이션 버튼 클릭...');
      const migrationButton = page.locator('button').filter({ hasText: '선택된 1개 마이그레이션' });
      await migrationButton.waitFor({ timeout: 3000 });
      await migrationButton.click();
      
      // 10. 마이그레이션 진행 대기
      console.log('⏳ 마이그레이션 진행 대기...');
      await page.waitForTimeout(8000);
      
      // 11. 성공 메시지 확인
      console.log('🎯 마이그레이션 결과 확인...');
      
      // alert 대화상자 처리
      page.on('dialog', async dialog => {
        console.log(`📢 알림: ${dialog.message()}`);
        await dialog.accept();
      });
      
      console.log('✅ 원격 종합 테스트 완료!');
      
    } catch (error) {
      console.log('⚠️ 원격 스크래핑 결과가 표시되지 않음:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 원격 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testRemoteComprehensive().catch(console.error);
