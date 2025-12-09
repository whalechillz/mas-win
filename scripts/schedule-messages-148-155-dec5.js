/**
 * 148-155번 메시지 12월 5일 예약 발송 설정
 * 
 * - 148, 149, 150, 151: 오전 10시부터 30분 단위 (10:00, 10:30, 11:00, 11:30)
 * - 152, 153, 154, 155: 오후 1시부터 30분 단위 (13:00, 13:30, 14:00, 14:30)
 * 
 * ⚠️ 주의: 이미지가 없거나 HTTP URL인 경우 발송 시 실패할 수 있습니다.
 *          예약 전에 모든 메시지에 Solapi imageId가 저장된 이미지를 업로드해주세요.
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

// 한국 시간 기준으로 예약 시간 생성 (12월 5일)
function getScheduledTime(hour, minute) {
  // 한국 시간 2025년 12월 5일로 명시적으로 설정
  // 한국 시간을 UTC로 변환: 한국 시간 - 9시간 = UTC
  // 예: 2025-12-05 10:00 KST = 2025-12-05 01:00 UTC
  // 예: 2025-12-05 13:00 KST = 2025-12-05 04:00 UTC
  
  const kstYear = 2025;
  const kstMonth = 11; // JavaScript month는 0부터 시작 (12월 = 11)
  const kstDay = 5;
  
  // UTC 시간 계산: 한국 시간에서 9시간 빼기
  let utcHour = hour - 9;
  let utcDay = kstDay;
  let utcMonth = kstMonth;
  let utcYear = kstYear;
  
  // UTC 시간이 음수가 되면 전날로 이동
  if (utcHour < 0) {
    utcHour += 24;
    utcDay -= 1;
    // 전달로 이동하는 경우 처리
    if (utcDay < 1) {
      utcMonth -= 1;
      if (utcMonth < 0) {
        utcMonth = 11;
        utcYear -= 1;
      }
      // 해당 월의 마지막 날짜 계산
      utcDay = new Date(utcYear, utcMonth + 1, 0).getDate();
    }
  }
  
  // UTC로 Date 객체 생성
  const utcDate = new Date(Date.UTC(utcYear, utcMonth, utcDay, utcHour, minute, 0, 0));
  
  return utcDate.toISOString();
}

// 예약 시간 매핑
const schedulePlan = [
  // 오전 그룹 (10:00부터 30분 간격)
  { id: 148, hour: 10, minute: 0 },   // 10:00
  { id: 149, hour: 10, minute: 30 }, // 10:30
  { id: 150, hour: 11, minute: 0 },  // 11:00
  { id: 151, hour: 11, minute: 30 }, // 11:30
  
  // 오후 그룹 (13:00부터 30분 간격)
  { id: 152, hour: 13, minute: 0 },  // 13:00
  { id: 153, hour: 13, minute: 30 }, // 13:30
  { id: 154, hour: 14, minute: 0 },  // 14:00
  { id: 155, hour: 14, minute: 30 }, // 14:30
];

async function scheduleMessages() {
  console.log('='.repeat(100));
  console.log('📅 148-155번 메시지 12월 5일 예약 발송 설정');
  console.log('='.repeat(100));
  console.log('');

  // 1. 메시지 존재 확인
  console.log('📋 1단계: 메시지 확인');
  console.log('-'.repeat(100));
  
  const messageIds = schedulePlan.map(p => p.id);
  const { data: messages, error: fetchError } = await supabase
    .from('channel_sms')
    .select('id, status, message_type, recipient_numbers, image_url, note')
    .in('id', messageIds)
    .order('id', { ascending: true });

  if (fetchError) {
    console.error('❌ 메시지 조회 오류:', fetchError);
    process.exit(1);
  }

  if (!messages || messages.length !== 8) {
    console.error(`❌ 메시지를 모두 찾을 수 없습니다. (발견: ${messages?.length || 0}/8)`);
    const foundIds = messages?.map(m => m.id) || [];
    const missingIds = messageIds.filter(id => !foundIds.includes(id));
    console.error(`   누락된 메시지 ID: ${missingIds.join(', ')}`);
    process.exit(1);
  }

  console.log(`✅ 모든 메시지 발견 (${messages.length}개)\n`);

  // 2. 이미지 상태 확인 및 경고
  console.log('🖼️ 2단계: 이미지 상태 확인');
  console.log('-'.repeat(100));
  
  const imageIssues = [];
  messages.forEach(msg => {
    if (!msg.image_url) {
      imageIssues.push({ id: msg.id, issue: '이미지 없음' });
    } else {
      const isHttpUrl = /^https?:\/\//i.test(msg.image_url);
      const isSolapiId = /^[A-Z0-9]+$/i.test(msg.image_url) && msg.image_url.length > 10;
      
      if (isHttpUrl) {
        imageIssues.push({ id: msg.id, issue: 'HTTP URL (재업로드 필요)', imageUrl: msg.image_url });
      } else if (!isSolapiId) {
        imageIssues.push({ id: msg.id, issue: '알 수 없는 이미지 형식', imageUrl: msg.image_url });
      }
    }
  });

  if (imageIssues.length > 0) {
    console.log('⚠️ 이미지 문제가 있는 메시지:');
    imageIssues.forEach(issue => {
      console.log(`   - 메시지 ID ${issue.id}: ${issue.issue}`);
    });
    console.log('\n⚠️ 경고: 이미지 문제가 있는 메시지는 발송 시 Solapi 1023 오류로 실패할 수 있습니다.');
    console.log('   하지만 예약은 설정하겠습니다. 발송 전에 이미지를 업로드해주세요.\n');
  } else {
    console.log('✅ 모든 메시지의 이미지가 정상입니다 (Solapi imageId)\n');
  }

  // 3. 예약 시간 설정
  console.log('⏰ 3단계: 예약 시간 설정');
  console.log('-'.repeat(100));
  
  const updateResults = [];
  
  for (const plan of schedulePlan) {
    const message = messages.find(m => m.id === plan.id);
    if (!message) {
      console.error(`❌ 메시지 ID ${plan.id}를 찾을 수 없습니다.`);
      continue;
    }

    const scheduledAt = getScheduledTime(plan.hour, plan.minute);
    const kstTime = new Date(new Date(scheduledAt).getTime() + 9 * 60 * 60 * 1000);
    
    console.log(`\n📨 메시지 ID ${plan.id}:`);
    console.log(`   한국 시간: ${kstTime.toLocaleString('ko-KR', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul'
    })}`);
    console.log(`   UTC 시간: ${scheduledAt}`);
    console.log(`   수신자 수: ${message.recipient_numbers?.length || 0}명`);

    // 상태를 draft로 변경하고 예약 시간 설정
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        status: 'draft',
        scheduled_at: scheduledAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', plan.id);

    if (updateError) {
      console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
      updateResults.push({ id: plan.id, success: false, error: updateError.message });
    } else {
      console.log(`   ✅ 예약 시간 설정 완료`);
      updateResults.push({ id: plan.id, success: true });
    }
  }

  // 4. 결과 요약
  console.log('\n' + '='.repeat(100));
  console.log('\n📊 설정 결과 요약:');
  console.log('-'.repeat(100));
  
  const successCount = updateResults.filter(r => r.success).length;
  const failCount = updateResults.filter(r => !r.success).length;
  
  console.log(`   ✅ 성공: ${successCount}개`);
  if (failCount > 0) {
    console.log(`   ❌ 실패: ${failCount}개`);
    updateResults.filter(r => !r.success).forEach(r => {
      console.log(`      - 메시지 ID ${r.id}: ${r.error}`);
    });
  }

  // 5. 예약 시간 검증
  console.log('\n🔍 예약 시간 검증:');
  console.log('-'.repeat(100));
  
  const { data: scheduledMessages, error: verifyError } = await supabase
    .from('channel_sms')
    .select('id, scheduled_at')
    .in('id', messageIds)
    .not('scheduled_at', 'is', null)
    .order('scheduled_at', { ascending: true });

  if (verifyError) {
    console.error('❌ 검증 중 오류:', verifyError);
  } else {
    console.log(`✅ 예약된 메시지: ${scheduledMessages.length}개\n`);
    scheduledMessages.forEach(msg => {
      const kstTime = new Date(new Date(msg.scheduled_at).getTime() + 9 * 60 * 60 * 1000);
      const plan = schedulePlan.find(p => p.id === msg.id);
      console.log(`   메시지 ID ${msg.id}: ${kstTime.toLocaleString('ko-KR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Seoul'
      })} (${plan ? `${plan.hour}:${String(plan.minute).padStart(2, '0')}` : 'N/A'})`);
    });
  }

  console.log('\n' + '='.repeat(100));
  console.log('\n✅ 예약 발송 설정 완료!');
  console.log('\n📌 다음 단계:');
  console.log('   1. Vercel Cron Job이 매 분 실행되어 예약 시간이 되면 자동 발송됩니다.');
  console.log('   2. 예약 시간 확인: /api/admin/send-scheduled-sms 로그 확인');
  console.log('   3. 발송 결과 확인: SMS 관리 페이지에서 확인');
  
  if (imageIssues.length > 0) {
    console.log('\n⚠️ 중요: 이미지 문제가 있는 메시지는 발송 전에 이미지를 업로드해주세요!');
    console.log('   - 각 메시지를 편집 페이지에서 열어 이미지를 새로 업로드');
    console.log('   - 이미지 업로드 후 저장하면 Solapi imageId가 자동으로 저장됩니다');
  }
}

scheduleMessages();

