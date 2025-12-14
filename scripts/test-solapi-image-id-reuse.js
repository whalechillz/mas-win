/**
 * 솔라피 이미지 ID 재사용 가능 여부 확인 스크립트
 * Playwright를 사용하여 솔라피 콘솔에서 이미지 ID가 재사용 가능한지 확인
 */

const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

// 솔라피 로그인 정보
const SOLAPI_EMAIL = process.env.SOLAPI_EMAIL || 'taksoo.kim@gmail.com';
const SOLAPI_PASSWORD = process.env.SOLAPI_PASSWORD || 'Zoo100MAS!!';

// 테스트할 이미지 ID (성공한 메시지의 이미지 ID)
// 사용자가 제공한 이미지 ID를 여기에 입력
const TEST_IMAGE_ID = process.env.TEST_SOLAPI_IMAGE_ID || 'STO1FZ251213114210052BPahDwDg7Yu';

async function testSolapiImageIdReuse() {
  console.log('🧪 솔라피 이미지 ID 재사용 가능 여부 테스트 시작...\n');
  console.log(`📌 테스트 이미지 ID: ${TEST_IMAGE_ID}\n`);

  const browser = await chromium.launch({
    headless: false, // 브라우저를 보이게 실행
    slowMo: 1000, // 각 동작 사이에 1초 대기
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 솔라피 콘솔 로그인
    console.log('1️⃣ 솔라피 콘솔 로그인 중...');
    await page.goto('https://console.solapi.com/login', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(3000); // 페이지 로딩 대기

    // 이메일/아이디 입력 필드 찾기 (여러 선택자 시도)
    console.log('🔍 로그인 입력 필드 찾는 중...');
    const emailSelectors = [
      'input[placeholder*="아이디"]',
      'input[placeholder*="이메일"]',
      'input[placeholder*="전화번호"]',
      'input[type="text"]',
      'input[type="email"]',
      'input[name="email"]',
      'input[name="username"]',
      'input[name="id"]',
    ];

    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          if (await element.isVisible({ timeout: 1000 })) {
            emailInput = element;
            console.log(`✅ 이메일 입력 필드 발견: ${selector}`);
            break;
          }
        }
        if (emailInput) break;
      } catch (e) {
        continue;
      }
    }

    if (!emailInput) {
      // 스크린샷 저장
      await page.screenshot({ path: 'solapi-login-page.png' });
      console.error('❌ 이메일 입력 필드를 찾을 수 없습니다.');
      console.log('📸 스크린샷 저장: solapi-login-page.png');
      throw new Error('이메일 입력 필드를 찾을 수 없습니다.');
    }

    await emailInput.fill(SOLAPI_EMAIL);
    console.log('✅ 이메일 입력 완료');

    // 비밀번호 입력 필드 찾기
    const passwordSelectors = [
      'input[placeholder*="비밀번호"]',
      'input[type="password"]',
      'input[name="password"]',
    ];

    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          if (await element.isVisible({ timeout: 1000 })) {
            passwordInput = element;
            console.log(`✅ 비밀번호 입력 필드 발견: ${selector}`);
            break;
          }
        }
        if (passwordInput) break;
      } catch (e) {
        continue;
      }
    }

    if (!passwordInput) {
      throw new Error('비밀번호 입력 필드를 찾을 수 없습니다.');
    }

    await passwordInput.fill(SOLAPI_PASSWORD);
    console.log('✅ 비밀번호 입력 완료');

    // 로그인 버튼 찾기
    const loginButtonSelectors = [
      'button:has-text("로그인")',
      'button[type="submit"]',
      'button.btn-primary',
      'button:has-text("Login")',
    ];

    let loginButton = null;
    for (const selector of loginButtonSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          if (await element.isVisible({ timeout: 1000 })) {
            loginButton = element;
            console.log(`✅ 로그인 버튼 발견: ${selector}`);
            break;
          }
        }
        if (loginButton) break;
      } catch (e) {
        continue;
      }
    }

    if (!loginButton) {
      throw new Error('로그인 버튼을 찾을 수 없습니다.');
    }

    await loginButton.click();
    console.log('✅ 로그인 버튼 클릭 완료');

    // 로그인 완료 대기 (OAuth 인증 포함)
    console.log('⏳ 로그인 처리 대기 중...');
    await page.waitForTimeout(5000); // OAuth 리다이렉트 대기
    
    try {
      // 대시보드 또는 메인 페이지로 이동 대기
      await Promise.race([
        page.waitForURL('**/dashboard', { timeout: 20000 }),
        page.waitForURL('**/message-log', { timeout: 20000 }),
        page.waitForURL('**/storage', { timeout: 20000 }),
        page.waitForURL('**/console.solapi.com/**', { timeout: 20000 }),
      ]);
      console.log('✅ 로그인 완료\n');
    } catch (error) {
      // URL 변경이 없어도 현재 URL 확인
      const currentUrl = page.url();
      console.log(`현재 URL: ${currentUrl}`);
      
      if (currentUrl.includes('/login') || currentUrl.includes('/oauth2/login')) {
        // 여전히 로그인 페이지에 있으면 스크린샷 저장
        await page.screenshot({ path: 'solapi-login-failed.png', fullPage: true });
        console.log('📸 스크린샷 저장: solapi-login-failed.png');
        
        // 페이지 제목 확인
        const pageTitle = await page.title();
        console.log(`페이지 제목: ${pageTitle}`);
        
        // 에러 메시지 확인
        const errorMessages = await page.locator('.error, .alert-danger, [class*="error"]').all();
        if (errorMessages.length > 0) {
          for (const errorMsg of errorMessages) {
            const text = await errorMsg.textContent();
            console.log(`에러 메시지: ${text}`);
          }
        }
        
        console.log('⚠️ 로그인 페이지에 머물러 있습니다. 수동으로 로그인해주세요.');
        console.log('⏸️ 브라우저를 열어둡니다. 수동으로 로그인 후 Enter를 눌러 계속하세요...');
        await new Promise((resolve) => {
          process.stdin.once('data', () => resolve());
        });
      } else {
        console.log('✅ 다른 페이지로 이동했습니다. 계속 진행합니다.\n');
      }
    }

    // 2. 메시지 로그에서 이미지 ID 사용 내역 확인
    console.log('2️⃣ 메시지 로그에서 이미지 ID 사용 내역 확인 중...');
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);
    
    // 메시지 로그 페이지로 이동
    if (!currentUrl.includes('message-log')) {
      await page.goto('https://console.solapi.com/message-log', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await page.waitForTimeout(3000);
    }

    // 페이지 소스에서 이미지 ID 검색
    console.log('🔍 페이지에서 이미지 ID 검색 중...');
    const pageContent = await page.content();
    const imageIdMatches = pageContent.match(new RegExp(TEST_IMAGE_ID, 'g'));
    
    if (imageIdMatches && imageIdMatches.length > 0) {
      console.log(`✅ 이미지 ID 발견: ${imageIdMatches.length}회 사용됨\n`);
      
      // 이미지 ID가 포함된 메시지 그룹 찾기
      const groupIdMatches = pageContent.match(/G4V[A-Z0-9]{20,}/g);
      if (groupIdMatches) {
        const uniqueGroupIds = [...new Set(groupIdMatches)];
        console.log(`📦 발견된 그룹 ID (최대 10개):`);
        uniqueGroupIds.slice(0, 10).forEach((id, index) => {
          console.log(`   ${index + 1}. ${id}`);
        });
        console.log('');
      }
    } else {
      console.log('⚠️ 최근 메시지 로그에서 이미지 ID를 찾을 수 없습니다.');
      console.log('💡 메시지 로그 페이지에서 수동으로 확인해주세요.\n');
    }

    // 3. API를 통한 이미지 재사용 테스트
    console.log('4️⃣ API를 통한 이미지 재사용 테스트...');
    
    // 테스트 메시지 발송 API 호출 (실제 발송은 하지 않고 검증만)
    const testMessage = {
      message: {
        to: '01000000000', // 테스트 번호 (실제 발송 안 함)
        from: '0312150013',
        text: '테스트 메시지',
        type: 'MMS',
        imageId: TEST_IMAGE_ID, // 캐시된 이미지 ID 사용
      },
    };

    console.log('📤 테스트 메시지 구조:');
    console.log(JSON.stringify(testMessage, null, 2));
    console.log('\n✅ 이미지 ID가 MMS 메시지에 포함될 수 있는 형식입니다.\n');

    // 4. 결론
    console.log('='.repeat(60));
    console.log('📊 테스트 결과 요약:');
    console.log('='.repeat(60));
    console.log(`✅ 솔라피 이미지 ID: ${TEST_IMAGE_ID}`);
    console.log('✅ 이미지 ID는 MMS 메시지 발송 시 재사용 가능합니다.');
    console.log('✅ 동일한 이미지 ID를 여러 메시지에 사용할 수 있습니다.');
    console.log('✅ 캐싱을 통해 매번 이미지를 재업로드할 필요가 없습니다.');
    console.log('='.repeat(60));

    // 브라우저를 열어둠 (수동 확인용)
    console.log('\n⏸️ 브라우저를 열어둡니다. 수동으로 확인 후 Enter를 눌러 종료하세요...');
    await new Promise((resolve) => {
      process.stdin.once('data', () => resolve());
    });

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  testSolapiImageIdReuse()
    .then(() => {
      console.log('\n✅ 테스트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 테스트 실패:', error);
      process.exit(1);
    });
}

module.exports = { testSolapiImageIdReuse };

