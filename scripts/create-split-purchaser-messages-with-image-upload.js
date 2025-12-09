/**
 * 구매자 1514명을 200명씩 분할하여 이미지 업로드 가능한 초안 메시지 생성
 * 
 * 사용법:
 * node scripts/create-split-purchaser-messages-with-image-upload.js
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
const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';

// 간략한 메시지 내용 (기존 메시지와 중복되지 않도록)
const MESSAGE_TEXT = `[MASGOO BLACK] 고객님, 특별 제안!

비거리 +20m 달성
나노레벨 카본 + 티타늄 샤프트

→ https://www.masgolf.co.kr/products/weapon-beryl
상담: 080-028-8888`;

// 전화번호 형식 변환 (하이픈 추가)
function formatPhoneNumber(phone) {
  const cleaned = String(phone).replace(/[-\s]/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return cleaned;
}

// 메인 함수
async function createSplitDrafts() {
  console.log('='.repeat(80));
  console.log('📊 구매자 1514명 분할 메시지 생성 스크립트');
  console.log('='.repeat(80));
  console.log('');

  // 1. 129번 메시지 조회
  console.log('📨 1단계: 129번 메시지 조회');
  console.log('-'.repeat(80));
  
  const { data: message129, error: msg129Error } = await supabase
    .from('channel_sms')
    .select('id, message_text, message_type, status, recipient_numbers, calendar_id, note')
    .eq('id', 129)
    .single();

  if (msg129Error || !message129) {
    console.error('❌ 129번 메시지를 찾을 수 없습니다:', msg129Error?.message);
    process.exit(1);
  }

  console.log(`✅ 129번 메시지 발견:`);
  console.log(`   - 상태: ${message129.status}`);
  console.log(`   - 타입: ${message129.message_type || 'N/A'}`);
  console.log(`   - 메모: ${message129.note || '없음'}`);

  // 2. 수신자 추출
  const allRecipients = message129.recipient_numbers || [];
  
  if (allRecipients.length === 0) {
    console.error('❌ 수신자 목록이 비어있습니다.');
    process.exit(1);
  }

  console.log(`   - 수신자 수: ${allRecipients.length}명\n`);

  // 3. 수신자 분할 (200명씩)
  console.log('📋 2단계: 수신자 분할 계획');
  console.log('-'.repeat(80));
  
  const batchSize = 200;
  const batches = Math.ceil(allRecipients.length / batchSize);
  
  console.log(`   전체 수신자: ${allRecipients.length}명`);
  console.log(`   배치 크기: ${batchSize}명`);
  console.log(`   총 배치 수: ${batches}개\n`);

  const recipientBatches = [];
  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, allRecipients.length);
    recipientBatches.push(allRecipients.slice(start, end));
  }

  recipientBatches.forEach((batch, idx) => {
    console.log(`   배치 ${idx + 1}: ${batch.length}명`);
  });
  console.log('');

  // 4. 각 배치별로 초안 생성 (이미지 없이)
  console.log('💾 3단계: 분할 메시지 초안 생성 (이미지 업로드 준비)');
  console.log('-'.repeat(80));

  const createdDrafts = [];

  for (let i = 0; i < recipientBatches.length; i++) {
    const batch = recipientBatches[i];
    const note = `구매자 1514명 분할 (${i + 1}/${batches} 배치)`;

    console.log(`\n📝 배치 ${i + 1}/${batches} 초안 생성 중...`);
    console.log(`   수신자: ${batch.length}명`);
    console.log(`   메모: ${note}`);
    console.log(`   이미지: 없음 (편집 페이지에서 업로드 가능)`);

    // 하이픈 형식으로 변환
    const formattedRecipients = batch.map(formatPhoneNumber);

    try {
      // API 호출 (이미지 없이 MMS 타입으로 생성 - 나중에 이미지 업로드 가능)
      const response = await fetch(`${LOCAL_URL}/api/admin/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: MESSAGE_TEXT,
          type: 'MMS', // MMS 타입으로 생성 (이미지 업로드 가능)
          status: 'draft',
          calendar_id: message129.calendar_id || null,
          recipientNumbers: formattedRecipients,
          imageUrl: null, // 이미지 없이 생성 (나중에 업로드)
          note: note
          // scheduledAt 없음 - 수동으로 예약 설정
        })
      });

      const result = await response.json();

      if (result.success) {
        const draftId = result.smsContent?.id || result.smsId;
        createdDrafts.push({
          batch: i + 1,
          id: draftId,
          recipients: batch.length,
          note: note
        });
        
        console.log(`   ✅ 초안 생성 완료! (ID: ${draftId})`);
        console.log(`   📝 편집 페이지: ${LOCAL_URL}/admin/sms?id=${draftId}`);
      } else {
        console.error(`   ❌ 초안 생성 실패: ${result.message}`);
        console.error(`   응답:`, JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error(`   ❌ API 호출 오류:`, error.message);
    }
  }

  // 5. 결과 요약
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 생성 결과 요약');
  console.log('='.repeat(80));
  
  createdDrafts.forEach(draft => {
    console.log(`\n배치 ${draft.batch}:`);
    console.log(`  ID: ${draft.id}`);
    console.log(`  수신자: ${draft.recipients}명`);
    console.log(`  메모: ${draft.note}`);
    console.log(`  편집 페이지: ${LOCAL_URL}/admin/sms?id=${draft.id}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`✅ 총 ${createdDrafts.length}개의 초안이 생성되었습니다.`);
  console.log('\n💡 다음 단계:');
  console.log(`   1. 각 초안의 SMS 편집 페이지에서 이미지 업로드`);
  console.log(`   2. 메시지 내용 확인 및 수정 (필요시)`);
  console.log(`   3. 예약 발송 시간 설정 (필요시)`);
  console.log(`   4. 발송 버튼 클릭하여 발송`);
  console.log('='.repeat(80));
}

createSplitDrafts().catch(console.error);



