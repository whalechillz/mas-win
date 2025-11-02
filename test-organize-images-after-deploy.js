// 배포 후 이미지 정렬 기능 테스트
const { chromium } = require('playwright');

async function testOrganizeImages() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 블로그 관리 페이지 접속 중...');
    await page.goto('https://www.masgolf.co.kr/admin/blog', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('⏳ 페이지 로드 대기 중...');
    await page.waitForTimeout(3000);
    
    // 다이얼로그 자동 처리
    page.on('dialog', async dialog => {
      const message = dialog.message();
      console.log(`📋 다이얼로그: ${dialog.type()} - ${message}`);
      
      if (dialog.type() === 'confirm') {
        if (message.includes('이미지를 폴더로 정렬')) {
          await dialog.accept();
          console.log('✅ 확인 다이얼로그 수락');
        } else {
          await dialog.dismiss();
          console.log('❌ 확인 다이얼로그 취소');
        }
      } else if (dialog.type() === 'alert') {
        console.log(`⚠️ 알림: ${message}`);
        await dialog.accept();
      }
    });
    
    // 콘솔 메시지 모니터링
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (text.includes('오류') || text.includes('error') || text.includes('Error') || text.includes('실패')) {
        console.log(`❌ 콘솔 오류: ${text}`);
      } else if (text.includes('성공') || text.includes('완료')) {
        console.log(`✅ 콘솔 성공: ${text}`);
      }
    });
    
    // 네트워크 요청 모니터링
    const networkErrors = [];
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/admin/organize-images-by-blog')) {
        const status = response.status();
        console.log(`📡 API 응답: ${status} ${url}`);
        
        if (status !== 200) {
          try {
            const text = await response.text();
            networkErrors.push({ url, status, text });
            console.log(`❌ API 오류 응답 (${status}): ${text}`);
          } catch (e) {
            console.log(`❌ API 오류 응답 (${status}): 응답 파싱 실패`);
          }
        } else {
          try {
            const data = await response.json();
            console.log(`✅ API 성공 응답:`, JSON.stringify(data, null, 2).slice(0, 500));
          } catch (e) {
            console.log(`✅ API 성공 (응답 파싱 실패)`);
          }
        }
      }
    });
    
    console.log('🔍 첫 번째 블로그 글의 "이미지 정렬" 버튼 찾기...');
    
    // "이미지 정렬" 버튼 찾기 (여러 선택자 시도)
    let organizeButton = null;
    const selectors = [
      'button:has-text("이미지 정렬")',
      'button:has-text("📁")',
      'button[title*="이미지 정렬"]',
      'button:has-text("정렬")'
    ];
    
    for (const selector of selectors) {
      try {
        const button = await page.locator(selector).first();
        if (await button.count() > 0) {
          organizeButton = button;
          console.log(`✅ 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!organizeButton) {
      console.log('❌ 이미지 정렬 버튼을 찾을 수 없습니다.');
      await page.screenshot({ path: 'screenshot-no-button.png' });
      console.log('📸 스크린샷 저장: screenshot-no-button.png');
      return;
    }
    
    console.log('✅ 이미지 정렬 버튼 발견, 클릭...');
    await organizeButton.click();
    
    console.log('⏳ 이미지 정렬 프로세스 대기 중...');
    await page.waitForTimeout(10000); // 10초 대기
    
    // 결과 확인
    const alerts = consoleMessages.filter(m => 
      m.includes('완료') || m.includes('성공') || m.includes('오류') || m.includes('실패')
    );
    
    if (alerts.length > 0) {
      console.log('\n📊 주요 메시지:');
      alerts.forEach(msg => console.log(`  - ${msg}`));
    }
    
    if (networkErrors.length > 0) {
      console.log('\n❌ 네트워크 오류:');
      networkErrors.forEach(err => {
        console.log(`  - ${err.status}: ${err.url}`);
        console.log(`    ${err.text?.slice(0, 200)}`);
      });
    }
    
    console.log('\n📊 테스트 완료');
    console.log(`콘솔 메시지: ${consoleMessages.length}개`);
    console.log(`네트워크 오류: ${networkErrors.length}개`);
    
    await page.screenshot({ path: 'screenshot-after-test.png' });
    console.log('📸 스크린샷 저장: screenshot-after-test.png');
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'screenshot-error.png' }).catch(() => {});
    console.log('📸 에러 스크린샷 저장: screenshot-error.png');
  } finally {
    await browser.close();
  }
}

testOrganizeImages();

