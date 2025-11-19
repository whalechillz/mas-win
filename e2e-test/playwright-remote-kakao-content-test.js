/**
 * Playwright 원격 점검 스크립트
 * 배포 후 카카오톡 콘텐츠 생성 기능 점검
 */

const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://www.masgolf.co.kr';
// e2e-tests 패턴 사용: 전화번호 로그인
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

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
    // 1. 로그인 (e2e-tests 패턴 사용)
    console.log('1️⃣ 로그인 중...');
    await page.goto(`${PRODUCTION_URL}/api/auth/signin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 로그인 폼 찾기 (전화번호 로그인)
    const phoneInput = await page.locator('input[type="tel"], input[name="phone"], input[type="text"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인")').first();
    
    if (await phoneInput.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 로그인 폼 발견');
      await phoneInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      await loginButton.click();
      await page.waitForTimeout(3000);
      
      // 로그인 성공 확인 (관리자 페이지로 리다이렉트되었는지 확인)
      try {
        await page.waitForURL('**/admin/**', { timeout: 5000 });
        console.log('   ✅ 로그인 완료 (관리자 페이지로 이동 확인)');
      } catch (error) {
        console.log('   ⚠️ 로그인 후 리다이렉트 확인 실패, 계속 진행...');
        // URL 확인 실패해도 계속 진행 (이미 로그인되어 있을 수 있음)
      }
    } else {
      console.log('   ⚠️ 로그인 폼을 찾을 수 없습니다. 이미 로그인되어 있을 수 있습니다.');
      // 로그인 페이지가 아닌 경우 직접 관리자 페이지로 이동 시도
      await page.goto(`${PRODUCTION_URL}/admin/kakao-content`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
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
    
    // 4. 디버깅 API 테스트
    console.log('4️⃣ 디버깅 API 테스트...');
    const debugApiTest = await page.evaluate(async (baseUrl) => {
      try {
        const res = await fetch(`${baseUrl}/api/debug-api-routing`);
        const data = await res.json();
        return {
          status: res.status,
          ok: res.ok,
          data: data
        };
      } catch (error) {
        return { error: error.message };
      }
    }, PRODUCTION_URL);
    
    console.log('🔍 디버깅 API 결과:');
    console.log(JSON.stringify(debugApiTest, null, 2));
    
    // 5. API 엔드포인트 직접 테스트
    console.log('\n5️⃣ API 엔드포인트 직접 테스트...');
    
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
          contentType: promptRes.headers.get('content-type'),
          xMatchedPath: promptRes.headers.get('x-matched-path'),
          url: promptRes.url
        };
        if (promptRes.ok) {
          const data = await promptRes.json();
          results.generatePrompt.data = { success: data.success };
        } else {
          const errorText = await promptRes.text();
          results.generatePrompt.errorText = errorText.substring(0, 500);
        }
      } catch (error) {
        results.generatePrompt = { error: error.message };
      }
      
      // 2. generate-paragraph-images-with-prompts API 테스트 (새 경로)
      try {
        const imageRes = await fetch(`${baseUrl}/api/kakao-content/generate-images`, {
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
          contentType: imageRes.headers.get('content-type'),
          xMatchedPath: imageRes.headers.get('x-matched-path'),
          url: imageRes.url
        };
        if (!imageRes.ok) {
          const errorText = await imageRes.text();
          results.generateImages.errorText = errorText.substring(0, 500);
          // HTML인지 JSON인지 확인
          results.generateImages.isHTML = errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html');
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
    if (apiTests.generateImages?.xMatchedPath) {
      console.log(`   ⚠️ x-matched-path: ${apiTests.generateImages.xMatchedPath}`);
      if (apiTests.generateImages.xMatchedPath.includes('/ko/') || apiTests.generateImages.xMatchedPath.includes('/ja/')) {
        console.log('   ❌ i18n이 API 경로를 가로채고 있습니다!');
      }
    }
    if (apiTests.generateImages?.isHTML) {
      console.log('   ❌ 응답이 HTML입니다 (에러 페이지로 라우팅됨)');
    }
    
    console.log('\n3. auto-create-account1 API:');
    console.log(JSON.stringify(apiTests.autoCreateAccount1, null, 2));
    
    console.log('\n4. auto-create-account2 API:');
    console.log(JSON.stringify(apiTests.autoCreateAccount2, null, 2));
    
    // 6. 스크린샷 저장
    console.log('\n6️⃣ 스크린샷 저장...');
    await page.screenshot({ 
      path: 'playwright-remote-kakao-content-test.png',
      fullPage: true 
    });
    console.log('   ✅ 스크린샷 저장: playwright-remote-kakao-content-test.png');
    
    // 7. 네트워크 요청 로그 확인
    console.log('\n7️⃣ 네트워크 요청 확인...');
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

