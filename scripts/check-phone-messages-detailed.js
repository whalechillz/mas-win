/**
 * 전화번호로 받은 메시지 상세 확인 스크립트 (다양한 형식 확인)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전화번호 정규화 함수
function normalizePhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[\-\s\(\)]/g, '');
  if (cleaned.startsWith('010')) {
    return cleaned;
  }
  if (cleaned.startsWith('82')) {
    return '0' + cleaned.slice(2);
  }
  if (cleaned.length === 10) {
    return '010' + cleaned;
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned;
  }
  return null;
}

// 전화번호 포맷팅 함수
function formatPhone(phone) {
  if (!phone || phone.length !== 11) return phone;
  if (phone.startsWith('010')) {
    return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  }
  return phone;
}

async function checkMessagesDetailed(phoneNumber) {
  console.log(`🔍 전화번호 ${phoneNumber}로 받은 메시지 상세 확인 중...\n`);

  const normalizedPhone = normalizePhone(phoneNumber);
  if (!normalizedPhone) {
    console.error('❌ 잘못된 전화번호 형식입니다.');
    return;
  }

  const formattedPhone = formatPhone(normalizedPhone);
  const phoneVariants = [
    normalizedPhone,
    formattedPhone,
    phoneNumber,
    phoneNumber.replace(/[\-\s]/g, ''),
    phoneNumber.replace(/-/g, ''),
  ].filter((v, i, arr) => arr.indexOf(v) === i); // 중복 제거

  console.log(`📞 확인할 전화번호 형식: ${phoneVariants.join(', ')}\n`);

  try {
    // 1. message_logs에서 조회 (다양한 형식)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣ message_logs 테이블 조회');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const phoneConditions = phoneVariants.map(p => `customer_phone.eq.${p}`).join(',');
    const { data: logs, error: logsError, count } = await supabase
      .from('message_logs')
      .select('*', { count: 'exact' })
      .or(phoneConditions)
      .order('sent_at', { ascending: false })
      .limit(100);

    if (logsError) {
      console.error('❌ message_logs 조회 오류:', logsError);
    } else {
      console.log(`📊 message_logs: ${count || 0}개 발견\n`);
      if (logs && logs.length > 0) {
        logs.slice(0, 5).forEach((log, i) => {
          console.log(`  [${i + 1}] ID: ${log.id}, content_id: ${log.content_id}, sent_at: ${log.sent_at}, status: ${log.status}`);
        });
      }
    }

    // 2. channel_sms에서 recipient_numbers에 포함된 경우 조회
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣ channel_sms 테이블 조회 (recipient_numbers 포함)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let matchingSms = [];
    const { data: smsList, error: smsError } = await supabase
      .from('channel_sms')
      .select('id, message_text, message_type, status, sent_at, recipient_numbers, created_at, note')
      .order('sent_at', { ascending: false })
      .limit(1000);

    if (smsError) {
      console.error('❌ channel_sms 조회 오류:', smsError);
    } else {
      matchingSms = (smsList || []).filter(sms => {
        if (!sms.recipient_numbers || !Array.isArray(sms.recipient_numbers)) return false;
        return sms.recipient_numbers.some(num => {
          const cleanNum = normalizePhone(num);
          if (!cleanNum) return false;
          // 정확한 매칭만 허용 (부분 매칭 제거)
          return phoneVariants.some(variant => {
            const cleanVariant = normalizePhone(variant);
            if (!cleanVariant) return false;
            return cleanNum === cleanVariant;
          });
        });
      });

      console.log(`📊 channel_sms: ${matchingSms.length}개 발견\n`);
      if (matchingSms.length > 0) {
        matchingSms.slice(0, 10).forEach((sms, i) => {
          console.log(`  [${i + 1}] ID: ${sms.id}`);
          console.log(`      발송 시간: ${sms.sent_at ? new Date(sms.sent_at).toLocaleString('ko-KR') : sms.created_at ? new Date(sms.created_at).toLocaleString('ko-KR') : '(없음)'}`);
          console.log(`      메시지 타입: ${sms.message_type || '(없음)'}`);
          console.log(`      상태: ${sms.status || '(없음)'}`);
          if (sms.message_text) {
            const text = sms.message_text.length > 80 ? sms.message_text.substring(0, 80) + '...' : sms.message_text;
            console.log(`      내용: ${text}`);
          }
          if (sms.note) {
            console.log(`      메모: ${sms.note}`);
          }
          console.log('');
        });
      }
    }

    // 3. 최종 요약
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 최종 요약');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`message_logs: ${count || 0}개`);
    console.log(`channel_sms (recipient_numbers 포함): ${matchingSms.length}개`);

    if ((count || 0) === 0 && matchingSms.length === 0) {
      console.log('\n⚠️  해당 전화번호로 발송된 메시지를 찾을 수 없습니다.');
      console.log('   - message_logs 테이블에 기록이 없거나');
      console.log('   - channel_sms의 recipient_numbers에 포함되지 않았을 수 있습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 실행
const phoneNumber = process.argv[2] || '010-4106-0273';
checkMessagesDetailed(phoneNumber);

