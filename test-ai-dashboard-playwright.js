/**
 * AI 대시보드 Playwright 테스트
 * Chrome Beta/Canary에서 AI 서비스 상태 확인
 */

const { chromium } = require('playwright');

async function testAIDashboard() {
  console.log('🚀 AI 대시보드 Playwright 테스트 시작...');
  
  // Chrome Beta 또는 Canary 사용
  const browser = await chromium.launch({
    channel: 'chrome-beta', // 또는 'chrome-canary'
    headless: false, // 브라우저 창 표시
    slowMo: 1000 // 1초 지연으로 테스트 과정 확인
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // 1. AI 대시보드 접속
    console.log('📊 AI 대시보드 접속 중...');
    await page.goto('https://masgolf.co.kr/admin/ai-dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 스크린샷 저장
    await page.screenshot({ 
      path: 'test-results/ai-dashboard-initial.png',
      fullPage: true 
    });

    // 2. AI 서비스 상태 확인
    console.log('🔍 AI 서비스 상태 확인 중...');
    
    // OpenAI 상태 확인
    const openaiStatus = await page.locator('text=OpenAI 정상 작동').isVisible();
    console.log(`✅ OpenAI 상태: ${openaiStatus ? '정상' : '오류'}`);

    // FAL AI 상태 확인
    const falStatus = await page.locator('text=FAL AI 정상 작동').isVisible();
    console.log(`✅ FAL AI 상태: ${falStatus ? '정상' : '오류'}`);

    // Kie AI 상태 확인
    const kieStatus = await page.locator('text=Kie AI 정상 작동').isVisible();
    console.log(`✅ Kie AI 상태: ${kieStatus ? '정상' : '오류'}`);

    // Replicate 상태 확인
    const replicateStatus = await page.locator('text=Replicate Flux').isVisible();
    console.log(`✅ Replicate 상태: ${replicateStatus ? '정상' : '오류'}`);

    // Stability AI 상태 확인 (더 구체적인 선택자 사용)
    const stabilityStatus = await page.locator('dt:has-text("🎨 Stability AI")').isVisible();
    console.log(`✅ Stability AI 상태: ${stabilityStatus ? '정상' : '오류'}`);

    // 3. 버튼 클릭 테스트
    console.log('🖱️ 버튼 클릭 테스트 중...');
    
    // OpenAI 관리 버튼 클릭 (새 탭에서 열림)
    const [openaiPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('text=OpenAI 관리')
    ]);
    
    await openaiPage.waitForLoadState('networkidle');
    console.log('✅ OpenAI 관리 페이지 열림');
    await openaiPage.close();

    // FAL AI 관리 버튼 클릭
    const [falPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('text=FAL AI 관리')
    ]);
    
    await falPage.waitForLoadState('networkidle');
    console.log('✅ FAL AI 관리 페이지 열림');
    await falPage.close();

    // 4. 탭 네비게이션 테스트
    console.log('📑 탭 네비게이션 테스트 중...');
    
    // AI 사용량 탭 클릭
    await page.click('text=AI 사용량');
    await page.waitForTimeout(2000);
    console.log('✅ AI 사용량 탭 이동');

    // 블로그 분석 탭 클릭
    await page.click('text=블로그 분석');
    await page.waitForTimeout(2000);
    console.log('✅ 블로그 분석 탭 이동');

    // 개요 탭으로 돌아가기
    await page.click('text=개요');
    await page.waitForTimeout(2000);
    console.log('✅ 개요 탭으로 복귀');

    // 5. 최종 스크린샷
    await page.screenshot({ 
      path: 'test-results/ai-dashboard-final.png',
      fullPage: true 
    });

    // 6. 테스트 결과 요약
    console.log('\n🎯 테스트 결과 요약:');
    console.log(`- OpenAI: ${openaiStatus ? '✅ 정상' : '❌ 오류'}`);
    console.log(`- FAL AI: ${falStatus ? '✅ 정상' : '❌ 오류'}`);
    console.log(`- Kie AI: ${kieStatus ? '✅ 정상' : '❌ 오류'}`);
    console.log(`- Replicate: ${replicateStatus ? '✅ 정상' : '❌ 오류'}`);
    console.log(`- Stability AI: ${stabilityStatus ? '✅ 정상' : '❌ 오류'}`);

    const allServicesWorking = openaiStatus && falStatus && kieStatus && replicateStatus && stabilityStatus;
    console.log(`\n🏆 전체 결과: ${allServicesWorking ? '✅ 모든 AI 서비스 정상 작동' : '❌ 일부 서비스 오류'}`);

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    try {
      await page.screenshot({ 
        path: 'test-results/ai-dashboard-error.png',
        fullPage: true 
      });
    } catch (screenshotError) {
      console.error('스크린샷 저장 실패:', screenshotError);
    }
  } finally {
    await browser.close();
    console.log('🔚 테스트 완료');
  }
}

// 테스트 실행
testAIDashboard().catch(console.error);
