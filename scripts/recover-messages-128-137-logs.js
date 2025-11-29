/**
 * 128~137번 메시지의 message_logs 복구 스크립트
 * 
 * 사용법:
 * node scripts/recover-messages-128-137-logs.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MESSAGE_IDS = [128, 129, 130, 131, 132, 133, 134, 135, 136, 137];

async function recoverMessages128to137() {
  console.log('\n🔍 128~137번 메시지 message_logs 복구 시작...\n');

  let totalRecovered = 0;
  let totalRecipients = 0;
  const results = [];

  for (const messageId of MESSAGE_IDS) {
    try {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📋 메시지 ID ${messageId} 처리 중...`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // 1. 메시지 정보 조회
      const { data: message, error: fetchError } = await supabase
        .from('channel_sms')
        .select('*')
        .eq('id', messageId)
        .single();

      if (fetchError || !message) {
        console.error(`   ❌ 메시지를 찾을 수 없습니다: ${fetchError?.message}`);
        results.push({ id: messageId, status: 'not_found', error: fetchError?.message });
        continue;
      }

      console.log(`   ✅ 메시지 조회 완료`);
      console.log(`      - 상태: ${message.status}`);
      console.log(`      - 수신자 수: ${message.recipient_numbers?.length || 0}명`);
      console.log(`      - 발송일: ${message.sent_at || '없음'}`);

      if (!message.recipient_numbers || !Array.isArray(message.recipient_numbers) || message.recipient_numbers.length === 0) {
        console.warn(`   ⚠️ recipient_numbers가 없어 복구 불가`);
        results.push({ id: messageId, status: 'skipped', reason: 'recipient_numbers 없음' });
        continue;
      }

      // 2. 기존 message_logs 확인
      const { count: existingCount } = await supabase
        .from('message_logs')
        .select('id', { count: 'exact' })
        .eq('content_id', String(messageId));

      console.log(`   📊 기존 로그: ${existingCount || 0}건`);
      console.log(`   📊 수신자 수: ${message.recipient_numbers.length}명`);

      if (existingCount === message.recipient_numbers.length) {
        console.log(`   ✅ 이미 모든 로그가 존재합니다. 스킵합니다.`);
        results.push({ id: messageId, status: 'skipped', reason: '이미 완료', existing: existingCount });
        continue;
      }

      // 3. message_logs 복구
      const nowIso = message.sent_at || new Date().toISOString();
      const logsToInsert = message.recipient_numbers.map(phone => {
        // 전화번호 정규화 (하이픈 제거)
        const normalized = phone.replace(/[\-\s]/g, '');
        
        // ⭐ channel_sms.status에 따라 message_logs.status 결정
        // draft 상태는 'draft'로, failed는 'failed'로, 나머지는 'sent'로 저장
        let logStatus = 'sent';
        if (message.status === 'failed') {
          logStatus = 'failed';
        } else if (message.status === 'draft') {
          logStatus = 'draft';
        } else if (message.status === 'scheduled') {
          logStatus = 'scheduled';
        }
        
        return {
          content_id: String(messageId),
          customer_phone: normalized,
          customer_id: null,
          message_type: (message.message_type || 'mms').toLowerCase(),
          status: logStatus,
          channel: 'solapi',
          sent_at: nowIso
        };
      });

      console.log(`   💾 ${logsToInsert.length}개 로그 생성 중...`);

      const { data: inserted, error: insertError } = await supabase
        .from('message_logs')
        .upsert(logsToInsert, { onConflict: 'content_id,customer_phone' })
        .select();

      if (insertError) {
        console.error(`   ❌ message_logs 복구 실패:`, insertError.message);
        results.push({ id: messageId, status: 'error', error: insertError.message });
        continue;
      }

      const recoveredCount = inserted?.length || 0;
      totalRecovered += recoveredCount;
      totalRecipients += message.recipient_numbers.length;

      console.log(`   ✅ ${recoveredCount}건 복구 완료!`);
      results.push({ 
        id: messageId, 
        status: 'success', 
        recovered: recoveredCount, 
        recipients: message.recipient_numbers.length 
      });

    } catch (error) {
      console.error(`   ❌ 메시지 ID ${messageId} 처리 중 오류:`, error.message);
      results.push({ id: messageId, status: 'error', error: error.message });
    }
  }

  // 4. 결과 요약
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 복구 결과 요약');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const successCount = results.filter(r => r.status === 'success').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const notFoundCount = results.filter(r => r.status === 'not_found').length;

  console.log(`총 처리 메시지: ${MESSAGE_IDS.length}건`);
  console.log(`✅ 복구 완료: ${successCount}건`);
  console.log(`⏭️  스킵: ${skippedCount}건`);
  console.log(`❌ 오류: ${errorCount}건`);
  console.log(`🔍 미발견: ${notFoundCount}건\n`);

  console.log(`총 복구된 로그: ${totalRecovered.toLocaleString()}건`);
  console.log(`총 수신자 수: ${totalRecipients.toLocaleString()}명\n`);

  // 5. 상세 결과
  if (successCount > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 복구 완료된 메시지:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    results.filter(r => r.status === 'success').forEach(r => {
      console.log(`   메시지 ID ${r.id}: ${r.recovered}건 복구 (수신자: ${r.recipients}명)`);
    });
    console.log('');
  }

  if (errorCount > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ 오류 발생 메시지:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`   메시지 ID ${r.id}: ${r.error}`);
    });
    console.log('');
  }

  console.log('✅ 복구 작업 완료!\n');
}

recoverMessages128to137();

