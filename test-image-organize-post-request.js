// POST 요청으로 실제 이미지 이동 및 폴더 생성 테스트
const { chromium } = require('playwright');

async function testImageOrganizePost() {
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
    
    // 로그인
    console.log('🔐 로그인 시도...');
    const phoneInput = await page.locator('input[type="tel"], input[name="phone"], input[placeholder*="전화번호"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인")').first();
    
    if (await phoneInput.count() > 0 && await passwordInput.count() > 0) {
      await phoneInput.fill('010-6669-9000');
      await passwordInput.fill('66699000');
      await loginButton.click();
      await page.waitForTimeout(3000);
      await page.waitForURL(/\/admin/, { timeout: 10000 }).catch(() => {});
    }
    
    console.log('📋 블로그 관리 페이지 접속 중...');
    await page.goto('https://www.masgolf.co.kr/admin/blog', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // 다이얼로그 자동 처리
    let dialogCount = 0;
    page.on('dialog', async dialog => {
      dialogCount++;
      const message = dialog.message();
      const type = dialog.type();
      console.log(`📋 다이얼로그 #${dialogCount} (${type}): ${message.substring(0, 100)}...`);
      
      if (type === 'confirm') {
        await dialog.accept();
        console.log('✅ 확인 다이얼로그 수락');
      } else if (type === 'alert') {
        console.log(`⚠️ 알림: ${message.substring(0, 300)}`);
        await dialog.accept();
      }
    });
    
    // 네트워크 요청 모니터링
    const apiResponses = [];
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/admin/organize-images-by-blog')) {
        const status = response.status();
        const method = url.includes('blogPostId=') ? 'GET' : 'POST';
        console.log(`📡 API 응답 (${method}): ${status} ${url.substring(0, 80)}...`);
        
        try {
          const data = await response.json();
          apiResponses.push({ method, status, url, data });
          
          if (status === 200) {
            if (method === 'GET') {
              const imageCount = data.results?.[0]?.totalImages || 0;
              const folderName = data.results?.[0]?.blogPost?.folderName || 'N/A';
              console.log(`✅ GET 성공: ${imageCount}개 이미지, 폴더: ${folderName}`);
            } else if (method === 'POST') {
              const summary = data.summary || {};
              console.log(`✅ POST 성공: 이동 ${summary.moved || 0}개, 스킵 ${summary.skipped || 0}개, 오류 ${summary.errors || 0}개`);
            }
          } else {
            console.log(`❌ API 오류 (${status}):`, JSON.stringify(data, null, 2).substring(0, 500));
          }
        } catch (e) {
          console.log(`⚠️ 응답 파싱 실패: ${status}`);
        }
      }
    });
    
    console.log('🔍 "이미지 정렬" 버튼 찾기...');
    const organizeButton = page.locator('button:has-text("이미지 정렬")').first();
    
    if (await organizeButton.count() === 0) {
      console.log('❌ 이미지 정렬 버튼을 찾을 수 없습니다.');
      await page.screenshot({ path: 'screenshot-no-button.png', fullPage: true });
      return;
    }
    
    console.log('✅ 이미지 정렬 버튼 클릭...');
    await organizeButton.click();
    
    console.log('⏳ 이미지 정렬 프로세스 대기 중 (최대 30초)...');
    await page.waitForTimeout(30000); // 30초 대기
    
    // 결과 확인
    console.log('\n📊 테스트 결과 요약:');
    console.log(`다이얼로그 처리: ${dialogCount}개`);
    console.log(`API 응답: ${apiResponses.length}개`);
    
    apiResponses.forEach((resp, idx) => {
      console.log(`\n${idx + 1}. ${resp.method} 요청 (${resp.status}):`);
      if (resp.method === 'POST' && resp.status === 200) {
        const summary = resp.data.summary || {};
        console.log(`   이동: ${summary.moved || 0}개`);
        console.log(`   스킵: ${summary.skipped || 0}개`);
        console.log(`   오류: ${summary.errors || 0}개`);
        
        if (summary.errors > 0) {
          console.log('   ⚠️ 일부 오류가 발생했습니다.');
        }
        if (summary.moved > 0) {
          console.log('   ✅ 폴더 생성 및 이미지 이동 성공!');
        }
      }
    });
    
    const postResponse = apiResponses.find(r => r.method === 'POST');
    if (postResponse && postResponse.status === 200) {
      console.log('\n✅ 테스트 성공: 폴더 생성 및 이미지 이동 완료!');
    } else if (postResponse && postResponse.status !== 200) {
      console.log('\n❌ 테스트 실패: POST 요청이 실패했습니다.');
    } else {
      console.log('\n⚠️ POST 요청이 실행되지 않았습니다.');
    }
    
    await page.screenshot({ path: 'screenshot-after-post-test.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: screenshot-after-post-test.png');
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'screenshot-error.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
}

testImageOrganizePost();

