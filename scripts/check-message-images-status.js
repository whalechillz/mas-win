/**
 * 메시지별 이미지 연결 상태 확인
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkMessageImages() {
  console.log('🔍 메시지별 이미지 연결 상태 확인\n');
  console.log('='.repeat(60));

  const messageGroups = {
    '메시지 1 (50km 이내)': [457, 459, 460],
    '메시지 2 (50km 이상)': [463, 464, 465],
    '메시지 3 (주소 없음)': [472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482]
  };

  const results = {
    message1: [],
    message2: [],
    message3: []
  };

  for (const [groupName, messageIds] of Object.entries(messageGroups)) {
    console.log(`\n📋 ${groupName}:`);
    console.log('-'.repeat(60));

    for (const messageId of messageIds) {
      const { data: message, error } = await supabase
        .from('channel_sms')
        .select('id, message_text, image_url, message_category, message_subcategory, status, sent_count')
        .eq('id', messageId)
        .single();

      if (error) {
        console.log(`   메시지 ${messageId}: ❌ 조회 실패 - ${error.message}`);
        continue;
      }

      if (!message) {
        console.log(`   메시지 ${messageId}: ❌ 존재하지 않음`);
        continue;
      }

      const hasImage = message.image_url && message.image_url.trim() !== '';
      const imageStatus = hasImage ? '✅ 이미지 연결됨' : '❌ 이미지 없음';
      const imageName = hasImage ? message.image_url.split('/').pop() : '-';

      console.log(`   메시지 ${messageId}: ${imageStatus}`);
      console.log(`      수신자: ${message.sent_count || 0}명`);
      console.log(`      상태: ${message.status}`);
      console.log(`      이미지: ${imageName}`);

      if (groupName.includes('메시지 1')) {
        results.message1.push({
          id: messageId,
          hasImage,
          imageUrl: message.image_url
        });
      } else if (groupName.includes('메시지 2')) {
        results.message2.push({
          id: messageId,
          hasImage,
          imageUrl: message.image_url
        });
      } else {
        results.message3.push({
          id: messageId,
          hasImage,
          imageUrl: message.image_url
        });
      }
    }
  }

  // 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 이미지 연결 상태 요약');
  console.log('='.repeat(60));

  const message1WithImage = results.message1.filter(m => m.hasImage).length;
  const message2WithImage = results.message2.filter(m => m.hasImage).length;
  const message3WithImage = results.message3.filter(m => m.hasImage).length;

  console.log(`\n메시지 1 (50km 이내): ${message1WithImage}/${results.message1.length}개 이미지 연결됨`);
  console.log(`메시지 2 (50km 이상): ${message2WithImage}/${results.message2.length}개 이미지 연결됨`);
  console.log(`메시지 3 (주소 없음): ${message3WithImage}/${results.message3.length}개 이미지 연결됨`);

  const totalWithImage = message1WithImage + message2WithImage + message3WithImage;
  const totalMessages = results.message1.length + results.message2.length + results.message3.length;

  console.log(`\n전체: ${totalWithImage}/${totalMessages}개 메시지에 이미지 연결됨`);

  if (totalWithImage < totalMessages) {
    console.log(`\n⚠️ ${totalMessages - totalWithImage}개 메시지에 이미지가 연결되지 않았습니다.`);
  } else {
    console.log(`\n✅ 모든 메시지에 이미지가 연결되었습니다!`);
  }

  return results;
}

checkMessageImages()
  .then(() => {
    console.log('\n✅ 확인 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
