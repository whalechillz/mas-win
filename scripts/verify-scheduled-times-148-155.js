/**
 * 148-155번 메시지의 예약 시간 검증 (한국 시간 기준)
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

// 예상되는 예약 시간 (한국 시간 기준, 12월 5일)
const expectedSchedule = [
  { id: 148, hour: 10, minute: 0 },   // AM 10:00
  { id: 149, hour: 10, minute: 30 }, // AM 10:30
  { id: 150, hour: 11, minute: 0 },  // AM 11:00
  { id: 151, hour: 11, minute: 30 }, // AM 11:30
  { id: 152, hour: 13, minute: 0 },  // PM 1:00
  { id: 153, hour: 13, minute: 30 }, // PM 1:30
  { id: 154, hour: 14, minute: 0 },  // PM 2:00
  { id: 155, hour: 14, minute: 30 }, // PM 2:30
];

async function verifyScheduledTimes() {
  console.log('='.repeat(100));
  console.log('🔍 148-155번 메시지 예약 시간 검증 (한국 시간 기준)');
  console.log('='.repeat(100));
  console.log('');

  const messageIds = expectedSchedule.map(s => s.id);
  const { data: messages, error } = await supabase
    .from('channel_sms')
    .select('id, scheduled_at, recipient_numbers')
    .in('id', messageIds)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ 메시지 조회 오류:', error);
    return;
  }

  if (!messages || messages.length === 0) {
    console.error('❌ 메시지를 찾을 수 없습니다.');
    return;
  }

  console.log('📅 예약 발송 일정 (12월 5일)\n');
  console.log('오전 그룹:');
  
  let allCorrect = true;
  const issues = [];

  messages.forEach((msg) => {
    const expected = expectedSchedule.find(s => s.id === msg.id);
    if (!expected) return;

    if (!msg.scheduled_at) {
      console.log(`   ${msg.id}번: ❌ 예약 시간 없음`);
      allCorrect = false;
      issues.push({ id: msg.id, issue: '예약 시간 없음' });
      return;
    }

    // UTC를 한국 시간으로 변환
    const utcDate = new Date(msg.scheduled_at);
    const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
    
    const year = kstDate.getFullYear();
    const month = kstDate.getMonth() + 1;
    const day = kstDate.getDate();
    const hour = kstDate.getHours();
    const minute = kstDate.getMinutes();

    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = String(minute).padStart(2, '0');

    // 검증: 2025년 12월 5일, 정확한 시간
    const isCorrect = 
      year === 2025 &&
      month === 12 &&
      day === 5 &&
      hour === expected.hour &&
      minute === expected.minute;

    const status = isCorrect ? '✅' : '❌';
    const timeStr = `${ampm}${displayHour}:${displayMinute}`;
    const recipientCount = msg.recipient_numbers?.length || 0;

    if (msg.id <= 151) {
      console.log(`   ${msg.id}번: ${status} ${timeStr} (${recipientCount}명)`);
    } else {
      if (msg.id === 152) {
        console.log('\n오후 그룹:');
      }
      console.log(`   ${msg.id}번: ${status} ${timeStr} (${recipientCount}명)`);
    }

    if (!isCorrect) {
      allCorrect = false;
      console.log(`      ⚠️ 예상: ${expected.hour}:${String(expected.minute).padStart(2, '0')}, 실제: ${hour}:${String(minute).padStart(2, '0')}`);
      console.log(`      UTC 시간: ${utcDate.toISOString()}`);
      console.log(`      한국 시간: ${kstDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
      issues.push({
        id: msg.id,
        expected: `${expected.hour}:${String(expected.minute).padStart(2, '0')}`,
        actual: `${hour}:${String(minute).padStart(2, '0')}`,
        utc: utcDate.toISOString(),
        kst: kstDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
      });
    }
  });

  console.log('\n' + '='.repeat(100));
  console.log('\n📊 검증 결과:');
  
  if (allCorrect) {
    console.log('✅ 모든 예약 시간이 올바르게 설정되었습니다!');
    console.log('\n📌 예약 시간 요약:');
    console.log('   오전 그룹:');
    expectedSchedule.slice(0, 4).forEach(s => {
      const ampm = s.hour < 12 ? 'AM' : 'PM';
      const displayHour = s.hour === 0 ? 12 : s.hour > 12 ? s.hour - 12 : s.hour;
      console.log(`     ${s.id}번: ${ampm}${displayHour}:${String(s.minute).padStart(2, '0')}`);
    });
    console.log('   오후 그룹:');
    expectedSchedule.slice(4).forEach(s => {
      const ampm = s.hour < 12 ? 'AM' : 'PM';
      const displayHour = s.hour === 0 ? 12 : s.hour > 12 ? s.hour - 12 : s.hour;
      console.log(`     ${s.id}번: ${ampm}${displayHour}:${String(s.minute).padStart(2, '0')}`);
    });
  } else {
    console.log('⚠️ 일부 예약 시간이 올바르지 않습니다.');
    console.log(`   문제가 있는 메시지: ${issues.length}개`);
    issues.forEach(issue => {
      console.log(`\n   메시지 ID ${issue.id}:`);
      console.log(`      예상: 2025-12-05 ${issue.expected} (KST)`);
      console.log(`      실제: ${issue.kst}`);
      console.log(`      UTC: ${issue.utc}`);
    });
    console.log('\n💡 해결 방법:');
    console.log('   node scripts/schedule-messages-148-155-dec5.js 를 다시 실행하세요.');
  }
}

verifyScheduledTimes();












