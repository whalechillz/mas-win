/**
 * 메시지 478에 그룹 ID 수동 연결 스크립트
 * 
 * 그룹 ID: G4V20260122101013UMFEYEURL0AI4RH
 * 재발송 후 자동 연결이 안 되는 경우를 대비한 수동 연결
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { createSolapiSignature } = require('../utils/solapiSignature.js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
  console.error('❌ Solapi 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const GROUP_ID = 'G4V20260122101013UMFEYEURL0AI4RH';
const MESSAGE_ID = 478;

async function linkGroupId() {
  console.log('🚀 메시지 478 그룹 ID 연결 시작\n');
  console.log('='.repeat(60));

  try {
    // 1. 메시지 478 확인
    console.log('📋 메시지 478 확인 중...\n');
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, status, message_text, recipient_numbers, solapi_group_id, sent_at, created_at, success_count, fail_count, sent_count')
      .eq('id', MESSAGE_ID)
      .single();

    if (messageError || !message) {
      console.error('❌ 메시지 조회 실패:', messageError);
      process.exit(1);
    }

    console.log('✅ 메시지 정보:');
    console.log(`   ID: ${message.id}`);
    console.log(`   상태: ${message.status}`);
    console.log(`   수신자: ${message.recipient_numbers?.length || 0}명`);
    console.log(`   현재 그룹 ID: ${message.solapi_group_id || '없음'}`);
    console.log(`   sent_at: ${message.sent_at || '없음'}`);
    console.log(`   created_at: ${message.created_at || '없음'}`);
    console.log(`   성공/실패/총: ${message.success_count || 0}/${message.fail_count || 0}/${message.sent_count || 0}\n`);

    // 2. 이미 연결되어 있는지 확인
    const existingGroupIds = message.solapi_group_id 
      ? message.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean)
      : [];
    
    if (existingGroupIds.includes(GROUP_ID)) {
      console.log('✅ 이미 연결되어 있습니다.');
      console.log(`   현재 그룹 IDs: ${message.solapi_group_id}`);
      console.log('\n💡 솔라피에서 통계를 동기화합니다...\n');
    } else {
      console.log('📎 그룹 ID 연결 중...\n');
    }

    // 3. 솔라피에서 그룹 정보 조회
    console.log('🔍 솔라피에서 그룹 정보 조회 중...');
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    
    const groupInfoResponse = await fetch(
      `https://api.solapi.com/messages/v4/groups/${GROUP_ID}`,
      { method: 'GET', headers: authHeaders }
    );

    if (!groupInfoResponse.ok) {
      const errorText = await groupInfoResponse.text();
      console.error('❌ 솔라피 그룹 정보 조회 실패:', groupInfoResponse.status, errorText);
      process.exit(1);
    }

    const groupInfoData = await groupInfoResponse.json();
    const groupInfo = groupInfoData.groupInfo || groupInfoData;
    const count = groupInfo.count || {};
    
    const totalCount = count.total || count.totalCount || groupInfo.totalCount || 0;
    const successCount = count.successful || count.success || count.successCount || groupInfo.successCount || 0;
    const failCount = count.failed || count.fail || count.failCount || groupInfo.failCount || 0;
    const dateSent = groupInfo.dateSent || groupInfo.dateCreated || groupInfo.date_created;

    console.log('✅ 솔라피 그룹 정보:');
    console.log(`   그룹 ID: ${GROUP_ID}`);
    console.log(`   총: ${totalCount}건`);
    console.log(`   성공: ${successCount}건`);
    console.log(`   실패: ${failCount}건`);
    console.log(`   발송일: ${dateSent || '없음'}\n`);

    // 4. 그룹 ID 추가
    if (!existingGroupIds.includes(GROUP_ID)) {
      existingGroupIds.push(GROUP_ID);
    }
    const newGroupIdsString = existingGroupIds.join(',');

    // 5. DB 업데이트
    console.log('💾 데이터베이스 업데이트 중...');
    const updateData = {
      solapi_group_id: newGroupIdsString,
      updated_at: new Date().toISOString()
    };

    // 솔라피 통계 업데이트
    if (totalCount > 0) {
      updateData.sent_count = totalCount;
    }
    if (successCount > 0 || failCount > 0) {
      updateData.success_count = Math.max(message.success_count || 0, successCount);
      updateData.fail_count = Math.max(message.fail_count || 0, failCount);
      
      // 상태 업데이트
      if (failCount === 0 && successCount > 0) {
        updateData.status = 'sent';
      } else if (successCount === 0 && failCount > 0) {
        updateData.status = 'failed';
      } else if (successCount > 0 && failCount > 0) {
        updateData.status = 'partial';
      }
    }

    // 발송일 업데이트 (솔라피 정보가 있으면)
    if (dateSent) {
      updateData.sent_at = dateSent;
    }

    const { data: updated, error: updateError } = await supabase
      .from('channel_sms')
      .update(updateData)
      .eq('id', MESSAGE_ID)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
      process.exit(1);
    }

    console.log('✅ 업데이트 완료!\n');

    // 6. 최종 결과
    console.log('='.repeat(60));
    console.log('📊 최종 결과');
    console.log('='.repeat(60));
    console.log(`\n✅ 메시지 ID: ${updated.id}`);
    console.log(`✅ 그룹 ID: ${updated.solapi_group_id}`);
    console.log(`✅ 상태: ${updated.status}`);
    console.log(`✅ 통계:`);
    console.log(`   - 총: ${updated.sent_count || 0}건`);
    console.log(`   - 성공: ${updated.success_count || 0}건`);
    console.log(`   - 실패: ${updated.fail_count || 0}건`);
    console.log(`\n💡 SMS/MMS 관리 페이지에서 확인할 수 있습니다.\n`);

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

linkGroupId()
  .then(() => {
    console.log('✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
