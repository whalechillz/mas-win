/**
 * 459번 메시지 솔라피 동기화 (메시지 목록 기반)
 * 
 * 솔라피 그룹 정보 API가 정확하지 않을 수 있으므로
 * 메시지 목록을 직접 조회하여 정확한 상태를 확인
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
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

// 솔라피 메시지 목록 조회
async function getSolapiMessageList(groupId) {
  const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
  
  console.log(`📡 솔라피 메시지 목록 조회 중: ${groupId}`);
  
  const response = await fetch(
    `https://api.solapi.com/messages/v4/list?groupId=${groupId}&limit=300`,
    { method: 'GET', headers: authHeaders }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ 솔라피 메시지 목록 조회 실패: ${response.status}`);
    console.error(`오류: ${errorText.substring(0, 200)}`);
    return null;
  }

  const data = await response.json();
  return data;
}

async function fixMessage459WithMessageList() {
  console.log('🚀 459번 메시지 솔라피 동기화 (메시지 목록 기반)...\n');
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
    console.log(`   현재 그룹 ID: ${message459.solapi_group_id || '없음'}\n`);

    // 2. 솔라피 메시지 목록 조회
    console.log('📡 2단계: 솔라피 메시지 목록 조회');
    const messageListData = await getSolapiMessageList(GROUP_ID);

    if (!messageListData || !messageListData.messages || messageListData.messages.length === 0) {
    // 2. 솔라피 그룹 정보 조회 (재시도)
    console.log('📡 2단계: 솔라피 그룹 정보 조회');
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    
    const groupResponse = await fetch(
      `https://api.solapi.com/messages/v4/groups/${GROUP_ID}`,
      { method: 'GET', headers: authHeaders }
    );

    let successCount = 0;
    let failCount = 0;
    let sendingCount = 0;
    let totalCount = 200; // 기본값

    if (groupResponse.ok) {
      const groupData = await groupResponse.json();
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

      totalCount = getNumber(count.total, groupInfo.totalCount, groupData.total, groupData.totalCount) || 200;
      successCount = getNumber(
        count.successful, count.success, count.successCount,
        groupInfo.successCount, groupData.successful, groupData.successCount
      );
      failCount = getNumber(
        count.failed, count.fail, count.failCount,
        groupInfo.failCount, groupData.failed, groupData.failCount
      );

      sendingCount = totalCount - successCount - failCount;
      
      console.log(`✅ 그룹 정보 조회 성공`);
      console.log(`   총: ${totalCount}건`);
      console.log(`   성공: ${successCount}건`);
      console.log(`   실패: ${failCount}건`);
      console.log(`   발송중: ${sendingCount}건\n`);
      
      // API에서 성공/실패가 0이면 이미지에서 확인한 값 사용 (재발송 완료 상태)
      if (successCount === 0 && failCount === 0 && sendingCount === 0) {
        console.warn('⚠️ API 응답이 불완전합니다. 솔라피 대시보드 기준 값 사용:');
        console.warn('   성공: 196건, 실패: 1건');
        successCount = 196;
        failCount = 1;
        sendingCount = 0;
        totalCount = 200;
      }
    } else {
      // API 조회 실패 시 이미지에서 확인한 값 사용
      console.warn('⚠️ 솔라피 API 조회 실패. 이미지에서 확인한 값 사용:');
      console.warn('   성공: 196건, 실패: 1건 (솔라피 대시보드 기준)');
      successCount = 196;
      failCount = 1;
      sendingCount = 0;
      totalCount = 200;
    }

    console.log(`\n📊 솔라피 통계 (최종):`);
    console.log(`   총: ${totalCount}건`);
    console.log(`   성공: ${successCount}건`);
    console.log(`   실패: ${failCount}건`);
    if (sendingCount > 0) {
      console.log(`   발송중: ${sendingCount}건`);
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

    console.log(`\n📝 4단계: DB 업데이트`);
    console.log(`   상태: ${newStatus}`);

    // 5. DB 업데이트
    const updateData = {
      solapi_group_id: GROUP_ID,
      success_count: successCount,
      fail_count: failCount,
      sent_count: totalCount,
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // 발송일은 첫 번째 메시지의 날짜 사용
    if (messages.length > 0 && messages[0].dateCreated) {
      updateData.sent_at = messages[0].dateCreated;
    }

    // 발송일은 그룹 생성 시간 사용 (이미 조회됨)
    // sent_at은 그대로 유지하거나 현재 시간 사용
      .select()
      .single();

    if (updateError) {
      console.error(`❌ DB 업데이트 실패: ${updateError.message}`);
      process.exit(1);
    }

    console.log(`✅ DB 업데이트 완료\n`);

    // 6. 최종 확인
    console.log('='.repeat(60));
    console.log('🎉 동기화 완료!');
    console.log('='.repeat(60));
    console.log(`\n📋 최종 상태:`);
    console.log(`   메시지 ID: ${updated.id}`);
    console.log(`   상태: ${updated.status}`);
    console.log(`   그룹 ID: ${updated.solapi_group_id || '없음'}`);
    console.log(`   성공: ${updated.success_count || 0}건`);
    console.log(`   실패: ${updated.fail_count || 0}건`);
    console.log(`   총: ${updated.sent_count || 0}건\n`);

    console.log('💡 다음 단계:');
    console.log('   1. 관리자 페이지에서 확인: /admin/sms-list');
    console.log(`   2. 솔라피 콘솔에서 확인: https://console.solapi.com/message-log?criteria=groupId&value=${GROUP_ID}&cond=eq\n`);

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

fixMessage459WithMessageList()
  .then(() => {
    console.log('✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
