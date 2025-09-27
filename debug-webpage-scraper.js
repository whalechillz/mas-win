const { chromium } = require('playwright');

async function debugWebpageScraper() {
  let browser;
  try {
    console.log('🚀 웹페이지 이미지 수집 디버깅 시작...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 1. 프로덕션 관리자 페이지 접속
    console.log('📝 1. 프로덕션 관리자 페이지 접속...');
    await page.goto('https://win.masgolf.co.kr/admin/blog');

    // 로그인 처리 (필요한 경우)
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
      console.log('🔑 로그인 페이지 감지, 로그인 시도...');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', '1234');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ 프로덕션 관리자 페이지 로드 완료');
    await page.waitForTimeout(5000);
    
    // 2. 페이지 스냅샷으로 현재 상태 확인
    console.log('📸 2. 페이지 스냅샷 확인...');
    const snapshot = await page.accessibility.snapshot();
    console.log('📊 페이지 구조:', JSON.stringify(snapshot, null, 2));
    
    // 3. 모든 버튼 찾기
    console.log('🔍 3. 모든 버튼 찾기...');
    const buttons = await page.locator('button').all();
    console.log(`📊 총 ${buttons.length}개의 버튼 발견`);
    
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await buttons[i].textContent();
      console.log(`버튼 ${i + 1}: "${buttonText}"`);
    }
    
    // 4. 웹페이지 관련 텍스트 찾기
    console.log('🔍 4. 웹페이지 관련 텍스트 찾기...');
    const webpageElements = await page.locator('text=웹페이지').all();
    console.log(`📊 "웹페이지" 텍스트가 포함된 요소 ${webpageElements.length}개 발견`);
    
    // 5. 이미지 수집 관련 텍스트 찾기
    console.log('🔍 5. 이미지 수집 관련 텍스트 찾기...');
    const imageElements = await page.locator('text=이미지 수집').all();
    console.log(`📊 "이미지 수집" 텍스트가 포함된 요소 ${imageElements.length}개 발견`);
    
    // 6. 스크린샷 저장
    console.log('📸 6. 스크린샷 저장...');
    await page.screenshot({ path: 'debug-webpage-scraper.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: debug-webpage-scraper.png');
    
    console.log('✅ 디버깅 완료!');
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류 발생:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugWebpageScraper();
