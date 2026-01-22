/**
 * 459번 메시지 솔라피 그룹 ID 연결 및 상태 동기화 스크립트
 * 
 * 문제:
 * - 459번 메시지가 솔라피에서 재발송되었지만 DB에 반영되지 않음
 * - 그룹 ID 자동 연결이 작동하지 않음
 * 
 * 작업:
 * 1. 솔라피 API로 그룹 ID 상태 조회
 * 2. 459번 메시지에 그룹 ID 연결
 * 3. 솔라피 통계를 DB에 동기화
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
  console.error('❌ SolAPI 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 솔라피 API 서명 생성
function createSolapiSignature(apiKey, apiSecret) {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(date + salt)
    .digest('hex');

  return {
    'Authorization': `HMAC-SHA256 ApiKey=${apiKey}, Date=${date}, Salt=${salt}, Signature=${signature}`,
    'Content-Type': 'application/json'
  };
}

// 솔라피 그룹 정보 조회
async function getSolapiGroupInfo(groupId) {
  const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
  
  console.log(`📡 솔라피 그룹 정보 조회 중: ${groupId}`);
  
  const response = await fetch(
    `https://api.solapi.com/messages/v4/groups/${groupId}`,
    { method: 'GET', headers: authHeaders }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ 솔라피 그룹 조회 실패: ${response.status}`);
    console.error(`오류: ${errorText.substring(0, 200)}`);
    return null;
  }

  const data = await response.json();
  return data;
}

// 메시지 상태 동기화
async function syncMessageStatus(messageId, groupId, groupData) {
  console.log(`\n🔄 메시지 상태 동기화 중...`);
  
  const groupInfo = groupData.groupInfo || groupData;
  const count = groupInfo.count || {};
  
  const getNumber = (...values) => {
    for (const value of values) {
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
      }
    }
    return 0;
  };

  const totalCount = getNumber(count.total, groupInfo.totalCount, groupData.total, groupData.totalCount);
  const successCount = getNumber(
    count.successful, count.success, count.successCount,
    groupInfo.successCount, groupData.successful, groupData.successCount
  );
  const failCount = getNumber(
    count.failed, count.fail, count.failCount,
    groupInfo.failCount, groupData.failed, groupData.failCount
  );
  const sendingCount = getNumber(
    count.sending, count.sendingCount, groupInfo.sendingCount,
    groupData.sending, groupData.sendingCount,
    totalCount - successCount - failCount
  );

  const dateSent = groupInfo.dateSent || groupData.dateSent || groupInfo.dateCreated || groupData.dateCreated;

  console.log(`📊 솔라피 통계:`);
  console.log(`   총: ${totalCount}건`);
  console.log(`   성공: ${successCount}건`);
  console.log(`   실패: ${failCount}건`);
  console.log(`   발송중: ${sendingCount}건`);
  console.log(`   발송일: ${dateSent || '없음'}`);

  // 상태 결정
  let newStatus = 'draft';
  if (sendingCount > 0) {
    newStatus = 'partial';
  } else if (failCount === totalCount && totalCount > 0) {
    newStatus = 'failed';
  } else if (successCount > 0 && failCount === 0) {
    newStatus = 'sent';
  } else if (successCount > 0 && failCount > 0) {
    newStatus = 'partial';
  } else if (totalCount > 0) {
    newStatus = 'sent';
  }

  console.log(`\n📝 DB 업데이트:`);
  console.log(`   상태: ${newStatus}`);

  // DB 업데이트
  const updateData = {
    solapi_group_id: groupId,
    success_count: successCount,
    fail_count: failCount,
    sent_count: totalCount,
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  if (dateSent) {
    updateData.sent_at = dateSent;
  }

  const { data: updated, error: updateError } = await supabase
    .from('channel_sms')
    .update(updateData)
    .eq('id', messageId)
    .select()
    .single();

  if (updateError) {
    console.error(`❌ DB 업데이트 실패: ${updateError.message}`);
    return { success: false, error: updateError };
  }

  console.log(`✅ DB 업데이트 완료`);
  return { success: true, data: updated };
}

async function fixMessage459() {
  console.log('🚀 459번 메시지 솔라피 동기화 시작...\n');
  console.log('='.repeat(60));

  const GROUP_ID = 'G4V20260120135037L2B2QM6MIE1TG09';
  const MESSAGE_ID = 459;

  try {
    // 1. 459번 메시지 조회
    console.log('📋 1단계: 459번 메시지 조회');
    const { data: message459, error: getError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', MESSAGE_ID)
      .single();

    if (getError || !message459) {
      console.error('❌ 메시지 조회 실패:', getError?.message);
      process.exit(1);
    }

    console.log(`✅ 메시지 발견: ID=${message459.id}`);
    console.log(`   상태: ${message459.status || 'N/A'}`);
    console.log(`   수신자 수: ${message459.recipient_numbers?.length || 0}명`);
    console.log(`   현재 그룹 ID: ${message459.solapi_group_id || '없음'}`);
    console.log(`   성공: ${message459.success_count || 0}건`);
    console.log(`   실패: ${message459.fail_count || 0}건\n`);

    // 2. 솔라피 그룹 정보 조회
    console.log('📡 2단계: 솔라피 그룹 정보 조회');
    const groupData = await getSolapiGroupInfo(GROUP_ID);

    if (!groupData) {
      console.error('❌ 솔라피 그룹 정보를 가져올 수 없습니다.');
      process.exit(1);
    }

    console.log(`✅ 솔라피 그룹 정보 조회 성공\n`);

    // 3. 그룹 ID 연결 및 상태 동기화
    console.log('🔗 3단계: 그룹 ID 연결 및 상태 동기화');
    
    // 기존 그룹 ID 확인
    const existingGroupIds = message459.solapi_group_id 
      ? message459.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean)
      : [];
    
    if (existingGroupIds.includes(GROUP_ID)) {
      console.log(`✅ 그룹 ID가 이미 연결되어 있습니다. 상태만 동기화합니다.`);
    } else {
      console.log(`📝 그룹 ID를 연결합니다.`);
      existingGroupIds.push(GROUP_ID);
    }

    // 상태 동기화
    const syncResult = await syncMessageStatus(
      MESSAGE_ID,
      existingGroupIds.join(','),
      groupData
    );

    if (!syncResult.success) {
      console.error('❌ 상태 동기화 실패');
      process.exit(1);
    }

    // 4. 최종 확인
    console.log('\n' + '='.repeat(60));
    console.log('🎉 동기화 완료!');
    console.log('='.repeat(60));
    
    const { data: finalMessage, error: finalError } = await supabase
      .from('channel_sms')
      .select('id, status, solapi_group_id, success_count, fail_count, sent_count')
      .eq('id', MESSAGE_ID)
      .single();

    if (!finalError && finalMessage) {
      console.log(`\n📋 최종 상태:`);
      console.log(`   메시지 ID: ${finalMessage.id}`);
      console.log(`   상태: ${finalMessage.status}`);
      console.log(`   그룹 ID: ${finalMessage.solapi_group_id || '없음'}`);
      console.log(`   성공: ${finalMessage.success_count || 0}건`);
      console.log(`   실패: ${finalMessage.fail_count || 0}건`);
      console.log(`   총: ${finalMessage.sent_count || 0}건\n`);

      console.log('💡 다음 단계:');
      console.log('   1. 관리자 페이지에서 확인: /admin/sms-list');
      console.log(`   2. 솔라피 콘솔에서 확인: https://console.solapi.com/message-log?criteria=groupId&value=${GROUP_ID}&cond=eq\n`);
    }

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

fixMessage459()
  .then(() => {
    console.log('✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
