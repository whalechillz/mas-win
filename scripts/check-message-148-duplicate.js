/**
 * 148번 메시지의 중복 집계 원인 확인
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

async function checkMessage148Duplicate() {
  try {
    console.log('🔍 148번 메시지 중복 집계 원인 확인\n');
    console.log('='.repeat(100));

    // 1. 메시지 기본 정보
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 148)
      .single();

    if (messageError || !message) {
      console.error('❌ 148번 메시지를 찾을 수 없습니다:', messageError);
      return;
    }

    console.log('📋 메시지 기본 정보:');
    console.log(`   ID: ${message.id}`);
    console.log(`   수신자 수: ${message.recipient_numbers?.length || 0}명`);
    console.log(`   솔라피 그룹 ID: ${message.solapi_group_id || '(없음)'}`);
    console.log(`   DB sent_count: ${message.sent_count || 0}건`);
    console.log(`   DB success_count: ${message.success_count || 0}건`);
    console.log(`   DB fail_count: ${message.fail_count || 0}건`);
    console.log('');

    // 2. 솔라피 그룹 ID 파싱
    let groupIds = [];
    if (message.solapi_group_id) {
      if (typeof message.solapi_group_id === 'string') {
        // 콤마로 구분된 경우
        if (message.solapi_group_id.includes(',')) {
          groupIds = message.solapi_group_id.split(',').map(g => g.trim());
        } else {
          groupIds = [message.solapi_group_id];
        }
      } else if (Array.isArray(message.solapi_group_id)) {
        groupIds = message.solapi_group_id;
      }
    }

    console.log(`📤 솔라피 그룹 ID (${groupIds.length}개):`);
    groupIds.forEach((groupId, idx) => {
      console.log(`   ${idx + 1}. ${groupId}`);
    });
    console.log('');

    // 3. message_logs 확인
    console.log('📊 message_logs 확인:');
    console.log('-'.repeat(100));

    const { data: logs, error: logsError } = await supabase
      .from('message_logs')
      .select('*')
      .eq('content_id', '148')
      .order('sent_at', { ascending: false });

    if (logsError) {
      console.error('❌ message_logs 조회 오류:', logsError);
    } else {
      console.log(`   총 로그 수: ${logs.length}건`);
      
      // 중복 확인
      const phoneCounts = {};
      logs.forEach(log => {
        const phone = log.customer_phone || log.recipient_number;
        if (phone) {
          phoneCounts[phone] = (phoneCounts[phone] || 0) + 1;
        }
      });

      const duplicates = Object.entries(phoneCounts).filter(([phone, count]) => count > 1);
      
      if (duplicates.length > 0) {
        console.log(`\n   ⚠️ 중복된 전화번호 발견: ${duplicates.length}개`);
        duplicates.slice(0, 10).forEach(([phone, count]) => {
          console.log(`      ${phone}: ${count}번 기록됨`);
        });
        if (duplicates.length > 10) {
          console.log(`      ... 외 ${duplicates.length - 10}개 더`);
        }
      } else {
        console.log(`   ✅ 중복된 전화번호 없음`);
      }

      // 상태별 집계
      const statusCounts = {};
      logs.forEach(log => {
        const status = log.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      console.log(`\n   상태별 집계:`);
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`      ${status}: ${count}건`);
      });
    }

    // 4. 수신자 번호와 로그 비교
    console.log('\n📋 수신자 번호 vs 로그 비교:');
    console.log('-'.repeat(100));

    const recipientNumbers = message.recipient_numbers || [];
    console.log(`   DB 수신자 수: ${recipientNumbers.length}명`);
    console.log(`   message_logs 수: ${logs?.length || 0}건`);
    console.log(`   비율: ${logs?.length ? (logs.length / recipientNumbers.length).toFixed(2) : 0}배`);

    if (logs && logs.length > 0) {
      const loggedPhones = new Set(logs.map(l => l.customer_phone || l.recipient_number).filter(Boolean));
      const recipientPhones = new Set(recipientNumbers.map(n => n.replace(/[\-\s]/g, '')));
      
      console.log(`   로그에 기록된 고유 전화번호: ${loggedPhones.size}개`);
      console.log(`   DB 수신자 고유 전화번호: ${recipientPhones.size}개`);

      // 로그에는 있지만 수신자 목록에는 없는 번호
      const extraInLogs = Array.from(loggedPhones).filter(phone => !recipientPhones.has(phone));
      if (extraInLogs.length > 0) {
        console.log(`\n   ⚠️ 로그에만 있는 번호: ${extraInLogs.length}개`);
        extraInLogs.slice(0, 5).forEach(phone => {
          console.log(`      ${phone}`);
        });
      }

      // 수신자 목록에는 있지만 로그에는 없는 번호
      const missingInLogs = Array.from(recipientPhones).filter(phone => !loggedPhones.has(phone));
      if (missingInLogs.length > 0) {
        console.log(`\n   ⚠️ 로그에 없는 번호: ${missingInLogs.length}개`);
        missingInLogs.slice(0, 5).forEach(phone => {
          console.log(`      ${phone}`);
        });
      }
    }

    // 5. 그룹별 집계 (만약 group_statuses가 있다면)
    if (message.group_statuses && Array.isArray(message.group_statuses)) {
      console.log('\n📊 그룹별 상태 (group_statuses):');
      console.log('-'.repeat(100));
      
      let totalFromGroups = 0;
      message.group_statuses.forEach((gs, idx) => {
        const total = gs.totalCount || 0;
        const success = gs.successCount || 0;
        const fail = gs.failCount || 0;
        totalFromGroups += total;
        console.log(`   그룹 ${idx + 1} (${gs.groupId?.substring(0, 20)}...):`);
        console.log(`      총: ${total}건, 성공: ${success}건, 실패: ${fail}건`);
      });
      
      console.log(`\n   그룹별 총합: ${totalFromGroups}건`);
      console.log(`   DB sent_count: ${message.sent_count || 0}건`);
      
      if (totalFromGroups !== (message.sent_count || 0)) {
        console.log(`   ⚠️ 그룹별 총합과 DB sent_count가 일치하지 않습니다!`);
      }
    }

    console.log('\n' + '='.repeat(100));
    console.log('\n📌 분석 결과:');
    
    if (logs && logs.length > recipientNumbers.length) {
      console.log(`   ⚠️ message_logs가 수신자 수보다 ${logs.length - recipientNumbers.length}건 더 많습니다.`);
      console.log(`   원인: 중복 기록 또는 재발송으로 인한 중복 로그 가능성`);
    } else if (logs && logs.length === recipientNumbers.length * 2) {
      console.log(`   ⚠️ message_logs가 수신자 수의 정확히 2배입니다.`);
      console.log(`   원인: 각 수신자마다 2번씩 기록되었을 가능성 (그룹별 중복 기록?)`);
    } else {
      console.log(`   ✅ 로그 수가 정상 범위입니다.`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkMessage148Duplicate();












