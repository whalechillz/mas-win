const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 마이그레이션할 메시지 ID
const SOURCE_MESSAGE_ID = 100; // 데이터를 가져올 메시지
const TARGET_MESSAGE_ID = 90;  // 데이터를 옮길 메시지

async function migrateSolapiData() {
  console.log('🔄 솔라피 데이터 마이그레이션 시작...\n');
  console.log(`📋 소스 메시지 ID: ${SOURCE_MESSAGE_ID}`);
  console.log(`📋 타겟 메시지 ID: ${TARGET_MESSAGE_ID}\n`);

  try {
    // 1. 소스 메시지(100번) 정보 조회
    console.log(`📋 1. 소스 메시지 #${SOURCE_MESSAGE_ID} 조회 중...`);
    const { data: sourceMessage, error: sourceError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', SOURCE_MESSAGE_ID)
      .single();

    if (sourceError || !sourceMessage) {
      console.error('❌ 소스 메시지를 찾을 수 없습니다:', sourceError?.message);
      process.exit(1);
    }

    console.log('✅ 소스 메시지 조회 완료:');
    console.log(`   - ID: ${sourceMessage.id}`);
    console.log(`   - 상태: ${sourceMessage.status}`);
    console.log(`   - 수신자: ${sourceMessage.recipient_numbers?.length || 0}명`);
    console.log(`   - 솔라피 그룹 ID: ${sourceMessage.solapi_group_id || '없음'}`);
    console.log(`   - 발송일: ${sourceMessage.sent_at || '없음'}`);
    console.log(`   - 발송 건수: ${sourceMessage.sent_count || 0}건`);
    console.log(`   - 성공 건수: ${sourceMessage.success_count || 0}건`);
    console.log(`   - 실패 건수: ${sourceMessage.fail_count || 0}건\n`);

    // 마이그레이션할 데이터 추출
    const solapiData = {
      solapi_group_id: sourceMessage.solapi_group_id,
      sent_at: sourceMessage.sent_at,
      sent_count: sourceMessage.sent_count,
      success_count: sourceMessage.success_count,
      fail_count: sourceMessage.fail_count,
      status: sourceMessage.status // partial -> sent 또는 그대로 유지
    };

    // 마이그레이션할 데이터가 있는지 확인
    if (!solapiData.solapi_group_id && !solapiData.sent_at) {
      console.warn('⚠️ 소스 메시지에 마이그레이션할 솔라피 데이터가 없습니다.');
      console.log('   마이그레이션을 건너뜁니다.');
      process.exit(0);
    }

    // 2. 타겟 메시지(90번) 정보 조회
    console.log(`📋 2. 타겟 메시지 #${TARGET_MESSAGE_ID} 조회 중...`);
    const { data: targetMessage, error: targetError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', TARGET_MESSAGE_ID)
      .single();

    if (targetError || !targetMessage) {
      console.error('❌ 타겟 메시지를 찾을 수 없습니다:', targetError?.message);
      process.exit(1);
    }

    console.log('✅ 타겟 메시지 조회 완료:');
    console.log(`   - ID: ${targetMessage.id}`);
    console.log(`   - 상태: ${targetMessage.status}`);
    console.log(`   - 수신자: ${targetMessage.recipient_numbers?.length || 0}명`);
    console.log(`   - 현재 솔라피 그룹 ID: ${targetMessage.solapi_group_id || '없음'}`);
    console.log(`   - 현재 발송일: ${targetMessage.sent_at || '없음'}\n`);

    // 타겟 메시지에 이미 데이터가 있는지 확인
    if (targetMessage.solapi_group_id || targetMessage.sent_at) {
      console.warn('⚠️ 타겟 메시지에 이미 솔라피 데이터가 있습니다!');
      console.log(`   현재 그룹 ID: ${targetMessage.solapi_group_id || '없음'}`);
      console.log(`   현재 발송일: ${targetMessage.sent_at || '없음'}`);
      console.log('\n   기존 데이터를 덮어씌우고 계속 진행합니다...\n');
    }

    // 3. 타겟 메시지(90번)에 데이터 마이그레이션
    console.log(`📋 3. 타겟 메시지 #${TARGET_MESSAGE_ID}에 데이터 마이그레이션 중...`);
    
    const updateData = {
      solapi_group_id: solapiData.solapi_group_id,
      sent_at: solapiData.sent_at,
      sent_count: solapiData.sent_count,
      success_count: solapiData.success_count,
      fail_count: solapiData.fail_count,
      status: solapiData.status === 'partial' ? 'sent' : solapiData.status, // partial이면 sent로 변경
      updated_at: new Date().toISOString()
    };

    const { data: updatedTarget, error: updateError } = await supabase
      .from('channel_sms')
      .update(updateData)
      .eq('id', TARGET_MESSAGE_ID)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 타겟 메시지 업데이트 실패:', updateError);
      process.exit(1);
    }

    console.log('✅ 타겟 메시지 업데이트 완료:');
    console.log(`   - 솔라피 그룹 ID: ${updatedTarget.solapi_group_id || '없음'}`);
    console.log(`   - 발송일: ${updatedTarget.sent_at || '없음'}`);
    console.log(`   - 발송 건수: ${updatedTarget.sent_count || 0}건`);
    console.log(`   - 성공 건수: ${updatedTarget.success_count || 0}건`);
    console.log(`   - 실패 건수: ${updatedTarget.fail_count || 0}건`);
    console.log(`   - 상태: ${updatedTarget.status}\n`);

    // 4. 소스 메시지(100번)에서 솔라피 데이터 삭제
    console.log(`📋 4. 소스 메시지 #${SOURCE_MESSAGE_ID}에서 솔라피 데이터 삭제 중...`);
    
    const clearData = {
      solapi_group_id: null,
      sent_at: null,
      sent_count: null,
      success_count: null,
      fail_count: null,
      status: 'draft', // 초안 상태로 변경
      updated_at: new Date().toISOString()
    };

    const { data: clearedSource, error: clearError } = await supabase
      .from('channel_sms')
      .update(clearData)
      .eq('id', SOURCE_MESSAGE_ID)
      .select()
      .single();

    if (clearError) {
      console.error('❌ 소스 메시지 데이터 삭제 실패:', clearError);
      process.exit(1);
    }

    console.log('✅ 소스 메시지 데이터 삭제 완료:');
    console.log(`   - 솔라피 그룹 ID: ${clearedSource.solapi_group_id || '없음 (삭제됨)'}`);
    console.log(`   - 발송일: ${clearedSource.sent_at || '없음 (삭제됨)'}`);
    console.log(`   - 발송 건수: ${clearedSource.sent_count || 0}건 (삭제됨)`);
    console.log(`   - 성공 건수: ${clearedSource.success_count || 0}건 (삭제됨)`);
    console.log(`   - 실패 건수: ${clearedSource.fail_count || 0}건 (삭제됨)`);
    console.log(`   - 상태: ${clearedSource.status} (초안으로 변경됨)\n`);

    // 5. 최종 결과 요약
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 마이그레이션 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 마이그레이션 결과:`);
    console.log(`   소스 메시지 #${SOURCE_MESSAGE_ID}:`);
    console.log(`     - 솔라피 데이터 삭제됨`);
    console.log(`     - 상태: ${clearedSource.status}`);
    console.log(`\n   타겟 메시지 #${TARGET_MESSAGE_ID}:`);
    console.log(`     - 솔라피 그룹 ID: ${updatedTarget.solapi_group_id || '없음'}`);
    console.log(`     - 발송일: ${updatedTarget.sent_at ? new Date(updatedTarget.sent_at).toLocaleString('ko-KR') : '없음'}`);
    console.log(`     - 발송 결과: 성공 ${updatedTarget.success_count || 0}건, 실패 ${updatedTarget.fail_count || 0}건`);
    console.log(`     - 상태: ${updatedTarget.status}`);
    console.log(`\n💡 확인 사항:`);
    console.log(`   1. SMS 리스트에서 메시지 #${TARGET_MESSAGE_ID} 확인`);
    console.log(`   2. 솔라피 그룹 ID가 올바르게 표시되는지 확인`);
    console.log(`   3. 발송 결과가 올바르게 표시되는지 확인`);
    console.log(`   4. 메시지 #${SOURCE_MESSAGE_ID}는 초안 상태로 변경되었는지 확인`);

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    console.error('   스택:', error.stack);
    process.exit(1);
  }
}

migrateSolapiData();

