/**
 * 나머지 메시지에 이미지 및 MMS 타입 업데이트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateRemainingMessages() {
  console.log('='.repeat(100));
  console.log('🔄 나머지 메시지에 이미지 및 MMS 타입 업데이트');
  console.log('='.repeat(100));
  console.log('');

  const imageId = 'ST01FZ251215022939395w6sR1vmZC52'; // Solapi imageId
  const messageIds = [229, 230, 231, 232, 233, 234, 235, 236, 237, 238];

  console.log(`📋 업데이트 대상: ${messageIds.length}개 메시지`);
  console.log(`📋 Solapi imageId: ${imageId}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const messageId of messageIds) {
    const { error } = await supabase
      .from('channel_sms')
      .update({
        image_url: imageId,
        message_type: 'MMS',
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) {
      console.error(`❌ 메시지 ${messageId} 업데이트 실패:`, error.message);
      failCount++;
    } else {
      console.log(`✅ 메시지 ${messageId} 업데이트 완료`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('✅ 완료!');
  console.log('='.repeat(100));
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${failCount}개\n`);
}

updateRemainingMessages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });

