const { chromium } = require('playwright');

async function testSimpleMigration() {
  console.log('🚀 간단한 마이그레이션 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 로컬 관리자 페이지로 이동
    console.log('📝 로컬 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 2. 페이지 스크린샷
    await page.screenshot({ path: 'admin-page.png' });
    console.log('📸 페이지 스크린샷 저장됨');
    
    // 3. 모든 버튼 찾기
    const buttons = await page.locator('button').all();
    console.log(`🔍 총 ${buttons.length}개 버튼 발견`);
    
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      console.log(`버튼 ${i + 1}: "${text}"`);
    }
    
    // 4. 네이버 관련 텍스트 찾기
    const naverElements = await page.locator('text=네이버').all();
    console.log(`🔍 네이버 관련 요소 ${naverElements.length}개 발견`);
    
    // 5. 탭 찾기
    const tabs = await page.locator('[role="tab"], .tab, button').all();
    console.log(`🔍 탭 요소 ${tabs.length}개 발견`);
    
    for (let i = 0; i < Math.min(tabs.length, 5); i++) {
      const text = await tabs[i].textContent();
      console.log(`탭 ${i + 1}: "${text}"`);
    }
    
    console.log('✅ 간단한 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testSimpleMigration().catch(console.error);
