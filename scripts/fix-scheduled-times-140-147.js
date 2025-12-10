/**
 * 메시지 140-147번의 예약 시간 수정 스크립트
 * 
 * 한국 시간 12월 4일 오후 1시부터 30분 간격으로 수정
 * 
 * 사용법:
 * node scripts/fix-scheduled-times-140-147.js
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

// 한국 시간 기준으로 오후 1시부터 30분 간격 시간 생성
function getScheduledTimes(startHour = 13, intervalMinutes = 30, batchCount = 8) {
  const times = [];
  // 한국 시간 2025년 12월 4일로 설정
  const targetDate = new Date('2025-12-04T00:00:00+09:00'); // 한국 시간 기준
  
  for (let i = 0; i < batchCount; i++) {
    const scheduledTime = new Date(targetDate);
    scheduledTime.setHours(startHour + Math.floor((intervalMinutes * i) / 60), (intervalMinutes * i) % 60, 0, 0);
    
    // UTC로 변환 (한국 시간은 UTC+9이므로 9시간 빼기)
    const utcTime = new Date(scheduledTime.getTime() - 9 * 60 * 60 * 1000);
    times.push(utcTime.toISOString());
  }
  
  return times;
}

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

async function fixScheduledTimes() {
  console.log('='.repeat(80));
  console.log('⏰ 메시지 140-147번 예약 시간 수정');
  console.log('='.repeat(80));
  console.log('');

  const messageIds = [140, 141, 142, 143, 144, 145, 146, 147];
  const scheduledTimes = getScheduledTimes(13, 30, 8);

  console.log('📅 수정할 예약 시간 (한국 시간):\n');
  scheduledTimes.forEach((time, idx) => {
    const kstTime = utcToKST(time);
    const kstFormatted = formatKST(kstTime);
    console.log(`   배치 ${idx + 1} (메시지 ID ${messageIds[idx]}): ${kstFormatted}`);
  });
  console.log('');

  // 메시지 조회
  const { data: messages, error: fetchError } = await supabase
    .from('channel_sms')
    .select('id, scheduled_at, recipient_numbers')
    .in('id', messageIds)
    .order('id', { ascending: true });

  if (fetchError) {
    console.error('❌ 메시지 조회 오류:', fetchError);
    process.exit(1);
  }

  if (messages.length !== messageIds.length) {
    console.error(`❌ 메시지를 모두 찾을 수 없습니다. (찾은 메시지: ${messages.length}개)`);
    process.exit(1);
  }

  // 각 메시지 업데이트
  const results = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const newScheduledAt = scheduledTimes[i];
    const messageId = messageIds[i];

    console.log(`\n📝 메시지 ${messageId} 수정 중...`);
    
    const oldKST = message.scheduled_at ? formatKST(utcToKST(message.scheduled_at)) : '없음';
    const newKST = formatKST(utcToKST(newScheduledAt));
    
    console.log(`   이전 시간: ${oldKST}`);
    console.log(`   새 시간: ${newKST}`);

    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        scheduled_at: newScheduledAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (updateError) {
      console.error(`   ❌ 업데이트 실패:`, updateError.message);
      results.push({ id: messageId, success: false, error: updateError.message });
    } else {
      console.log(`   ✅ 업데이트 완료!`);
      results.push({ id: messageId, success: true, newTime: newKST });
    }
  }

  // 결과 요약
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 수정 결과 요약');
  console.log('='.repeat(80));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`\n✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개\n`);

  results.forEach(result => {
    if (result.success) {
      console.log(`   메시지 ${result.id}: ✅ ${result.newTime}`);
    } else {
      console.log(`   메시지 ${result.id}: ❌ ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`✅ 총 ${successCount}개 메시지의 예약 시간이 수정되었습니다.`);
  console.log('\n📅 최종 예약 발송 일정 (한국 시간):');
  scheduledTimes.forEach((time, idx) => {
    const kstTime = utcToKST(time);
    const kstFormatted = formatKST(kstTime);
    console.log(`   배치 ${idx + 1} (메시지 ID ${messageIds[idx]}): ${kstFormatted}`);
  });
  console.log('='.repeat(80));
}

fixScheduledTimes().catch(console.error);









