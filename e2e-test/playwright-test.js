const { chromium } = require('playwright');

async function testAdminLogin() {
  console.log('🚀 Playwright 브라우저 테스트 시작...');
  
  // 브라우저 실행 (headless: false로 브라우저 창 표시)
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // 각 동작 사이 1초 대기
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. 관리자 페이지 접속
    console.log('📱 관리자 페이지 접속 중...');
    await page.goto('http://localhost:3000/admin');
    
    // 2. 로그인 폼 대기
    await page.waitForSelector('input[type="text"]');
    console.log('✅ 로그인 폼 로드됨');
    
    // 3. 로그인 정보 입력
    console.log('🔑 로그인 정보 입력 중...');
    await page.fill('input[type="text"]', 'admin');
    const password = process.env.ADMIN_PASSWORD || ''; await page.fill('input[type="password"]', password);
    
    // 4. 로그인 버튼 클릭
    console.log('👆 로그인 버튼 클릭...');
    await page.click('button[type="submit"]');
    
    // 5. 로그인 성공 확인
    try {
      await page.waitForSelector('h1:has-text("MASGOLF 관리자")', { timeout: 10000 });
      console.log('🎉 로그인 성공!');
      
      // 6. GA4 데이터 확인
      console.log('📊 GA4 데이터 확인 중...');
      await page.waitForTimeout(3000);
      
      const ga4Data = await page.evaluate(() => {
        const elements = document.querySelectorAll('.bg-gradient-to-r');
        const data = {};
        
        elements.forEach((el) => {
          const title = el.querySelector('p')?.textContent;
          const value = el.querySelector('.text-2xl')?.textContent;
          if (title && value) {
            data[title] = value;
          }
        });
        
        return data;
      });
      
      console.log('📈 GA4 데이터:', ga4Data);
      
      // 7. 각 탭 클릭해보기
      console.log('📋 각 탭 확인 중...');
      const tabs = ['대시보드', '캠페인 관리', '고객 관리', '예약 관리', '마케팅 콘텐츠', '팀 관리'];
      
      for (const tab of tabs) {
        try {
          console.log(`\n🔍 ${tab} 탭 클릭...`);
          await page.click(`button:has-text("${tab}")`);
          await page.waitForTimeout(2000);
          console.log(`✅ ${tab} 탭 로드됨`);
        } catch (error) {
          console.log(`❌ ${tab} 탭 오류: ${error.message}`);
        }
      }
      
      // 8. 최종 스크린샷
      await page.screenshot({ path: 'admin-dashboard-final.png', fullPage: true });
      console.log('📸 최종 스크린샷 저장됨');
      
    } catch (error) {
      console.log('❌ 로그인 실패:', error.message);
      
      // 로그인 실패 시 스크린샷
      await page.screenshot({ path: 'login-failed.png' });
      
      // 다른 패스워드 시도
      const passwords = ['Masgolf!!', 'admin123', 'password', 'masgolf'];
      
      for (const password of passwords) {
        try {
          console.log(`\n🔄 다른 패스워드 시도: ${password}`);
          
          await page.fill('input[type="password"]', password);
          await page.click('button[type="submit"]');
          
          await page.waitForSelector('h1:has-text("MASGOLF 관리자")', { timeout: 5000 });
          console.log(`🎉 성공! 패스워드: ${password}`);
          break;
          
        } catch (error) {
          console.log(`❌ ${password} 실패`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 전체 오류:', error);
    await page.screenshot({ path: 'error.png' });
  } finally {
    // 브라우저는 수동으로 닫을 수 있도록 열어둠
    console.log('\n🌐 브라우저를 확인하고 수동으로 닫아주세요.');
    console.log('💡 브라우저를 닫으려면: await browser.close();');
    
    // 30초 후 자동으로 닫기 (선택사항)
    setTimeout(async () => {
      await browser.close();
      console.log('🔒 브라우저 자동 종료됨');
    }, 30000);
  }
}

// 스크립트 실행
testAdminLogin().catch(console.error); 