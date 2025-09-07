const { chromium } = require('playwright');

async function testBlogAdminLocal() {
  console.log('🚀 로컬 블로그 관리자 페이지 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome-canary'
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 콘솔 에러 수집
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('❌ 콘솔 에러:', msg.text());
      }
    });
    
    // 페이지 에러 수집
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('❌ 페이지 에러:', error.message);
    });
    
    console.log('📱 로컬 서버 시작 중...');
    
    // 로컬 서버로 이동
    await page.goto('http://localhost:3000/admin/blog-simple', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('✅ 페이지 로드 완료');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    // 에러 메시지 확인
    const errorElement = await page.$('text=Application error');
    if (errorElement) {
      console.log('❌ Application error 발견!');
      
      // 개발자 도구 열기
      await page.evaluate(() => {
        console.log('🔍 개발자 도구 콘솔 에러 확인 중...');
      });
      
      // 에러 상세 정보 수집
      const errorDetails = await page.evaluate(() => {
        const errorDiv = document.querySelector('text=Application error');
        return errorDiv ? errorDiv.textContent : '에러 요소를 찾을 수 없음';
      });
      
      console.log('❌ 에러 상세:', errorDetails);
    } else {
      console.log('✅ Application error 없음');
    }
    
    // 게시물 목록 확인
    const postsCount = await page.$$eval('.border.border-gray-200.rounded-lg', elements => elements.length);
    console.log('📝 게시물 개수:', postsCount);
    
    // 로딩 상태 확인
    const loadingElement = await page.$('text=로딩 중');
    if (loadingElement) {
      console.log('⏳ 아직 로딩 중...');
      await page.waitForSelector('text=로딩 중', { state: 'hidden', timeout: 10000 });
    }
    
    // 최종 상태 확인
    const finalPostsCount = await page.$$eval('.border.border-gray-200.rounded-lg', elements => elements.length);
    console.log('📝 최종 게시물 개수:', finalPostsCount);
    
    // 에러가 있다면 상세 정보 출력
    if (errors.length > 0) {
      console.log('\n🔍 발견된 에러들:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ 에러 없음');
    }
    
    // 스크린샷 저장
    await page.screenshot({ 
      path: 'mas9golf/blog-admin-local-test.png',
      fullPage: true 
    });
    console.log('📸 스크린샷 저장: mas9golf/blog-admin-local-test.png');
    
    // 5초 대기
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  } finally {
    await browser.close();
  }
}

// 로컬 서버가 실행 중인지 확인
async function checkLocalServer() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:3001', { timeout: 5000 });
    console.log('✅ 로컬 서버 실행 중');
    return true;
  } catch (error) {
    console.log('❌ 로컬 서버가 실행되지 않음');
    console.log('💡 다음 명령어로 로컬 서버를 시작하세요: npm run dev');
    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🔍 로컬 서버 상태 확인...');
  const serverRunning = await checkLocalServer();
  
  if (serverRunning) {
    await testBlogAdminLocal();
  } else {
    console.log('❌ 로컬 서버를 먼저 시작해주세요.');
  }
}

main().catch(console.error);
