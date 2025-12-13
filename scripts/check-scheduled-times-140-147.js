/**
 * 메시지 140-147번의 예약 시간 확인 스크립트
 * 
 * 사용법:
 * node scripts/check-scheduled-times-140-147.js
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

// UTC를 한국 시간으로 변환
function utcToKST(utcString) {
  const utcDate = new Date(utcString);
  const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
  return kstDate;
}

// 한국 시간 포맷팅
function formatKST(date) {
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul'
  });
}

async function checkScheduledTimes() {
  console.log('='.repeat(80));
  console.log('⏰ 메시지 140-147번 예약 시간 확인');
  console.log('='.repeat(80));
  console.log('');

  const messageIds = [140, 141, 142, 143, 144, 145, 146, 147];
  const expectedKSTTimes = [
    '2025-12-04 13:00:00', // 배치 1
    '2025-12-04 13:30:00', // 배치 2
    '2025-12-04 14:00:00', // 배치 3
    '2025-12-04 14:30:00', // 배치 4
    '2025-12-04 15:00:00', // 배치 5
    '2025-12-04 15:30:00', // 배치 6
    '2025-12-04 16:00:00', // 배치 7
    '2025-12-04 16:30:00', // 배치 8
  ];

  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('id, scheduled_at, recipient_numbers, status, note')
    .in('id', messageIds)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ 메시지 조회 오류:', error);
    process.exit(1);
  }

  console.log('📊 예약 시간 확인 결과:\n');
  console.log('배치 | 메시지 ID | 수신자 | 예약 시간 (UTC) | 예약 시간 (KST) | 예상 시간 (KST) | 상태');
  console.log('-'.repeat(100));

  let allCorrect = true;

  messages.forEach((msg, idx) => {
    const batchNum = idx + 1;
    const expectedKST = expectedKSTTimes[idx];
    
    if (!msg.scheduled_at) {
      console.log(`${batchNum.toString().padStart(2)} | ${msg.id.toString().padStart(3)} | ${(msg.recipient_numbers?.length || 0).toString().padStart(3)}명 | ❌ 없음 | ❌ 없음 | ${expectedKST} | ${msg.status}`);
      allCorrect = false;
      return;
    }

    const utcTime = new Date(msg.scheduled_at);
    const kstTime = utcToKST(msg.scheduled_at);
    const kstFormatted = formatKST(kstTime);
    const kstTimeOnly = kstFormatted.split(' ')[1]; // 시간 부분만 추출
    
    // 예상 시간과 비교 (초 제외)
    const expectedTimeOnly = expectedKST.split(' ')[1];
    const isCorrect = kstTimeOnly.startsWith(expectedTimeOnly.substring(0, 5)); // 시:분만 비교
    
    const statusIcon = isCorrect ? '✅' : '❌';
    
    console.log(
      `${batchNum.toString().padStart(2)} | ${msg.id.toString().padStart(3)} | ${(msg.recipient_numbers?.length || 0).toString().padStart(3)}명 | ${utcTime.toISOString().substring(0, 19).replace('T', ' ')} | ${kstTimeOnly} | ${expectedTimeOnly} | ${statusIcon} ${msg.status}`
    );

    if (!isCorrect) {
      allCorrect = false;
    }
  });

  console.log('\n' + '='.repeat(80));
  
  if (allCorrect) {
    console.log('✅ 모든 예약 시간이 정확하게 설정되었습니다!');
    console.log('\n📅 예약 발송 일정:');
    messages.forEach((msg, idx) => {
      if (msg.scheduled_at) {
        const kstTime = utcToKST(msg.scheduled_at);
        const kstFormatted = formatKST(kstTime);
        console.log(`   배치 ${idx + 1} (메시지 ID ${msg.id}): ${kstFormatted} - ${msg.recipient_numbers?.length || 0}명`);
      }
    });
  } else {
    console.log('❌ 일부 예약 시간이 올바르지 않습니다. 확인이 필요합니다.');
  }
  
  console.log('\n💡 참고:');
  console.log('   - UTC 시간은 데이터베이스에 저장된 시간입니다.');
  console.log('   - KST (한국 시간) = UTC + 9시간');
  console.log('   - 예약 발송은 한국 시간 기준으로 작동합니다.');
  console.log('='.repeat(80));
}

checkScheduledTimes().catch(console.error);












