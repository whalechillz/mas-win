/**
 * 457번 메시지 내용 수정 스크립트
 * 이미지 보완 발송용 메시지로 업데이트
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

async function updateMessage457() {
  console.log('🚀 457번 메시지 내용 수정 중...\n');
  console.log('='.repeat(60));

  try {
    // 1. 현재 메시지 상태 확인
    const { data: current, error: getError } = await supabase
      .from('channel_sms')
      .select('id, message_text, recipient_numbers, status, image_url, sent_count')
      .eq('id', 457)
      .single();

    if (getError || !current) {
      console.error('❌ 메시지 조회 실패:', getError?.message);
      process.exit(1);
    }

    console.log('📋 현재 메시지 상태:');
    console.log(`   ID: ${current.id}`);
    console.log(`   상태: ${current.status || 'N/A'}`);
    console.log(`   수신자 수: ${current.recipient_numbers?.length || current.sent_count || 0}명`);
    console.log(`   이미지: ${current.image_url ? '✅ 연결됨' : '❌ 없음'}\n`);

    // 2. 새로운 메시지 내용 (간결 버전, 이름 제거) - 옵션 1 추천
    const newMessageText = `마쓰구 티타늄 샤프트 신제품 시타 예약이 가능합니다! 🎯

▶ 시타 예약: https://www.masgolf.co.kr/try-a-massgoo
☎ 무료 상담: 080-028-8888`;

    // 3. 메시지 업데이트
    const { data: updated, error: updateError } = await supabase
      .from('channel_sms')
      .update({
        message_text: newMessageText,
        message_type: 'MMS',
        note: '타이타늄 샤프트 시타 - 이미지 보완 발송 (452, 453, 454번 메시지 수신자)',
        updated_at: new Date().toISOString()
      })
      .eq('id', 457)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 메시지 업데이트 실패:', updateError.message);
      process.exit(1);
    }

    console.log('✅ 메시지 업데이트 완료!\n');
    console.log('📋 업데이트된 내용:');
    console.log(`   메시지 ID: ${updated.id}`);
    console.log(`   메시지 타입: ${updated.message_type}`);
    console.log(`   상태: ${updated.status}`);
    console.log(`   수신자 수: ${updated.recipient_numbers?.length || updated.sent_count || 0}명`);
    console.log(`   이미지: ${updated.image_url ? '✅ 연결됨' : '❌ 없음'}`);
    console.log(`   메모: ${updated.note || '없음'}\n`);

    console.log('='.repeat(60));
    console.log('💡 다음 단계:');
    console.log('   1. 관리자 페이지에서 확인: /admin/sms?id=457');
    console.log('   2. 수신자 목록 확인 (477명)');
    console.log('   3. 이미지 확인');
    console.log('   4. 발송 실행\n');

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

updateMessage457()
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
