/**
 * 155번 메시지 상태 확인
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

async function checkMessage155() {
  try {
    console.log('🔍 155번 메시지 상태 확인\n');
    console.log('='.repeat(100));

    // 메시지 정보 확인
    const { data: message, error } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 155)
      .single();

    if (error) {
      console.error('❌ 메시지 조회 오류:', error);
      return;
    }

    if (!message) {
      console.error('❌ 155번 메시지를 찾을 수 없습니다.');
      return;
    }

    console.log('📋 메시지 정보:');
    console.log(`   ID: ${message.id}`);
    console.log(`   상태: ${message.status}`);
    console.log(`   타입: ${message.message_type}`);
    console.log(`   솔라피 그룹 ID: ${message.solapi_group_id || '(없음)'}`);
    console.log(`   수신자 수: ${message.recipient_numbers?.length || 0}명`);
    console.log('');

    // 이미지 URL 분석
    if (message.image_url) {
      const isHttpUrl = /^https?:\/\//i.test(message.image_url);
      const isSolapiId = /^ST01FZ[A-Z0-9a-z]{20,}$/i.test(message.image_url);
      
      console.log('🖼️ 이미지 정보:');
      console.log(`   image_url: ${message.image_url.substring(0, 80)}${message.image_url.length > 80 ? '...' : ''}`);
      
      if (isHttpUrl) {
        console.log('   ⚠️ 타입: HTTP URL (Supabase) - 재업로드 필요');
      } else if (isSolapiId) {
        console.log('   ✅ 타입: Solapi imageId - 준비 완료!');
      } else {
        console.log('   ❓ 타입: 알 수 없음');
      }
    } else {
      console.log('🖼️ 이미지 정보:');
      console.log('   ❌ 이미지 없음');
    }

    console.log('\n' + '='.repeat(100));
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkMessage155();

