const { chromium } = require('playwright');

async function testContentExtraction() {
  console.log('🚀 콘텐츠 추출 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 로컬 관리자 페이지로 이동
    console.log('📝 로컬 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog', { waitUntil: 'networkidle' });
    
    // 2. 네이버 블로그 스크래퍼 탭 클릭
    console.log('🔵 네이버 블로그 스크래퍼 탭 클릭...');
    const naverScraperTab = page.locator('button').filter({ hasText: '네이버 블로그 스크래퍼' }).first();
    await naverScraperTab.click();
    await page.waitForTimeout(2000);
    
    // 3. URL 직접 입력 모드 선택
    console.log('🔄 URL 직접 입력 모드 선택...');
    const urlModeRadio = page.locator('input[value="urls"]');
    await urlModeRadio.click();
    await page.waitForTimeout(1000);
    
    // 4. 개별 포스트 URL 입력
    console.log('📝 개별 포스트 URL 입력...');
    const urlTextarea = page.locator('textarea[placeholder*="네이버 블로그 포스트 URL"]');
    await urlTextarea.waitFor({ timeout: 5000 });
    await urlTextarea.fill('https://blog.naver.com/massgoogolf/223958579134');
    
    // 5. 스크래핑 시작
    console.log('🔍 스크래핑 시작...');
    const scrapeButton = page.locator('button').filter({ hasText: '스크래핑 시작' }).first();
    await scrapeButton.click();
    
    // 6. 결과 대기
    console.log('⏳ 스크래핑 결과 대기...');
    await page.waitForTimeout(10000); // 더 오래 대기
    
    // 7. 결과 확인
    const resultSection = page.locator('text=스크래핑 결과').first();
    await resultSection.waitFor({ timeout: 5000 });
    console.log('✅ 스크래핑 결과 표시됨');
    
    // 8. 포스트 제목 확인
    const postTitle = page.locator('h4').first();
    const titleText = await postTitle.textContent();
    console.log(`📝 포스트 제목: ${titleText}`);
    
    // 9. 포스트 URL 확인
    const postUrl = page.locator('text=URL:').first();
    const urlText = await postUrl.textContent();
    console.log(`🔗 포스트 URL: ${urlText}`);
    
    // 10. 이미지 수 확인
    const imageCount = page.locator('text=이미지').first();
    const imageText = await imageCount.textContent();
    console.log(`🖼️ 이미지 정보: ${imageText}`);
    
    console.log('✅ 콘텐츠 추출 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testContentExtraction().catch(console.error);
