const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

const TARGET_PHONE = '01066699000';
const KAKAO_BUSINESS_URL = 'https://business.kakao.com';
const KAKAO_LOGIN_ID = 'taksoo.kim@gmail.com'; // 또는 '01066699000'
const KAKAO_LOGIN_PASSWORD = 'Zoo100zoo!!';

async function findKakaoUuid() {
  console.log('🔍 카카오 비즈니스 파트너센터에서 UUID 찾기 시작...');
  console.log(`📞 대상 전화번호: ${TARGET_PHONE}\n`);

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
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
      
      // API 응답에서 UUID 정보 찾기
      if (url.includes('api') || url.includes('friends') || url.includes('customers') || url.includes('members')) {
        const status = response.status();
        
        if (status === 200) {
          try {
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('application/json')) {
              const data = await response.json();
              
              // JSON 데이터에서 전화번호와 UUID 찾기
              const searchInObject = (obj, path = '') => {
                if (typeof obj !== 'object' || obj === null) return;
                
                for (const key in obj) {
                  const value = obj[key];
                  const currentPath = path ? `${path}.${key}` : key;
                  
                  // 전화번호 찾기
                  if (typeof value === 'string' && value.replace(/[^0-9]/g, '') === TARGET_PHONE.replace(/[^0-9]/g, '')) {
                    console.log(`\n📱 전화번호 발견: ${currentPath} = ${value}`);
                    
                    // 같은 객체나 부모 객체에서 UUID 찾기
                    const findUuid = (searchObj, searchPath = '') => {
                      for (const k in searchObj) {
                        const v = searchObj[k];
                        const p = searchPath ? `${searchPath}.${k}` : k;
                        
                        if (k.toLowerCase().includes('uuid') || k.toLowerCase().includes('id')) {
                          if (typeof v === 'string' && v.length > 10) {
                            console.log(`   🎯 UUID 후보 발견: ${p} = ${v}`);
                            return v;
                          }
                        }
                        
                        if (typeof v === 'object' && v !== null) {
                          const uuid = findUuid(v, p);
                          if (uuid) return uuid;
                        }
                      }
                      return null;
                    };
                    
                    const uuid = findUuid(obj);
                    if (uuid && !foundUuid) {
                      foundUuid = uuid;
                      foundPhone = value;
                      console.log(`\n✅ UUID 찾기 성공!`);
                      console.log(`   UUID: ${foundUuid}`);
                      console.log(`   전화번호: ${foundPhone}`);
                    }
                  }
                  
                  // UUID 직접 찾기
                  if (key.toLowerCase().includes('uuid') && typeof value === 'string' && value.length > 10) {
                    console.log(`   🔍 UUID 발견: ${currentPath} = ${value}`);
                  }
                  
                  if (typeof value === 'object' && value !== null) {
                    searchInObject(value, currentPath);
                  }
                }
              };
              
              searchInObject(data);
            }
          } catch (e) {
            // JSON 파싱 실패는 무시
          }
        }
      }
    });

    console.log('1️⃣ 카카오 비즈니스 파트너센터로 이동...');
    await page.goto(KAKAO_BUSINESS_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // 로그인 상태 확인
    console.log('2️⃣ 로그인 시도...');
    
    // 로그인 버튼 또는 링크 찾기
    const loginSelectors = [
      'a:has-text("로그인")',
      'button:has-text("로그인")',
      'a[href*="login"]',
      '.login',
      '[data-testid*="login"]'
    ];

    let loginButton = null;
    for (const selector of loginSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        loginButton = elements[0];
        break;
      }
    }

    if (loginButton) {
      console.log('   로그인 버튼 클릭...');
      await loginButton.click();
      await page.waitForTimeout(3000);
    }

    // 로그인 폼 찾기 및 입력
    console.log('   로그인 정보 입력 중...');
    
    // 이메일/전화번호 입력 필드 찾기
    const idSelectors = [
      'input[type="email"]',
      'input[type="text"][name*="email"]',
      'input[type="text"][name*="id"]',
      'input[type="text"][name*="username"]',
      'input[type="tel"]',
      'input[placeholder*="이메일"]',
      'input[placeholder*="전화번호"]',
      'input[placeholder*="아이디"]',
      'input#email',
      'input#id',
      'input#username'
    ];

    let idInput = null;
    for (const selector of idSelectors) {
      const inputs = await page.locator(selector).all();
      if (inputs.length > 0) {
        idInput = inputs[0];
        break;
      }
    }

    if (idInput) {
      await idInput.fill(KAKAO_LOGIN_ID);
      console.log(`   ✅ ID 입력 완료: ${KAKAO_LOGIN_ID}`);
      await page.waitForTimeout(1000);
    } else {
      console.log('   ⚠️ ID 입력 필드를 찾지 못했습니다.');
    }

    // 비밀번호 입력 필드 찾기
    const passwordSelectors = [
      'input[type="password"]',
      'input[name*="password"]',
      'input[name*="pwd"]',
      'input#password',
      'input#pwd'
    ];

    let passwordInput = null;
    for (const selector of passwordSelectors) {
      const inputs = await page.locator(selector).all();
      if (inputs.length > 0) {
        passwordInput = inputs[0];
        break;
      }
    }

    if (passwordInput) {
      await passwordInput.fill(KAKAO_LOGIN_PASSWORD);
      console.log('   ✅ 비밀번호 입력 완료');
      await page.waitForTimeout(1000);
    } else {
      console.log('   ⚠️ 비밀번호 입력 필드를 찾지 못했습니다.');
    }

    // 로그인 제출 버튼 찾기 및 클릭
    if (idInput && passwordInput) {
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("로그인")',
        'input[type="submit"]',
        'button.login',
        '.btn-login'
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        const buttons = await page.locator(selector).all();
        if (buttons.length > 0) {
          submitButton = buttons[0];
          break;
        }
      }

      if (submitButton) {
        console.log('   로그인 버튼 클릭...');
        await submitButton.click();
        await page.waitForTimeout(5000);
        
        // 로그인 성공 확인
        const currentUrl = page.url();
        if (!currentUrl.includes('login')) {
          console.log('   ✅ 로그인 성공!');
        } else {
          console.log('   ⚠️ 로그인 실패 가능성. 수동으로 확인해주세요.');
        }
      } else {
        // Enter 키로 제출 시도
        if (passwordInput) {
          await passwordInput.press('Enter');
          console.log('   Enter 키로 로그인 시도...');
          await page.waitForTimeout(5000);
        }
      }
    }

    // 카카오톡 인증 대기
    console.log('\n3️⃣ 카카오톡 인증 대기 중...');
    console.log('   💡 카카오톡에서 로그인 확인 메시지를 확인하고 "로그인 확인" 버튼을 눌러주세요.');
    console.log('   ⏸️  인증 완료까지 대기합니다...\n');
    
    // 인증 완료 확인 (URL이 business.kakao.com으로 변경되거나 로그인 페이지가 아닐 때까지 대기)
    let authCompleted = false;
    const maxWaitTime = 120000; // 최대 2분 대기
    const startTime = Date.now();
    
    while (!authCompleted && (Date.now() - startTime) < maxWaitTime) {
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      
      // 인증 완료 확인: business.kakao.com으로 리다이렉트되었는지 확인
      if (currentUrl.includes('business.kakao.com') && !currentUrl.includes('login') && !currentUrl.includes('accounts.kakao.com')) {
        authCompleted = true;
        console.log('   ✅ 인증 완료! 비즈니스 파트너센터로 이동했습니다.');
        break;
      }
      
      // 페이지 내용 확인 (인증 완료 메시지 등)
      const pageText = await page.textContent('body');
      if (pageText && (pageText.includes('대시보드') || pageText.includes('채널') || pageText.includes('메시지'))) {
        authCompleted = true;
        console.log('   ✅ 인증 완료! 대시보드 페이지로 이동했습니다.');
        break;
      }
      
      process.stdout.write('.'); // 진행 표시
    }
    
    if (!authCompleted) {
      console.log('\n   ⚠️ 인증 대기 시간이 초과되었습니다.');
      console.log('   💡 수동으로 인증을 완료한 후 스크립트가 계속 진행됩니다.');
    }
    
    await page.waitForTimeout(3000);

    console.log('4️⃣ 친구/고객 관리 페이지로 이동 시도...');
    
    // 여러 가능한 경로 시도
    const possiblePaths = [
      '/friends',
      '/customers',
      '/members',
      '/channel/friends',
      '/channel/customers',
      '/manage/friends',
      '/manage/customers'
    ];

    for (const path of possiblePaths) {
      try {
        console.log(`   시도: ${KAKAO_BUSINESS_URL}${path}`);
        await page.goto(`${KAKAO_BUSINESS_URL}${path}`, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });
        await page.waitForTimeout(2000);
        
        // 페이지가 로드되었는지 확인
        const pageTitle = await page.title();
        console.log(`   페이지 제목: ${pageTitle}`);
        
        // 전화번호 검색 시도
        const searchInputs = await page.locator('input[type="text"], input[type="tel"], input[placeholder*="전화"], input[placeholder*="번호"]').count();
        if (searchInputs > 0) {
          console.log(`   ✅ 검색 입력 필드 발견!`);
          break;
        }
      } catch (e) {
        // 경로가 없으면 다음 경로 시도
        continue;
      }
    }

    console.log('\n5️⃣ 전화번호 검색 시도...');
    
    // 검색 입력 필드 찾기
    const searchSelectors = [
      'input[type="text"]',
      'input[type="tel"]',
      'input[placeholder*="전화"]',
      'input[placeholder*="번호"]',
      'input[placeholder*="검색"]',
      'input[name*="phone"]',
      'input[name*="search"]'
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      const inputs = await page.locator(selector).all();
      for (const input of inputs) {
        const placeholder = await input.getAttribute('placeholder') || '';
        const name = await input.getAttribute('name') || '';
        if (placeholder.includes('전화') || placeholder.includes('번호') || placeholder.includes('검색') || 
            name.includes('phone') || name.includes('search')) {
          searchInput = input;
          break;
        }
      }
      if (searchInput) break;
    }

    if (searchInput) {
      console.log('   검색 입력 필드에 전화번호 입력...');
      await searchInput.fill(TARGET_PHONE);
      await page.waitForTimeout(1000);
      
      // 검색 버튼 클릭
      const searchButtons = await page.locator('button:has-text("검색"), button[type="submit"]').all();
      if (searchButtons.length > 0) {
        await searchButtons[0].click();
        console.log('   검색 버튼 클릭 완료');
        await page.waitForTimeout(3000);
      } else {
        // Enter 키로 검색
        await searchInput.press('Enter');
        console.log('   Enter 키로 검색 실행');
        await page.waitForTimeout(3000);
      }
    } else {
      console.log('   ⚠️ 검색 입력 필드를 자동으로 찾지 못했습니다.');
      console.log('   💡 수동으로 전화번호를 검색해주세요.');
    }

    console.log('\n6️⃣ 페이지 내용 확인 중...');
    await page.waitForTimeout(5000);

    // 페이지의 텍스트에서 UUID 패턴 찾기
    const pageContent = await page.textContent('body');
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const uuids = pageContent.match(uuidPattern);
    
    if (uuids && uuids.length > 0) {
      console.log(`\n🔍 페이지에서 UUID 패턴 발견: ${uuids.length}개`);
      uuids.forEach((uuid, index) => {
        console.log(`   ${index + 1}. ${uuid}`);
      });
    }

    // 테이블이나 리스트에서 전화번호와 UUID 찾기
    const tables = await page.locator('table, [role="table"], .table, .list').all();
    for (const table of tables) {
      const rows = await table.locator('tr, [role="row"], .row').all();
      for (const row of rows) {
        const rowText = await row.textContent();
        if (rowText && rowText.includes(TARGET_PHONE.replace(/[^0-9]/g, ''))) {
          console.log(`\n✅ 전화번호가 포함된 행 발견:`);
          console.log(`   ${rowText}`);
          
          // 같은 행에서 UUID 찾기
          const cells = await row.locator('td, th, [role="cell"]').all();
          for (const cell of cells) {
            const cellText = await cell.textContent();
            if (cellText) {
              const uuidMatch = cellText.match(uuidPattern);
              if (uuidMatch) {
                foundUuid = uuidMatch[0];
                foundPhone = TARGET_PHONE;
                console.log(`\n🎉 UUID 찾기 성공!`);
                console.log(`   UUID: ${foundUuid}`);
                console.log(`   전화번호: ${foundPhone}`);
              }
            }
          }
        }
      }
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
      console.log('   1. 브라우저에서 친구/고객 목록을 확인하세요');
      console.log('   2. 전화번호로 검색하여 UUID를 확인하세요');
      console.log('   3. 확인한 UUID를 /admin/kakao-friends에서 등록하세요');
    }

    console.log('\n⏸️  브라우저를 30초간 열어둡니다. 확인 후 닫아주세요...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    console.log('\n💡 수동 확인 방법:');
    console.log('   1. 카카오 비즈니스 파트너센터에 로그인');
    console.log('   2. 채널 → 친구 관리 또는 고객 관리 메뉴로 이동');
    console.log('   3. 전화번호로 검색하여 UUID 확인');
  } finally {
    console.log('\n✅ 스크립트 종료');
    // 브라우저를 닫지 않고 열어둠
    // await browser.close();
  }
}

// 실행
findKakaoUuid().catch(console.error);
