/**
 * 고객 메시지 이력 API 테스트
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

async function testCustomerMessages(phoneNumber) {
  console.log(`🔍 전화번호 ${phoneNumber} 메시지 이력 확인 중...\n`);

  // 1. 직접 message_logs 조회
  const normalizedPhone = phoneNumber.replace(/[^0-9]/g, '');
  const formattedPhone = normalizedPhone.length === 11 
    ? `${normalizedPhone.slice(0, 3)}-${normalizedPhone.slice(3, 7)}-${normalizedPhone.slice(7)}`
    : phoneNumber;

  console.log(`📞 정규화된 전화번호: ${normalizedPhone}`);
  console.log(`📞 포맷된 전화번호: ${formattedPhone}\n`);

  const { data: logs, error: logsError, count } = await supabase
    .from('message_logs')
    .select('*', { count: 'exact' })
    .or(`customer_phone.eq.${normalizedPhone},customer_phone.eq.${formattedPhone}`)
    .order('sent_at', { ascending: false });

  if (logsError) {
    console.error('❌ message_logs 조회 오류:', logsError);
    return;
  }

  console.log(`📊 message_logs 결과: ${count || 0}건\n`);

  if (logs && logs.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 message_logs 상세:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logs.forEach((log, i) => {
      console.log(`\n[${i + 1}]`);
      console.log(`  ID: ${log.id}`);
      console.log(`  content_id: ${log.content_id}`);
      console.log(`  customer_phone: ${log.customer_phone}`);
      console.log(`  sent_at: ${log.sent_at}`);
      console.log(`  status: ${log.status}`);
      console.log(`  message_type: ${log.message_type}`);
    });
  } else {
    console.log('⚠️  message_logs에 기록이 없습니다.\n');
  }

  // 2. API 엔드포인트 테스트
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 API 엔드포인트 테스트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const apiUrl = `http://localhost:3000/api/admin/customers/${encodeURIComponent(phoneNumber)}/messages`;
  console.log(`API URL: ${apiUrl}\n`);

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    console.log(`응답 상태: ${response.status}`);
    console.log(`응답 데이터:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ API 호출 오류:', error.message);
    console.log('\n💡 서버가 실행 중인지 확인하세요: npm run dev');
  }

  // 3. 모든 전화번호 형식으로 확인
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 모든 전화번호 형식으로 확인');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const phoneVariants = [
    normalizedPhone,
    formattedPhone,
    phoneNumber,
    phoneNumber.replace(/[\-\s]/g, ''),
    phoneNumber.replace(/-/g, ''),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  for (const variant of phoneVariants) {
    const { data: variantLogs, count: variantCount } = await supabase
      .from('message_logs')
      .select('*', { count: 'exact' })
      .eq('customer_phone', variant);

    if (variantCount > 0) {
      console.log(`✅ "${variant}": ${variantCount}건 발견`);
      variantLogs?.forEach(log => {
        console.log(`   - content_id: ${log.content_id}, sent_at: ${log.sent_at}`);
      });
    } else {
      console.log(`❌ "${variant}": 0건`);
    }
  }
}

const phoneNumber = process.argv[2] || '01041060273';
testCustomerMessages(phoneNumber);

