/**
 * 솔라피 API로 실제 전송된 메시지의 imageId 확인 및 DB 업데이트
 * 
 * 각 메시지 그룹의 메시지 목록을 조회하여 실제 전송된 imageId 확인
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
const targetMessageIds = [149, 150, 151, 152, 153, 154, 155, 159, 160, 161];

async function fetchSolapiImageIds() {
  console.log('='.repeat(100));
  console.log('🔍 솔라피에서 실제 전송된 imageId 확인');
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

  const imageIdMap = {};
  const updates = [];

  // 2. 각 메시지의 솔라피 그룹에서 imageId 확인
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
      // 각 호출마다 새로운 signature 생성
      const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
      
      console.log(`   🔍 솔라피 메시지 목록 조회 중...`);
      
      // 메시지 목록 조회
      const messageListResponse = await fetch(
        `https://api.solapi.com/messages/v4/list?groupId=${groupId}&limit=5`,
        { method: 'GET', headers: authHeaders }
      );

      if (!messageListResponse.ok) {
        const errorText = await messageListResponse.text();
        console.error(`   ❌ 메시지 목록 조회 실패: ${messageListResponse.status}`);
        console.error(`   오류: ${errorText.substring(0, 200)}`);
        continue;
      }

      const messageListData = await messageListResponse.json();
      const messages_list = messageListData.messages || [];
      
      if (messages_list.length === 0) {
        console.log(`   ⚠️ 메시지 목록이 비어있습니다.`);
        continue;
      }

      // 첫 번째 메시지의 정보로 판단
      const firstMessage = messages_list[0];
      const messageType = firstMessage.type || firstMessage.messageType;
      const imageId = firstMessage.imageId || null;

      console.log(`   📊 솔라피 메시지 정보:`);
      console.log(`      타입: ${messageType}`);
      console.log(`      imageId: ${imageId || '(없음)'}`);

      if (messageType === 'MMS' && imageId) {
        imageIdMap[msg.id] = imageId;
        console.log(`   ✅ 솔라피에 이미지 전송됨: ${imageId.substring(0, 30)}...`);
        
        // DB에 imageId가 없거나 다르면 업데이트 필요
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
        console.log(`   ℹ️ 솔라피에 이미지 없음 (타입: ${messageType})`);
      }

    } catch (error) {
      console.error(`   ❌ 오류: ${error.message}`);
    }

    // API 호출 제한 고려
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 3. DB 업데이트
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
}

fetchSolapiImageIds();








