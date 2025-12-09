/**
 * 솔라피 기준으로 실제 전송된 이미지를 DB에 동기화
 * 
 * 1. 각 메시지의 솔라피 그룹 ID로 실제 전송 내용 확인
 * 2. 이미지가 전송된 경우 Solapi imageId를 DB에 업데이트
 * 3. 이미지가 전송되지 않은 경우 DB에서 imageUrl 제거
 */

const { createClient } = require('@supabase/supabase-js');
const { createSolapiSignature } = require('../utils/solapiSignature.js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
  console.error('❌ Solapi 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 확인할 메시지 ID 목록
const messageIds = [140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 157, 158, 159, 160, 161];

async function getSolapiMessageDetailsWithAuth(groupId, customAuthHeaders) {
  try {
    // 메시지 목록 조회 (실제 전송된 메시지 정보 확인)
    const messageListResponse = await fetch(
      `https://api.solapi.com/messages/v4/list?groupId=${groupId}&limit=10`,
      { method: 'GET', headers: customAuthHeaders }
    );

    if (!messageListResponse.ok) {
      const errorText = await messageListResponse.text();
      console.error(`   ❌ 메시지 목록 조회 실패: ${messageListResponse.status} - ${errorText.substring(0, 100)}`);
      return null;
    }

    const messageListData = await messageListResponse.json();
    const messages = messageListData.messages || [];
    
    if (messages.length === 0) {
      return null;
    }

    // 첫 번째 메시지의 정보로 판단 (모든 메시지가 같은 타입과 이미지를 사용한다고 가정)
    const firstMessage = messages[0];
    
    return {
      message: firstMessage,
      type: firstMessage.type || firstMessage.messageType,
      imageId: firstMessage.imageId || null,
      text: firstMessage.text || firstMessage.message || null
    };
  } catch (error) {
    console.error(`   ❌ Solapi 조회 오류: ${error.message}`);
    return null;
  }
}

async function syncImagesFromSolapi() {
  console.log('='.repeat(100));
  console.log('🔄 솔라피 기준으로 이미지 동기화');
  console.log('='.repeat(100));
  console.log('');

  // 1. 메시지 조회
  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('*')
    .in('id', messageIds)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ 메시지 조회 오류:', error);
    return;
  }

  if (!messages || messages.length === 0) {
    console.error('❌ 메시지를 찾을 수 없습니다.');
    return;
  }

  console.log(`📋 총 ${messages.length}개 메시지 확인\n`);

  const results = [];
  const needsUpdate = [];

  // 2. 각 메시지의 솔라피 정보 확인
  for (const msg of messages) {
    console.log(`\n📨 메시지 ID: ${msg.id}`);
    console.log(`   상태: ${msg.status}`);
    console.log(`   타입: ${msg.message_type}`);
    console.log(`   DB image_url: ${msg.image_url || '(없음)'}`);
    console.log(`   솔라피 그룹 ID: ${msg.solapi_group_id || '(없음)'}`);

    if (!msg.solapi_group_id) {
      console.log(`   ⚠️ 솔라피 그룹 ID가 없습니다. 건너뜁니다.`);
      results.push({
        id: msg.id,
        status: 'skipped',
        reason: '솔라피 그룹 ID 없음'
      });
      continue;
    }

    // 여러 그룹 ID 처리
    const groupIds = msg.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean);
    let solapiHasImage = false;
    let solapiImageId = null;
    let solapiMessageText = null;

    // 첫 번째 그룹의 정보로 판단
    if (groupIds.length > 0) {
      console.log(`   🔍 솔라피 그룹 정보 확인 중... (${groupIds.length}개 그룹)`);
      
      // 각 API 호출마다 새로운 signature 생성
      const freshAuthHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
      const solapiData = await getSolapiMessageDetailsWithAuth(groupIds[0], freshAuthHeaders);
      
      if (solapiData) {
        solapiMessageText = solapiData.text || null;
        
        // MMS 타입이고 imageId가 있으면 이미지 전송됨
        if (solapiData.type === 'MMS') {
          solapiImageId = solapiData.imageId || null;
          if (solapiImageId) {
            solapiHasImage = true;
            console.log(`   ✅ 솔라피: 이미지 전송됨 (imageId: ${solapiImageId.substring(0, 30)}...)`);
          } else {
            console.log(`   ❌ 솔라피: MMS 타입이지만 imageId 없음`);
          }
        } else {
          console.log(`   ℹ️ 솔라피: 타입이 ${solapiData.type}이므로 이미지 없음`);
        }
      } else {
        console.log(`   ⚠️ 솔라피 정보를 가져올 수 없습니다.`);
      }
    }

    // 3. DB와 솔라피 비교
    const dbHasImage = !!msg.image_url;
    const needsImageUpdate = solapiHasImage !== dbHasImage || 
                            (solapiHasImage && msg.image_url !== solapiImageId);

    console.log(`   📊 비교 결과:`);
    console.log(`      솔라피: ${solapiHasImage ? '이미지 있음' : '이미지 없음'}`);
    console.log(`      DB: ${dbHasImage ? '이미지 있음' : '이미지 없음'}`);

    if (needsImageUpdate) {
      console.log(`   ⚠️ 동기화 필요!`);
      needsUpdate.push({
        id: msg.id,
        solapiHasImage,
        solapiImageId,
        currentImageUrl: msg.image_url,
        action: solapiHasImage ? '이미지 추가' : '이미지 제거'
      });
    } else {
      console.log(`   ✅ 동기화 불필요 (일치)`);
    }

    results.push({
      id: msg.id,
      status: needsImageUpdate ? 'needs_update' : 'synced',
      solapiHasImage,
      dbHasImage,
      solapiImageId
    });

    // API 호출 제한 고려
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 4. 결과 요약
  console.log('\n' + '='.repeat(100));
  console.log('\n📊 동기화 결과 요약:');
  console.log(`   총 확인: ${results.length}개`);
  console.log(`   동기화 필요: ${needsUpdate.length}개`);
  console.log(`   이미 동기화됨: ${results.filter(r => r.status === 'synced').length}개`);

  if (needsUpdate.length > 0) {
    console.log('\n⚠️ 동기화가 필요한 메시지:');
    needsUpdate.forEach(item => {
      console.log(`   - 메시지 ID ${item.id}: ${item.action}`);
      if (item.solapiHasImage) {
        console.log(`     솔라피 imageId: ${item.solapiImageId}`);
      }
    });

    console.log('\n' + '='.repeat(100));
    console.log('\n💾 DB 업데이트 진행 중...\n');
    
    let updateSuccess = 0;
    let updateFail = 0;
    
    for (const item of needsUpdate) {
      try {
        const updateData = {};
        
        if (item.solapiHasImage && item.solapiImageId) {
          // 솔라피에 이미지가 있으면 DB에 추가
          updateData.image_url = item.solapiImageId;
          console.log(`   ✅ 메시지 ID ${item.id}: 이미지 추가 (${item.solapiImageId.substring(0, 30)}...)`);
        } else {
          // 솔라피에 이미지가 없으면 DB에서 제거
          updateData.image_url = null;
          console.log(`   🗑️ 메시지 ID ${item.id}: 이미지 제거`);
        }
        
        const { error: updateError } = await supabase
          .from('channel_sms')
          .update(updateData)
          .eq('id', item.id);
        
        if (updateError) {
          console.error(`   ❌ 메시지 ID ${item.id} 업데이트 실패: ${updateError.message}`);
          updateFail++;
        } else {
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
    console.log('\n✅ 모든 메시지가 솔라피와 동기화되어 있습니다.');
  }

  return { results, needsUpdate };
}

syncImagesFromSolapi();

