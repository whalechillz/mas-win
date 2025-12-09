/**
 * 152-155번 메시지의 이미지 상태 확인
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

async function checkMessages152155() {
  try {
    console.log('🔍 152-155번 메시지 이미지 상태 확인\n');
    console.log('='.repeat(100));

    const { data: messages, error } = await supabase
      .from('channel_sms')
      .select('*')
      .in('id', [152, 153, 154, 155])
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ 메시지 조회 오류:', error);
      return;
    }

    if (!messages || messages.length === 0) {
      console.error('❌ 메시지를 찾을 수 없습니다.');
      return;
    }

    const needsImage = [];

    messages.forEach((msg) => {
      console.log(`\n📋 메시지 ID: ${msg.id}`);
      console.log(`   상태: ${msg.status}`);
      console.log(`   타입: ${msg.message_type}`);
      console.log(`   수신자 수: ${msg.recipient_numbers?.length || 0}명`);
      
      // 이미지 URL 분석
      if (msg.image_url) {
        const isHttpUrl = /^https?:\/\//i.test(msg.image_url);
        const isSolapiId = /^[A-Z0-9]+$/i.test(msg.image_url) && msg.image_url.length > 10;
        
        console.log(`   이미지 URL/ID: ${msg.image_url.substring(0, 80)}${msg.image_url.length > 80 ? '...' : ''}`);
        
        if (isHttpUrl) {
          console.log(`   ⚠️ 이미지 타입: HTTP URL (Supabase) - 재업로드 필요`);
          needsImage.push({ id: msg.id, issue: 'HTTP URL - 재업로드 필요' });
        } else if (isSolapiId) {
          console.log(`   ✅ 이미지 타입: Solapi imageId - 준비 완료`);
        } else {
          console.log(`   ❓ 이미지 타입: 알 수 없음`);
          needsImage.push({ id: msg.id, issue: '알 수 없는 형식' });
        }
      } else {
        console.log(`   ❌ 이미지: 없음 - 업로드 필요`);
        needsImage.push({ id: msg.id, issue: '이미지 없음' });
      }
    });

    console.log('\n' + '='.repeat(100));
    console.log('\n📊 분석 결과:');
    
    const readyCount = messages.length - needsImage.length;
    console.log(`   ✅ 준비 완료: ${readyCount}개`);
    console.log(`   ⚠️ 이미지 필요: ${needsImage.length}개`);
    
    if (needsImage.length > 0) {
      console.log('\n⚠️ 이미지 업로드가 필요한 메시지:');
      needsImage.forEach(item => {
        console.log(`   - 메시지 ID ${item.id}: ${item.issue}`);
      });
      console.log('\n💡 해결 방법:');
      console.log('   1. 각 메시지를 편집 페이지에서 열기');
      console.log('   2. 이미지 업로드 (Solapi imageId가 자동으로 저장됨)');
      console.log('   3. 저장 후 발송');
    } else {
      console.log('\n✅ 모든 메시지에 이미지가 준비되어 있습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkMessages152155();


