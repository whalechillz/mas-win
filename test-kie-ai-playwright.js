// Kie AI API 구문 에러 테스트
const { chromium } = require('playwright');

async function testKieAISyntax() {
  console.log('🧪 Kie AI API 구문 에러 테스트 시작...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 1. 로컬 서버 접속
    console.log('1️⃣ 로컬 서버 접속...');
    await page.goto('http://localhost:3000/admin/blog');
    
    // 2. 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    console.log('✅ 페이지 로딩 완료');
    
    // 3. 제목 입력
    console.log('2️⃣ 제목 입력...');
    await page.fill('input[placeholder*="제목"]', 'Kie AI 테스트 게시물');
    
    // 4. Kie AI 버튼 클릭
    console.log('3️⃣ Kie AI 이미지 생성 버튼 클릭...');
    const kieButton = page.locator('button:has-text("ChatGPT + Kie AI")').first();
    await kieButton.click();
    
    // 5. 에러 다이얼로그 확인
    console.log('4️⃣ 에러 다이얼로그 확인...');
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    
    const dialogText = await page.textContent('[role="dialog"]');
    console.log('다이얼로그 내용:', dialogText);
    
    // 6. 다이얼로그 닫기
    await page.click('button:has-text("확인")');
    
    // 7. 콘솔 에러 확인
    console.log('5️⃣ 콘솔 에러 확인...');
    const consoleLogs = await page.evaluate(() => {
      return window.console.logs || [];
    });
    
    console.log('콘솔 로그:', consoleLogs);
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
  } finally {
    await browser.close();
  }
}

// 테스트 실행
testKieAISyntax();
