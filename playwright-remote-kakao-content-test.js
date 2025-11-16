/**
 * Playwright 원격 점검 스크립트
 * 배포 후 카카오톡 콘텐츠 생성 기능 점검
 */

const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://www.masgolf.co.kr';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@masgolf.co.kr';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'your-password';

async function testKakaoContentGeneration() {
  console.log('🚀 원격 점검 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // 디버깅을 위해 느리게 실행
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto(`${PRODUCTION_URL}/admin/login`);
    await page.waitForTimeout(2000);
    
    // 로그인 폼 찾기
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="이메일"], input[placeholder*="email"]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = await page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();
    
    if (await emailInput.count() > 0) {
      await emailInput.fill(ADMIN_EMAIL);
      await passwordInput.fill(ADMIN_PASSWORD);
      await submitButton.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('⚠️ 로그인 폼을 찾을 수 없습니다. 이미 로그인되어 있을 수 있습니다.');
    }
    
    // 2. 카카오톡 콘텐츠 페이지로 이동
    console.log('2️⃣ 카카오톡 콘텐츠 페이지로 이동...');
    await page.goto(`${PRODUCTION_URL}/admin/kakao-content`);
    await page.waitForTimeout(3000);
    
    // 페이지 로드 확인
    const pageTitle = await page.locator('h1, h2, .page-title').first().textContent().catch(() => '');
    console.log(`   페이지 제목: ${pageTitle}`);
    
    // 3. 날짜 선택 (2025-11-19)
    console.log('3️⃣ 날짜 선택 (2025-11-19)...');
    const dateInput = await page.locator('input[type="date"], input[name="date"]').first();
    if (await dateInput.count() > 0) {
      await dateInput.fill('2025-11-19');
      await page.waitForTimeout(1000);
    } else {
      console.log('⚠️ 날짜 입력 필드를 찾을 수 없습니다.');
    }
    
    // 4. API 엔드포인트 직접 테스트
    console.log('4️⃣ API 엔드포인트 직접 테스트...');
    
    // 브라우저 콘솔에서 fetch 테스트
    const apiTests = await page.evaluate(async (baseUrl) => {
      const results = {
        generatePrompt: null,
        generateImages: null,
        autoCreateAccount1: null,
        autoCreateAccount2: null
      };
      
      // 1. generate-prompt API 테스트
      try {
        const promptRes = await fetch(`${baseUrl}/api/kakao-content/generate-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: '골프 배경',
            accountType: 'account1',
            type: 'background',
            date: '2025-11-19'
          })
        });
        results.generatePrompt = {
          status: promptRes.status,
          statusText: promptRes.statusText,
          ok: promptRes.ok,
          contentType: promptRes.headers.get('content-type')
        };
        if (promptRes.ok) {
          const data = await promptRes.json();
          results.generatePrompt.data = { success: data.success };
        }
      } catch (error) {
        results.generatePrompt = { error: error.message };
      }
      
      // 2. generate-paragraph-images-with-prompts API 테스트
      try {
        const imageRes = await fetch(`${baseUrl}/api/generate-paragraph-images-with-prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompts: [{ prompt: 'test prompt', paragraphIndex: 0 }],
            imageCount: 1,
            metadata: {
              account: 'account1',
              type: 'background',
              date: '2025-11-19'
            }
          })
        });
        results.generateImages = {
          status: imageRes.status,
          statusText: imageRes.statusText,
          ok: imageRes.ok,
          contentType: imageRes.headers.get('content-type')
        };
        if (!imageRes.ok) {
          const errorText = await imageRes.text();
          results.generateImages.errorText = errorText.substring(0, 200);
        }
      } catch (error) {
        results.generateImages = { error: error.message };
      }
      
      // 3. auto-create-account1 API 테스트
      try {
        const account1Res = await fetch(`${baseUrl}/api/kakao-content/auto-create-account1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: '2025-11-19',
            forceRegenerate: false
          })
        });
        results.autoCreateAccount1 = {
          status: account1Res.status,
          statusText: account1Res.statusText,
          ok: account1Res.ok
        };
        if (!account1Res.ok) {
          const errorText = await account1Res.text();
          results.autoCreateAccount1.errorText = errorText.substring(0, 200);
        }
      } catch (error) {
        results.autoCreateAccount1 = { error: error.message };
      }
      
      // 4. auto-create-account2 API 테스트
      try {
        const account2Res = await fetch(`${baseUrl}/api/kakao-content/auto-create-account2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: '2025-11-19',
            forceRegenerate: false
          })
        });
        results.autoCreateAccount2 = {
          status: account2Res.status,
          statusText: account2Res.statusText,
          ok: account2Res.ok
        };
        if (!account2Res.ok) {
          const errorText = await account2Res.text();
          results.autoCreateAccount2.errorText = errorText.substring(0, 200);
        }
      } catch (error) {
        results.autoCreateAccount2 = { error: error.message };
      }
      
      return results;
    }, PRODUCTION_URL);
    
    // 결과 출력
    console.log('\n📊 API 테스트 결과:\n');
    
    console.log('1. generate-prompt API:');
    console.log(JSON.stringify(apiTests.generatePrompt, null, 2));
    
    console.log('\n2. generate-paragraph-images-with-prompts API:');
    console.log(JSON.stringify(apiTests.generateImages, null, 2));
    
    console.log('\n3. auto-create-account1 API:');
    console.log(JSON.stringify(apiTests.autoCreateAccount1, null, 2));
    
    console.log('\n4. auto-create-account2 API:');
    console.log(JSON.stringify(apiTests.autoCreateAccount2, null, 2));
    
    // 5. 스크린샷 저장
    console.log('\n5️⃣ 스크린샷 저장...');
    await page.screenshot({ 
      path: 'playwright-remote-kakao-content-test.png',
      fullPage: true 
    });
    console.log('   ✅ 스크린샷 저장: playwright-remote-kakao-content-test.png');
    
    // 6. 네트워크 요청 로그 확인
    console.log('\n6️⃣ 네트워크 요청 확인...');
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const request = requests.find(r => r.url === response.url());
        if (request) {
          request.status = response.status();
          request.statusText = response.statusText();
        }
      }
    });
    
    // 페이지 새로고침하여 네트워크 요청 캡처
    await page.reload();
    await page.waitForTimeout(2000);
    
    console.log(`   총 ${requests.length}개의 API 요청 발견`);
    requests.forEach((req, idx) => {
      console.log(`   ${idx + 1}. ${req.method} ${req.url} - ${req.status || 'N/A'}`);
    });
    
    // 결과 요약
    console.log('\n📋 점검 결과 요약:\n');
    
    const issues = [];
    if (apiTests.generateImages?.status === 405) {
      issues.push('❌ generate-paragraph-images-with-prompts API가 HTTP 405 반환');
    }
    if (apiTests.autoCreateAccount1?.status === 405) {
      issues.push('❌ auto-create-account1 API가 HTTP 405 반환');
    }
    if (apiTests.autoCreateAccount2?.status === 405) {
      issues.push('❌ auto-create-account2 API가 HTTP 405 반환');
    }
    
    if (issues.length > 0) {
      console.log('⚠️ 발견된 문제:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('✅ 모든 API가 정상 작동 중입니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ 
      path: 'playwright-remote-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

// 실행
testKakaoContentGeneration().catch(console.error);

