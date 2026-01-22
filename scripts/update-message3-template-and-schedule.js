/**
 * 메시지 3 (477, 478, 479, 480, 481, 482) 템플릿 수정 및 예약 발송 스크립트
 * 
 * 1. 템플릿 수정: 불릿 포인트(•) → 하이픈(-)
 * 2. 예약 설정: 1월 22일(목) 오전 10시부터 10분 간격
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * 한국 시간(KST)을 UTC ISO 문자열로 변환
 */
function kstToUTC(dateStr) {
  const [datePart, timePart] = dateStr.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  
  const kstDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second || 0));
  const utcDate = new Date(kstDate.getTime() - 9 * 60 * 60 * 1000);
  
  return utcDate.toISOString();
}

async function updateTemplateAndSchedule() {
  console.log('🚀 메시지 3 템플릿 수정 및 예약 발송 설정 시작\n');
  console.log('='.repeat(60));

  const messageIds = [477, 478, 479, 480, 481, 482];
  const baseDate = '2026-01-22';
  const baseHour = 10;
  const intervalMinutes = 10;

  try {
    // 1. 현재 메시지 템플릿 확인
    console.log('📋 메시지 확인 중...\n');
    const { data: messages, error: checkError } = await supabase
      .from('channel_sms')
      .select('id, status, message_text, recipient_numbers')
      .in('id', messageIds)
      .order('id', { ascending: true });

    if (checkError) {
      console.error('❌ 메시지 조회 실패:', checkError);
      process.exit(1);
    }

    if (!messages || messages.length === 0) {
      console.error('❌ 메시지를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log(`✅ ${messages.length}개 메시지 확인 완료\n`);

    // 2. 템플릿 수정 및 예약 설정
    const results = [];

    for (let i = 0; i < messageIds.length; i++) {
      const messageId = messageIds[i];
      const message = messages.find(m => m.id === messageId);
      
      if (!message) {
        console.log(`⚠️  메시지 #${messageId}를 찾을 수 없습니다. 건너뜁니다.\n`);
        continue;
      }

      console.log(`📝 메시지 #${messageId} 처리 중...`);
      console.log(`   현재 상태: ${message.status}`);
      console.log(`   수신자: ${message.recipient_numbers?.length || 0}명`);

      // 템플릿 수정: • → -
      let updatedText = message.message_text || '';
      const originalText = updatedText;
      
      // [특별 혜택] 섹션의 불릿 포인트를 하이픈으로 변경
      updatedText = updatedText.replace(/\[특별 혜택\]\n•/g, '[특별 혜택]\n-');
      updatedText = updatedText.replace(/\n• /g, '\n- ');
      
      const textChanged = updatedText !== originalText;
      
      if (textChanged) {
        console.log(`   ✅ 템플릿 수정: 불릿 포인트(•) → 하이픈(-)`);
      } else {
        console.log(`   ℹ️  템플릿 변경 없음 (이미 수정되었거나 패턴이 다름)`);
      }

      // 예약 시간 계산
      const minutes = i * intervalMinutes;
      const hour = baseHour + Math.floor(minutes / 60);
      const minute = minutes % 60;
      const kstTime = `${baseDate} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
      const scheduledAtUTC = kstToUTC(kstTime);

      console.log(`   📅 예약 시간: ${kstTime} (KST)`);
      console.log(`   UTC 시간: ${scheduledAtUTC}`);

      // 업데이트
      const updateData = {
        scheduled_at: scheduledAtUTC,
        updated_at: new Date().toISOString()
      };
      
      if (textChanged) {
        updateData.message_text = updatedText;
      }

      const { data: updated, error: updateError } = await supabase
        .from('channel_sms')
        .update(updateData)
        .eq('id', messageId)
        .select()
        .single();

      if (updateError) {
        console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
        results.push({ messageId, success: false, error: updateError.message });
      } else {
        console.log(`   ✅ 업데이트 완료`);
        results.push({ 
          messageId, 
          success: true, 
          scheduledAt: scheduledAtUTC,
          kstTime: kstTime,
          textUpdated: textChanged
        });
      }
      console.log('');
    }

    // 3. 최종 요약
    console.log('='.repeat(60));
    console.log('📊 최종 요약');
    console.log('='.repeat(60));
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const textUpdatedCount = results.filter(r => r.success && r.textUpdated).length;

    console.log(`\n✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`📝 템플릿 수정: ${textUpdatedCount}개`);
    
    console.log(`\n📅 예약 일정:`);
    results.forEach(result => {
      if (result.success) {
        const textStatus = result.textUpdated ? ' (템플릿 수정됨)' : '';
        console.log(`   메시지 #${result.messageId}: ${result.kstTime} (KST)${textStatus}`);
      } else {
        console.log(`   메시지 #${result.messageId}: ❌ 실패 - ${result.error}`);
      }
    });

    console.log(`\n💡 예약 발송은 자동으로 실행됩니다.`);
    console.log(`   - 예약 시간이 되면 자동으로 발송됩니다.`);
    console.log(`   - 예약 시간 전까지는 '초안' 상태로 유지됩니다.`);
    console.log(`   - SMS/MMS 관리 페이지에서 예약 시간을 확인할 수 있습니다.\n`);

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

updateTemplateAndSchedule()
  .then(() => {
    console.log('✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
