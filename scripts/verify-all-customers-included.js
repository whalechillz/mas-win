/**
 * 전체 고객 수 확인 및 메시지 발송 대상 검증
 * 
 * 목적:
 * 1. 전체 고객 수 확인 (2,990명)
 * 2. 수신거부 고객 수 확인 (3명)
 * 3. 전화번호 없는 고객 수 확인 (0명)
 * 4. 메시지 발송 대상 합계 확인
 * 5. 누락된 고객 찾기
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

async function verifyAllCustomers() {
  console.log('🔍 전체 고객 수 및 메시지 발송 대상 검증\n');
  console.log('='.repeat(60));

  try {
    // 1. 전체 고객 수
    console.log('📊 1단계: 전체 고객 수 확인');
    const { count: totalCustomers, error: totalError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('❌ 전체 고객 수 조회 실패:', totalError.message);
      process.exit(1);
    }

    console.log(`✅ 전체 고객 수: ${totalCustomers}명\n`);

    // 2. 수신거부 고객 수
    console.log('📊 2단계: 수신거부 고객 수 확인');
    const { count: optOutCount, error: optOutError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('opt_out', true);

    if (optOutError) {
      console.error('❌ 수신거부 고객 수 조회 실패:', optOutError.message);
      process.exit(1);
    }

    console.log(`✅ 수신거부 고객: ${optOutCount}명\n`);

    // 3. 전화번호 없는 고객 수
    console.log('📊 3단계: 전화번호 없는 고객 수 확인');
    const { count: noPhoneCount, error: noPhoneError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .is('phone', null);

    if (noPhoneError) {
      console.error('❌ 전화번호 없는 고객 수 조회 실패:', noPhoneError.message);
      process.exit(1);
    }

    console.log(`✅ 전화번호 없는 고객: ${noPhoneCount}명\n`);

    // 4. 발송 가능 고객 (opt_out=false, phone 있음)
    console.log('📊 4단계: 발송 가능 고객 수 확인');
    const { data: sendableCustomers, error: sendableError } = await supabase
      .from('customers')
      .select('id')
      .eq('opt_out', false)
      .not('phone', 'is', null);

    if (sendableError) {
      console.error('❌ 발송 가능 고객 조회 실패:', sendableError.message);
      process.exit(1);
    }

    const sendableIds = new Set((sendableCustomers || []).map(c => c.id));
    console.log(`✅ 발송 가능 고객: ${sendableIds.size}명\n`);

    // 5. 메시지 발송 대상 고객 수집
    console.log('📊 5단계: 메시지 발송 대상 고객 수집');
    
    // 메시지 1, 2 대상 (거리 정보 있음)
    const { data: withDistance, error: distanceError } = await supabase
      .from('customer_address_cache')
      .select('customer_id')
      .eq('geocoding_status', 'success')
      .not('distance_km', 'is', null);

    if (distanceError) {
      console.error('❌ 거리 정보 조회 실패:', distanceError.message);
      process.exit(1);
    }

    const withDistanceIds = new Set((withDistance || []).map(c => c.customer_id));
    console.log(`✅ 거리 정보 있는 고객: ${withDistanceIds.size}명`);

    // 메시지 3 대상 = 발송 가능 고객 중 거리 정보 없는 고객
    const message3Ids = Array.from(sendableIds).filter(id => !withDistanceIds.has(id));
    console.log(`✅ 메시지 3 대상 (거리 정보 없음): ${message3Ids.length}명\n`);

    // 6. 메시지 발송 대상 합계
    const message1Count = Array.from(withDistanceIds).filter(id => {
      // 50km 이내는 실제로 조회해야 하지만, 여기서는 전체로 계산
      return sendableIds.has(id);
    }).length;

    // 실제로는 메시지 1, 2를 구분해야 하지만, 여기서는 전체 거리 정보 있는 고객으로 계산
    const messageTargetTotal = withDistanceIds.size + message3Ids.length;

    console.log('='.repeat(60));
    console.log('📋 최종 검증 결과');
    console.log('='.repeat(60));
    console.log(`\n전체 고객 수: ${totalCustomers}명`);
    console.log(`수신거부: ${optOutCount}명`);
    console.log(`전화번호 없음: ${noPhoneCount}명`);
    console.log(`발송 가능 고객: ${sendableIds.size}명`);
    console.log(`\n메시지 발송 대상:`);
    console.log(`   거리 정보 있음: ${withDistanceIds.size}명`);
    console.log(`   거리 정보 없음: ${message3Ids.length}명`);
    console.log(`   ─────────────────────────────`);
    console.log(`   합계: ${messageTargetTotal}명\n`);

    // 7. 차이 확인
    const expectedSendable = totalCustomers - optOutCount - noPhoneCount;
    const difference = sendableIds.size - messageTargetTotal;

    console.log('📊 차이 분석:');
    console.log(`   예상 발송 가능: ${expectedSendable}명 (전체 - 수신거부 - 전화번호없음)`);
    console.log(`   실제 발송 가능: ${sendableIds.size}명`);
    console.log(`   메시지 발송 대상: ${messageTargetTotal}명`);
    
    if (difference > 0) {
      console.log(`   ⚠️ 차이: ${difference}명 (메시지 발송 대상에 포함되지 않음)\n`);
      
      // 차이 원인 분석
      console.log('💡 차이 원인 분석:');
      console.log('   - 거리 정보는 있지만 geocoding_status != "success"인 고객');
      console.log('   - 거리 정보는 있지만 distance_km IS NULL인 고객');
      console.log('   - customer_address_cache에 등록되지 않은 고객\n');
    } else if (difference === 0) {
      console.log(`   ✅ 모든 발송 가능 고객이 메시지 발송 대상에 포함됨\n`);
    }

    // 8. 실제 메시지 ID별 수신자 수 확인
    console.log('📊 6단계: 실제 생성된 메시지 수신자 수 확인');
    const messageIds = {
      message1: [457, 459, 460],
      message2: [463, 464, 465],
      message3: [472, 473, 474, 475]
    };

    let totalInMessages = 0;

    for (const [type, ids] of Object.entries(messageIds)) {
      let typeTotal = 0;
      for (const id of ids) {
        const { data: msg, error: msgError } = await supabase
          .from('channel_sms')
          .select('recipient_numbers, sent_count')
          .eq('id', id)
          .single();

        if (!msgError && msg) {
          const count = msg.recipient_numbers?.length || msg.sent_count || 0;
          typeTotal += count;
          console.log(`   메시지 ${id}: ${count}명`);
        }
      }
      console.log(`   ${type} 합계: ${typeTotal}명\n`);
      totalInMessages += typeTotal;
    }

    console.log(`📋 실제 메시지 수신자 합계: ${totalInMessages}명\n`);

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

verifyAllCustomers()
  .then(() => {
    console.log('✅ 검증 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
