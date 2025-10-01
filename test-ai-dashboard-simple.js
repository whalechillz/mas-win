/**
 * AI 대시보드 간단 테스트
 * Chrome Beta에서 AI 서비스 상태만 확인
 */

const { chromium } = require('playwright');

async function testAIDashboardSimple() {
  console.log('🚀 AI 대시보드 간단 테스트 시작...');
  
  // Chrome Beta 사용
  const browser = await chromium.launch({
    channel: 'chrome-beta',
    headless: false,
    slowMo: 500
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();

    // 1. AI 대시보드 접속
    console.log('📊 AI 대시보드 접속 중...');
    await page.goto('https://masgolf.co.kr/admin/ai-dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 초기 스크린샷
    await page.screenshot({ 
      path: 'test-results/ai-dashboard-simple.png',
      fullPage: true 
    });

    // 2. AI 서비스 상태 확인
    console.log('🔍 AI 서비스 상태 확인 중...');
    
    // 페이지 로딩 대기
    await page.waitForTimeout(3000);

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

    // Stability AI 상태 확인
    const stabilityStatus = await page.locator('dt:has-text("🎨 Stability AI")').isVisible();
    console.log(`✅ Stability AI 상태: ${stabilityStatus ? '정상' : '오류'}`);

    // 3. 페이지 내용 확인
    console.log('📄 페이지 내용 확인 중...');
    
    // 제목 확인
    const title = await page.title();
    console.log(`📋 페이지 제목: ${title}`);

    // 헤딩 확인
    const heading = await page.locator('h1').textContent();
    console.log(`📋 메인 헤딩: ${heading}`);

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
      path: 'test-results/ai-dashboard-final-simple.png',
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

    // 7. 브라우저 콘솔 로그 확인
    console.log('\n📊 브라우저 콘솔 로그:');
    const logs = await page.evaluate(() => {
      return window.console.logs || [];
    });
    console.log('콘솔 로그:', logs);

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  } finally {
    await browser.close();
    console.log('🔚 테스트 완료');
  }
}

// 테스트 실행
testAIDashboardSimple().catch(console.error);
