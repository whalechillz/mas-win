/**
 * 129번 메시지의 message_logs 상태를 draft로 수정
 * 
 * 사용법:
 * node scripts/fix-message-129-logs-status.js
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

async function fixMessage129LogsStatus() {
  console.log('\n🔍 129번 메시지의 message_logs 상태 수정 시작...\n');

  try {
    // 1. 129번 메시지 정보 확인
    const { data: message, error: msgError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 129)
      .single();

    if (msgError || !message) {
      console.error(`❌ 메시지를 찾을 수 없습니다: ${msgError?.message}`);
      process.exit(1);
    }

    console.log('✅ 메시지 조회 성공:');
    console.log(`   - 상태: ${message.status}`);
    console.log(`   - 수신자 수: ${message.recipient_numbers?.length || 0}명\n`);

    if (message.status !== 'draft') {
      console.log(`⚠️ 메시지 상태가 'draft'가 아닙니다. (현재: ${message.status})`);
      console.log('   상태 수정을 계속 진행합니다...\n');
    }

    // 2. message_logs 조회
    const { data: logs, error: logsError } = await supabase
      .from('message_logs')
      .select('id, status')
      .eq('content_id', '129');

    if (logsError) {
      console.error('❌ message_logs 조회 오류:', logsError.message);
      process.exit(1);
    }

    if (!logs || logs.length === 0) {
      console.log('⚠️ message_logs가 없습니다.');
      process.exit(0);
    }

    console.log(`📊 message_logs 개수: ${logs.length}건`);
    console.log(`   현재 상태: ${logs[0]?.status || '없음'}\n`);

    // 3. status가 'sent'인 로그만 'draft'로 수정
    const logsToUpdate = logs.filter(log => log.status === 'sent');
    
    if (logsToUpdate.length === 0) {
      console.log('✅ 수정할 로그가 없습니다. (이미 draft 상태이거나 다른 상태)');
      process.exit(0);
    }

    console.log(`💾 ${logsToUpdate.length}건의 로그를 'draft'로 수정 중...`);

    const { data: updated, error: updateError } = await supabase
      .from('message_logs')
      .update({ status: 'draft' })
      .eq('content_id', '129')
      .eq('status', 'sent')
      .select();

    if (updateError) {
      console.error('❌ message_logs 업데이트 실패:', updateError.message);
      process.exit(1);
    }

    console.log(`✅ ${updated?.length || 0}건의 로그 상태를 'draft'로 수정 완료!\n`);
    console.log('💡 고객 메시지 이력에서 "예정"으로 표시됩니다.\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fixMessage129LogsStatus();

