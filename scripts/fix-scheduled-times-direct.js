/**
 * 메시지 140-147번의 예약 시간 직접 수정
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 한국 시간 12월 4일 오후 1시부터 30분 간격 (UTC로 변환)
// 한국 시간을 Date 객체로 생성한 후 UTC로 변환
const kstTimes = [
  '2025-12-04T13:00:00+09:00', // 오후 1시
  '2025-12-04T13:30:00+09:00', // 오후 1시 30분
  '2025-12-04T14:00:00+09:00', // 오후 2시
  '2025-12-04T14:30:00+09:00', // 오후 2시 30분
  '2025-12-04T15:00:00+09:00', // 오후 3시
  '2025-12-04T15:30:00+09:00', // 오후 3시 30분
  '2025-12-04T16:00:00+09:00', // 오후 4시
  '2025-12-04T16:30:00+09:00', // 오후 4시 30분
];

const scheduledTimes = kstTimes.map(kst => new Date(kst).toISOString());

const messageIds = [140, 141, 142, 143, 144, 145, 146, 147];

async function fixTimes() {
  console.log('예약 시간 수정 중...\n');
  
  for (let i = 0; i < messageIds.length; i++) {
    const msgId = messageIds[i];
    const scheduledAt = scheduledTimes[i];
    
    const { error } = await supabase
      .from('channel_sms')
      .update({ 
        scheduled_at: scheduledAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', msgId);
    
    if (error) {
      console.error(`메시지 ${msgId} 실패:`, error.message);
    } else {
      const kst = new Date(new Date(scheduledAt).getTime() + 9 * 60 * 60 * 1000);
      console.log(`✅ 메시지 ${msgId}: ${kst.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })}`);
    }
  }
  
  console.log('\n완료!');
}

fixTimes().catch(console.error);

