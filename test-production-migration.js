const { chromium } = require('playwright');

async function testProductionMigration() {
  console.log('🚀 프로덕션 마이그레이션 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 1. 프로덕션 관리자 페이지 접속
    console.log('📱 프로덕션 관리자 페이지 접속 중...');
    await page.goto('https://www.masgolf.co.kr/admin/blog/');
    await page.waitForLoadState('networkidle');
    
    // 2. 스크린샷 촬영
    await page.screenshot({ path: 'production-admin-page.png' });
    console.log('📸 관리자 페이지 스크린샷 저장: production-admin-page.png');
    
    // 3. 마이그레이션 탭 클릭
    console.log('🔄 마이그레이션 탭 클릭 중...');
    const migrationTab = page.locator('text=블로그 마이그레이션');
    await migrationTab.click();
    await page.waitForTimeout(2000);
    
    // 4. URL 입력
    console.log('📝 마이그레이션 URL 입력 중...');
    const urlInput = page.locator('input[type="url"]');
    await urlInput.fill('https://www.mas9golf.com/post/massgoogolfblog20150915-1');
    
    // 5. 마이그레이션 버튼 클릭
    console.log('▶️ 마이그레이션 시작 버튼 클릭 중...');
    const migrationButton = page.locator('button:has-text("마이그레이션 시작")');
    await migrationButton.click();
    
    // 6. 결과 대기 및 확인
    console.log('⏳ 마이그레이션 결과 대기 중...');
    await page.waitForTimeout(5000);
    
    // 7. 성공/실패 메시지 확인
    const successMessage = page.locator('text=성공');
    const errorMessage = page.locator('text=실패');
    
    if (await successMessage.isVisible()) {
      console.log('✅ 마이그레이션 성공!');
      await page.screenshot({ path: 'production-migration-success.png' });
    } else if (await errorMessage.isVisible()) {
      console.log('❌ 마이그레이션 실패!');
      await page.screenshot({ path: 'production-migration-error.png' });
      
      // 오류 메시지 텍스트 추출
      const errorText = await errorMessage.textContent();
      console.log('오류 메시지:', errorText);
    } else {
      console.log('⚠️ 결과를 확인할 수 없습니다.');
      await page.screenshot({ path: 'production-migration-unknown.png' });
    }
    
    // 8. 최종 스크린샷
    await page.screenshot({ path: 'production-final-result.png' });
    console.log('📸 최종 결과 스크린샷 저장: production-final-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    try {
      await page.screenshot({ path: 'production-error.png' });
    } catch (screenshotError) {
      console.error('스크린샷 저장 실패:', screenshotError);
    }
  } finally {
    await browser.close();
    console.log('🔚 브라우저 종료');
  }
}

// 테스트 실행
testProductionMigration().catch(console.error);
