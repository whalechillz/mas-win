/**
 * 459번 메시지 수동 업데이트 스크립트
 * 
 * 솔라피 대시보드에서 확인한 값으로 직접 업데이트:
 * - 성공: 196건
 * - 실패: 1건
 * - 총: 200건
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updateMessage459() {
  console.log('🚀 459번 메시지 수동 업데이트 시작...\n');
  console.log('='.repeat(60));

  const MESSAGE_ID = 459;
  const GROUP_ID = 'G4V20260120135037L2B2QM6MIE1TG09';
  
  // 솔라피 대시보드에서 확인한 값
  const successCount = 196;
  const failCount = 1;
  const totalCount = 200;

  try {
    // 1. 현재 메시지 상태 확인
    console.log('📋 1단계: 현재 메시지 상태 확인');
    const { data: current, error: getError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', MESSAGE_ID)
      .single();

    if (getError || !current) {
      console.error('❌ 메시지 조회 실패:', getError?.message);
      process.exit(1);
    }

    console.log(`✅ 메시지 발견: ID=${current.id}`);
    console.log(`   현재 상태: ${current.status || 'N/A'}`);
    console.log(`   현재 그룹 ID: ${current.solapi_group_id || '없음'}`);
    console.log(`   현재 성공: ${current.success_count || 0}건`);
    console.log(`   현재 실패: ${current.fail_count || 0}건\n`);

    // 2. 상태 결정
    let newStatus = 'partial';
    if (failCount === totalCount) {
      newStatus = 'failed';
    } else if (successCount > 0 && failCount === 0) {
      newStatus = 'sent';
    } else if (successCount > 0 && failCount > 0) {
      newStatus = 'partial';
    }

    console.log('📝 2단계: DB 업데이트');
    console.log(`   그룹 ID: ${GROUP_ID}`);
    console.log(`   성공: ${successCount}건`);
    console.log(`   실패: ${failCount}건`);
    console.log(`   총: ${totalCount}건`);
    console.log(`   상태: ${newStatus}\n`);

    // 3. DB 업데이트
    const updateData = {
      solapi_group_id: GROUP_ID,
      success_count: successCount,
      fail_count: failCount,
      sent_count: totalCount,
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    const { data: updated, error: updateError } = await supabase
      .from('channel_sms')
      .update(updateData)
      .eq('id', MESSAGE_ID)
      .select()
      .single();

    if (updateError) {
      console.error(`❌ DB 업데이트 실패: ${updateError.message}`);
      process.exit(1);
    }

    console.log(`✅ DB 업데이트 완료\n`);

    // 4. 최종 확인
    console.log('='.repeat(60));
    console.log('🎉 업데이트 완료!');
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

updateMessage459()
  .then(() => {
    console.log('✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
