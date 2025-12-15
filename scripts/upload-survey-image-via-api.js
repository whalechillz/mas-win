/**
 * 설문 조사 이미지를 API를 통해 Solapi에 업로드하고 메시지에 연결
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOCAL_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadImageViaAPI() {
  console.log('='.repeat(100));
  console.log('🖼️ 설문 조사 이미지 Solapi 업로드 (API 사용)');
  console.log('='.repeat(100));
  console.log('');

  const imageUrl = 'https://masgolf.co.kr/main/products/goods/good-reviews/bucket-hat-muziik-8.webp';
  const messageIds = [227, 228, 229, 230, 231, 232];

  console.log(`📋 이미지 URL: ${imageUrl}`);
  console.log(`📋 대상 메시지: ${messageIds.join(', ')}\n`);

  // 1. 첫 번째 메시지에 대해 이미지 업로드 (reupload-image API 사용)
  console.log('📤 Solapi에 이미지 업로드 중...');
  try {
    const response = await fetch(`${LOCAL_URL}/api/solapi/reupload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: imageUrl,
        messageId: messageIds[0] // 첫 번째 메시지 ID 사용
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('❌ 이미지 업로드 실패:', result.message || '알 수 없는 오류');
      console.log('응답:', JSON.stringify(result, null, 2));
      process.exit(1);
    }

    const solapiImageId = result.imageId;
    console.log(`✅ Solapi 업로드 성공!`);
    console.log(`   imageId: ${solapiImageId}`);
    console.log(`   Supabase URL: ${result.supabaseUrl || '(없음)'}\n`);

    // 2. 모든 메시지에 imageId 업데이트
    console.log('💾 모든 메시지에 imageId 업데이트 중...');
    
    for (const messageId of messageIds) {
      const { error: updateError } = await supabase
        .from('channel_sms')
        .update({
          image_url: solapiImageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) {
        console.error(`   ❌ 메시지 ${messageId} 업데이트 실패:`, updateError.message);
      } else {
        console.log(`   ✅ 메시지 ${messageId} 업데이트 완료`);
      }
    }

    console.log('\n' + '='.repeat(100));
    console.log('✅ 완료!');
    console.log('='.repeat(100));
    console.log(`\n📋 Solapi imageId: ${solapiImageId}`);
    console.log('💡 이제 모든 메시지가 MMS 발송 준비가 되었습니다.\n');
    console.log('📋 생성된 메시지:');
    messageIds.forEach(id => {
      console.log(`   - ID ${id}: ${LOCAL_URL}/admin/sms?id=${id}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

uploadImageViaAPI()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });


