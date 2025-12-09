/**
 * 모든 메시지 이미지 복원 스크립트
 * Playwright를 사용하여 솔라피 콘솔에서 imageId를 추출하고 DB에 업데이트
 * 
 * 대상 메시지:
 * - 149-155번: 솔라피에 이미지 전송됨 → DB에 imageId 업데이트
 * - 159-161번: 솔라피에 이미지 전송됨 → DB에 imageId 업데이트
 * - 157-158번: 솔라피에 이미지 없음 → DB에서 image_url 제거
 * - 148번: 솔라피에 이미지 없음 → DB에서 image_url 제거
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

// 복원 대상 메시지 ID
const TARGET_MESSAGE_IDS = [149, 150, 151, 152, 153, 154, 155, 159, 160, 161];
// 이미지 제거 대상 메시지 ID (솔라피에 이미지 없음)
const REMOVE_IMAGE_IDS = [148, 157, 158];

async function restoreAllMessagesImages() {
  console.log('='.repeat(100));
  console.log('🔄 모든 메시지 이미지 복원 시작');
  console.log('='.repeat(100));
  console.log('');

  // 1. 대상 메시지 조회
  const allTargetIds = [...TARGET_MESSAGE_IDS, ...REMOVE_IMAGE_IDS];
  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('*')
    .in('id', allTargetIds)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ 메시지 조회 오류:', error);
    return;
  }

  if (!messages || messages.length === 0) {
    console.error('❌ 대상 메시지를 찾을 수 없습니다.');
    return;
  }

  console.log(`📋 대상 메시지: ${messages.length}개\n`);

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

    // 3. 로그인 상태 확인
    await page.waitForTimeout(2000);
    let currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}\n`);
    
    if (currentUrl.includes('login') || currentUrl.includes('oauth2')) {
      console.log('⚠️ 로그인 페이지입니다.');
      console.log('   💡 브라우저에서 로그인을 완료해주세요.');
      console.log('   ⏳ 로그인 완료를 감지하는 중... (최대 60초 대기)\n');
      
      let loginCompleted = false;
      const maxWaitTime = 60000;
      const checkInterval = 2000;
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
        console.log('   💡 브라우저에서 로그인을 완료한 후 스크립트를 다시 실행해주세요.\n');
        return;
      }
    } else {
      console.log('✅ 이미 로그인된 상태입니다.\n');
    }

    // 4. 각 메시지 처리
    const results = {
      updated: [],
      removed: [],
      failed: []
    };

    for (const msg of messages) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📨 메시지 ID: ${msg.id}`);
      console.log(`   타입: ${msg.message_type}`);
      console.log(`   솔라피 그룹 ID: ${msg.solapi_group_id || '(없음)'}`);
      console.log(`   현재 DB image_url: ${msg.image_url ? msg.image_url.substring(0, 50) + '...' : '(없음)'}`);

      const shouldRemove = REMOVE_IMAGE_IDS.includes(msg.id);
      
      if (shouldRemove) {
        // 이미지 제거 대상
        console.log(`   🗑️ 이미지 제거 대상 (솔라피에 이미지 없음)`);
        try {
          const { error: updateError } = await supabase
            .from('channel_sms')
            .update({
              image_url: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', msg.id);

          if (updateError) {
            console.error(`   ❌ DB 업데이트 실패: ${updateError.message}`);
            results.failed.push({ id: msg.id, reason: 'DB 업데이트 실패' });
          } else {
            console.log(`   ✅ 이미지 제거 완료`);
            results.removed.push(msg.id);
          }
        } catch (error) {
          console.error(`   ❌ 오류: ${error.message}`);
          results.failed.push({ id: msg.id, reason: error.message });
        }
        continue;
      }

      // 이미지 복원 대상
      if (!msg.solapi_group_id) {
        console.log(`   ⚠️ 솔라피 그룹 ID가 없습니다. 건너뜁니다.`);
        results.failed.push({ id: msg.id, reason: '솔라피 그룹 ID 없음' });
        continue;
      }

      const groupId = msg.solapi_group_id.split(',')[0].trim();
      
      try {
        // 그룹 상세 페이지로 이동
        const groupUrl = `https://console.solapi.com/message-log?criteria=groupId&value=${groupId}&cond=eq`;
        console.log(`   🔍 그룹 상세 페이지 접속: ${groupId.substring(0, 20)}...`);
        
        await page.goto(groupUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        await page.waitForTimeout(3000);

        // 그룹 행 클릭하여 상세 모달 열기
        try {
          const groupRow = await page.locator('tbody tr, [role="row"]').first();
          if (await groupRow.isVisible({ timeout: 5000 })) {
            await groupRow.click();
            await page.waitForTimeout(2000);
            console.log('   ✅ 그룹 상세 모달 열기');
          }
        } catch (e) {
          console.log(`   ⚠️ 그룹 모달 열기 실패: ${e.message}`);
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
          console.log(`   ⚠️ RawData 탭 클릭 실패: ${e.message}`);
        }

        // imageId 추출
        let imageId = null;

        // 방법 1: RawData JSON에서 imageId 추출
        try {
          const rawDataContent = await page.evaluate(() => {
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
              if (/^ST01FZ[A-Z0-9a-z]{20,}$/i.test(candidate)) {
                imageId = candidate;
                console.log(`   ✅ RawData에서 imageId 발견: ${imageId.substring(0, 30)}...`);
              }
            }
          }
        } catch (e) {
          console.log(`   ⚠️ RawData 추출 실패: ${e.message}`);
        }

        // 방법 2: 페이지 소스에서 imageId 패턴 찾기
        if (!imageId) {
          const pageContent = await page.content();
          const imageIdMatches = pageContent.match(/ST01FZ[A-Z0-9a-z]{20,}/gi);
          if (imageIdMatches && imageIdMatches.length > 0) {
            const candidate = imageIdMatches[0];
            if (/^ST01FZ[A-Z0-9a-z]{20,}$/i.test(candidate)) {
              imageId = candidate;
              console.log(`   ✅ 페이지 소스에서 imageId 발견: ${imageId.substring(0, 30)}...`);
            }
          }
        }

        // imageId 확인 결과 처리
        if (imageId && /^ST01FZ[A-Z0-9a-z]{20,}$/i.test(imageId)) {
          console.log(`\n   ✅ imageId 확인 완료: ${imageId}\n`);
          
          // DB 업데이트
          console.log('   💾 DB 업데이트 중...');
          const { error: updateError } = await supabase
            .from('channel_sms')
            .update({
              image_url: imageId,
              message_type: 'MMS',
              updated_at: new Date().toISOString()
            })
            .eq('id', msg.id);

          if (updateError) {
            console.error(`   ❌ DB 업데이트 실패: ${updateError.message}`);
            results.failed.push({ id: msg.id, reason: 'DB 업데이트 실패' });
          } else {
            console.log('   ✅ DB 업데이트 완료!');
            console.log(`      - image_url: ${imageId.substring(0, 50)}...`);
            console.log(`      - message_type: MMS`);
            
            // image_metadata에 태그 추가 (이미지가 있는 경우)
            const tag = `sms-${msg.id}`;
            console.log(`   🔗 image_metadata에 태그 "${tag}" 연결 시도...`);
            
            // Solapi imageId로 이미지 찾기 (get-image-preview API가 생성한 임시 이미지)
            const { data: existingImages } = await supabase
              .from('image_metadata')
              .select('*')
              .or(`tags.cs.{solapi-${imageId}},metadata->>solapiImageId.eq.${imageId}`)
              .limit(1);
            
            if (existingImages && existingImages.length > 0) {
              // 기존 이미지에 태그 추가
              const existingTags = existingImages[0].tags || [];
              if (!existingTags.includes(tag)) {
                const { error: tagError } = await supabase
                  .from('image_metadata')
                  .update({
                    tags: [...existingTags, tag],
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingImages[0].id);
                
                if (tagError) {
                  console.log(`   ⚠️ 태그 추가 실패: ${tagError.message}`);
                } else {
                  console.log(`   ✅ 태그 "${tag}" 추가 완료!`);
                }
              } else {
                console.log(`   ℹ️ 태그 "${tag}" 이미 존재함`);
              }
            } else {
              console.log(`   ℹ️ image_metadata에 해당 이미지 없음 (임시 파일일 수 있음)`);
            }
            
            results.updated.push({ id: msg.id, imageId });
          }
        } else {
          console.log('\n   ❌ imageId를 찾을 수 없습니다.');
          console.log(`   💡 솔라피 콘솔에서 수동으로 확인해주세요.`);
          console.log(`   URL: ${groupUrl}`);
          results.failed.push({ id: msg.id, reason: 'imageId를 찾을 수 없음' });
        }

        // 다음 메시지 처리 전 대기
        await page.waitForTimeout(2000);

      } catch (error) {
        console.error(`   ❌ 오류 발생: ${error.message}`);
        results.failed.push({ id: msg.id, reason: error.message });
      }
    }

    // 5. 결과 요약
    console.log('\n' + '='.repeat(100));
    console.log('📊 복원 결과 요약');
    console.log('='.repeat(100));
    console.log(`\n✅ 이미지 업데이트 완료: ${results.updated.length}개`);
    if (results.updated.length > 0) {
      results.updated.forEach(item => {
        console.log(`   - 메시지 ${item.id}: ${item.imageId.substring(0, 30)}...`);
      });
    }
    
    console.log(`\n🗑️ 이미지 제거 완료: ${results.removed.length}개`);
    if (results.removed.length > 0) {
      console.log(`   - 메시지: ${results.removed.join(', ')}`);
    }
    
    console.log(`\n❌ 실패: ${results.failed.length}개`);
    if (results.failed.length > 0) {
      results.failed.forEach(item => {
        console.log(`   - 메시지 ${item.id}: ${item.reason}`);
      });
    }

    console.log('\n' + '='.repeat(100));
    console.log('✅ 모든 메시지 이미지 복원 작업 완료!');
    console.log('='.repeat(100));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    console.log('\n💡 브라우저는 열어둡니다. 확인 후 수동으로 닫아주세요.');
  }
}

restoreAllMessagesImages();

