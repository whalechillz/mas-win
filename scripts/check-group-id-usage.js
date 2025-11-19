const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const GROUP_ID = 'G4V202511191242486SYSWM98ZEK0BTX';

async function checkGroupIdUsage() {
  console.log('🔍 그룹 ID 사용 현황 확인...\n');
  console.log(`📋 그룹 ID: ${GROUP_ID}\n`);

  try {
    // 이 그룹 ID를 사용하는 모든 메시지 조회
    const { data: messages, error } = await supabase
      .from('channel_sms')
      .select('id, status, recipient_numbers, solapi_group_id, created_at, sent_at')
      .eq('solapi_group_id', GROUP_ID);

    if (error) {
      console.error('❌ 조회 오류:', error);
      process.exit(1);
    }

    if (!messages || messages.length === 0) {
      console.log('ℹ️ 이 그룹 ID를 사용하는 메시지가 없습니다.');
    } else {
      console.log(`📊 이 그룹 ID를 사용하는 메시지: ${messages.length}개\n`);
      
      messages.forEach((msg, idx) => {
        console.log(`${idx + 1}. 메시지 #${msg.id}`);
        console.log(`   - 상태: ${msg.status}`);
        console.log(`   - 수신자: ${msg.recipient_numbers?.length || 0}명`);
        console.log(`   - 생성일: ${msg.created_at ? new Date(msg.created_at).toLocaleString('ko-KR') : '없음'}`);
        console.log(`   - 발송일: ${msg.sent_at ? new Date(msg.sent_at).toLocaleString('ko-KR') : '없음'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkGroupIdUsage();

