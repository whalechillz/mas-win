/**
 * Playwright로 솔라피 콘솔에 자동 로그인하여 실제 전송된 imageId 확인 및 DB 동기화
 * 
 * 솔라피 기준으로 실제 전송된 이미지 상태를 확인하고 DB를 업데이트
 */

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 솔라피 로그인 정보
const SOLAPI_EMAIL = 'taksoo.kim@gmail.com';
const SOLAPI_PASSWORD = 'Zoo100MAS!!';

// 동기화할 메시지 ID 목록
// 155: 우선 복구 (솔라피에 이미지 있음 → DB 업데이트 필요)
// 149-155, 159-161: 솔라피에 이미지 있음 → DB 업데이트 필요
// 157-158: 솔라피에 이미지 없음 → DB에서 제거 필요
const targetMessageIds = [155]; // 우선 155번만 복구

async function syncImagesFromSolapi() {
  console.log('='.repeat(100));
  console.log('🔄 솔라피 기준 이미지 동기화 시작');
  console.log('='.repeat(100));
  console.log('');

  // 1. 메시지 조회
  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('*')
    .in('id', targetMessageIds)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ 메시지 조회 오류:', error);
    return;
  }

  console.log(`📋 총 ${messages.length}개 메시지 확인\n`);

  let browser = null;
  let page = null;

  try {
    // 2. 브라우저 연결 또는 실행
    console.log('🌐 브라우저 준비 중...\n');
    
    const cdpPorts = [9222, 9223, 9224, 9225];
    let connected = false;
    
    for (const port of cdpPorts) {
      try {
        browser = await chromium.connectOverCDP(`http://localhost:${port}`);
        const contexts = browser.contexts();
        if (contexts.length > 0) {
          const context = contexts[0];
          const pages = context.pages();
          if (pages.length > 0) {
            page = pages[0];
            console.log(`✅ 기존 Chrome 브라우저에 연결 성공 (포트 ${port})\n`);
            connected = true;
            break;
          }
        }
      } catch (cdpError) {
        continue;
      }
    }
    
    if (!connected) {
      browser = await chromium.launch({
        headless: false,
        channel: 'chrome'
      });
      page = await browser.newPage();
      console.log('✅ 새 브라우저 실행 완료\n');
    }

    // 3. 솔라피 로그인 (수동 로그인 유도)
    console.log('🔐 솔라피 로그인 준비...');
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log(`   📍 현재 URL: ${currentUrl}`);
    
    // 이미 로그인되어 있는지 확인
    let isLoggedIn = false;
    if (currentUrl.includes('console.solapi.com') && !currentUrl.includes('login') && !currentUrl.includes('oauth2')) {
      const pageContent = await page.content();
      if (!pageContent.includes('로그인이 필요합니다') && 
          (pageContent.includes('message-log') || pageContent.includes('대시보드') || 
           pageContent.includes('메시지 로그') || currentUrl.includes('message-log'))) {
        isLoggedIn = true;
        console.log('   ✅ 이미 로그인되어 있습니다.\n');
      }
    }
    
    if (!isLoggedIn) {
      // 로그인 페이지로 이동
      if (!currentUrl.includes('console.solapi.com/login') && !currentUrl.includes('oauth2/login')) {
        console.log('   🔄 솔라피 로그인 페이지로 이동 중...');
        await page.goto('https://console.solapi.com/login', {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        await page.waitForTimeout(2000);
      }
      
      console.log('\n' + '='.repeat(100));
      console.log('⚠️ 수동 로그인이 필요합니다.');
      console.log('='.repeat(100));
      console.log('브라우저에서 다음 정보로 로그인해주세요:');
      console.log(`   이메일: ${SOLAPI_EMAIL}`);
      console.log(`   비밀번호: ${SOLAPI_PASSWORD}`);
      console.log('\n로그인 완료 후 Enter를 눌러주세요...\n');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise(resolve => {
        rl.question('로그인 완료 후 Enter를 누르세요: ', () => {
          rl.close();
          resolve();
        });
      });
      
      // 로그인 후 확인
      await page.waitForTimeout(2000);
      const finalUrl = page.url();
      const finalContent = await page.content();
      
      if (finalUrl.includes('login') || finalUrl.includes('oauth2') || finalContent.includes('로그인이 필요합니다')) {
        console.log('   ⚠️ 로그인이 완료되지 않은 것 같습니다.');
        console.log('   💡 다시 확인해주세요.\n');
      } else {
        console.log('   ✅ 로그인 확인 완료\n');
      }
    }

    // 로그인 폼 찾기 및 입력
    try {
      console.log('   🔍 로그인 폼 찾는 중...');
      
      // 이미 로그인되어 있는지 다시 확인
      const pageContent = await page.content();
      const currentUrlAfter = page.url();
      
      if ((pageContent.includes('message-log') || pageContent.includes('대시보드') || 
           currentUrlAfter.includes('message-log') || currentUrlAfter.includes('dashboard')) &&
          !pageContent.includes('로그인이 필요합니다')) {
        console.log('   ✅ 이미 로그인되어 있습니다.\n');
      } else {
        console.log('   📝 로그인 정보 입력 시작...');
        // 이메일/아이디 입력 필드 찾기 (더 다양한 선택자 시도)
        let emailInput = null;
        const emailSelectors = [
          'input[placeholder*="아이디"]',
          'input[placeholder*="이메일"]',
          'input[placeholder*="전화번호"]',
          'input[type="text"]:first-of-type',
          'input[type="email"]',
          'input[name="email"]',
          'input[name="username"]',
          'input[name="id"]',
          'input[class*="input"]:first-of-type',
          'form input:first-of-type'
        ];
        
        for (const selector of emailSelectors) {
          try {
            const input = page.locator(selector).first();
            const count = await input.count();
            if (count > 0) {
              const placeholder = await input.getAttribute('placeholder') || '';
              const name = await input.getAttribute('name') || '';
              const type = await input.getAttribute('type') || '';
              
              // 비밀번호 필드가 아닌지 확인
              if (type === 'password') continue;
              
              if (placeholder.includes('아이디') || placeholder.includes('이메일') || placeholder.includes('전화번호') || 
                  name.includes('email') || name.includes('username') || name.includes('id') ||
                  (selector.includes('first-of-type') && type !== 'password')) {
                emailInput = input;
                console.log(`   ✅ 이메일 입력 필드 발견: ${selector}`);
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        if (emailInput) {
          await emailInput.click({ timeout: 5000 });
          await page.waitForTimeout(300);
          await emailInput.fill(SOLAPI_EMAIL, { timeout: 5000 });
          await page.waitForTimeout(500);
          console.log('   ✅ 이메일 입력 완료');
        } else {
          console.log('   ⚠️ 이메일 입력 필드를 찾을 수 없습니다.');
          console.log('   💡 수동으로 입력해주세요.');
        }

        // 비밀번호 입력 필드 찾기
        const passwordSelectors = [
          'input[type="password"]',
          'input[placeholder*="비밀번호"]',
          'input[name="password"]',
          'form input[type="password"]'
        ];
        
        let passwordInput = null;
        for (const selector of passwordSelectors) {
          try {
            const input = page.locator(selector).first();
            if (await input.count() > 0) {
              passwordInput = input;
              console.log(`   ✅ 비밀번호 입력 필드 발견: ${selector}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (passwordInput) {
          await passwordInput.click({ timeout: 5000 });
          await page.waitForTimeout(300);
          await passwordInput.fill(SOLAPI_PASSWORD, { timeout: 5000 });
          await page.waitForTimeout(500);
          console.log('   ✅ 비밀번호 입력 완료');
        } else {
          console.log('   ⚠️ 비밀번호 입력 필드를 찾을 수 없습니다.');
          console.log('   💡 수동으로 입력해주세요.');
        }

        // 로그인 버튼 찾기 및 클릭
        const loginButtonSelectors = [
          'button:has-text("로그인")',
          'button[type="submit"]',
          'button.btn-primary',
          'button.primary',
          '[class*="login"] button',
          'form button[type="submit"]'
        ];
        
        let loginButton = null;
        for (const selector of loginButtonSelectors) {
          const button = page.locator(selector).first();
          if (await button.count() > 0) {
            loginButton = button;
            break;
          }
        }
        
        if (loginButton && await loginButton.count() > 0) {
          await loginButton.click();
          console.log('   ✅ 로그인 버튼 클릭');
          await page.waitForTimeout(2000);
        } else {
          console.log('   ⚠️ 로그인 버튼을 찾을 수 없습니다.');
        }

        // 로그인 완료 대기 (URL 변경 또는 특정 요소 대기)
        try {
          await page.waitForURL('**/console.solapi.com/**', { 
            timeout: 10000,
            waitUntil: 'domcontentloaded'
          });
          await page.waitForTimeout(3000);
          console.log('✅ 로그인 완료\n');
        } catch (waitError) {
          // URL 변경이 없어도 페이지 내용 확인
          const newContent = await page.content();
          if (!newContent.includes('로그인') || newContent.includes('message-log') || newContent.includes('대시보드')) {
            console.log('✅ 로그인 완료 (페이지 내용 확인)\n');
          } else {
            throw new Error('로그인 대기 시간 초과');
          }
        }
      }
    } catch (loginError) {
      console.log(`   ⚠️ 자동 로그인 중 오류: ${loginError.message}`);
    }
    
    // 로그인 완료 여부 최종 확인
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    const finalContent = await page.content();
    
    if (finalUrl.includes('login') || finalUrl.includes('oauth2') || finalContent.includes('로그인이 필요합니다')) {
      console.log('   ⚠️ 로그인이 완료되지 않았습니다.');
      console.log('   💡 브라우저에서 수동으로 로그인을 완료한 후 Enter를 눌러주세요...\n');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise(resolve => {
        rl.question('로그인 완료 후 Enter를 누르세요: ', () => {
          rl.close();
          resolve();
        });
      });
      
      // 로그인 후 페이지 확인
      await page.waitForTimeout(2000);
      const finalUrlAfter = page.url();
      console.log(`   📍 현재 URL: ${finalUrlAfter}\n`);
    } else {
      console.log('✅ 로그인 완료\n');
    }

    const imageIdMap = {};
    const updates = [];

    // 4. 각 메시지의 그룹 ID로 imageId 확인
    for (const msg of messages) {
      console.log(`\n📨 메시지 ID: ${msg.id}`);
      console.log(`   타입: ${msg.message_type}`);
      console.log(`   솔라피 그룹 ID: ${msg.solapi_group_id || '(없음)'}`);
      console.log(`   현재 DB image_url: ${msg.image_url ? msg.image_url.substring(0, 50) + '...' : '(없음)'}`);

      if (!msg.solapi_group_id) {
        console.log(`   ⚠️ 솔라피 그룹 ID가 없습니다. 건너뜁니다.`);
        continue;
      }

      // 첫 번째 그룹 ID 사용
      const groupId = msg.solapi_group_id.split(',')[0].trim();
      
      try {
        // 솔라피 콘솔에서 그룹 상세 페이지로 이동
        const groupUrl = `https://console.solapi.com/message-log?criteria=groupId&value=${groupId}&cond=eq`;
        console.log(`   🔍 그룹 상세 페이지 접속: ${groupId.substring(0, 20)}...`);
        
        await page.goto(groupUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        await page.waitForTimeout(3000);

        // imageId 추출 시도
        let imageId = null;

        // 방법 1: 페이지 소스에서 imageId 패턴 찾기
        const pageContent = await page.content();
        const imageIdMatches = pageContent.match(/ST01FZ[A-Z0-9]{20,}/g);
        if (imageIdMatches && imageIdMatches.length > 0) {
          imageId = imageIdMatches[0];
          console.log(`   📄 페이지 소스에서 imageId 발견: ${imageId.substring(0, 30)}...`);
        }

        // 방법 2: DOM에서 직접 찾기
        if (!imageId) {
          try {
            imageId = await page.evaluate(() => {
              // 모든 텍스트 노드에서 imageId 패턴 찾기
              const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null
              );
              
              let node;
              while (node = walker.nextNode()) {
                const text = node.textContent;
                const match = text.match(/ST01FZ[A-Z0-9]{20,}/);
                if (match) {
                  return match[0];
                }
              }
              
              return null;
            });
            
            if (imageId) {
              console.log(`   🔍 DOM에서 imageId 발견: ${imageId.substring(0, 30)}...`);
            }
          } catch (e) {
            // JavaScript 실행 실패 무시
          }
        }

        // 방법 3: 네트워크 요청 모니터링
        if (!imageId) {
          let networkImageId = null;
          const responseHandler = async (response) => {
            const url = response.url();
            if (url.includes('api.solapi.com') && (url.includes('list') || url.includes('groups') || url.includes('messages'))) {
              try {
                const data = await response.json();
                if (data.messages && Array.isArray(data.messages)) {
                  for (const message of data.messages) {
                    if (message.imageId && /^ST01FZ[A-Z0-9]{20,}$/.test(message.imageId)) {
                      networkImageId = message.imageId;
                      break;
                    }
                  }
                }
                if (!networkImageId && data.imageId && /^ST01FZ[A-Z0-9]{20,}$/.test(data.imageId)) {
                  networkImageId = data.imageId;
                }
              } catch (e) {
                // JSON 파싱 실패 무시
              }
            }
          };

          page.on('response', responseHandler);
          await page.reload({ waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(3000);
          page.off('response', responseHandler);
          
          if (networkImageId) {
            imageId = networkImageId;
            console.log(`   🌐 네트워크 요청에서 imageId 발견: ${imageId.substring(0, 30)}...`);
          }
        }

        // imageId 확인 결과 처리
        if (imageId && /^ST01FZ[A-Z0-9]{20,}$/.test(imageId)) {
          imageIdMap[msg.id] = imageId;
          console.log(`   ✅ imageId 확인: ${imageId.substring(0, 30)}...`);
          
          // DB와 비교
          if (!msg.image_url || msg.image_url !== imageId) {
            updates.push({
              id: msg.id,
              action: '이미지 업데이트',
              currentImageUrl: msg.image_url || '(없음)',
              newImageId: imageId
            });
            console.log(`   ⚠️ DB 업데이트 필요: ${msg.image_url ? '기존 이미지 → 새 이미지' : '이미지 추가'}`);
          } else {
            console.log(`   ✅ DB에 이미 올바른 imageId가 있습니다.`);
          }
        } else {
          // imageId가 없음 (솔라피에도 이미지 없음)
          console.log(`   ℹ️ 솔라피에 imageId가 없습니다.`);
          
          // DB에 이미지가 있다면 제거 필요
          if (msg.image_url) {
            updates.push({
              id: msg.id,
              action: '이미지 제거',
              currentImageUrl: msg.image_url,
              newImageId: null
            });
            console.log(`   ⚠️ DB에서 이미지 제거 필요`);
          } else {
            console.log(`   ✅ DB에도 이미지가 없습니다. (정상)`);
          }
        }

      } catch (error) {
        console.error(`   ❌ 오류: ${error.message}`);
      }

      // 다음 메시지로 이동하기 전 대기
      await page.waitForTimeout(2000);
    }

    // 5. DB 업데이트
    console.log('\n' + '='.repeat(100));
    console.log('\n📊 확인 결과:');
    console.log(`   imageId 확인됨: ${Object.keys(imageIdMap).length}개`);
    console.log(`   업데이트 필요: ${updates.length}개`);

    if (updates.length > 0) {
      console.log('\n⚠️ 업데이트할 메시지:');
      updates.forEach(item => {
        console.log(`   - 메시지 ID ${item.id}: ${item.action}`);
        if (item.action === '이미지 업데이트') {
          console.log(`     현재: ${item.currentImageUrl.substring(0, 50)}...`);
          console.log(`     변경: ${item.newImageId.substring(0, 50)}...`);
        } else {
          console.log(`     제거: ${item.currentImageUrl.substring(0, 50)}...`);
        }
      });

      console.log('\n' + '='.repeat(100));
      console.log('\n💾 DB 업데이트 진행 중...\n');

      let updateSuccess = 0;
      let updateFail = 0;

      for (const item of updates) {
        try {
          const updateData = item.action === '이미지 업데이트'
            ? {
                image_url: item.newImageId,
                message_type: 'MMS', // 이미지가 있으면 MMS
                updated_at: new Date().toISOString()
              }
            : {
                image_url: null,
                message_type: 'LMS', // 이미지가 없으면 LMS
                updated_at: new Date().toISOString()
              };

          const { error: updateError } = await supabase
            .from('channel_sms')
            .update(updateData)
            .eq('id', item.id);

          if (updateError) {
            console.error(`   ❌ 메시지 ID ${item.id} 업데이트 실패: ${updateError.message}`);
            updateFail++;
          } else {
            console.log(`   ✅ 메시지 ID ${item.id}: ${item.action} 완료`);
            updateSuccess++;
          }
        } catch (error) {
          console.error(`   ❌ 메시지 ID ${item.id} 업데이트 오류: ${error.message}`);
          updateFail++;
        }
      }

      console.log('\n' + '='.repeat(100));
      console.log('\n📊 업데이트 결과:');
      console.log(`   ✅ 성공: ${updateSuccess}개`);
      if (updateFail > 0) {
        console.log(`   ❌ 실패: ${updateFail}개`);
      }
      console.log('\n✅ 동기화 완료!');
    } else {
      console.log('\n✅ 모든 메시지가 이미 올바르게 설정되어 있습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    // 브라우저는 닫지 않음 (사용자가 확인할 수 있도록)
    console.log('\n💡 브라우저는 열어둡니다. 확인 후 수동으로 닫아주세요.');
  }
}

syncImagesFromSolapi();

