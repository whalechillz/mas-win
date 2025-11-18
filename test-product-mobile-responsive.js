const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone 12/13 크기
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  console.log('📱 모바일 반응형 테스트 시작...\n');
  
  // 1. gold2-sapphire 페이지 테스트
  console.log('1️⃣ /products/gold2-sapphire 테스트');
  await page.goto('http://localhost:3000/products/gold2-sapphire', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  // 스크린샷 저장
  await page.screenshot({ path: 'test-results/gold2-sapphire-mobile.png', fullPage: true });
  console.log('   ✅ 스크린샷 저장: test-results/gold2-sapphire-mobile.png');
  
  // 헤더 확인
  try {
    const header = await page.locator('header').first();
    const headerText = await header.textContent({ timeout: 5000 });
    console.log(`   📋 헤더 텍스트: ${headerText?.substring(0, 50)}...`);
  } catch (e) {
    console.log(`   ⚠️ 헤더 확인 실패: ${e.message}`);
  }
  
  // 스펙 테이블 확인
  try {
    const specTable = await page.locator('text=시크리트포스 골드 2 MUZIIK').first();
    const specTableVisible = await specTable.isVisible({ timeout: 5000 });
    console.log(`   📊 스펙 테이블 표시: ${specTableVisible}`);
  } catch (e) {
    console.log(`   ⚠️ 스펙 테이블 확인 실패: ${e.message}`);
  }
  
  // 가로 스크롤 가능 여부 확인
  try {
    const specTableContainer = await page.locator('div.product-scrollbar').first();
    const scrollInfo = await specTableContainer.evaluate(el => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      canScroll: el.scrollWidth > el.clientWidth
    }));
    console.log(`   📏 스펙 테이블 가로 스크롤 가능: ${scrollInfo.canScroll} (scrollWidth: ${scrollInfo.scrollWidth}, clientWidth: ${scrollInfo.clientWidth})`);
  } catch (e) {
    console.log(`   ⚠️ 스크롤 확인 실패: ${e.message}`);
  }
  
  // 비교 테이블 확인
  try {
    const compareSection = await page.locator('text=다른 브랜드와의 비교').first();
    const compareVisible = await compareSection.isVisible({ timeout: 5000 });
    console.log(`   📊 비교 테이블 섹션 표시: ${compareVisible}`);
  } catch (e) {
    console.log(`   ⚠️ 비교 테이블 확인 실패: ${e.message}`);
  }
  
  // 2. weapon-beryl 페이지 테스트
  console.log('\n2️⃣ /products/weapon-beryl 테스트');
  await page.goto('http://localhost:3000/products/weapon-beryl', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'test-results/weapon-beryl-mobile.png', fullPage: true });
  console.log('   ✅ 스크린샷 저장: test-results/weapon-beryl-mobile.png');
  
  // 데스크톱 크기로도 테스트
  console.log('\n3️⃣ 데스크톱 크기 테스트 (1920x1080)');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000/products/gold2-sapphire', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'test-results/gold2-sapphire-desktop.png', fullPage: true });
  console.log('   ✅ 스크린샷 저장: test-results/gold2-sapphire-desktop.png');
  
  await browser.close();
  console.log('\n✅ 테스트 완료!');
})();

