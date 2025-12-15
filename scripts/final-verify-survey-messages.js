/**
 * 최종 메시지 검증 및 요약
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

async function verifyMessages() {
  console.log('='.repeat(100));
  console.log('📊 설문 조사 메시지 최종 검증');
  console.log('='.repeat(100));
  console.log('');

  // 1. 전체 고객 수 확인
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('opt_out', false)
    .not('phone', 'is', null);

  const { count: purchasers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .not('last_purchase_date', 'is', null)
    .eq('opt_out', false)
    .not('phone', 'is', null);

  const { count: nonPurchasers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .is('last_purchase_date', null)
    .eq('opt_out', false)
    .not('phone', 'is', null);

  console.log('📋 고객 통계:');
  console.log(`   전체: ${totalCustomers}명`);
  console.log(`   구매자: ${purchasers}명`);
  console.log(`   비구매자: ${nonPurchasers}명`);
  console.log(`   합계: ${(purchasers || 0) + (nonPurchasers || 0)}명\n`);

  // 2. 생성된 메시지 확인
  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('id, message_type, status, note, recipient_numbers, image_url')
    .like('note', '%A/B/C 테스트%')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ 메시지 조회 실패:', error.message);
    process.exit(1);
  }

  console.log('='.repeat(100));
  console.log('📨 생성된 메시지 목록');
  console.log('='.repeat(100));
  console.log('');

  let totalRecipients = 0;
  let hasImage = 0;
  let draftCount = 0;
  const byType = { nonPurchaser: { A: 0, B: 0, C: 0 }, purchaser: { A: 0, B: 0, C: 0 } };

  messages.forEach(msg => {
    const count = msg.recipient_numbers?.length || 0;
    totalRecipients += count;
    const imgOk = msg.image_url && (msg.image_url.startsWith('ST01FZ') || msg.image_url.includes('supabase'));
    if (imgOk) hasImage++;
    if (msg.status === 'draft') draftCount++;

    // 타입별 집계
    const isPurchaser = msg.note.includes('구매자');
    const version = msg.note.includes('A(태국)') ? 'A' : msg.note.includes('B(베트남)') ? 'B' : 'C';
    if (isPurchaser) {
      byType.purchaser[version] += count;
    } else {
      byType.nonPurchaser[version] += count;
    }

    console.log(`ID ${msg.id}: ${count}명 - ${msg.note}`);
    console.log(`   이미지: ${imgOk ? '✅' : '❌'} | 상태: ${msg.status} | 타입: ${msg.message_type}`);
    console.log('');
  });

  console.log('='.repeat(100));
  console.log('📊 최종 통계');
  console.log('='.repeat(100));
  console.log(`총 메시지: ${messages.length}개`);
  console.log(`총 수신자: ${totalRecipients}명`);
  console.log(`이미지 연결: ${hasImage}/${messages.length}개`);
  console.log(`초안 상태: ${draftCount}개`);
  console.log('');
  console.log('📋 타입별 분포:');
  console.log(`   비구매자 A(태국): ${byType.nonPurchaser.A}명`);
  console.log(`   비구매자 B(베트남): ${byType.nonPurchaser.B}명`);
  console.log(`   비구매자 C(일본): ${byType.nonPurchaser.C}명`);
  console.log(`   구매자 A(태국): ${byType.purchaser.A}명`);
  console.log(`   구매자 B(베트남): ${byType.purchaser.B}명`);
  console.log(`   구매자 C(일본): ${byType.purchaser.C}명`);
  console.log('');
  console.log('='.repeat(100));

  // 3. 누락 확인
  const expectedTotal = (purchasers || 0) + (nonPurchasers || 0);
  const missing = expectedTotal - totalRecipients;
  
  if (missing > 0) {
    console.log(`⚠️ 누락된 고객: ${missing}명`);
  } else if (missing < 0) {
    console.log(`⚠️ 중복 포함 가능: ${Math.abs(missing)}명`);
  } else {
    console.log('✅ 모든 고객이 포함되었습니다!');
  }
  console.log('='.repeat(100));
  console.log('');
}

verifyMessages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });

