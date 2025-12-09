/**
 * Playwright로 솔라피 콘솔에서 실제 전송된 imageId 확인 및 DB 업데이트
 * 
 * 현재 열려있는 Chrome 브라우저를 사용하여 솔라피 콘솔에 접속
 * 각 메시지 그룹의 실제 전송된 imageId를 확인하고 DB에 업데이트
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

// 확인할 메시지 ID 목록
const targetMessageIds = [149, 150, 151, 152, 153, 154, 155, 159, 160, 161];

async function fetchSolapiImageIdsWithPlaywright() {
  console.log('='.repeat(100));
  console.log('🔍 Playwright로 솔라피 콘솔에서 imageId 확인');
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
    // 2. 현재 열려있는 Chrome 브라우저에 연결 시도
    console.log('🌐 Chrome 브라우저 연결 시도 중...\n');
    
    // 여러 CDP 포트 시도
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
        // 다음 포트 시도
        continue;
      }
    }
    
    if (!connected) {
      console.log('⚠️ 기존 브라우저 연결 실패, 새 브라우저 실행...');
      console.log('   💡 Chrome을 CDP 모드로 실행하려면:');
      console.log('      /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222\n');
      
      // 새 브라우저 실행
      browser = await chromium.launch({
        headless: false, // 브라우저 창 표시
        channel: 'chrome' // Chrome 사용
      });
      page = await browser.newPage();
      console.log('✅ 새 브라우저 실행 완료\n');
    }

    // 3. 현재 페이지 확인 또는 솔라피 콘솔 접속
    const currentUrl = page.url();
    console.log(`📍 현재 페이지: ${currentUrl}\n`);

    if (!currentUrl.includes('console.solapi.com')) {
      console.log('🔐 솔라피 콘솔 접속 중...');
      await page.goto('https://console.solapi.com/message-log', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      await page.waitForTimeout(3000);
      console.log('✅ 솔라피 콘솔 접속 완료\n');
    } else {
      console.log('✅ 이미 솔라피 콘솔에 접속되어 있습니다.\n');
    }
    
    // 로그인 상태 확인 (간단히)
    const pageTitle = await page.title();
    console.log(`📄 페이지 제목: ${pageTitle}\n`);

    const imageIdMap = {};
    const updates = [];

    // 4. 각 메시지의 그룹 ID로 imageId 확인
    for (const msg of messages) {
      console.log(`\n📨 메시지 ID: ${msg.id}`);
      console.log(`   타입: ${msg.message_type}`);
      console.log(`   솔라피 그룹 ID: ${msg.solapi_group_id || '(없음)'}`);
      console.log(`   현재 DB image_url: ${msg.image_url || '(없음)'}`);

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
          waitUntil: 'networkidle',
          timeout: 30000
        });

        // 페이지 로딩 대기
        await page.waitForTimeout(2000);

        // 메시지 상세 정보에서 imageId 추출 시도
        let imageId = null;

        // 페이지 로딩 대기
        await page.waitForTimeout(3000);

        // 방법 1: 메시지 상세 모달 열기 (있는 경우)
        try {
          // 메시지 목록에서 첫 번째 메시지 클릭하여 상세 보기
          const messageRow = page.locator('tr, [class*="message"], [class*="row"]').first();
          if (await messageRow.count() > 0) {
            await messageRow.click();
            await page.waitForTimeout(2000);
          }
        } catch (e) {
          // 클릭 실패 무시
        }

        // 방법 2: 페이지 소스에서 imageId 패턴 찾기
        const pageContent = await page.content();
        // Solapi imageId 패턴: ST01FZ로 시작하는 긴 문자열 (최소 25자)
        const imageIdMatches = pageContent.match(/ST01FZ[A-Z0-9]{20,}/g);
        if (imageIdMatches && imageIdMatches.length > 0) {
          // 첫 번째 매치 사용
          imageId = imageIdMatches[0];
          console.log(`   📄 페이지 소스에서 imageId 발견: ${imageId.substring(0, 30)}...`);
        }

        // 방법 3: DOM에서 직접 찾기
        if (!imageId) {
          try {
            // 다양한 선택자로 시도
            const selectors = [
              '[data-image-id]',
              '.image-id',
              '[class*="imageId"]',
              '[class*="image-id"]',
              'td:has-text("ST01FZ")',
              'span:has-text("ST01FZ")',
              'div:has-text("ST01FZ")'
            ];

            for (const selector of selectors) {
              try {
                const element = page.locator(selector).first();
                if (await element.count() > 0) {
                  const text = await element.textContent();
                  const match = text?.match(/ST01FZ[A-Z0-9]{20,}/);
                  if (match) {
                    imageId = match[0];
                    console.log(`   🎯 DOM에서 imageId 발견 (${selector}): ${imageId.substring(0, 30)}...`);
                    break;
                  }
                }
              } catch (e) {
                // 다음 선택자 시도
                continue;
              }
            }
          } catch (e) {
            // DOM 검색 실패 무시
          }
        }

        // 방법 4: 네트워크 요청 모니터링 (실시간)
        if (!imageId) {
          let networkImageId = null;
          const responseHandler = async (response) => {
            const url = response.url();
            if (url.includes('api.solapi.com') && (url.includes('list') || url.includes('groups') || url.includes('messages'))) {
              try {
                const data = await response.json();
                // messages 배열에서 imageId 찾기
                if (data.messages && Array.isArray(data.messages)) {
                  for (const msg of data.messages) {
                    if (msg.imageId && /^ST01FZ[A-Z0-9]{20,}$/.test(msg.imageId)) {
                      networkImageId = msg.imageId;
                      break;
                    }
                  }
                }
                // 또는 직접 imageId 필드
                if (!networkImageId && data.imageId && /^ST01FZ[A-Z0-9]{20,}$/.test(data.imageId)) {
                  networkImageId = data.imageId;
                }
                // 또는 message 객체에서
                if (!networkImageId && data.message && data.message.imageId) {
                  networkImageId = data.message.imageId;
                }
              } catch (e) {
                // JSON 파싱 실패 무시
              }
            }
          };

          page.on('response', responseHandler);
          
          // 페이지 새로고침하여 네트워크 요청 트리거
          await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(5000);
          
          page.off('response', responseHandler);
          
          if (networkImageId) {
            imageId = networkImageId;
            console.log(`   🌐 네트워크 요청에서 imageId 발견: ${imageId.substring(0, 30)}...`);
          }
        }

        // 방법 5: JavaScript 실행으로 DOM에서 찾기
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
              
              // 또는 특정 속성에서 찾기
              const elements = document.querySelectorAll('[data-image-id], [image-id], [data-id]');
              for (const el of elements) {
                const id = el.getAttribute('data-image-id') || 
                          el.getAttribute('image-id') || 
                          el.getAttribute('data-id') ||
                          el.textContent;
                const match = String(id).match(/ST01FZ[A-Z0-9]{20,}/);
                if (match) {
                  return match[0];
                }
              }
              
              return null;
            });
            
            if (imageId) {
              console.log(`   🔍 JavaScript 실행으로 imageId 발견: ${imageId.substring(0, 30)}...`);
            }
          } catch (e) {
            // JavaScript 실행 실패 무시
          }
        }

        if (imageId && /^ST01FZ[A-Z0-9]{20,}$/.test(imageId)) {
          imageIdMap[msg.id] = imageId;
          console.log(`   ✅ imageId 확인: ${imageId.substring(0, 30)}...`);
          
          if (!msg.image_url || msg.image_url !== imageId) {
            updates.push({
              id: msg.id,
              currentImageUrl: msg.image_url,
              newImageId: imageId
            });
            console.log(`   ⚠️ DB 업데이트 필요`);
          } else {
            console.log(`   ✅ DB에 이미 올바른 imageId가 있습니다.`);
          }
        } else {
          console.log(`   ⚠️ imageId를 찾을 수 없습니다.`);
          console.log(`   💡 수동으로 확인: ${groupUrl}`);
        }

      } catch (error) {
        console.error(`   ❌ 오류: ${error.message}`);
      }

      // 다음 메시지로 이동하기 전 대기
      await page.waitForTimeout(1000);
    }

    // 5. DB 업데이트
    console.log('\n' + '='.repeat(100));
    console.log('\n📊 확인 결과:');
    console.log(`   imageId 확인됨: ${Object.keys(imageIdMap).length}개`);
    console.log(`   업데이트 필요: ${updates.length}개`);

    if (updates.length > 0) {
      console.log('\n⚠️ 업데이트할 메시지:');
      updates.forEach(item => {
        console.log(`   - 메시지 ID ${item.id}:`);
        console.log(`     현재: ${item.currentImageUrl || '(없음)'}`);
        console.log(`     변경: ${item.newImageId.substring(0, 50)}...`);
      });

      console.log('\n' + '='.repeat(100));
      console.log('\n💾 DB 업데이트 진행 중...\n');

      let updateSuccess = 0;
      let updateFail = 0;

      for (const item of updates) {
        try {
          const { error: updateError } = await supabase
            .from('channel_sms')
            .update({
              image_url: item.newImageId,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          if (updateError) {
            console.error(`   ❌ 메시지 ID ${item.id} 업데이트 실패: ${updateError.message}`);
            updateFail++;
          } else {
            console.log(`   ✅ 메시지 ID ${item.id}: imageId 업데이트 완료`);
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
    // 브라우저는 사용자가 로그인한 상태를 유지하기 위해 닫지 않음
    // 필요시 주석 해제
    // if (browser) {
    //   await browser.close();
    // }
  }
}

fetchSolapiImageIdsWithPlaywright();

