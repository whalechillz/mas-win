const { chromium } = require('playwright');

(async () => {
  console.log('🚀 페이지 구조 디버깅 시작...');
  const browser = await chromium.launch({ headless: false }); // 시각적 확인
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000/admin/blog/');
    await page.waitForLoadState('networkidle');

    // 네이버 스크래퍼 버튼 클릭
    console.log('🔵 네이버 스크래퍼 버튼 클릭...');
    await page.click('button:has-text("🔵 네이버 블로그 스크래퍼")');
    await page.waitForTimeout(3000);

    // 모든 입력 필드 확인
    console.log('🔍 모든 입력 필드 확인:');
    const inputs = await page.locator('input').all();
    for (let i = 0; i < inputs.length; i++) {
      try {
        const type = await inputs[i].getAttribute('type');
        const placeholder = await inputs[i].getAttribute('placeholder');
        const name = await inputs[i].getAttribute('name');
        const id = await inputs[i].getAttribute('id');
        const className = await inputs[i].getAttribute('class');
        const isVisible = await inputs[i].isVisible();
        const isEnabled = await inputs[i].isEnabled();
        
        console.log(`  Input ${i + 1}:`);
        console.log(`    type: ${type}`);
        console.log(`    placeholder: ${placeholder}`);
        console.log(`    name: ${name}`);
        console.log(`    id: ${id}`);
        console.log(`    class: ${className}`);
        console.log(`    visible: ${isVisible}`);
        console.log(`    enabled: ${isEnabled}`);
        console.log('    ---');
      } catch (e) {
        console.log(`  Input ${i + 1}: 오류 - ${e.message}`);
      }
    }

    // 스크래핑 버튼 상태 확인
    console.log('🔍 스크래핑 버튼 상태 확인:');
    const scrapeButtons = await page.locator('button').all();
    for (let i = 0; i < scrapeButtons.length; i++) {
      try {
        const text = await scrapeButtons[i].textContent();
        const isDisabled = await scrapeButtons[i].isDisabled();
        const isVisible = await scrapeButtons[i].isVisible();
        
        if (text && (text.includes('스크래핑') || text.includes('시작') || text.includes('추출'))) {
          console.log(`  스크래핑 버튼 ${i + 1}:`);
          console.log(`    text: ${text}`);
          console.log(`    disabled: ${isDisabled}`);
          console.log(`    visible: ${isVisible}`);
        }
      } catch (e) {
        // 무시
      }
    }

    // 스크린샷 촬영
    await page.screenshot({ path: 'debug-page-structure.png', fullPage: true });
    console.log('📸 디버그 스크린샷 저장: debug-page-structure.png');

    // 5초 대기 후 브라우저 닫기
    await page.waitForTimeout(5000);
    await browser.close();
    console.log('✅ 디버깅 완료');

  } catch (error) {
    console.error('❌ 디버깅 실패:', error.message);
    await browser.close();
  }
})();
