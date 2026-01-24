const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

const SOLAPI_URL = 'https://console.solapi.com';
const SOLAPI_USERNAME = process.env.SOLAPI_USERNAME || '';
const SOLAPI_PASSWORD = process.env.SOLAPI_PASSWORD || '';

if (!SOLAPI_USERNAME || !SOLAPI_PASSWORD) {
  console.error('❌ Solapi 로그인 정보가 없습니다.');
  console.error('   .env.local에 SOLAPI_USERNAME과 SOLAPI_PASSWORD를 설정해주세요.');
  process.exit(1);
}

async function checkSolapiTemplates() {
  console.log('🚀 Solapi 템플릿 API 확인 시작...\n');

  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500 
  });
  
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 } 
  });
  
  const page = await context.newPage();

  try {
    // 1. Solapi 로그인
    console.log('🔐 Solapi 로그인 중...');
    await page.goto(`${SOLAPI_URL}/login`, { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    await page.waitForTimeout(3000);

    // 로그인 필드 찾기
    const emailInputSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[name="username"]',
      'input[placeholder*="아이디"]',
      'input[placeholder*="이메일"]',
      'input[placeholder*="전화번호"]',
      'input[placeholder*="ID"]',
      'input[placeholder*="Email"]',
      'input[type="text"]'
    ];
    
    let emailInput = null;
    for (const selector of emailInputSelectors) {
      try {
        const input = await page.locator(selector).first();
        if (await input.isVisible({ timeout: 2000 })) {
          emailInput = input;
          console.log(`  ✅ 로그인 ID 필드 발견: ${selector}`);
          break;
        }
      } catch (e) {
        // 다음 셀렉터 시도
      }
    }
    
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();

    if (emailInput && await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill(SOLAPI_USERNAME);
      console.log('  ✅ ID 입력 완료');
    } else {
      throw new Error('❌ 로그인 ID 필드를 찾을 수 없습니다.');
    }

    if (await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await passwordInput.fill(SOLAPI_PASSWORD);
      console.log('  ✅ 비밀번호 입력 완료');
    } else {
      throw new Error('❌ 비밀번호 필드를 찾을 수 없습니다.');
    }

    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();
      console.log('  ✅ 로그인 버튼 클릭');
      await page.waitForTimeout(5000);
      
      // 로그인 성공 확인
      const currentUrl = page.url();
      if (!currentUrl.includes('/login')) {
        console.log('  ✅ 로그인 성공');
      } else {
        console.log('  ⚠️ 로그인 페이지에 머물러 있음. 수동 확인 필요');
      }
    } else {
      throw new Error('❌ 로그인 버튼을 찾을 수 없습니다.');
    }

    // 2. 템플릿 페이지로 이동
    console.log('\n📋 템플릿 페이지로 이동 중...');
    
    // 여러 경로 시도
    const templatePaths = [
      '/kakao/templates',
      '/message/kakao/templates',
      '/kakao/alimtalk/templates',
      '/templates/kakao'
    ];

    let templatePageFound = false;
    for (const path of templatePaths) {
      try {
        await page.goto(`${SOLAPI_URL}${path}`, { 
          waitUntil: 'domcontentloaded', 
          timeout: 30000 
        });
        await page.waitForTimeout(3000);
        
        // 템플릿 목록이 있는지 확인
        const hasTemplates = await page.locator('text=템플릿, text=Template, [class*="template"]').first().isVisible({ timeout: 3000 }).catch(() => false);
        if (hasTemplates) {
          console.log(`  ✅ 템플릿 페이지 발견: ${path}`);
          templatePageFound = true;
          break;
        }
      } catch (e) {
        console.log(`  ⚠️ ${path} 접근 실패, 다음 경로 시도`);
      }
    }

    if (!templatePageFound) {
      console.log('  ⚠️ 템플릿 페이지를 자동으로 찾지 못했습니다. 수동으로 확인해주세요.');
      console.log('  현재 URL:', page.url());
    }

    // 3. 네트워크 요청 모니터링
    console.log('\n🔍 네트워크 요청 모니터링 중...');
    
    const apiRequests = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('api.solapi.com') && url.includes('template')) {
        apiRequests.push({
          url: url,
          method: request.method(),
          headers: request.headers(),
        });
        console.log(`  📡 API 요청 발견: ${request.method()} ${url}`);
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('api.solapi.com') && url.includes('template')) {
        const status = response.status();
        const headers = response.headers();
        let body = '';
        try {
          body = await response.text();
        } catch (e) {
          body = '응답 본문을 읽을 수 없음';
        }
        
        console.log(`  📥 API 응답: ${status} ${url}`);
        console.log(`     응답 헤더:`, JSON.stringify(headers, null, 2));
        console.log(`     응답 본문 (처음 500자):`, body.substring(0, 500));
        
        if (status === 200) {
          try {
            const jsonData = JSON.parse(body);
            console.log(`     ✅ JSON 파싱 성공`);
            console.log(`     템플릿 구조:`, JSON.stringify(Object.keys(jsonData), null, 2));
            if (jsonData.templates || jsonData.list) {
              const templates = jsonData.templates || jsonData.list;
              console.log(`     템플릿 개수: ${templates.length}`);
              if (templates.length > 0) {
                console.log(`     첫 번째 템플릿 예시:`, JSON.stringify(templates[0], null, 2));
              }
            }
          } catch (e) {
            console.log(`     ⚠️ JSON 파싱 실패: ${e.message}`);
          }
        }
      }
    });

    // 4. 페이지 새로고침하여 API 요청 캡처
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // 5. 개발자 도구에서 API 확인 안내
    console.log('\n📝 수집된 정보:');
    console.log(`   API 요청 개수: ${apiRequests.length}`);
    if (apiRequests.length > 0) {
      console.log('\n   발견된 API 요청:');
      apiRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.method} ${req.url}`);
      });
    }

    console.log('\n✅ 확인 완료!');
    console.log('\n💡 다음 단계:');
    console.log('   1. 브라우저 개발자 도구(F12)를 열어 Network 탭 확인');
    console.log('   2. 템플릿 목록이 로드될 때의 API 요청 확인');
    console.log('   3. 요청 URL, 헤더, 파라미터를 확인하여 API 문서와 비교');
    
    // 브라우저를 열어둠 (수동 확인용)
    console.log('\n⏸️  브라우저를 열어두었습니다. 수동 확인 후 Enter를 누르면 종료됩니다...');
    await new Promise((resolve) => {
      process.stdin.once('data', () => resolve());
    });

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

checkSolapiTemplates().catch(console.error);
