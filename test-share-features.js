const { chromium } = require('playwright');

async function testShareFeatures() {
  console.log('🚀 공유 기능 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 블로그 목록 페이지로 이동
    console.log('📝 블로그 목록 페이지로 이동...');
    await page.goto('http://localhost:3000/blog/');
    await page.waitForLoadState('networkidle');
    
    // 2. 첫 번째 블로그 포스트 클릭
    console.log('🔍 첫 번째 블로그 포스트 클릭...');
    const firstPost = await page.locator('a[href*="/blog/"]').first();
    await firstPost.click();
    await page.waitForLoadState('networkidle');
    
    // 3. 공유 섹션 스크린샷
    console.log('📸 공유 섹션 스크린샷...');
    await page.screenshot({ path: 'share-features.png' });
    
    // 4. 카카오톡 공유 버튼 테스트
    console.log('📱 카카오톡 공유 버튼 테스트...');
    const kakaoButton = await page.locator('button:has-text("카카오톡 공유")');
    if (await kakaoButton.isVisible()) {
      console.log('✅ 카카오톡 공유 버튼 발견');
    }
    
    // 5. 링크 복사 버튼 테스트
    console.log('📋 링크 복사 버튼 테스트...');
    const copyButton = await page.locator('button:has-text("링크 복사")');
    if (await copyButton.isVisible()) {
      console.log('✅ 링크 복사 버튼 발견');
    }
    
    // 6. 이메일 공유 버튼 테스트
    console.log('📧 이메일 공유 버튼 테스트...');
    const emailButton = await page.locator('button:has-text("이메일 공유")');
    if (await emailButton.isVisible()) {
      console.log('✅ 이메일 공유 버튼 발견');
    }
    
    // 7. 인쇄 버튼 테스트
    console.log('🖨️ 인쇄 버튼 테스트...');
    const printButton = await page.locator('button:has-text("인쇄하기")');
    if (await printButton.isVisible()) {
      console.log('✅ 인쇄 버튼 발견');
    }
    
    // 8. 페이스북 버튼이 없는지 확인
    console.log('❌ 페이스북 버튼 제거 확인...');
    const facebookButton = await page.locator('button:has-text("페이스북")');
    if (!(await facebookButton.isVisible())) {
      console.log('✅ 페이스북 버튼 제거 확인됨');
    }
    
    console.log('✅ 모든 공유 기능 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  } finally {
    await browser.close();
  }
}

testShareFeatures().catch(console.error);
