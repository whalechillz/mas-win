/**
 * 457번 메시지를 200명씩 3개로 분할하는 스크립트
 * 
 * 작업:
 * 1. 457번 메시지 조회
 * 2. 수신자를 200명씩 3개 그룹으로 분할
 * 3. 457번 메시지는 첫 200명만 유지
 * 4. 458번, 459번 메시지 생성 (각각 200명, 77명)
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

async function splitMessage457() {
  console.log('🚀 457번 메시지 분할 시작...\n');
  console.log('='.repeat(60));

  try {
    // 1. 457번 메시지 조회
    console.log('📋 1단계: 457번 메시지 조회');
    const { data: message457, error: getError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 457)
      .single();

    if (getError || !message457) {
      console.error('❌ 메시지 조회 실패:', getError?.message);
      process.exit(1);
    }

    console.log(`✅ 메시지 발견: ID=${message457.id}`);
    console.log(`   상태: ${message457.status || 'N/A'}`);
    console.log(`   수신자 수: ${message457.recipient_numbers?.length || 0}명`);
    console.log(`   이미지: ${message457.image_url ? '✅ 연결됨' : '❌ 없음'}\n`);

    // 2. 수신자 추출
    const allRecipients = message457.recipient_numbers || [];
    
    if (allRecipients.length === 0) {
      console.error('❌ 수신자 목록이 비어있습니다.');
      process.exit(1);
    }

    const totalRecipients = allRecipients.length;
    console.log(`📊 2단계: 수신자 분할 계획`);
    console.log(`   전체 수신자: ${totalRecipients}명`);
    console.log(`   분할 계획:`);
    console.log(`   - 메시지 457: 200명`);
    console.log(`   - 메시지 458: 200명`);
    console.log(`   - 메시지 459: ${totalRecipients - 400}명\n`);

    // 3. 수신자 분할
    const batch1 = allRecipients.slice(0, 200);
    const batch2 = allRecipients.slice(200, 400);
    const batch3 = allRecipients.slice(400);

    console.log(`✅ 수신자 분할 완료:`);
    console.log(`   배치 1: ${batch1.length}명`);
    console.log(`   배치 2: ${batch2.length}명`);
    console.log(`   배치 3: ${batch3.length}명\n`);

    // 4. 457번 메시지 업데이트 (첫 200명만 유지)
    console.log('📝 3단계: 457번 메시지 업데이트 (첫 200명만 유지)');
    const { data: updated457, error: update457Error } = await supabase
      .from('channel_sms')
      .update({
        recipient_numbers: batch1,
        sent_count: batch1.length,
        note: `${message457.note || ''} (200명씩 분할: 1/3)`.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', 457)
      .select()
      .single();

    if (update457Error) {
      console.error('❌ 457번 메시지 업데이트 실패:', update457Error.message);
      process.exit(1);
    }

    console.log(`✅ 457번 메시지 업데이트 완료 (${batch1.length}명)\n`);

    // 5. 458번 메시지 생성 (200명)
    console.log('📝 4단계: 458번 메시지 생성 (200명)');
    const message458 = {
      message_text: message457.message_text,
      message_type: message457.message_type || 'MMS',
      status: 'draft',
      recipient_numbers: batch2,
      sent_count: batch2.length,
      image_url: message457.image_url,
      message_category: message457.message_category,
      message_subcategory: message457.message_subcategory,
      note: `${message457.note || '타이타늄 샤프트 시타 - 이미지 보완 발송'} (200명씩 분할: 2/3)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: created458, error: create458Error } = await supabase
      .from('channel_sms')
      .insert(message458)
      .select()
      .single();

    if (create458Error) {
      console.error('❌ 458번 메시지 생성 실패:', create458Error.message);
      process.exit(1);
    }

    console.log(`✅ 458번 메시지 생성 완료 (ID: ${created458.id}, ${batch2.length}명)\n`);

    // 6. 459번 메시지 생성 (나머지)
    console.log('📝 5단계: 459번 메시지 생성 (나머지)');
    const message459 = {
      message_text: message457.message_text,
      message_type: message457.message_type || 'MMS',
      status: 'draft',
      recipient_numbers: batch3,
      sent_count: batch3.length,
      image_url: message457.image_url,
      message_category: message457.message_category,
      message_subcategory: message457.message_subcategory,
      note: `${message457.note || '타이타늄 샤프트 시타 - 이미지 보완 발송'} (200명씩 분할: 3/3)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: created459, error: create459Error } = await supabase
      .from('channel_sms')
      .insert(message459)
      .select()
      .single();

    if (create459Error) {
      console.error('❌ 459번 메시지 생성 실패:', create459Error.message);
      process.exit(1);
    }

    console.log(`✅ 459번 메시지 생성 완료 (ID: ${created459.id}, ${batch3.length}명)\n`);

    // 7. 최종 요약
    console.log('='.repeat(60));
    console.log('🎉 메시지 분할 완료!');
    console.log('='.repeat(60));
    console.log(`\n📋 분할 결과:`);
    console.log(`   메시지 457: ${batch1.length}명 (기존 메시지 업데이트)`);
    console.log(`   메시지 458: ${batch2.length}명 (새로 생성)`);
    console.log(`   메시지 459: ${batch3.length}명 (새로 생성)`);
    console.log(`   총 수신자: ${batch1.length + batch2.length + batch3.length}명\n`);

    console.log('💡 다음 단계:');
    console.log('   1. 관리자 페이지에서 확인:');
    console.log(`      - /admin/sms?id=457`);
    console.log(`      - /admin/sms?id=458`);
    console.log(`      - /admin/sms?id=459`);
    console.log('   2. 각 메시지별 이미지 확인');
    console.log('   3. 순차적으로 발송 실행\n');

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

splitMessage457()
  .then(() => {
    console.log('✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
