const { chromium } = require('playwright');

async function testWebpageScraper() {
  let browser;
  try {
    console.log('🚀 웹페이지 이미지 수집 기능 테스트 시작...');
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
    await page.waitForTimeout(3000);
    
    // 2. 웹페이지 이미지 수집 버튼 클릭
    console.log('🔍 2. 웹페이지 이미지 수집 버튼 클릭...');
    await page.click('button:has-text("🌐 웹페이지 이미지 수집")');
    await page.waitForTimeout(1000);
    
    // 3. URL 입력 필드 확인
    console.log('📝 3. URL 입력 필드 확인...');
    const urlInput = page.locator('input[type="url"]');
    await urlInput.waitFor({ state: 'visible' });
    console.log('✅ URL 입력 필드 발견');
    
    // 4. 테스트 URL 입력 (간단한 웹사이트)
    console.log('🌐 4. 테스트 URL 입력...');
    const testUrl = 'https://httpbin.org/html'; // 간단한 HTML 페이지
    await urlInput.fill(testUrl);
    console.log(`✅ URL 입력 완료: ${testUrl}`);
    
    // 5. 이미지 수집 버튼 클릭
    console.log('🔍 5. 이미지 수집 버튼 클릭...');
    await page.click('button:has-text("🔍 이미지 수집")');
    
    // 6. 수집 진행 상태 확인
    console.log('⏳ 6. 수집 진행 상태 확인...');
    await page.waitForTimeout(2000);
    
    // 7. 결과 확인 (성공 또는 실패)
    console.log('📊 7. 결과 확인...');
    
    // 알림 다이얼로그 확인
    const alertPromise = page.waitForEvent('dialog');
    const alert = await alertPromise;
    console.log('📢 알림 메시지:', alert.message());
    
    if (alert.message().includes('✅')) {
      console.log('🎉 이미지 수집 성공!');
    } else {
      console.log('❌ 이미지 수집 실패:', alert.message());
    }
    
    await alert.accept();
    
    // 8. 수집된 이미지 확인
    console.log('🖼️ 8. 수집된 이미지 확인...');
    const imageGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-4');
    const imageCount = await imageGrid.locator('img').count();
    console.log(`📊 수집된 이미지 개수: ${imageCount}개`);
    
    // 9. 다른 URL로 테스트 (실패 케이스)
    console.log('🧪 9. 실패 케이스 테스트...');
    await urlInput.fill('https://invalid-url-test.com');
    await page.click('button:has-text("🔍 이미지 수집")');
    
    const alertPromise2 = page.waitForEvent('dialog');
    const alert2 = await alertPromise2;
    console.log('📢 실패 케이스 알림:', alert2.message());
    await alert2.accept();
    
    // 10. 네이버 블로그 URL 테스트
    console.log('🧪 10. 네이버 블로그 URL 테스트...');
    await urlInput.fill('https://blog.naver.com/massgoogolf/223958579134');
    await page.click('button:has-text("🔍 이미지 수집")');
    
    const alertPromise3 = page.waitForEvent('dialog');
    const alert3 = await alertPromise3;
    console.log('📢 네이버 블로그 알림:', alert3.message());
    await alert3.accept();
    
    console.log('✅ 웹페이지 이미지 수집 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testWebpageScraper();
