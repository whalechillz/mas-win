const { chromium } = require('playwright');

async function testSimpleImageSystem() {
  console.log('🚀 간단 이미지 시스템 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 블로그 관리 페이지로 이동
    console.log('📝 블로그 관리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog/');
    await page.waitForLoadState('networkidle');
    
    // 2. 페이지 스크린샷
    console.log('📸 페이지 스크린샷...');
    await page.screenshot({ path: 'blog-admin-page.png' });
    
    // 3. AI Dashboard로 이동
    console.log('📊 AI Dashboard로 이동...');
    await page.goto('http://localhost:3000/admin/ai-dashboard/');
    await page.waitForLoadState('networkidle');
    
    // 4. AI Dashboard 스크린샷
    console.log('📸 AI Dashboard 스크린샷...');
    await page.screenshot({ path: 'ai-dashboard-page.png' });
    
    // 5. AI 사용량 탭 클릭
    console.log('🤖 AI 사용량 탭 클릭...');
    const aiUsageTab = await page.locator('text=AI 사용량').first();
    await aiUsageTab.click();
    await page.waitForTimeout(2000);
    
    // 6. 최종 스크린샷
    console.log('📸 최종 스크린샷...');
    await page.screenshot({ path: 'ai-usage-tab.png' });
    
    console.log('✅ 테스트 완료! 스크린샷이 저장되었습니다.');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  } finally {
    await browser.close();
  }
}

testSimpleImageSystem().catch(console.error);
