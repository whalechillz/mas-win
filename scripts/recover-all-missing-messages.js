/**
 * 전체 누락된 message_logs 복구 스크립트
 * channel_sms의 sent/partial 상태 메시지 중 message_logs에 기록이 없는 모든 메시지 복구
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

async function recoverAllMissingMessages() {
  console.log('🔍 전체 누락된 message_logs 복구 시작...\n');

  try {
    // 1. channel_sms에서 sent/partial 상태 메시지 조회
    const { data: sentMessages, error: sentError } = await supabase
      .from('channel_sms')
      .select('id, status, sent_at, recipient_numbers, message_type, note, sent_count')
      .in('status', ['sent', 'partial', 'failed']) // failed도 포함 (117번 같은 경우)
      .order('sent_at', { ascending: false })
      .limit(1000);

    if (sentError) {
      console.error('❌ channel_sms 조회 오류:', sentError);
      return;
    }

    console.log(`📊 총 ${sentMessages?.length || 0}건의 메시지 확인\n`);

    if (!sentMessages || sentMessages.length === 0) {
      console.log('⚠️  발송된 메시지가 없습니다.');
      return;
    }

    // 2. 각 메시지의 message_logs 기록 확인 및 복구
    let totalRecovered = 0;
    let totalRecipients = 0;
    let recoveredMessages = 0;
    let skippedMessages = 0;
    let errorMessages = 0;

    const recoveryResults = [];

    for (const msg of sentMessages) {
      // message_logs 기록 확인
      const { count } = await supabase
        .from('message_logs')
        .select('id', { count: 'exact' })
        .eq('content_id', String(msg.id));

      const logCount = count || 0;
      const recipientCount = msg.recipient_numbers?.length || msg.sent_count || 0;

      // 기록이 없거나 부족한 경우 복구
      if (logCount === 0 && recipientCount > 0 && msg.recipient_numbers && Array.isArray(msg.recipient_numbers)) {
        try {
          const nowIso = msg.sent_at || new Date().toISOString();
          const logsToInsert = msg.recipient_numbers.map(phone => ({
            content_id: String(msg.id),
            customer_phone: phone,
            customer_id: null,
            message_type: (msg.message_type || 'mms').toLowerCase(),
            status: msg.status === 'failed' ? 'failed' : 'sent',
            channel: 'solapi',
            sent_at: nowIso
          }));

          const { data: inserted, error: insertError } = await supabase
            .from('message_logs')
            .upsert(logsToInsert, { onConflict: 'content_id,customer_phone' })
            .select();

          if (insertError) {
            console.error(`❌ 메시지 ID ${msg.id} 복구 실패:`, insertError.message);
            errorMessages++;
            recoveryResults.push({
              id: msg.id,
              status: 'error',
              error: insertError.message
            });
          } else {
            const recoveredCount = inserted?.length || 0;
            totalRecovered += recoveredCount;
            totalRecipients += recipientCount;
            recoveredMessages++;
            console.log(`✅ 메시지 ID ${msg.id}: ${recoveredCount}건 복구 (수신자 ${recipientCount}명)`);
            recoveryResults.push({
              id: msg.id,
              status: 'success',
              recovered: recoveredCount,
              recipients: recipientCount
            });
          }
        } catch (error) {
          console.error(`❌ 메시지 ID ${msg.id} 복구 중 오류:`, error.message);
          errorMessages++;
          recoveryResults.push({
            id: msg.id,
            status: 'error',
            error: error.message
          });
        }
      } else if (logCount > 0) {
        // 이미 기록이 있는 경우 스킵
        skippedMessages++;
      } else if (!msg.recipient_numbers || !Array.isArray(msg.recipient_numbers) || msg.recipient_numbers.length === 0) {
        // recipient_numbers가 없는 경우 스킵
        skippedMessages++;
        console.log(`⚠️  메시지 ID ${msg.id}: recipient_numbers가 없어 복구 불가`);
      }
    }

    // 3. 결과 요약
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 복구 결과 요약');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`총 확인 메시지: ${sentMessages.length}건`);
    console.log(`✅ 복구 완료: ${recoveredMessages}건`);
    console.log(`⏭️  스킵 (이미 기록 있음): ${skippedMessages}건`);
    console.log(`❌ 오류: ${errorMessages}건\n`);

    console.log(`총 복구된 로그: ${totalRecovered.toLocaleString()}건`);
    console.log(`총 수신자 수: ${totalRecipients.toLocaleString()}명\n`);

    // 4. 복구된 메시지 ID 목록
    const successIds = recoveryResults
      .filter(r => r.status === 'success')
      .map(r => r.id);
    
    if (successIds.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ 복구된 메시지 ID 목록');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(successIds.join(', '));
      console.log('');
    }

    // 5. 오류 발생 메시지
    const errorIds = recoveryResults.filter(r => r.status === 'error');
    if (errorIds.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ 오류 발생 메시지');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      errorIds.forEach(r => {
        console.log(`메시지 ID ${r.id}: ${r.error}`);
      });
      console.log('');
    }

    // 6. 최종 확인
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 최종 기록률 확인');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let finalTotalRecipients = 0;
    let finalTotalLogged = 0;

    for (const msg of sentMessages) {
      const { count } = await supabase
        .from('message_logs')
        .select('id', { count: 'exact' })
        .eq('content_id', String(msg.id));

      const recipientCount = msg.recipient_numbers?.length || msg.sent_count || 0;
      finalTotalRecipients += recipientCount;
      finalTotalLogged += (count || 0);
    }

    const finalCoverageRate = finalTotalRecipients > 0 
      ? ((finalTotalLogged / finalTotalRecipients) * 100).toFixed(2)
      : 0;

    console.log(`총 수신자: ${finalTotalRecipients.toLocaleString()}명`);
    console.log(`총 기록: ${finalTotalLogged.toLocaleString()}건`);
    console.log(`📈 최종 기록률: ${finalCoverageRate}%\n`);

    if (parseFloat(finalCoverageRate) >= 95) {
      console.log('✅ 복구가 성공적으로 완료되었습니다!');
    } else if (parseFloat(finalCoverageRate) >= 80) {
      console.log('⚠️  대부분 복구되었지만 일부 누락이 있을 수 있습니다.');
    } else {
      console.log('⚠️  복구가 완전하지 않습니다. 추가 확인이 필요합니다.');
    }

  } catch (error) {
    console.error('❌ 전체 복구 중 오류 발생:', error);
  }
}

// 실행 옵션 확인
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

if (dryRun) {
  console.log('🔍 DRY RUN 모드: 실제 복구는 하지 않고 확인만 합니다.\n');
  // TODO: dry-run 로직 추가
}

recoverAllMissingMessages();


