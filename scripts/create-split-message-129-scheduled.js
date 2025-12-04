/**
 * 129번 메시지 분할 및 예약 발송 스크립트
 * 
 * 1. 129번 메시지를 200명씩 8개 배치로 분할
 * 2. 각 배치를 오후 1시부터 30분 간격으로 예약 저장
 * 3. 최고 응답률 메시지의 이미지와 내용 사용
 * 
 * 사용법:
 * node scripts/create-split-message-129-scheduled.js
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

// 메시지 내용
const MESSAGE_TEXT = `[MASGOO BLACK] 고객님, 첫 구매 특별 혜택!

"마제스티보다 20m 더 멀리"

나노레벨 카본 + 40g 티타늄 4X 샤프트

☆ 합법적 극한 성능  ☆ AI 피팅  ☆ 2년 헤드보증

→ https://www.masgolf.co.kr/products/weapon-beryl

상담: 080-028-8888`;

// 이미지 URL (최고 응답률 메시지의 이미지)
const IMAGE_URL = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/mms/2025-11-28/128/mms-128-1764297325499.jpg';

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

// 한국 시간 기준으로 오후 1시부터 30분 간격 시간 생성
function getScheduledTimes(startHour = 13, intervalMinutes = 30, batchCount = 8) {
  const times = [];
  const today = new Date();
  
  for (let i = 0; i < batchCount; i++) {
    const scheduledTime = new Date(today);
    scheduledTime.setHours(startHour, intervalMinutes * i, 0, 0);
    
    // UTC로 변환 (한국 시간은 UTC+9)
    const utcTime = new Date(scheduledTime.getTime() - 9 * 60 * 60 * 1000);
    times.push(utcTime.toISOString());
  }
  
  return times;
}

// 메인 함수
async function createSplitScheduledDrafts() {
  console.log('='.repeat(80));
  console.log('📊 129번 메시지 분할 및 예약 발송 스크립트');
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

  // 4. 예약 시간 생성
  console.log('⏰ 3단계: 예약 발송 시간 설정');
  console.log('-'.repeat(80));
  
  const scheduledTimes = getScheduledTimes(13, 30, batches);
  
  scheduledTimes.forEach((time, idx) => {
    const kstTime = new Date(new Date(time).getTime() + 9 * 60 * 60 * 1000);
    console.log(`   배치 ${idx + 1}: ${kstTime.toLocaleString('ko-KR', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })} (${recipientBatches[idx].length}명)`);
  });
  console.log('');

  // 5. 각 배치별로 초안 생성
  console.log('💾 4단계: 분할 메시지 초안 생성');
  console.log('-'.repeat(80));

  const createdDrafts = [];

  for (let i = 0; i < recipientBatches.length; i++) {
    const batch = recipientBatches[i];
    const scheduledAt = scheduledTimes[i];
    const note = `구매자 1514명중 블랙 업그레이드 1차 (${i + 1}번 분할)`;

    console.log(`\n📝 배치 ${i + 1}/${batches} 초안 생성 중...`);
    console.log(`   수신자: ${batch.length}명`);
    console.log(`   예약 시간: ${new Date(new Date(scheduledAt).getTime() + 9 * 60 * 60 * 1000).toLocaleString('ko-KR')}`);
    console.log(`   메모: ${note}`);

    // 하이픈 형식으로 변환
    const formattedRecipients = batch.map(formatPhoneNumber);

    try {
      // API 호출
      const response = await fetch(`${LOCAL_URL}/api/admin/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: MESSAGE_TEXT,
          type: 'MMS',
          status: 'draft',
          calendar_id: message129.calendar_id || null,
          recipientNumbers: formattedRecipients,
          imageUrl: IMAGE_URL,
          note: note,
          scheduledAt: scheduledAt // 예약 발송 시간
        })
      });

      const result = await response.json();

      if (result.success) {
        const draftId = result.smsContent?.id || result.smsId;
        createdDrafts.push({
          batch: i + 1,
          id: draftId,
          recipients: batch.length,
          scheduledAt: scheduledAt,
          note: note
        });
        
        console.log(`   ✅ 초안 생성 완료! (ID: ${draftId})`);
      } else {
        console.error(`   ❌ 초안 생성 실패: ${result.message}`);
        console.error(`   응답:`, JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error(`   ❌ API 호출 오류:`, error.message);
    }
  }

  // 6. 결과 요약
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 생성 결과 요약');
  console.log('='.repeat(80));
  
  createdDrafts.forEach(draft => {
    const kstTime = new Date(new Date(draft.scheduledAt).getTime() + 9 * 60 * 60 * 1000);
    console.log(`\n배치 ${draft.batch}:`);
    console.log(`  ID: ${draft.id}`);
    console.log(`  수신자: ${draft.recipients}명`);
    console.log(`  예약 시간: ${kstTime.toLocaleString('ko-KR')}`);
    console.log(`  메모: ${draft.note}`);
    console.log(`  편집 페이지: ${LOCAL_URL}/admin/sms?id=${draft.id}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`✅ 총 ${createdDrafts.length}개의 예약 발송 초안이 생성되었습니다.`);
  console.log('\n💡 다음 단계:');
  console.log(`   1. 각 초안의 SMS 편집 페이지에서 내용 확인`);
  console.log(`   2. 예약 발송 확인 버튼 클릭하여 예약 활성화`);
  console.log(`   3. 예약 시간에 자동 발송됩니다`);
  console.log('='.repeat(80));
}

createSplitScheduledDrafts().catch(console.error);

