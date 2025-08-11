const { chromium } = require('playwright');

async function findPassword() {
  console.log('🔍 패스워드 찾기 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  // 테스트할 패스워드 목록
  const passwords = [
    '1234',
    'Masgolf!!',
    'admin123',
    'password',
    'masgolf',
    'admin',
    '123456',
    'qwerty',
    'masgolf123',
    'admin2024',
    'masgolf2024',
    'golf123',
    'mas123',
    'admin2025',
    'masgolf2025'
  ];

  console.log(`📝 총 ${passwords.length}개의 패스워드를 테스트합니다...`);

  for (let i = 0; i < passwords.length; i++) {
    const password = passwords[i];
    
    try {
      console.log(`\n🔄 [${i + 1}/${passwords.length}] 테스트 중: admin / ${password}`);
      
      // 로그인 페이지로 이동
      await page.goto('http://localhost:3000/admin');
      await page.waitForSelector('input[type="text"]');
      
      // 로그인 정보 입력
      await page.fill('input[type="text"]', 'admin');
      await page.fill('input[type="password"]', password);
      
      // 로그인 버튼 클릭
      await page.click('button[type="submit"]');
      
      // 로그인 성공 여부 확인 (대시보드 페이지로 이동했는지)
      try {
        await page.waitForSelector('h1:has-text("MASGOLF 관리자")', { timeout: 3000 });
        console.log(`🎉 성공! 패스워드: ${password}`);
        
        // 성공 스크린샷 저장
        await page.screenshot({ path: `login-success-${password}.png` });
        
        // 성공한 패스워드 정보 출력
        console.log('\n📋 성공 정보:');
        console.log(`   사용자명: admin`);
        console.log(`   패스워드: ${password}`);
        console.log(`   스크린샷: login-success-${password}.png`);
        
        await browser.close();
        return password;
        
      } catch (error) {
        console.log(`❌ 실패: ${password}`);
        
        // 실패 시 현재 화면 스크린샷 저장
        await page.screenshot({ path: `login-failed-${password}.png` });
      }
      
    } catch (error) {
      console.log(`❌ 오류: ${password} - ${error.message}`);
    }
  }
  
  console.log('\n❌ 모든 패스워드 테스트 완료 - 성공한 패스워드가 없습니다.');
  console.log('\n💡 수동으로 확인해보세요:');
  console.log('   1. 브라우저에서 http://localhost:3000/admin 접속');
  console.log('   2. 사용자명: admin');
  console.log('   3. 다양한 패스워드 시도');
  
  await browser.close();
  return null;
}

// 스크립트 실행
findPassword().then(password => {
  if (password) {
    console.log(`\n🎊 찾은 패스워드: ${password}`);
    console.log('✅ 이제 이 패스워드로 로그인할 수 있습니다!');
  } else {
    console.log('\n❌ 패스워드를 찾지 못했습니다.');
    console.log('🔧 환경변수 파일을 확인하거나 수동으로 테스트해보세요.');
  }
}).catch(error => {
  console.error('❌ 스크립트 오류:', error);
}); 