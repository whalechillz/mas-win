/**
 * 메시지 254, 255, 257, 259번에 전화 문구 추가
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 추가할 전화 문구
const PHONE_SECTION = `

☆ 참여하기:
https://www.masgolf.co.kr/survey

☆ 전화 상담만 해도 특별 선물!
080-028-8888 (무료)`;

async function updateMessages() {
  console.log('='.repeat(100));
  console.log('📝 메시지 254, 255, 257, 259번에 전화 문구 추가');
  console.log('='.repeat(100));
  console.log('');

  const messageIds = [254, 255, 257, 259];

  // 1. 현재 메시지 내용 조회
  console.log('📋 현재 메시지 내용 조회 중...\n');
  const { data: messages, error: fetchError } = await supabase
    .from('channel_sms')
    .select('id, message_text')
    .in('id', messageIds)
    .order('id', { ascending: true });

  if (fetchError) {
    console.error('❌ 메시지 조회 실패:', fetchError.message);
    return;
  }

  if (!messages || messages.length === 0) {
    console.log('⚠️  해당 메시지를 찾을 수 없습니다.');
    return;
  }

  console.log(`✅ 발견된 메시지: ${messages.length}개\n`);

  // 2. 각 메시지 업데이트
  let successCount = 0;
  let failCount = 0;

  for (const msg of messages) {
    console.log(`📝 메시지 ID ${msg.id} 업데이트 중...`);

    // 이미 전화 문구가 있는지 확인
    if (msg.message_text && msg.message_text.includes('080-028-8888')) {
      console.log(`   ⚠️  이미 전화 문구가 포함되어 있습니다. 건너뜀.`);
      continue;
    }

    // 기존 메시지에 전화 문구 추가
    const updatedText = msg.message_text + PHONE_SECTION;

    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        message_text: updatedText,
        updated_at: new Date().toISOString()
      })
      .eq('id', msg.id);

    if (updateError) {
      console.error(`   ❌ 업데이트 실패:`, updateError.message);
      failCount++;
    } else {
      console.log(`   ✅ 업데이트 완료`);
      console.log(`   📄 변경된 내용 (처음 100자): ${updatedText.substring(0, 100)}...`);
      successCount++;
    }
    console.log('');
  }

  // 3. 결과 요약
  console.log('='.repeat(100));
  console.log('✅ 완료!');
  console.log('='.repeat(100));
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${failCount}개`);
  console.log(`건너뜀: ${messages.length - successCount - failCount}개\n`);

  // 4. 최종 확인
  console.log('🔍 최종 확인 중...\n');
  const { data: finalMessages } = await supabase
    .from('channel_sms')
    .select('id, message_text')
    .in('id', messageIds)
    .order('id', { ascending: true });

  if (finalMessages) {
    finalMessages.forEach(msg => {
      const hasPhone = msg.message_text && msg.message_text.includes('080-028-8888');
      const hasSurvey = msg.message_text && msg.message_text.includes('masgolf.co.kr/survey');
      console.log(`ID ${msg.id}: 전화문구=${hasPhone ? '✅' : '❌'} | 설문링크=${hasSurvey ? '✅' : '❌'}`);
    });
  }
  console.log('\n✅ 모든 작업 완료!');
}

updateMessages()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });

