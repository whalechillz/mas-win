// 플레이라이트로 이미지 정렬 API 테스트
const { chromium } = require('playwright');

async function testOrganizeImages() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 블로그 관리 페이지 접속 중...');
    await page.goto('https://www.masgolf.co.kr/admin/blog', { waitUntil: 'networkidle' });
    
    console.log('⏳ 페이지 로드 대기 중...');
    await page.waitForTimeout(3000);
    
    console.log('🔍 첫 번째 블로그 글 찾기...');
    // 첫 번째 블로그 글의 "이미지 정렬" 버튼 찾기
    const organizeButton = await page.locator('button:has-text("이미지 정렬")').first();
    
    if (await organizeButton.count() === 0) {
      console.log('❌ 이미지 정렬 버튼을 찾을 수 없습니다.');
      await page.screenshot({ path: 'screenshot-no-button.png' });
      return;
    }
    
    console.log('✅ 이미지 정렬 버튼 발견, 클릭...');
    await organizeButton.click();
    
    console.log('⏳ 확인 다이얼로그 대기 중...');
    // 확인 다이얼로그 처리
    page.on('dialog', async dialog => {
      console.log(`📋 다이얼로그: ${dialog.type()} - ${dialog.message()}`);
      if (dialog.type() === 'confirm') {
        await dialog.accept();
        console.log('✅ 확인 다이얼로그 수락');
      } else if (dialog.type() === 'alert') {
        console.log(`⚠️ 알림: ${dialog.message()}`);
        await dialog.accept();
      }
    });
    
    await page.waitForTimeout(5000);
    
    // 콘솔 메시지 확인
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (text.includes('오류') || text.includes('error') || text.includes('Error')) {
        console.log(`❌ 콘솔 오류: ${text}`);
      }
    });
    
    // 네트워크 요청 모니터링
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/admin/organize-images-by-blog')) {
        console.log(`📡 API 응답: ${response.status()} ${url}`);
        if (response.status() !== 200) {
          response.text().then(text => {
            console.log(`❌ API 오류 응답: ${text}`);
          });
        }
      }
    });
    
    await page.waitForTimeout(10000);
    
    console.log('\n📊 테스트 완료');
    console.log(`콘솔 메시지: ${consoleMessages.length}개`);
    
    await page.screenshot({ path: 'screenshot-after-test.png' });
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'screenshot-error.png' });
  } finally {
    await browser.close();
  }
}

testOrganizeImages();

