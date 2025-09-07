const { chromium } = require('playwright');

async function testVercelDeployment() {
  console.log('🚀 Vercel 배포 테스트 시작...');
  
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
    
    console.log('🌐 Vercel 배포 사이트 테스트...');
    
    // 1. 메인 페이지 테스트
    console.log('📱 메인 페이지 테스트...');
    await page.goto('https://masgolf.co.kr', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    const mainTitle = await page.title();
    console.log('✅ 메인 페이지 제목:', mainTitle);
    
    // 2. 블로그 목록 페이지 테스트
    console.log('📱 블로그 목록 페이지 테스트...');
    await page.goto('https://masgolf.co.kr/blog', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    const blogTitle = await page.title();
    console.log('✅ 블로그 페이지 제목:', blogTitle);
    
    // 게시물 개수 확인
    const postsCount = await page.$$eval('.border.border-gray-200.rounded-lg', elements => elements.length);
    console.log('📝 게시물 개수:', postsCount);
    
    // 3. 블로그 관리자 페이지 테스트 (간단한 버전)
    console.log('📱 블로그 관리자 페이지 테스트 (간단한 버전)...');
    await page.goto('https://masgolf.co.kr/admin/blog-simple', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    const adminTitle = await page.title();
    console.log('✅ 관리자 페이지 제목:', adminTitle);
    
    // 에러 메시지 확인
    const errorElement = await page.$('text=Application error');
    if (errorElement) {
      console.log('❌ Application error 발견!');
    } else {
      console.log('✅ Application error 없음');
    }
    
    // 관리자 페이지 게시물 개수 확인
    const adminPostsCount = await page.$$eval('.border.border-gray-200.rounded-lg', elements => elements.length);
    console.log('📝 관리자 페이지 게시물 개수:', adminPostsCount);
    
    // 4. 블로그 관리자 페이지 테스트 (전체 기능)
    console.log('📱 블로그 관리자 페이지 테스트 (전체 기능)...');
    await page.goto('https://masgolf.co.kr/admin/blog', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    const fullAdminTitle = await page.title();
    console.log('✅ 전체 관리자 페이지 제목:', fullAdminTitle);
    
    // 에러 메시지 확인
    const fullErrorElement = await page.$('text=Application error');
    if (fullErrorElement) {
      console.log('❌ 전체 관리자 페이지에서 Application error 발견!');
    } else {
      console.log('✅ 전체 관리자 페이지에서 Application error 없음');
    }
    
    // 5. 개별 블로그 게시물 테스트
    if (postsCount > 0) {
      console.log('📱 개별 블로그 게시물 테스트...');
      await page.goto('https://masgolf.co.kr/blog/hot-summer-perfect-swing-royal-salute-gift-event', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      const postTitle = await page.title();
      console.log('✅ 블로그 게시물 제목:', postTitle);
      
      // 이미지 로드 확인
      const images = await page.$$eval('img', elements => elements.length);
      console.log('🖼️ 이미지 개수:', images);
    }
    
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
      path: 'mas9golf/vercel-deployment-test.png',
      fullPage: true 
    });
    console.log('📸 스크린샷 저장: mas9golf/vercel-deployment-test.png');
    
    // 10초 대기 (브라우저 확인용)
    console.log('⏳ 10초 대기 중... (브라우저 확인용)');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  } finally {
    await browser.close();
  }
}

testVercelDeployment().catch(console.error);