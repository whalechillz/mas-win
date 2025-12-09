/**
 * 155번 메시지에 imageId 직접 업데이트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMessage155ImageId() {
  try {
    console.log('🔧 155번 메시지 imageId 업데이트\n');
    console.log('='.repeat(100));

    const imageId = 'ST01FZ251205023727584Iv58wbTRn6F';

    // DB 업데이트
    console.log('💾 DB 업데이트 중...');
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        image_url: imageId,
        message_type: 'MMS',
        updated_at: new Date().toISOString()
      })
      .eq('id', 155);

    if (updateError) {
      console.error(`❌ DB 업데이트 실패: ${updateError.message}`);
      return;
    }

    console.log('✅ DB 업데이트 완료!');
    console.log(`   - image_url: ${imageId}`);
    console.log(`   - message_type: MMS`);
    console.log('\n✅ 155번 메시지 이미지 복구 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

updateMessage155ImageId();

