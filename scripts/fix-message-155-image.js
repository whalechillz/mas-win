/**
 * 155번 메시지의 솔라피 imageId 확인 및 DB 복구
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

async function fixMessage155Image() {
  console.log('='.repeat(100));
  console.log('🔧 155번 메시지 이미지 복구');
  console.log('='.repeat(100));
  console.log('');

  // 1. 155번 메시지 조회
  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('id', 155)
    .single();

  if (error) {
    console.error('❌ 메시지 조회 오류:', error);
    return;
  }

  if (!messages) {
    console.error('❌ 155번 메시지를 찾을 수 없습니다.');
    return;
  }

  const msg = messages;
  console.log(`📨 메시지 ID: ${msg.id}`);
  console.log(`   타입: ${msg.message_type}`);
  console.log(`   솔라피 그룹 ID: ${msg.solapi_group_id || '(없음)'}`);
  console.log(`   현재 DB image_url: ${msg.image_url ? msg.image_url.substring(0, 50) + '...' : '(없음)'}`);
  console.log('');

  if (!msg.solapi_group_id) {
    console.error('❌ 솔라피 그룹 ID가 없습니다.');
    return;
  }

  // 첫 번째 그룹 ID 사용
  const groupId = msg.solapi_group_id.split(',')[0].trim();
  console.log(`🔍 그룹 ID: ${groupId}\n`);

  let browser = null;
  let page = null;

  try {
    // 2. 브라우저 연결
    console.log('🌐 브라우저 연결 중...\n');
    
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
            console.log(`✅ 기존 브라우저에 연결 성공 (포트 ${port})\n`);
            connected = true;
            break;
          } else {
            page = await context.newPage();
            console.log(`✅ 기존 브라우저에 연결, 새 페이지 생성 (포트 ${port})\n`);
            connected = true;
            break;
          }
        }
      } catch (cdpError) {
        continue;
      }
    }
    
    if (!connected) {
      console.log('⚠️ 기존 브라우저 연결 실패, 새 브라우저 실행...\n');
      browser = await chromium.launch({
        headless: false,
        channel: 'chrome-canary'
      });
      page = await browser.newPage();
      console.log('✅ 새 브라우저 실행 완료\n');
    }

    // 3. 현재 페이지 확인 및 로그인 상태 확인
    await page.waitForTimeout(2000); // 페이지 로딩 대기
    let currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}\n`);
    
    // 로그인 페이지인지 확인
    if (currentUrl.includes('login') || currentUrl.includes('oauth2')) {
      console.log('⚠️ 로그인 페이지입니다.');
      console.log('   💡 브라우저에서 로그인을 완료해주세요.');
      console.log('   ⏳ 로그인 완료를 감지하는 중... (최대 60초 대기)\n');
      
      // 로그인 완료 감지 (로그인 페이지가 아닌 URL로 변경될 때까지 대기)
      let loginCompleted = false;
      const maxWaitTime = 60000; // 60초
      const checkInterval = 2000; // 2초마다 확인
      const startTime = Date.now();
      
      while (!loginCompleted && (Date.now() - startTime) < maxWaitTime) {
        await page.waitForTimeout(checkInterval);
        currentUrl = page.url();
        
        if (!currentUrl.includes('login') && !currentUrl.includes('oauth2')) {
          loginCompleted = true;
          console.log(`   ✅ 로그인 완료 감지!`);
          console.log(`   📍 현재 URL: ${currentUrl}\n`);
          break;
        }
      }
      
      if (!loginCompleted) {
        console.log('   ⚠️ 로그인 완료를 감지하지 못했습니다.');
        console.log('   💡 이미 로그인하셨다면, 브라우저를 새로고침하거나 그룹 페이지로 이동해주세요.\n');
        // 로그인 완료를 감지하지 못했어도 계속 진행 (이미 로그인된 경우)
      }
    } else {
      console.log('✅ 이미 로그인된 상태입니다.\n');
    }

    // 4. 솔라피 그룹 상세 페이지로 이동
    const groupUrl = `https://console.solapi.com/message-log?criteria=groupId&value=${groupId}&cond=eq`;
    console.log(`🔍 그룹 상세 페이지 접속: ${groupUrl}\n`);
    
    await page.goto(groupUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(5000); // 페이지 로딩 대기

    // 5. imageId 추출
    let imageId = null;

    console.log('🔍 imageId 추출 시도 중...\n');

    // 방법 1: 메시지 그룹 상세 모달 열기 및 RawData 보기 탭 클릭
    try {
      console.log('   📋 메시지 그룹 상세 모달 열기 시도...');
      
      // 그룹 행 클릭하여 상세 모달 열기
      const groupRow = await page.locator('tbody tr, [role="row"]').first();
      if (await groupRow.isVisible({ timeout: 5000 })) {
        await groupRow.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ 그룹 상세 모달 열기');
      }

      // "RawData 보기" 탭 클릭
      try {
        const rawDataTab = page.locator('text=RawData 보기, button:has-text("RawData 보기"), [role="tab"]:has-text("RawData")').first();
        if (await rawDataTab.isVisible({ timeout: 3000 })) {
          await rawDataTab.click();
          await page.waitForTimeout(2000);
          console.log('   ✅ RawData 보기 탭 클릭');
        }
      } catch (e) {
        console.log(`   ⚠️ RawData 보기 탭 클릭 실패: ${e.message}`);
        // 다른 방법으로 시도
        try {
          const rawDataButton = page.locator('button, a, [role="button"]').filter({ hasText: /RawData|rawdata|raw/i });
          if (await rawDataButton.count() > 0) {
            await rawDataButton.first().click();
            await page.waitForTimeout(2000);
            console.log('   ✅ RawData 버튼 클릭 (대체 방법)');
          }
        } catch (e2) {
          console.log(`   ⚠️ RawData 버튼 클릭 실패: ${e2.message}`);
        }
      }

      // 메시지목록 탭으로 이동하여 개별 메시지 상세 보기
      try {
        const messageListTab = await page.locator('text=메시지목록, [role="tab"]:has-text("메시지목록")').first();
        if (await messageListTab.isVisible({ timeout: 3000 })) {
          await messageListTab.click();
          await page.waitForTimeout(2000);
          console.log('   ✅ 메시지목록 탭으로 이동');
        }

        // 첫 번째 메시지 행 클릭하여 상세 보기
        const firstMessageRow = await page.locator('tbody tr, [role="row"]').first();
        if (await firstMessageRow.isVisible({ timeout: 3000 })) {
          await firstMessageRow.click();
          await page.waitForTimeout(2000);
          console.log('   ✅ 메시지 상세 모달 열기');
        }

        // 메시지 상세 모달에서 "RawData 보기" 탭 클릭
        try {
          const messageRawDataTab = page.locator('text=RawData 보기, button:has-text("RawData 보기"), [role="tab"]:has-text("RawData")').first();
          if (await messageRawDataTab.isVisible({ timeout: 3000 })) {
            await messageRawDataTab.click();
            await page.waitForTimeout(2000);
            console.log('   ✅ 메시지 RawData 보기 탭 클릭');
          }
        } catch (e) {
          console.log(`   ⚠️ 메시지 RawData 탭 클릭 실패: ${e.message}`);
        }
      } catch (e) {
        console.log(`   ⚠️ 메시지목록 탭 이동 실패: ${e.message}`);
      }
    } catch (e) {
      console.log(`   ⚠️ 상세 모달 열기 실패: ${e.message}`);
    }

    // 방법 2: RawData에서 imageId 추출 (JSON 구조에서)
    try {
      console.log('   🔍 RawData JSON에서 imageId 추출 시도...');
      const rawDataContent = await page.evaluate(() => {
        // RawData 영역의 모든 텍스트 수집
        const rawDataElements = document.querySelectorAll('[class*="raw"], [class*="data"], pre, code, [class*="json"]');
        for (const el of rawDataElements) {
          const text = el.textContent || el.innerText;
          if (text && text.includes('imageId')) {
            return text;
          }
        }
        return null;
      });

      if (rawDataContent) {
        const imageIdMatch = rawDataContent.match(/"imageId"\s*:\s*"([^"]+)"/i) || 
                            rawDataContent.match(/imageId["\s:]+["']?([A-Z0-9]{20,})/i);
        if (imageIdMatch && imageIdMatch[1]) {
          const candidate = imageIdMatch[1].trim();
          if (/^ST01FZ[A-Z0-9]{20,}$/.test(candidate)) {
            imageId = candidate;
            console.log(`✅ RawData에서 imageId 발견: ${imageId.substring(0, 30)}...`);
          }
        }
      }
    } catch (e) {
      console.log(`   ⚠️ RawData 추출 실패: ${e.message}`);
    }

    // 방법 3: 페이지 소스에서 imageId 패턴 찾기 (더 넓은 범위)
    if (!imageId) {
      console.log('   🔍 페이지 소스에서 imageId 검색 중...');
      const pageContent = await page.content();
      const imageIdPatterns = [
        /ST01FZ[A-Z0-9]{20,}/g,
        /imageId["\s:]+([A-Z0-9]{20,})/gi,
        /image["\s:]+id["\s:]+["']?([A-Z0-9]{20,})/gi,
        /"imageId":\s*"([A-Z0-9]{20,})"/gi
      ];
      
      for (const pattern of imageIdPatterns) {
        const matches = pageContent.match(pattern);
        if (matches && matches.length > 0) {
          // 첫 번째 매치에서 실제 ID 추출
          const candidate = matches[0].replace(/[^A-Z0-9]/g, '');
          if (candidate.length >= 20 && candidate.startsWith('ST01FZ')) {
            imageId = candidate;
            console.log(`✅ 페이지 소스에서 imageId 발견: ${imageId.substring(0, 30)}...`);
            break;
          }
        }
      }
    }

    // 방법 4: DOM에서 직접 찾기 (더 광범위한 검색)
    if (!imageId) {
      try {
        imageId = await page.evaluate(() => {
          // 모든 속성에서 imageId 찾기
          const allElements = document.querySelectorAll('*');
          for (const el of allElements) {
            for (const attr of el.attributes) {
              const value = attr.value;
              const match = value.match(/ST01FZ[A-Z0-9]{20,}/);
              if (match) {
                return match[0];
              }
            }
          }
          
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
          console.log(`✅ DOM에서 imageId 발견: ${imageId.substring(0, 30)}...`);
        }
      } catch (e) {
        console.log(`   ⚠️ DOM 검색 실패: ${e.message}`);
      }
    }

    // 방법 5: 네트워크 요청 모니터링 (더 상세하게)
    if (!imageId) {
      console.log('   🌐 네트워크 요청 모니터링 중...');
      let networkImageId = null;
      const responseHandler = async (response) => {
        const url = response.url();
        if (url.includes('api.solapi.com')) {
          try {
            const data = await response.json();
            // 다양한 구조에서 imageId 찾기
            const findImageId = (obj) => {
              if (!obj || typeof obj !== 'object') return null;
              if (obj.imageId && /^ST01FZ[A-Z0-9]{20,}$/.test(obj.imageId)) {
                return obj.imageId;
              }
              if (obj.image && obj.image.id && /^ST01FZ[A-Z0-9]{20,}$/.test(obj.image.id)) {
                return obj.image.id;
              }
              for (const key in obj) {
                if (typeof obj[key] === 'object') {
                  const found = findImageId(obj[key]);
                  if (found) return found;
                }
              }
              return null;
            };
            
            const found = findImageId(data);
            if (found) {
              networkImageId = found;
            }
          } catch (e) {
            // JSON 파싱 실패 무시
          }
        }
      };

      page.on('response', responseHandler);
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(5000);
      page.off('response', responseHandler);
      
      if (networkImageId) {
        imageId = networkImageId;
        console.log(`✅ 네트워크 요청에서 imageId 발견: ${imageId.substring(0, 30)}...`);
      }
    }

    // 방법 6: 사용자에게 수동 입력 요청
    if (!imageId) {
      console.log('\n   ⚠️ 자동으로 imageId를 찾을 수 없습니다.');
      console.log('   💡 브라우저에서 개발자 도구(F12)를 열고 다음을 시도해보세요:');
      console.log('      1. Network 탭에서 api.solapi.com 요청 확인');
      console.log('      2. Elements 탭에서 "ST01FZ" 검색');
      console.log('      3. Console에서 imageId 관련 데이터 확인\n');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise((resolve) => {
        rl.question('   브라우저에서 imageId를 확인하셨다면 입력해주세요 (없으면 Enter): ', (input) => {
          if (input && input.trim()) {
            const trimmed = input.trim();
            if (/^ST01FZ[A-Z0-9]{20,}$/.test(trimmed)) {
              imageId = trimmed;
              console.log(`   ✅ imageId 입력됨: ${imageId.substring(0, 30)}...\n`);
            } else {
              console.log('   ⚠️ 올바른 imageId 형식이 아닙니다. (ST01FZ로 시작하는 20자 이상)\n');
            }
          }
          rl.close();
          resolve();
        });
      });
    }

    // 6. imageId 확인 결과 처리
    if (imageId && /^ST01FZ[A-Z0-9]{20,}$/.test(imageId)) {
      console.log(`\n✅ imageId 확인 완료: ${imageId}\n`);
      
      // DB 업데이트
      console.log('💾 DB 업데이트 중...');
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: imageId,
          message_type: 'MMS',
          updated_at: new Date().toISOString()
        })
        .eq('id', 155);

      if (updateError) {
        console.error(`❌ DB 업데이트 실패: ${updateError.message}`);
      } else {
        console.log('✅ DB 업데이트 완료!');
        console.log(`   - image_url: ${imageId.substring(0, 50)}...`);
        console.log(`   - message_type: MMS`);
        console.log('\n✅ 155번 메시지 이미지 복구 완료!');
      }
    } else {
      console.log('\n❌ imageId를 찾을 수 없습니다.');
      console.log('   💡 솔라피 콘솔에서 수동으로 확인해주세요.');
      console.log(`   URL: ${groupUrl}`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    console.log('\n💡 브라우저는 열어둡니다. 확인 후 수동으로 닫아주세요.');
  }
}

fixMessage155Image();

