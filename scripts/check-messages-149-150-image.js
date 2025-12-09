/**
 * 149, 150번 메시지의 이미지 저장 상태 확인
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

async function checkMessages149150() {
  try {
    console.log('🔍 149, 150번 메시지 이미지 저장 상태 확인\n');
    console.log('='.repeat(100));

    const { data: messages, error } = await supabase
      .from('channel_sms')
      .select('*')
      .in('id', [149, 150])
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ 메시지 조회 오류:', error);
      return;
    }

    if (!messages || messages.length === 0) {
      console.error('❌ 메시지를 찾을 수 없습니다.');
      return;
    }

    messages.forEach((msg) => {
      console.log(`\n📋 메시지 ID: ${msg.id}`);
      console.log(`   상태: ${msg.status}`);
      console.log(`   타입: ${msg.message_type}`);
      console.log(`   수신자 수: ${msg.recipient_numbers?.length || 0}명`);
      console.log(`   발송일: ${msg.sent_at || '(없음)'}`);
      console.log(`   솔라피 그룹 ID: ${msg.solapi_group_id || '(없음)'}`);
      
      // 이미지 URL 분석
      if (msg.image_url) {
        const isHttpUrl = /^https?:\/\//i.test(msg.image_url);
        const isSolapiId = /^[A-Z0-9]+$/i.test(msg.image_url) && msg.image_url.length > 10;
        
        console.log(`   이미지 URL/ID: ${msg.image_url.substring(0, 100)}${msg.image_url.length > 100 ? '...' : ''}`);
        
        if (isHttpUrl) {
          console.log(`   ⚠️ 이미지 타입: HTTP URL (Supabase)`);
        } else if (isSolapiId) {
          console.log(`   ✅ 이미지 타입: Solapi imageId`);
        } else {
          console.log(`   ❓ 이미지 타입: 알 수 없음`);
        }
      } else {
        console.log(`   ❌ 이미지: 없음 (DB에 저장되지 않음)`);
      }
      
      // 업데이트 시간 확인
      console.log(`   생성일: ${msg.created_at}`);
      console.log(`   수정일: ${msg.updated_at}`);
    });

    console.log('\n' + '='.repeat(100));
    console.log('\n📊 분석 결과:');
    
    const hasImage = messages.filter(m => m.image_url).length;
    const noImage = messages.filter(m => !m.image_url).length;
    
    console.log(`   이미지 있음: ${hasImage}개`);
    console.log(`   이미지 없음: ${noImage}개`);
    
    if (noImage > 0) {
      console.log('\n⚠️ 문제: 일부 메시지에 이미지가 DB에 저장되지 않았습니다.');
      console.log('   원인: 발송 시 이미지가 DB에 저장되지 않았을 가능성');
      console.log('   해결: 코드 수정 후 재발송 또는 수동으로 이미지 업로드 필요');
    } else {
      console.log('\n✅ 모든 메시지에 이미지가 저장되어 있습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkMessages149150();



