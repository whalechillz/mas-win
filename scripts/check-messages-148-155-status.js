/**
 * 148-155번 메시지 상태 및 이미지 확인
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

async function checkMessages148to155() {
  try {
    console.log('🔍 148-155번 메시지 상태 확인 중...\n');

    const messageIds = [148, 149, 150, 151, 152, 153, 154, 155];
    
    const { data: messages, error } = await supabase
      .from('channel_sms')
      .select('*')
      .in('id', messageIds)
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ 메시지 조회 오류:', error);
      return;
    }

    if (!messages || messages.length === 0) {
      console.error('❌ 메시지를 찾을 수 없습니다.');
      return;
    }

    console.log(`📊 총 ${messages.length}개 메시지 발견\n`);
    console.log('='.repeat(100));

    const imageIssues = [];
    const readyMessages = [];

    messages.forEach((msg, idx) => {
      console.log(`\n📋 메시지 ID: ${msg.id}`);
      console.log(`   상태: ${msg.status}`);
      console.log(`   타입: ${msg.message_type}`);
      console.log(`   수신자 수: ${msg.recipient_numbers?.length || 0}명`);
      console.log(`   예약 시간: ${msg.scheduled_at || '(없음)'}`);
      console.log(`   메모: ${msg.note || '(없음)'}`);

      // 이미지 URL 분석
      if (msg.image_url) {
        const isHttpUrl = /^https?:\/\//i.test(msg.image_url);
        const isSolapiId = /^[A-Z0-9]+$/i.test(msg.image_url) && msg.image_url.length > 10;
        
        console.log(`   이미지 URL/ID: ${msg.image_url.substring(0, 80)}${msg.image_url.length > 80 ? '...' : ''}`);
        
        if (isHttpUrl) {
          console.log(`   ⚠️ 이미지 타입: HTTP URL (Supabase) - 발송 시 재업로드 필요`);
          imageIssues.push({
            id: msg.id,
            issue: 'HTTP URL - 재업로드 필요',
            imageUrl: msg.image_url
          });
        } else if (isSolapiId) {
          console.log(`   ✅ 이미지 타입: Solapi imageId - 바로 사용 가능`);
          readyMessages.push(msg.id);
        } else {
          console.log(`   ❓ 이미지 타입: 알 수 없음`);
          imageIssues.push({
            id: msg.id,
            issue: '알 수 없는 이미지 형식',
            imageUrl: msg.image_url
          });
        }
      } else {
        console.log(`   ⚠️ 이미지: 없음`);
        imageIssues.push({
          id: msg.id,
          issue: '이미지 없음',
          imageUrl: null
        });
      }
    });

    console.log('\n' + '='.repeat(100));
    console.log('\n📌 요약:');
    console.log(`   ✅ 준비 완료 (Solapi imageId): ${readyMessages.length}개 - ${readyMessages.join(', ')}`);
    console.log(`   ⚠️ 이미지 문제: ${imageIssues.length}개`);
    
    if (imageIssues.length > 0) {
      console.log('\n⚠️ 이미지 문제가 있는 메시지:');
      imageIssues.forEach(issue => {
        console.log(`   - 메시지 ID ${issue.id}: ${issue.issue}`);
      });
      console.log('\n💡 해결 방법:');
      console.log('   1. 각 메시지를 편집 페이지에서 열기');
      console.log('   2. 기존 이미지 삭제 후 새로 업로드');
      console.log('   3. 저장 후 예약 시간 설정');
    } else {
      console.log('\n✅ 모든 메시지의 이미지가 정상입니다!');
    }

    return { imageIssues, readyMessages, messages };

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    return null;
  }
}

checkMessages148to155();












