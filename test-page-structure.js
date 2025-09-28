const { chromium } = require('playwright');

(async () => {
  console.log('🚀 페이지 구조 탐색 테스트 시작...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 1. 블로그 관리자 페이지로 이동
    console.log('📝 블로그 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog/');
    await page.waitForLoadState('networkidle');

    // 2. 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);

    // 3. 모든 텍스트 요소 찾기
    console.log('🔍 페이지의 주요 텍스트 요소들:');
    const textElements = await page.locator('h1, h2, h3, h4, h5, h6, button, input, textarea').all();
    
    for (let i = 0; i < Math.min(textElements.length, 20); i++) {
      try {
        const text = await textElements[i].textContent();
        const tagName = await textElements[i].evaluate(el => el.tagName);
        if (text && text.trim().length > 0) {
          console.log(`  ${tagName}: "${text.trim()}"`);
        }
      } catch (e) {
        // 무시
      }
    }

    // 4. 입력 필드 찾기
    console.log('🔍 입력 필드들:');
    const inputs = await page.locator('input, textarea').all();
    for (let i = 0; i < inputs.length; i++) {
      try {
        const type = await inputs[i].getAttribute('type');
        const placeholder = await inputs[i].getAttribute('placeholder');
        const name = await inputs[i].getAttribute('name');
        console.log(`  Input ${i + 1}: type="${type}", placeholder="${placeholder}", name="${name}"`);
      } catch (e) {
        // 무시
      }
    }

    // 5. 버튼 찾기
    console.log('🔍 버튼들:');
    const buttons = await page.locator('button').all();
    for (let i = 0; i < Math.min(buttons.length, 15); i++) {
      try {
        const text = await buttons[i].textContent();
        if (text && text.trim().length > 0) {
          console.log(`  Button ${i + 1}: "${text.trim()}"`);
        }
      } catch (e) {
        // 무시
      }
    }

    // 6. 스크린샷 촬영
    await page.screenshot({ path: 'page-structure-exploration.png', fullPage: true });
    console.log('📸 페이지 구조 스크린샷 저장: page-structure-exploration.png');

    console.log('✅ 페이지 구조 탐색 완료!');

  } catch (error) {
    console.error('❌ 탐색 실패:', error.message);
    await page.screenshot({ path: 'page-structure-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
