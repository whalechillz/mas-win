const { chromium } = require('playwright');

async function testAIUsageTracking() {
  let browser;
  try {
    console.log('🚀 AI 사용량 추적 테스트 시작...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 1. 관리자 페이지 접속
    console.log('📝 1. 관리자 페이지 접속...');
    await page.goto('http://localhost:3000/admin/blog');

    // 로그인 처리 (필요한 경우)
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
      console.log('🔑 로그인 페이지 감지, 로그인 시도...');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', '1234');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ 관리자 페이지 로드 완료');
    await page.waitForTimeout(2000);
    
    // 2. 블로그 수정 페이지로 이동
    console.log('🔍 2. 블로그 수정 페이지로 이동...');
    const editButtons = page.locator('button:has-text("수정")');
    const editButtonCount = await editButtons.count();
    
    if (editButtonCount > 0) {
      console.log(`📝 ${editButtonCount}개의 수정 버튼 발견 - 첫 번째 클릭`);
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');
      console.log('✅ 블로그 수정 페이지로 이동 완료');
    } else {
      console.log('❌ 수정 버튼을 찾을 수 없음');
      return;
    }
    
    await page.waitForTimeout(2000);
    
    // 3. AI 개선 버튼 클릭
    console.log('🔧 3. AI 개선 버튼 클릭...');
    const improvementButton = page.locator('button:has-text("🔧 AI 개선")');
    
    if (await improvementButton.isVisible()) {
      console.log('✅ AI 개선 버튼 발견');
      await improvementButton.click();
      
      // 4. API 응답 대기
      console.log('⏳ 4. API 응답 대기...');
      await page.waitForTimeout(15000); // 15초 대기
      
      // 5. AI 사용량 대시보드 확인
      console.log('🤖 5. AI 사용량 대시보드 확인...');
      const aiUsageButton = page.locator('button:has-text("🤖 AI 사용량")');
      
      if (await aiUsageButton.isVisible()) {
        console.log('✅ AI 사용량 버튼 발견');
        await aiUsageButton.click();
        await page.waitForTimeout(3000);
        
        const aiUsageDashboard = page.locator('text=AI 사용량 대시보드');
        if (await aiUsageDashboard.isVisible()) {
          console.log('✅ AI 사용량 대시보드가 표시됨');
          
          // 사용량 통계 확인
          const totalRequests = page.locator('text=총 요청수');
          const totalCost = page.locator('text=총 비용');
          
          if (await totalRequests.isVisible() && await totalCost.isVisible()) {
            console.log('✅ AI 사용량 통계가 정상적으로 표시됨');
            
            // 실제 데이터 확인
            const requestText = await totalRequests.textContent();
            const costText = await totalCost.textContent();
            console.log(`📊 총 요청수: ${requestText}`);
            console.log(`💰 총 비용: ${costText}`);
            
            if (requestText && requestText !== '0') {
              console.log('✅ AI 사용량 데이터가 성공적으로 저장되고 표시됨');
            } else {
              console.log('⚠️ AI 사용량 데이터가 아직 저장되지 않음');
            }
          } else {
            console.log('❌ AI 사용량 통계가 표시되지 않음');
          }
        } else {
          console.log('❌ AI 사용량 대시보드가 표시되지 않음');
        }
      } else {
        console.log('❌ AI 사용량 버튼을 찾을 수 없음');
      }
      
    } else {
      console.log('❌ AI 개선 버튼을 찾을 수 없음');
    }
    
    // 6. 스크린샷 촬영
    console.log('📸 6. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'ai-usage-tracking-test-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: ai-usage-tracking-test-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'ai-usage-tracking-test-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: ai-usage-tracking-test-error.png');
    }
  } finally {
    console.log('🔚 7. 브라우저 종료...');
    await browser.close();
    console.log('✅ AI 사용량 추적 테스트 완료');
  }
}

// 테스트 실행
testAIUsageTracking().catch(console.error);
