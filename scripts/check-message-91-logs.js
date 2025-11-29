/**
 * 91번 메시지의 실제 발송 기록 확인
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMessage91() {
  console.log('🔍 91번 메시지 상세 확인 중...\n');

  // 1. channel_sms 정보
  const { data: sms } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('id', 91)
    .single();

  if (!sms) {
    console.log('❌ 91번 메시지를 찾을 수 없습니다.');
    return;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 channel_sms 정보:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`상태: ${sms.status}`);
  console.log(`솔라피 그룹 ID: ${sms.solapi_group_id || '(없음)'}`);
  console.log(`발송 수: ${sms.sent_count || 0}명`);
  console.log(`성공 수: ${sms.success_count || 0}명`);
  console.log(`실패 수: ${sms.fail_count || 0}명`);
  console.log(`수신자 수: ${sms.recipient_numbers ? sms.recipient_numbers.length : 0}명`);
  console.log(`발송 시간: ${sms.sent_at || '(없음)'}`);
  console.log('');

  // 2. message_logs 확인
  const { data: logs, count } = await supabase
    .from('message_logs')
    .select('*', { count: 'exact' })
    .eq('content_id', '91');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 message_logs 기록:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`총 ${count || 0}건의 발송 기록\n`);

  if (logs && logs.length > 0) {
    console.log('실제 발송된 전화번호 목록:');
    logs.forEach((log, i) => {
      console.log(`  [${i + 1}] ${log.customer_phone || '(없음)'} - 상태: ${log.status || '(없음)'} - 발송시간: ${log.sent_at || '(없음)'}`);
    });

    // 01041060273 포함 여부 확인
    const targetPhone = '01041060273';
    const formattedTarget = '010-4106-0273';
    const sentToTarget = logs.some(log => {
      const logPhone = (log.customer_phone || '').replace(/[\-\s]/g, '');
      return logPhone === targetPhone || log.customer_phone === formattedTarget || log.customer_phone === targetPhone;
    });

    console.log(`\n🎯 ${targetPhone} 발송 여부: ${sentToTarget ? '✅ 발송됨' : '❌ 발송 안됨'}`);
    
    if (!sentToTarget) {
      console.log('\n⚠️  이 번호는 recipient_numbers에는 포함되어 있지만 실제로는 발송되지 않았습니다.');
      console.log('   가능한 이유:');
      console.log('   1. 발송 실패');
      console.log('   2. 수신거부 처리');
      console.log('   3. 발송 전 필터링');
    }
  } else {
    console.log('⚠️  message_logs에 기록이 없습니다.');
    console.log('   이는 실제로 발송되지 않았거나, 발송 로그가 기록되지 않았음을 의미합니다.');
  }

  // 3. recipient_numbers 확인
  if (sms.recipient_numbers && Array.isArray(sms.recipient_numbers)) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 recipient_numbers 목록:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${sms.recipient_numbers.length}명\n`);
    
    const targetPhone = '01041060273';
    const normalizedTarget = targetPhone.replace(/[\-\s]/g, '');
    const formattedTarget = '010-4106-0273';
    
    const inRecipients = sms.recipient_numbers.some(num => {
      const cleanNum = (num || '').replace(/[\-\s]/g, '');
      return cleanNum === normalizedTarget || num === formattedTarget || num === targetPhone;
    });

    console.log(`${targetPhone} 포함 여부: ${inRecipients ? '✅ 포함됨' : '❌ 포함 안됨'}`);
    
    if (inRecipients) {
      console.log('\n💡 recipient_numbers에는 포함되어 있지만 message_logs에는 없습니다.');
      console.log('   이는 실제로 발송되지 않았음을 의미합니다.');
    }
  }
}

checkMessage91();


