const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

const TARGET_PHONE = '01066699000';
const KAKAO_LOGIN_ID = 'taksoo.kim@gmail.com'; // 또는 '01066699000'
const KAKAO_LOGIN_PASSWORD = 'Zoo100zoo!!';

async function findUuidViaDevConsole() {
  console.log('🔍 카카오 개발자 콘솔 REST API 테스트 도구로 UUID 찾기 시작...');
  console.log(`📞 대상 전화번호: ${TARGET_PHONE}\n`);

  const browser = await chromium.launch({ 
    headless: false,        // 헤드리스 모드 해제 (브라우저 창 표시)
    slowMo: 1500,           // 동작 속도 조절 (밀리초)
    devtools: false,        // 개발자 도구 자동 열기 여부
    channel: 'chrome',      // Chrome 브라우저 사용 (더 안정적)
    args: [
      '--start-maximized',  // 최대화된 창으로 시작
      '--disable-blink-features=AutomationControlled' // 자동화 감지 방지
    ]
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // 네트워크 요청 모니터링
    let foundUuid = null;
    let foundPhone = null;
    let foundNickname = null;

    page.on('response', async (response) => {
      const url = response.url();
      
      // 친구 목록 API 응답 캡처
      if (url.includes('kapi.kakao.com') && (url.includes('friends') || url.includes('/v1/api/talk'))) {
        const status = response.status();
        console.log(`\n📡 API 응답: ${url}`);
        console.log(`   Status: ${status}`);
        
        if (status === 200) {
          try {
            const data = await response.json();
            console.log(`   ✅ API 응답 데이터:`, JSON.stringify(data, null, 2));
            
            // 친구 목록 응답 처리
            if (data.elements && Array.isArray(data.elements)) {
              console.log(`   등록된 친구 수: ${data.elements.length}명`);
              
              const friend = data.elements.find((f) => {
                const phone = f.phone_number || '';
                return phone.replace(/[^0-9]/g, '') === TARGET_PHONE.replace(/[^0-9]/g, '');
              });
              
              if (friend) {
                foundUuid = friend.uuid;
                foundPhone = friend.phone_number;
                foundNickname = friend.profile_nickname;
                console.log(`\n🎉 UUID 찾기 성공!`);
                console.log(`   UUID: ${foundUuid}`);
                console.log(`   전화번호: ${foundPhone}`);
                console.log(`   닉네임: ${foundNickname || '-'}`);
              } else {
                console.log(`   ⚠️ 해당 전화번호의 친구를 찾을 수 없습니다.`);
                if (data.elements.length > 0) {
                  console.log(`   등록된 친구 목록 (최대 5명):`);
                  data.elements.slice(0, 5).forEach((f, index) => {
                    console.log(`   ${index + 1}. 전화번호: ${f.phone_number || '-'}, UUID: ${f.uuid}, 닉네임: ${f.profile_nickname || '-'}`);
                  });
                }
              }
            }
          } catch (e) {
            console.log(`   ⚠️ JSON 파싱 실패:`, e.message);
          }
        } else {
          try {
            const errorData = await response.json();
            console.log(`   ❌ 에러:`, JSON.stringify(errorData, null, 2));
          } catch (e) {
            const text = await response.text();
            console.log(`   ❌ 에러 텍스트:`, text.substring(0, 200));
          }
        }
      }
    });

    console.log('1️⃣ 카카오 개발자 콘솔로 이동...');
    await page.goto('https://developers.kakao.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(3000);

    // 로그인 확인 및 로그인
    console.log('2️⃣ 로그인 상태 확인...');
    const loginButtons = await page.locator('a:has-text("로그인"), button:has-text("로그인")').all();
    const needsLogin = loginButtons.length > 0;
    
    if (needsLogin) {
      console.log('   로그인 필요. 로그인 시도...');
      
      if (loginButtons.length > 0) {
        await loginButtons[0].click();
        await page.waitForTimeout(2000);
      }

      // 로그인 폼 입력
      const idInput = await page.locator('input[type="email"], input[type="text"][name*="email"], input[type="text"][name*="id"], input[type="tel"]').first();
      const passwordInput = await page.locator('input[type="password"]').first();

      if (await idInput.count() > 0 && await passwordInput.count() > 0) {
        await idInput.fill(KAKAO_LOGIN_ID);
        await passwordInput.fill(KAKAO_LOGIN_PASSWORD);
        console.log('   로그인 정보 입력 완료');
        
        // 로그인 제출
        const submitButton = await page.locator('button[type="submit"], button:has-text("로그인")').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(3000);
        } else {
          await passwordInput.press('Enter');
          await page.waitForTimeout(3000);
        }
      }
    } else {
      console.log('   이미 로그인되어 있습니다.');
    }

    // 카카오톡 인증 대기
    console.log('\n3️⃣ 카카오톡 인증 대기 중...');
    console.log('   💡 카카오톡에서 로그인 확인 메시지를 확인하고 "로그인 확인" 버튼을 눌러주세요.');
    
    let authCompleted = false;
    const maxWaitTime = 120000;
    const startTime = Date.now();
    
    while (!authCompleted && (Date.now() - startTime) < maxWaitTime) {
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      
      if (currentUrl.includes('developers.kakao.com') && !currentUrl.includes('login') && !currentUrl.includes('accounts.kakao.com')) {
        authCompleted = true;
        console.log('   ✅ 인증 완료!');
        break;
      }
      
      process.stdout.write('.');
    }
    
    if (!authCompleted) {
      console.log('\n   ⚠️ 인증 대기 시간이 초과되었습니다.');
    }
    
    await page.waitForTimeout(3000);

    console.log('\n4️⃣ 친구 목록 조회 API 페이지로 이동...');
    
    // 친구 목록 조회 API 페이지로 직접 이동
    const friendsApiUrl = 'https://developers.kakao.com/tool/rest-api/open/get/kakaotalk-social-friends';
    
    try {
      console.log(`   친구 목록 조회 API 페이지로 이동: ${friendsApiUrl}`);
      await page.goto(friendsApiUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000
      });
      await page.waitForTimeout(3000);
      console.log('   ✅ 페이지 로드 완료');
    } catch (e) {
      console.log('   ⚠️ 직접 URL 접근 실패. REST API 테스트 도구 메인으로 이동...');
      await page.goto('https://developers.kakao.com/tool/rest-api', { 
        waitUntil: 'networkidle',
        timeout: 30000
      });
      await page.waitForTimeout(3000);
      
      // 왼쪽 메뉴에서 "카카오톡 소셜" 확장 후 "친구 목록 조회" 찾기
      console.log('   왼쪽 메뉴에서 "카카오톡 소셜" > "친구 목록 조회" 찾기...');
      
      // 먼저 "카카오톡 소셜" 메뉴 확장
      const socialMenu = await page.locator('text=카카오톡 소셜, [aria-label*="카카오톡 소셜"]').first();
      if (await socialMenu.count() > 0) {
        const isExpanded = await socialMenu.getAttribute('aria-expanded');
        if (isExpanded !== 'true') {
          await socialMenu.click();
          await page.waitForTimeout(1000);
        }
      }
      
      // "친구 목록 조회" 메뉴 클릭
      const friendsMenu = await page.locator('a:has-text("친구 목록 조회"), [role="link"]:has-text("친구 목록 조회")').first();
      if (await friendsMenu.count() > 0) {
        console.log('   친구 목록 조회 메뉴 클릭...');
        await friendsMenu.click();
        await page.waitForTimeout(3000);
      } else {
        console.log('   ⚠️ 친구 목록 조회 메뉴를 찾지 못했습니다.');
      }
    }

    console.log('\n2️⃣ Access Token 발급...');
    
    // 토큰 발급 버튼 찾기 (여러 가능한 텍스트)
    const tokenButtonSelectors = [
      'button:has-text("토큰 발급")',
      'button:has-text("발급")',
      'button:has-text("Issue Token")',
      'a:has-text("토큰 발급")',
      '[class*="token"][class*="issue"]',
      '[class*="issue"][class*="button"]'
    ];

    let tokenButton = null;
    for (const selector of tokenButtonSelectors) {
      const buttons = await page.locator(selector).all();
      if (buttons.length > 0) {
        tokenButton = buttons[0];
        console.log(`   토큰 발급 버튼 발견: ${selector}`);
        break;
      }
    }

    if (tokenButton) {
      console.log('   토큰 발급 버튼 클릭...');
      await tokenButton.click();
      await page.waitForTimeout(3000);
      
      // 토큰 발급 모달/팝업 처리
      const confirmSelectors = [
        'button:has-text("확인")',
        'button:has-text("동의")',
        'button:has-text("발급")',
        'button:has-text("OK")',
        '[role="button"]:has-text("확인")'
      ];
      
      for (const selector of confirmSelectors) {
        const buttons = await page.locator(selector).all();
        if (buttons.length > 0) {
          const btn = buttons[0];
          const isVisible = await btn.isVisible();
          if (isVisible) {
            console.log(`   확인 버튼 클릭: ${selector}`);
            await btn.click();
            await page.waitForTimeout(2000);
            break;
          }
        }
      }
    } else {
      console.log('   ⚠️ 토큰 발급 버튼을 찾지 못했습니다.');
      console.log('   💡 수동으로 "토큰 발급" 버튼을 클릭해주세요.');
    }

    console.log('\n3️⃣ API 호출 버튼 찾기 및 클릭...');
    await page.waitForTimeout(2000);
    
    // API 호출 버튼 찾기
    const apiCallSelectors = [
      'button:has-text("API 호출")',
      'button:has-text("요청")',
      'button:has-text("실행")',
      'button:has-text("Send")',
      'button:has-text("Request")',
      'button[type="submit"]',
      '[class*="call"][class*="button"]',
      '[class*="request"][class*="button"]'
    ];

    let apiCallButton = null;
    for (const selector of apiCallSelectors) {
      const buttons = await page.locator(selector).all();
      if (buttons.length > 0) {
        // 가장 눈에 띄는 버튼 선택 (보통 첫 번째)
        for (const btn of buttons) {
          const isVisible = await btn.isVisible();
          if (isVisible) {
            apiCallButton = btn;
            console.log(`   API 호출 버튼 발견: ${selector}`);
            break;
          }
        }
        if (apiCallButton) break;
      }
    }

    if (apiCallButton) {
      console.log('   API 호출 버튼 클릭...');
      await apiCallButton.click();
      await page.waitForTimeout(5000);
      console.log('   ✅ API 호출 완료. 응답 대기 중...');
    } else {
      console.log('   ⚠️ API 호출 버튼을 찾지 못했습니다.');
      console.log('   💡 수동으로 "API 호출" 또는 "요청" 버튼을 클릭해주세요.');
    }

    console.log('\n4️⃣ 응답 데이터 확인 중...');
    await page.waitForTimeout(5000);

    // 응답 영역에서 데이터 확인
    const responseSelectors = [
      'pre',
      'code',
      '.response',
      '.result',
      '[class*="response"]',
      '[class*="result"]',
      '[class*="json"]',
      'textarea[readonly]',
      '[data-testid*="response"]',
      '[data-testid*="result"]'
    ];

    let foundResponse = false;
    for (const selector of responseSelectors) {
      const elements = await page.locator(selector).all();
      for (const element of elements) {
        const text = await element.textContent();
        if (text && (text.includes('uuid') || text.includes('phone') || text.includes('elements') || text.includes('phone_number'))) {
          if (!foundResponse) {
            console.log(`\n✅ 응답 데이터 발견 (${selector}):`);
            foundResponse = true;
          }
          
          // JSON 파싱 시도
          try {
            const data = JSON.parse(text);
            if (data.elements && Array.isArray(data.elements)) {
              console.log(`   등록된 친구 수: ${data.elements.length}명`);
              
              const friend = data.elements.find((f) => {
                const phone = f.phone_number || '';
                return phone.replace(/[^0-9]/g, '') === TARGET_PHONE.replace(/[^0-9]/g, '');
              });
              
              if (friend) {
                foundUuid = friend.uuid;
                foundPhone = friend.phone_number;
                foundNickname = friend.profile_nickname;
                console.log(`\n🎉 UUID 찾기 성공!`);
                console.log(`   UUID: ${foundUuid}`);
                console.log(`   전화번호: ${foundPhone}`);
                console.log(`   닉네임: ${foundNickname || '-'}`);
              } else if (data.elements.length > 0) {
                console.log(`   ⚠️ 해당 전화번호의 친구를 찾을 수 없습니다.`);
                console.log(`   등록된 친구 목록 (최대 5명):`);
                data.elements.slice(0, 5).forEach((f, index) => {
                  console.log(`   ${index + 1}. 전화번호: ${f.phone_number || '-'}, UUID: ${f.uuid}, 닉네임: ${f.profile_nickname || '-'}`);
                });
              }
              break;
            }
          } catch (e) {
            // JSON 파싱 실패는 무시하고 텍스트에서 UUID 패턴 찾기
            const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
            const uuids = text.match(uuidPattern);
            if (uuids && uuids.length > 0) {
              console.log(`\n🔍 UUID 패턴 발견: ${uuids.length}개`);
              uuids.forEach((uuid, index) => {
                console.log(`   ${index + 1}. ${uuid}`);
              });
            }
          }
        }
      }
    }

    // 페이지 스크린샷 저장 (디버깅용)
    try {
      await page.screenshot({ path: 'kakao-api-response.png', fullPage: true });
      console.log('   📸 페이지 스크린샷 저장: kakao-api-response.png');
    } catch (e) {
      // 스크린샷 실패는 무시
    }

    if (foundUuid) {
      console.log('\n✅ 최종 결과:');
      console.log(`   UUID: ${foundUuid}`);
      console.log(`   전화번호: ${foundPhone}`);
      console.log(`   닉네임: ${foundNickname || '-'}`);
      
      console.log('\n💡 이 UUID를 사용하여 친구를 등록할 수 있습니다:');
      console.log(`   /admin/kakao-friends 페이지에서 UUID "${foundUuid}"와 전화번호 "${foundPhone}"를 등록하세요.`);
    } else {
      console.log('\n⚠️ UUID를 자동으로 찾지 못했습니다.');
      console.log('💡 수동으로 확인해주세요:');
      console.log('   1. REST API 테스트 도구에서 친구 목록 API 호출');
      console.log('   2. 토큰 발급 후 API 호출 버튼 클릭');
      console.log('   3. 응답 데이터에서 전화번호와 UUID 확인');
      console.log('   4. 확인한 UUID를 /admin/kakao-friends에서 등록');
    }

    console.log('\n⏸️  브라우저를 30초간 열어둡니다. 확인 후 닫아주세요...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    console.log('\n💡 수동 확인 방법:');
    console.log('   1. 카카오 개발자 콘솔 REST API 테스트 도구 사용');
    console.log('   2. 카카오톡 소셜 > 친구 목록 조회 API 선택');
    console.log('   3. 토큰 발급 후 API 호출');
    console.log('   4. 응답에서 UUID 확인');
  } finally {
    console.log('\n✅ 스크립트 종료');
    // 브라우저를 닫지 않고 열어둠
    // await browser.close();
  }
}

// 실행
findUuidViaDevConsole().catch(console.error);
