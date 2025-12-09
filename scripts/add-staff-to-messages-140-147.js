/**
 * 메시지 140-147번에 스탭진 번호 추가 스크립트
 * 
 * 사용법:
 * node scripts/add-staff-to-messages-140-147.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 스탭진 전화번호
const STAFF_NUMBERS = [
  '010-6669-9000',
  '010-5704-0013'
];

// 전화번호 정규화
function normalizePhone(phone) {
  return String(phone).replace(/[-\s]/g, '');
}

// 전화번호 포맷팅
function formatPhone(phone) {
  const cleaned = normalizePhone(phone);
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

async function addStaffToMessages() {
  console.log('='.repeat(80));
  console.log('📱 메시지 140-147번에 스탭진 번호 추가');
  console.log('='.repeat(80));
  console.log('');

  const messageIds = [140, 141, 142, 143, 144, 145, 146, 147];
  const results = [];

  for (const messageId of messageIds) {
    console.log(`\n📨 메시지 ${messageId} 처리 중...`);

    // 메시지 조회
    const { data: message, error: fetchError } = await supabase
      .from('channel_sms')
      .select('id, recipient_numbers')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      console.error(`   ❌ 메시지 ${messageId}를 찾을 수 없습니다:`, fetchError?.message);
      results.push({ id: messageId, success: false, error: fetchError?.message });
      continue;
    }

    // 현재 수신자 목록
    const currentRecipients = message.recipient_numbers || [];
    console.log(`   현재 수신자: ${currentRecipients.length}명`);

    // 스탭진 번호 추가 (중복 제거)
    const normalizedStaffNumbers = STAFF_NUMBERS.map(normalizePhone);
    const normalizedCurrent = currentRecipients.map(normalizePhone);
    
    const newRecipients = [...currentRecipients];
    let addedCount = 0;

    STAFF_NUMBERS.forEach(staffNumber => {
      const normalized = normalizePhone(staffNumber);
      if (!normalizedCurrent.includes(normalized)) {
        newRecipients.push(staffNumber);
        addedCount++;
      }
    });

    if (addedCount === 0) {
      console.log(`   ✅ 스탭진 번호가 이미 포함되어 있습니다.`);
      results.push({ id: messageId, success: true, added: 0, total: newRecipients.length });
      continue;
    }

    console.log(`   추가할 스탭진 번호: ${addedCount}개`);
    console.log(`   총 수신자: ${currentRecipients.length}명 → ${newRecipients.length}명`);

    // 메시지 업데이트
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        recipient_numbers: newRecipients,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (updateError) {
      console.error(`   ❌ 업데이트 실패:`, updateError.message);
      results.push({ id: messageId, success: false, error: updateError.message });
    } else {
      console.log(`   ✅ 스탭진 번호 추가 완료!`);
      results.push({ 
        id: messageId, 
        success: true, 
        added: addedCount, 
        total: newRecipients.length 
      });
    }
  }

  // 결과 요약
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 처리 결과 요약');
  console.log('='.repeat(80));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const totalAdded = results.reduce((sum, r) => sum + (r.added || 0), 0);

  console.log(`\n✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`➕ 추가된 스탭진 번호: ${totalAdded}개\n`);

  results.forEach(result => {
    if (result.success) {
      console.log(`   메시지 ${result.id}: ${result.added || 0}개 추가 (총 ${result.total}명)`);
    } else {
      console.log(`   메시지 ${result.id}: ❌ 실패 - ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`✅ 총 ${successCount}개 메시지에 스탭진 번호가 추가되었습니다.`);
  console.log('='.repeat(80));
}

addStaffToMessages().catch(console.error);




