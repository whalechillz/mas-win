const { chromium } = require('playwright');

async function testImageSystem() {
  console.log('🚀 이미지 시스템 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 블로그 관리 페이지로 이동
    console.log('📝 블로그 관리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog/');
    await page.waitForLoadState('networkidle');
    
    // 2. 네이버 블로그 스크래퍼 섹션 찾기
    console.log('🔍 네이버 블로그 스크래퍼 섹션 찾기...');
    const naverSection = await page.locator('text=네이버 블로그 스크래퍼').first();
    await naverSection.scrollIntoViewIfNeeded();
    
    // 3. URL 입력 필드 찾기 및 입력
    console.log('📝 URL 입력...');
    const urlInput = await page.locator('input[type="url"]').first();
    await urlInput.fill('https://blog.naver.com/massgoogolf/223958579134');
    
    // 4. 스크래핑 버튼 클릭
    console.log('🔄 스크래핑 시작...');
    const scrapeButton = await page.locator('button:has-text("스크래핑 시작")').first();
    await scrapeButton.click();
    
    // 5. 스크래핑 완료 대기
    console.log('⏳ 스크래핑 완료 대기...');
    await page.waitForSelector('text=스크래핑 완료', { timeout: 30000 });
    
    // 6. 이미지 갤러리 열기
    console.log('🖼️ 이미지 갤러리 열기...');
    const galleryButton = await page.locator('button:has-text("갤러리 열기")').first();
    await galleryButton.click();
    
    // 7. Supabase 저장 버튼 클릭
    console.log('💾 Supabase 저장 시작...');
    const saveButton = await page.locator('button:has-text("Supabase에 저장")').first();
    await saveButton.click();
    
    // 8. 저장 완료 대기
    console.log('⏳ 저장 완료 대기...');
    await page.waitForSelector('text=성공적으로 저장되었습니다', { timeout: 30000 });
    
    // 9. AI Dashboard로 이동
    console.log('📊 AI Dashboard로 이동...');
    await page.goto('http://localhost:3000/admin/ai-dashboard/');
    await page.waitForLoadState('networkidle');
    
    // 10. AI 사용량 탭 클릭
    console.log('🤖 AI 사용량 탭 클릭...');
    const aiUsageTab = await page.locator('text=AI 사용량').first();
    await aiUsageTab.click();
    
    // 11. Google Vision API 로그 확인
    console.log('🔍 Google Vision API 로그 확인...');
    await page.waitForSelector('text=google-vision-api', { timeout: 10000 });
    
    console.log('✅ 모든 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  } finally {
    await browser.close();
  }
}

testImageSystem().catch(console.error);
