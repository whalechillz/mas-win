/**
 * 전화번호로 받은 메시지 확인 스크립트
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

async function checkMessages(phoneNumber) {
  console.log(`🔍 전화번호 ${phoneNumber}로 받은 메시지 확인 중...\n`);

  const normalizedPhone = normalizePhone(phoneNumber);
  if (!normalizedPhone) {
    console.error('❌ 잘못된 전화번호 형식입니다.');
    return;
  }

  const formattedPhone = formatPhone(normalizedPhone);

  try {
    // message_logs에서 메시지 조회
    const { data: logs, error: logsError, count } = await supabase
      .from('message_logs')
      .select('id, content_id, customer_phone, sent_at, status, message_type', { count: 'exact' })
      .or(`customer_phone.eq.${normalizedPhone},customer_phone.eq.${formattedPhone}`)
      .order('sent_at', { ascending: false })
      .limit(100);

    if (logsError) {
      console.error('❌ message_logs 조회 오류:', logsError);
      return;
    }

    if (!logs || logs.length === 0) {
      console.log('📭 받은 메시지가 없습니다.\n');
      return;
    }

    console.log(`📊 총 ${count || logs.length}개의 메시지 발견\n`);

    // content_id 추출
    const messageIds = Array.from(
      new Set(
        logs
          .map((log) => {
            const parsed = Number(log.content_id);
            return Number.isNaN(parsed) ? null : parsed;
          })
          .filter((id) => id !== null)
      )
    );

    // channel_sms에서 상세 정보 조회
    let smsDetailsMap = new Map();
    if (messageIds.length > 0) {
      const { data: smsDetails, error: smsError } = await supabase
        .from('channel_sms')
        .select(
          'id, message_text, message_type, status, note, solapi_group_id, sent_at, success_count, fail_count, image_url, created_at'
        )
        .in('id', messageIds);

      if (smsError) {
        console.error('❌ channel_sms 조회 오류:', smsError);
      } else {
        smsDetailsMap = new Map((smsDetails || []).map((item) => [item.id, item]));
      }
    }

    // 메시지 정보 출력
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📨 받은 메시지 목록');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    logs.forEach((log, index) => {
      const contentIdNumber = Number(log.content_id);
      const detail = !Number.isNaN(contentIdNumber) ? smsDetailsMap.get(contentIdNumber) : null;

      console.log(`[${index + 1}] 메시지 ID: ${log.content_id || '(없음)'}`);
      console.log(`    발송 시간: ${log.sent_at ? new Date(log.sent_at).toLocaleString('ko-KR') : '(없음)'}`);
      console.log(`    메시지 타입: ${detail?.message_type || log.message_type || '(없음)'}`);
      console.log(`    발송 상태: ${log.status || '(없음)'}`);
      
      if (detail) {
        console.log(`    메시지 내용:`);
        const messageText = detail.message_text || '';
        if (messageText.length > 100) {
          console.log(`    ${messageText.substring(0, 100)}...`);
        } else {
          console.log(`    ${messageText}`);
        }
        
        if (detail.image_url) {
          console.log(`    이미지 URL: ${detail.image_url}`);
        }
        
        if (detail.note) {
          console.log(`    메모: ${detail.note}`);
        }
        
        if (detail.solapi_group_id) {
          console.log(`    솔라피 그룹 ID: ${detail.solapi_group_id}`);
        }
      }
      
      console.log('');
    });

    // 요약 정보
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 요약');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 메시지 수: ${logs.length}개`);
    
    const statusCounts = {};
    logs.forEach(log => {
      const status = log.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('발송 상태별:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}개`);
    });
    
    const typeCounts = {};
    logs.forEach(log => {
      const type = log.message_type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    console.log('메시지 타입별:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}개`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 실행
const phoneNumber = process.argv[2] || '010-4106-0273';
checkMessages(phoneNumber);


