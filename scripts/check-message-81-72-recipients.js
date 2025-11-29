/**
 * 81번, 72번 메시지의 recipient_numbers 확인 스크립트
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

// 전화번호 정규화 함수
function normalizePhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[\-\s\(\)]/g, '');
  if (cleaned.startsWith('010')) {
    return cleaned;
  }
  if (cleaned.startsWith('82')) {
    return '0' + cleaned.slice(2);
  }
  if (cleaned.length === 10) {
    return '010' + cleaned;
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned;
  }
  return null;
}

async function checkMessageRecipients() {
  const targetPhone = '010-4914-8478';
  const normalizedTarget = normalizePhone(targetPhone);
  const messageIds = [117, 81, 72];

  console.log(`🔍 메시지 81번, 72번의 recipient_numbers 확인\n`);
  console.log(`📞 확인 대상 번호: ${targetPhone} (정규화: ${normalizedTarget})\n`);

  for (const messageId of messageIds) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 메시지 ID: ${messageId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // channel_sms 정보 조회
    const { data: sms, error: smsError } = await supabase
      .from('channel_sms')
      .select('id, message_text, message_type, status, sent_at, recipient_numbers, created_at, note, solapi_group_id')
      .eq('id', messageId)
      .single();

    if (smsError || !sms) {
      console.error(`❌ 메시지 ${messageId} 조회 실패:`, smsError?.message || '메시지를 찾을 수 없습니다.');
      console.log('');
      continue;
    }

    console.log(`상태: ${sms.status}`);
    console.log(`메시지 타입: ${sms.message_type || '(없음)'}`);
    console.log(`발송 시간: ${sms.sent_at ? new Date(sms.sent_at).toLocaleString('ko-KR') : sms.created_at ? new Date(sms.created_at).toLocaleString('ko-KR') : '(없음)'}`);
    console.log(`메모: ${sms.note || '(없음)'}`);
    console.log(`솔라피 그룹 ID: ${sms.solapi_group_id || '(없음)'}\n`);

    // recipient_numbers 확인
    if (!sms.recipient_numbers || !Array.isArray(sms.recipient_numbers)) {
      console.log('⚠️  recipient_numbers가 없거나 배열이 아닙니다.\n');
      continue;
    }

    console.log(`📊 recipient_numbers 총 ${sms.recipient_numbers.length}명\n`);

    // 정확한 매칭 확인
    const exactMatch = sms.recipient_numbers.some(num => {
      const cleanNum = normalizePhone(num);
      return cleanNum === normalizedTarget;
    });

    // 부분 매칭 확인 (포함 여부)
    const partialMatches = sms.recipient_numbers.filter(num => {
      const cleanNum = normalizePhone(num);
      const numStr = num.replace(/[\-\s]/g, '');
      const targetStr = normalizedTarget.replace(/[\-\s]/g, '');
      return cleanNum === normalizedTarget || 
             numStr.includes(targetStr) || 
             targetStr.includes(numStr) ||
             num.includes('49148478') ||
             num.includes('4914-8478');
    });

    if (exactMatch) {
      console.log(`✅ 정확한 매칭: ${targetPhone}가 recipient_numbers에 포함되어 있습니다.\n`);
    } else if (partialMatches.length > 0) {
      console.log(`⚠️  부분 매칭 발견 (${partialMatches.length}개):`);
      partialMatches.forEach((num, i) => {
        console.log(`   [${i + 1}] ${num}`);
      });
      console.log('');
    } else {
      console.log(`❌ ${targetPhone}가 recipient_numbers에 포함되어 있지 않습니다.\n`);
    }

    // recipient_numbers 전체 목록 확인 (처음 20개만)
    console.log(`📋 recipient_numbers 샘플 (처음 20개):`);
    sms.recipient_numbers.slice(0, 20).forEach((num, i) => {
      const isMatch = normalizePhone(num) === normalizedTarget;
      console.log(`   [${i + 1}] ${num}${isMatch ? ' ✅ 매칭!' : ''}`);
    });
    if (sms.recipient_numbers.length > 20) {
      console.log(`   ... 외 ${sms.recipient_numbers.length - 20}개 더 있음`);
    }
    console.log('');

    // message_logs 확인
    console.log(`📊 message_logs 확인:`);
    const { data: logs, error: logsError, count } = await supabase
      .from('message_logs')
      .select('*', { count: 'exact' })
      .eq('content_id', String(messageId));

    if (logsError) {
      console.error(`   ❌ 조회 오류: ${logsError.message}`);
    } else {
      console.log(`   총 ${count || 0}건의 발송 기록`);
      
      if (count === 0) {
        console.log(`   ⚠️  message_logs에 기록이 없습니다.`);
        console.log(`   이는 실제로 발송되지 않았거나, 발송 로그가 기록되지 않았음을 의미합니다.`);
      } else {
        // 010-4914-8478이 message_logs에 있는지 확인
        const targetInLogs = logs?.some(log => {
          const logPhone = normalizePhone(log.customer_phone);
          return logPhone === normalizedTarget;
        });
        
        if (targetInLogs) {
          console.log(`   ✅ ${targetPhone}가 message_logs에 있습니다.`);
        } else {
          console.log(`   ❌ ${targetPhone}가 message_logs에 없습니다.`);
        }
      }
    }

    console.log('\n');
  }

  // 최종 요약
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 최종 요약');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`확인 대상 번호: ${targetPhone}`);
  console.log(`\n💡 분석:`);
  console.log(`- recipient_numbers에 포함되어 있다고 나오는 이유:`);
  console.log(`  → 스크립트의 부분 매칭 로직이 너무 관대할 수 있습니다.`);
  console.log(`  → 실제로는 포함되어 있지 않을 수 있습니다.`);
  console.log(`\n- message_logs에 기록이 없는 이유:`);
  console.log(`  → 실제로 발송되지 않았거나,`);
  console.log(`  → 발송 로그 기록 과정에서 누락되었을 수 있습니다.`);
}

checkMessageRecipients();

