/**
 * message_logs 기록 누락 확인 스크립트
 * channel_sms의 sent/partial 상태 메시지 중 message_logs에 기록이 없는 비율 확인
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

async function checkMessageLogsCoverage() {
  console.log('🔍 message_logs 기록 누락 확인 중...\n');

  try {
    // 1. channel_sms에서 sent/partial 상태 메시지 조회
    const { data: sentMessages, error: sentError } = await supabase
      .from('channel_sms')
      .select('id, status, sent_at, recipient_numbers, sent_count, success_count, fail_count, note')
      .in('status', ['sent', 'partial'])
      .order('sent_at', { ascending: false })
      .limit(1000);

    if (sentError) {
      console.error('❌ channel_sms 조회 오류:', sentError);
      return;
    }

    console.log(`📊 channel_sms (sent/partial 상태): ${sentMessages?.length || 0}건\n`);

    if (!sentMessages || sentMessages.length === 0) {
      console.log('⚠️  발송된 메시지가 없습니다.');
      return;
    }

    // 2. 각 메시지의 message_logs 기록 확인
    let totalRecipients = 0;
    let totalLogged = 0;
    let messagesWithoutLogs = 0;
    let messagesWithPartialLogs = 0;
    let messagesWithFullLogs = 0;

    const missingLogs = [];

    for (const msg of sentMessages) {
      const { data: logs, error: logsError, count } = await supabase
        .from('message_logs')
        .select('id', { count: 'exact' })
        .eq('content_id', String(msg.id));

      const logCount = count || 0;
      const recipientCount = msg.recipient_numbers?.length || msg.sent_count || 0;

      totalRecipients += recipientCount;
      totalLogged += logCount;

      if (logCount === 0) {
        messagesWithoutLogs++;
        if (recipientCount > 0) {
          missingLogs.push({
            id: msg.id,
            status: msg.status,
            sent_at: msg.sent_at,
            recipient_count: recipientCount,
            log_count: 0,
            note: msg.note
          });
        }
      } else if (logCount < recipientCount) {
        messagesWithPartialLogs++;
      } else {
        messagesWithFullLogs++;
      }
    }

    // 3. 결과 출력
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 message_logs 기록 현황');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`총 발송 메시지: ${sentMessages.length}건`);
    console.log(`총 수신자 수: ${totalRecipients.toLocaleString()}명`);
    console.log(`총 기록 수: ${totalLogged.toLocaleString()}건\n`);

    console.log(`✅ 완전 기록: ${messagesWithFullLogs}건`);
    console.log(`⚠️  부분 기록: ${messagesWithPartialLogs}건`);
    console.log(`❌ 기록 없음: ${messagesWithoutLogs}건\n`);

    const coverageRate = totalRecipients > 0 
      ? ((totalLogged / totalRecipients) * 100).toFixed(2)
      : 0;
    
    console.log(`📈 기록률: ${coverageRate}%`);
    console.log(`📉 누락률: ${(100 - parseFloat(coverageRate)).toFixed(2)}%\n`);

    // 4. 기록이 없는 메시지 상세 (최근 20개)
    if (missingLogs.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ message_logs 기록이 없는 메시지 (최근 20개)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      missingLogs.slice(0, 20).forEach((msg, i) => {
        console.log(`[${i + 1}] 메시지 ID: ${msg.id}`);
        console.log(`    상태: ${msg.status}`);
        console.log(`    발송 시간: ${msg.sent_at ? new Date(msg.sent_at).toLocaleString('ko-KR') : '(없음)'}`);
        console.log(`    수신자 수: ${msg.recipient_count}명`);
        console.log(`    기록 수: ${msg.log_count}건`);
        if (msg.note) {
          console.log(`    메모: ${msg.note}`);
        }
        console.log('');
      });

      if (missingLogs.length > 20) {
        console.log(`... 외 ${missingLogs.length - 20}개 더 있음\n`);
      }

      // 누락된 메시지 ID 목록 저장 (복구용)
      const missingIds = missingLogs.map(m => m.id).join(',');
      console.log(`\n📋 복구 대상 메시지 ID (총 ${missingLogs.length}개):`);
      console.log(missingIds.substring(0, 200) + (missingIds.length > 200 ? '...' : ''));
    }

    // 5. 분석 및 권장사항
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 분석 및 권장사항');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (coverageRate < 50) {
      console.log('⚠️  기록률이 50% 미만입니다. 심각한 문제가 있습니다.');
      console.log('   → 발송 로직에서 message_logs 기록이 누락되고 있을 가능성이 높습니다.\n');
    } else if (coverageRate < 80) {
      console.log('⚠️  기록률이 80% 미만입니다. 개선이 필요합니다.');
      console.log('   → 일부 메시지의 기록이 누락되고 있습니다.\n');
    } else if (coverageRate < 100) {
      console.log('✅ 기록률이 80% 이상입니다. 대부분 정상적으로 기록되고 있습니다.');
      console.log('   → 일부 누락은 예전 메시지이거나 특수한 경우일 수 있습니다.\n');
    } else {
      console.log('✅ 기록률이 100%입니다. 모든 메시지가 정상적으로 기록되고 있습니다.\n');
    }

    if (messagesWithoutLogs > 0) {
      console.log(`📌 기록이 없는 메시지 ${messagesWithoutLogs}건:`);
      console.log('   → recipient_numbers 기반으로 복구 가능');
      console.log('   → scripts/recover-all-missing-messages.js 실행 권장\n');
    }

    return {
      totalMessages: sentMessages.length,
      totalRecipients,
      totalLogged,
      coverageRate: parseFloat(coverageRate),
      messagesWithoutLogs,
      missingLogs
    };

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    return null;
  }
}

checkMessageLogsCoverage().then(result => {
  if (result) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});


