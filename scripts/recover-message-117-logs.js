/**
 * 117번 메시지의 message_logs 복구 스크립트
 * failed 상태이지만 recipient_numbers에 포함된 번호들 복구
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function recoverMessage117Logs() {
  console.log('🔍 117번 메시지 로그 복구 시작...\n');

  const messageId = 117;

  // channel_sms 정보 조회
  const { data: sms, error: smsError } = await supabase
    .from('channel_sms')
    .select('id, status, sent_at, recipient_numbers, message_type, note')
    .eq('id', messageId)
    .single();

  if (smsError || !sms) {
    console.error('❌ channel_sms 조회 오류:', smsError?.message || '메시지를 찾을 수 없습니다.');
    return;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 channel_sms 정보:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`상태: ${sms.status}`);
  console.log(`메시지 타입: ${sms.message_type || '(없음)'}`);
  console.log(`발송 시간: ${sms.sent_at ? new Date(sms.sent_at).toLocaleString('ko-KR') : '(없음)'}`);
  console.log(`수신자 수: ${sms.recipient_numbers?.length || 0}명`);
  console.log(`메모: ${sms.note || '(없음)'}\n`);

  if (!sms.recipient_numbers || !Array.isArray(sms.recipient_numbers) || sms.recipient_numbers.length === 0) {
    console.log('⚠️  recipient_numbers가 없습니다. 복구할 수 없습니다.');
    return;
  }

  // recipient_numbers 기반으로 message_logs 생성
  const nowIso = sms.sent_at || new Date().toISOString();
  const logsToInsert = sms.recipient_numbers.map(phone => ({
    content_id: String(messageId),
    customer_phone: phone,
    customer_id: null,
    message_type: (sms.message_type || 'mms').toLowerCase(),
    status: sms.status === 'failed' ? 'failed' : 'sent', // failed 상태는 failed로 기록
    channel: 'solapi',
    sent_at: nowIso
  }));

  console.log(`📊 ${logsToInsert.length}개 로그 생성 중...\n`);

  const { data: inserted, error: insertError } = await supabase
    .from('message_logs')
    .upsert(logsToInsert, { onConflict: 'content_id,customer_phone' })
    .select();

  if (insertError) {
    console.error('❌ message_logs 복구 실패:', insertError);
    return;
  }

  console.log(`✅ ${inserted?.length || 0}개 로그 복구 완료\n`);

  // 010-4914-8478 포함 여부 확인
  const targetPhone = '010-4914-8478';
  const normalizedTarget = '01049148478';
  const found = inserted?.some(log => {
    const logPhone = (log.customer_phone || '').replace(/[\-\s]/g, '');
    return logPhone === normalizedTarget || log.customer_phone === targetPhone;
  });

  if (found) {
    console.log(`✅ ${targetPhone} 번호의 로그가 복구되었습니다.`);
  } else {
    console.log(`⚠️  ${targetPhone} 번호가 복구된 로그에 없습니다.`);
    console.log(`   recipient_numbers에 포함되어 있는지 확인이 필요합니다.`);
  }

  console.log('\n✅ 복구 완료!');
}

recoverMessage117Logs();


