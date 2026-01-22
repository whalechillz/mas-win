/**
 * 메시지 1 초안 예약 발송 설정 스크립트
 * 
 * 초안 453: 오전 11시 30분
 * 초안 454: 오전 11시 40분
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

async function scheduleDrafts() {
  console.log('='.repeat(80));
  console.log('⏰ 메시지 1 초안 예약 발송 설정');
  console.log('='.repeat(80));
  console.log('');

  // 오늘 날짜 기준으로 예약 시간 설정
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  // 예약 시간 설정
  const schedules = [
    {
      id: 453,
      time: '11:30',
      description: '오전 11시 30분'
    },
    {
      id: 454,
      time: '11:40',
      description: '오전 11시 40분'
    }
  ];

  try {
    for (const schedule of schedules) {
      console.log(`📅 초안 ID ${schedule.id} 예약 설정 중...`);
      console.log(`   예약 시간: ${schedule.description} (${schedule.time})`);

      // 예약 시간을 ISO 형식으로 변환 (한국 시간 기준)
      const [hours, minutes] = schedule.time.split(':');
      
      // 한국 시간대(Asia/Seoul, UTC+9)로 날짜 생성
      // ISO 형식: YYYY-MM-DDTHH:mm:ss+09:00
      const kstDateString = `${year}-${month}-${day}T${hours}:${minutes}:00+09:00`;
      const scheduledDate = new Date(kstDateString);
      
      // UTC로 변환 (toISOString()이 자동으로 UTC로 변환)
      const scheduledAtISO = scheduledDate.toISOString();

      console.log(`   로컬 시간: ${scheduledDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
      console.log(`   UTC 시간: ${scheduledAtISO}`);

      // 초안 정보 확인
      const { data: draft, error: checkError } = await supabase
        .from('channel_sms')
        .select('id, message_text, recipient_numbers, status')
        .eq('id', schedule.id)
        .single();

      if (checkError || !draft) {
        console.error(`   ❌ 초안 조회 실패:`, checkError);
        continue;
      }

      console.log(`   현재 상태: ${draft.status}`);
      console.log(`   수신자 수: ${draft.recipient_numbers?.length || 0}명`);

      // 예약 시간 업데이트
      const { data: updated, error: updateError } = await supabase
        .from('channel_sms')
        .update({
          scheduled_at: scheduledAtISO,
          updated_at: new Date().toISOString()
        })
        .eq('id', schedule.id)
        .select()
        .single();

      if (updateError) {
        console.error(`   ❌ 예약 설정 실패:`, updateError);
        continue;
      }

      console.log(`   ✅ 예약 설정 완료!`);
      console.log(`   예약 시간: ${updated.scheduled_at}`);
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('✅ 예약 발송 설정 완료!');
    console.log('');
    console.log('📌 예약 일정:');
    console.log('   - 초안 453: 오전 11시 30분');
    console.log('   - 초안 454: 오전 11시 40분');
    console.log('');
    console.log('⚠️  참고:');
    console.log('   - 예약 발송은 시스템에서 자동으로 처리됩니다');
    console.log('   - 예약 시간이 되면 자동으로 발송됩니다');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  scheduleDrafts()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { scheduleDrafts };
