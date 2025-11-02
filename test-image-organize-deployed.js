// 배포된 사이트에서 이미지 정렬 기능 테스트
const { chromium } = require('playwright');

async function testImageOrganize() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔍 배포된 사이트 접속 중...');
    await page.goto('https://www.masgolf.co.kr/admin/login', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('⏳ 로그인 페이지 로드 대기...');
    await page.waitForTimeout(2000);
    
    // 로그인 (환경 변수나 설정에서 가져오기)
    console.log('🔐 로그인 시도...');
    const phoneInput = await page.locator('input[type="tel"], input[name="phone"], input[placeholder*="전화번호"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인")').first();
    
    if (await phoneInput.count() > 0 && await passwordInput.count() > 0) {
      await phoneInput.fill('010-6669-9000');
      await passwordInput.fill('66699000');
      await loginButton.click();
      
      console.log('⏳ 로그인 처리 대기...');
      await page.waitForTimeout(3000);
      
      // 리다이렉션 대기
      await page.waitForURL(/\/admin/, { timeout: 10000 }).catch(() => {});
    } else {
      console.log('⚠️ 로그인 폼을 찾을 수 없습니다. 이미 로그인되었을 수 있습니다.');
    }
    
    console.log('📋 블로그 관리 페이지 접속 중...');
    await page.goto('https://www.masgolf.co.kr/admin/blog', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('⏳ 페이지 로드 대기...');
    await page.waitForTimeout(3000);
    
    // 다이얼로그 자동 처리
    page.on('dialog', async dialog => {
      const message = dialog.message();
      const type = dialog.type();
      console.log(`📋 다이얼로그 (${type}): ${message.substring(0, 100)}...`);
      
      if (type === 'confirm') {
        if (message.includes('이미지를 폴더로 정렬')) {
          await dialog.accept();
          console.log('✅ 확인 다이얼로그 수락');
        } else {
          await dialog.dismiss();
          console.log('❌ 확인 다이얼로그 취소');
        }
      } else if (type === 'alert') {
        console.log(`⚠️ 알림: ${message.substring(0, 200)}`);
        await dialog.accept();
      }
    });
    
    // 콘솔 메시지 모니터링
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('오류') || text.includes('error') || text.includes('Error') || text.includes('실패')) {
        console.log(`❌ 콘솔 오류: ${text.substring(0, 200)}`);
      } else if (text.includes('성공') || text.includes('완료')) {
        console.log(`✅ 콘솔 성공: ${text.substring(0, 200)}`);
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
            networkErrors.push({ url, status, text: text.substring(0, 300) });
            console.log(`❌ API 오류 응답 (${status}): ${text.substring(0, 300)}`);
          } catch (e) {
            console.log(`❌ API 오류 응답 (${status}): 응답 파싱 실패`);
          }
        } else {
          try {
            const data = await response.json();
            console.log(`✅ API 성공 응답:`, JSON.stringify(data, null, 2).substring(0, 500));
          } catch (e) {
            console.log(`✅ API 성공 (응답 파싱 실패)`);
          }
        }
      }
    });
    
    console.log('🔍 "이미지 정렬" 버튼 찾기...');
    
    // 다양한 선택자로 버튼 찾기
    const buttonSelectors = [
      'button:has-text("이미지 정렬")',
      'button:has-text("📁")',
      'button[title*="이미지 정렬"]',
      'button:has-text("정렬")',
      'a:has-text("이미지 정렬")',
      'button:has-text("이미지")'
    ];
    
    let organizeButton = null;
    for (const selector of buttonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.count() > 0) {
          const isVisible = await button.isVisible();
          if (isVisible) {
            organizeButton = button;
            console.log(`✅ 버튼 발견: ${selector}`);
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!organizeButton) {
      console.log('❌ 이미지 정렬 버튼을 찾을 수 없습니다.');
      await page.screenshot({ path: 'screenshot-no-button.png', fullPage: true });
      console.log('📸 스크린샷 저장: screenshot-no-button.png');
      
      // 페이지 HTML 일부 확인
      const pageContent = await page.content();
      console.log('📄 페이지 내용 일부:', pageContent.substring(0, 1000));
      return;
    }
    
    // 버튼 텍스트 확인
    const buttonText = await organizeButton.textContent();
    console.log(`📋 버튼 텍스트: ${buttonText}`);
    
    // 첫 번째 블로그 글의 이미지 정렬 버튼 클릭
    console.log('✅ 이미지 정렬 버튼 클릭...');
    await organizeButton.click();
    
    console.log('⏳ 이미지 정렬 프로세스 대기 중...');
    await page.waitForTimeout(15000); // 15초 대기
    
    // 결과 확인
    if (networkErrors.length > 0) {
      console.log('\n❌ 네트워크 오류:');
      networkErrors.forEach(err => {
        console.log(`  - ${err.status}: ${err.url}`);
        console.log(`    ${err.text?.substring(0, 200)}`);
      });
    }
    
    console.log('\n📊 테스트 완료');
    await page.screenshot({ path: 'screenshot-after-test.png', fullPage: true });
    console.log('📸 스크린샷 저장: screenshot-after-test.png');
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'screenshot-error.png', fullPage: true }).catch(() => {});
    console.log('📸 에러 스크린샷 저장: screenshot-error.png');
  } finally {
    await browser.close();
  }
}

testImageOrganize();

