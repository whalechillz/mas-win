// 블로그 다운로드 API 직접 호출 테스트 (로깅 확인용)
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 블로그 다운로드 API 직접 테스트 시작...\n');

    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('https://win.masgolf.co.kr/admin/login');
    await page.waitForTimeout(2000);
    
    const loginInput = page.locator('input#login, input[name="login"], input[placeholder*="전화번호"], input[placeholder*="아이디"]').first();
    await loginInput.waitFor({ timeout: 10000 });
    await loginInput.fill('010-6669-9000');
    console.log('✅ 전화번호 입력 완료');
    await page.waitForTimeout(500);
    
    const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]').first();
    await passwordInput.waitFor({ timeout: 10000 });
    await passwordInput.fill('66699000');
    console.log('✅ 비밀번호 입력 완료');
    await page.waitForTimeout(500);
    
    const loginButton = page.locator('button[type="submit"], form button, button:has-text("로그인")').first();
    await loginButton.waitFor({ timeout: 10000 });
    await loginButton.click();
    console.log('✅ 로그인 버튼 클릭 완료');
    await page.waitForTimeout(3000);

    // 2. 블로그 관리 페이지 이동
    console.log('\n2️⃣ 블로그 관리 페이지로 이동...');
    await page.goto('https://win.masgolf.co.kr/admin/blog');
    await page.waitForTimeout(5000);

    // 3. Network 요청 모니터링 설정
    console.log('\n3️⃣ Network 요청 모니터링 설정...');
    const networkLogs = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/admin/blog-download')) {
        console.log(`\n📡 API 응답 받음: ${url}`);
        console.log(`   상태: ${response.status()}`);
        
        try {
          const responseText = await response.text();
          if (response.status() !== 200) {
            console.log(`   오류 응답: ${responseText.substring(0, 500)}`);
          } else {
            console.log(`   ✅ 성공 응답 (ZIP 파일)`);
            console.log(`   Content-Type: ${response.headers()['content-type']}`);
            console.log(`   Content-Length: ${response.headers()['content-length']}`);
          }
        } catch (error) {
          console.log(`   응답 파싱 오류: ${error.message}`);
        }
      }
    });

    // 4. API 직접 호출하여 로그 확인
    console.log('\n4️⃣ API 직접 호출...');
    
    // 먼저 브라우저에서 쿠키 가져오기
    const cookies = await context.cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    // API 직접 호출
    const response = await page.evaluate(async (cookieString) => {
      const response = await fetch('/api/admin/blog-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieString
        },
        body: JSON.stringify({ postId: 477 })
      });
      
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      };
    }, cookieString);
    
    console.log(`   응답 상태: ${response.status}`);
    console.log(`   응답 OK: ${response.ok}`);
    
    // 5. 다운로드 버튼 클릭 (실제 사용자 플로우)
    console.log('\n5️⃣ 다운로드 버튼 클릭 (실제 플로우)...');
    const downloadButton = page.locator('button:has-text("다운로드")').first();
    
    if (await downloadButton.count() > 0) {
      console.log('✅ 다운로드 버튼 발견');
      
      // Network 요청 캡처
      const requestPromise = page.waitForRequest(request => 
        request.url().includes('/api/admin/blog-download') && request.method() === 'POST'
      );
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/admin/blog-download') && response.request().method() === 'POST'
      );
      
      await downloadButton.click();
      console.log('✅ 다운로드 버튼 클릭');
      
      const request = await requestPromise;
      const response2 = await responsePromise;
      
      console.log('\n📡 요청 상세:');
      console.log(`   URL: ${request.url()}`);
      console.log(`   Method: ${request.method()}`);
      const requestBody = request.postData();
      if (requestBody) {
        try {
          const body = JSON.parse(requestBody);
          console.log(`   Body: ${JSON.stringify(body, null, 2)}`);
        } catch (e) {
          console.log(`   Body (raw): ${requestBody.substring(0, 200)}`);
        }
      }
      
      console.log('\n📡 응답 상세:');
      console.log(`   Status: ${response2.status()}`);
      console.log(`   Headers:`, JSON.stringify(response2.headers(), null, 2));
      
      // 다운로드 완료 대기
      await page.waitForTimeout(5000);
      
    } else {
      console.log('❌ 다운로드 버튼을 찾을 수 없음');
    }

    console.log('\n✅ 테스트 완료!');
    console.log('\n💡 팁: Vercel Dashboard → Functions → blog-download → Runtime Logs에서 상세 로그 확인 가능');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
    await page.screenshot({ path: 'test-blog-download-api-error.png' });
  } finally {
    await browser.close();
  }
})();

