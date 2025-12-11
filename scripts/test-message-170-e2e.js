const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMessage170() {
  try {
    console.log('🧪 메시지 170 E2E 테스트 시작');
    console.log(`현재 시간: ${new Date().toISOString()}`);
    
    // 현재 시간에서 5분 후로 예약 시간 설정 (KST 기준)
    const now = new Date();
    const scheduledTime = new Date(now.getTime() + 5 * 60 * 1000); // 5분 후
    const scheduledAtISO = scheduledTime.toISOString();
    
    console.log(`예약 시간 설정: ${scheduledAtISO} (${scheduledTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })})`);
    
    // 메시지 170의 현재 상태 확인
    const { data: currentMessage, error: fetchError } = await supabase
      .from('channel_sms')
      .select('id, status, scheduled_at, recipient_numbers, message_type, image_url')
      .eq('id', 170)
      .single();
    
    if (fetchError) {
      console.error('❌ 메시지 170 조회 실패:', fetchError);
      return;
    }
    
    console.log('📋 메시지 170 현재 상태:');
    console.log(JSON.stringify(currentMessage, null, 2));
    
    // scheduled_at 업데이트
    const { data: updatedMessage, error: updateError } = await supabase
      .from('channel_sms')
      .update({
        scheduled_at: scheduledAtISO,
        updated_at: new Date().toISOString()
      })
      .eq('id', 170)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ 메시지 170 예약 시간 설정 실패:', updateError);
      return;
    }
    
    console.log('✅ 메시지 170 예약 시간 설정 완료:');
    console.log(`   예약 시간: ${updatedMessage.scheduled_at}`);
    console.log(`   상태: ${updatedMessage.status}`);
    console.log(`   수신자: ${updatedMessage.recipient_numbers?.join(', ') || '없음'}`);
    console.log(`   메시지 타입: ${updatedMessage.message_type}`);
    console.log(`   이미지: ${updatedMessage.image_url ? '있음' : '없음'}`);
    console.log('');
    console.log('⏰ 5분 후 자동 발송 예정입니다.');
    console.log(`   예약 시간: ${scheduledTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
    console.log(`   현재 시간: ${now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
    
  } catch (error) {
    console.error('❌ 테스트 실행 오류:', error);
  }
}

testMessage170();
