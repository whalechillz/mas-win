/**
 * 누락된 솔라피 그룹 ID 복구 스크립트
 * 
 * 사용법:
 * node scripts/fix-missing-group-ids.js <messageId> <groupIds>
 * 
 * 예시:
 * node scripts/fix-missing-group-ids.js 96 "G4V20251120112333JFB0WGSIYOSRIL7,G4V20251120112334ABCDEFGHIJKLMNOP"
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

async function fixMissingGroupIds(messageId, groupIds) {
  console.log(`\n🔄 누락된 그룹 ID 복구 시작...\n`);
  console.log(`메시지 ID: ${messageId}`);
  console.log(`그룹 IDs: ${groupIds}\n`);

  // 1. 메시지 조회
  const { data: message, error: fetchError } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('id', messageId)
    .single();

  if (fetchError || !message) {
    console.error(`❌ 메시지를 찾을 수 없습니다: ${fetchError?.message}`);
    process.exit(1);
  }

  console.log(`✅ 메시지 조회 성공:`);
  console.log(`   현재 그룹 ID: ${message.solapi_group_id || '없음'}`);
  console.log(`   수신자 수: ${message.recipient_numbers?.length || 0}명`);
  console.log(`   발송일: ${message.sent_at || '없음'}\n`);

  // 2. 그룹 ID 업데이트
  const groupIdsArray = groupIds.split(',').map(g => g.trim()).filter(Boolean);
  const groupIdsString = groupIdsArray.join(',');

  console.log(`📝 그룹 ID 업데이트:`);
  console.log(`   이전: ${message.solapi_group_id || '없음'}`);
  console.log(`   이후: ${groupIdsString}`);
  console.log(`   그룹 수: ${groupIdsArray.length}개\n`);

  const { error: updateError } = await supabase
    .from('channel_sms')
    .update({
      solapi_group_id: groupIdsString,
      updated_at: new Date().toISOString()
    })
    .eq('id', messageId);

  if (updateError) {
    console.error(`❌ 그룹 ID 업데이트 실패: ${updateError.message}`);
    process.exit(1);
  }

  console.log(`✅ 그룹 ID 업데이트 완료!\n`);
  console.log(`📋 업데이트된 그룹 IDs:`);
  groupIdsArray.forEach((groupId, idx) => {
    console.log(`   ${idx + 1}. ${groupId}`);
  });
  console.log(`\n💡 SMS 리스트에서 확인하세요: /admin/sms-list\n`);
}

// 명령줄 인자 파싱
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ 사용법: node scripts/fix-missing-group-ids.js <messageId> <groupIds>');
  console.error('   예시: node scripts/fix-missing-group-ids.js 96 "G4V20251120112333JFB0WGSIYOSRIL7,G4V20251120112334ABCDEFGHIJKLMNOP"');
  process.exit(1);
}

const messageId = parseInt(args[0]);
const groupIds = args[1];

if (isNaN(messageId)) {
  console.error('❌ 메시지 ID는 숫자여야 합니다.');
  process.exit(1);
}

fixMissingGroupIds(messageId, groupIds)
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });

