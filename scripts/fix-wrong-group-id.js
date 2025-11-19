const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 잘못된 그룹 ID가 연결된 메시지 ID
const MESSAGE_ID = 90;
const WRONG_GROUP_ID = 'G4V202511191242486SYSWM98ZEK0BTX';

async function fixWrongGroupId() {
  console.log('🔧 잘못된 그룹 ID 수정 시작...\n');
  console.log(`📋 메시지 ID: ${MESSAGE_ID}`);
  console.log(`📋 잘못된 그룹 ID: ${WRONG_GROUP_ID}\n`);

  try {
    // 1. 메시지 정보 조회
    const { data: message, error: fetchError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', MESSAGE_ID)
      .single();

    if (fetchError || !message) {
      console.error('❌ 메시지를 찾을 수 없습니다:', fetchError?.message);
      process.exit(1);
    }

    console.log('📋 현재 메시지 정보:');
    console.log(`   - ID: ${message.id}`);
    console.log(`   - 상태: ${message.status}`);
    console.log(`   - 수신자: ${message.recipient_numbers?.length || 0}명`);
    console.log(`   - 현재 그룹 ID: ${message.solapi_group_id || '없음'}\n`);

    // 2. 잘못된 그룹 ID 제거
    if (message.solapi_group_id === WRONG_GROUP_ID) {
      console.log('🔧 잘못된 그룹 ID 제거 중...');
      
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          solapi_group_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', MESSAGE_ID);

      if (updateError) {
        console.error('❌ 그룹 ID 제거 실패:', updateError);
        process.exit(1);
      }

      console.log('✅ 잘못된 그룹 ID 제거 완료!');
      console.log(`\n💡 메시지 #${MESSAGE_ID}의 그룹 ID가 제거되었습니다.`);
      console.log(`   이제 이 메시지는 솔라피 그룹 ID 없이 초안 상태로 유지됩니다.`);
    } else {
      console.log('ℹ️ 메시지의 그룹 ID가 지정한 값과 다릅니다.');
      console.log(`   현재 그룹 ID: ${message.solapi_group_id || '없음'}`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fixWrongGroupId();

