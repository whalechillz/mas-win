// 간단한 이미지 최적화 테스트
const { chromium } = require('playwright');

async function testImageOptimizationSimple() {
  console.log('🚀 간단한 이미지 최적화 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 관리자 페이지로 이동
    console.log('📱 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog');
    
    // 페이지 로딩 대기
    await page.waitForTimeout(5000);
    
    // 2. 페이지 스크린샷으로 현재 상태 확인
    console.log('📸 페이지 상태 확인...');
    await page.screenshot({ path: 'test-page-state.png' });
    
    // 3. 네이버 블로그 스크래퍼 섹션 찾기 (더 유연한 선택자)
    console.log('🔍 네이버 블로그 스크래퍼 섹션 찾기...');
    
    // 여러 가능한 선택자 시도
    const possibleSelectors = [
      'h2:has-text("네이버")',
      'h2:has-text("스크래퍼")',
      'h2:has-text("블로그")',
      '[data-testid*="naver"]',
      'button:has-text("스크래핑")',
      'input[placeholder*="URL"]'
    ];
    
    let foundElement = null;
    for (const selector of possibleSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        foundElement = selector;
        console.log(`✅ 요소 발견: ${selector}`);
        break;
      } catch (e) {
        console.log(`❌ 요소 없음: ${selector}`);
      }
    }
    
    if (!foundElement) {
      console.log('📋 페이지 내용 확인...');
      const pageContent = await page.textContent('body');
      console.log('페이지에 포함된 텍스트:', pageContent.substring(0, 500));
      
      // 모든 버튼과 입력 필드 찾기
      const buttons = await page.locator('button').all();
      const inputs = await page.locator('input').all();
      
      console.log(`발견된 버튼 수: ${buttons.length}`);
      console.log(`발견된 입력 필드 수: ${inputs.length}`);
      
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        const buttonText = await buttons[i].textContent();
        console.log(`버튼 ${i + 1}: ${buttonText}`);
      }
    }
    
    // 4. 수동으로 URL 입력 필드 찾기
    console.log('🔍 URL 입력 필드 수동 검색...');
    const urlInputs = await page.locator('input[type="text"], input[type="url"]').all();
    
    if (urlInputs.length > 0) {
      console.log(`✅ ${urlInputs.length}개의 입력 필드 발견`);
      
      // 첫 번째 입력 필드에 테스트 URL 입력
      const testUrl = 'https://blog.naver.com/massgoogolf/223958579134';
      await urlInputs[0].fill(testUrl);
      console.log('📝 테스트 URL 입력 완료');
      
      // 스크래핑 버튼 찾기
      const scrapeButtons = await page.locator('button').all();
      for (const button of scrapeButtons) {
        const buttonText = await button.textContent();
        if (buttonText && (buttonText.includes('스크래핑') || buttonText.includes('시작'))) {
          console.log('🔄 스크래핑 버튼 클릭:', buttonText);
          await button.click();
          break;
        }
      }
    }
    
    // 5. 결과 대기
    console.log('⏳ 결과 대기...');
    await page.waitForTimeout(10000);
    
    console.log('✅ 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

// 테스트 실행
testImageOptimizationSimple().catch(console.error);
