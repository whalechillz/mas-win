/**
 * 91번 메시지의 솔라피 발송 결과를 확인하고 message_logs 복구
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { createSolapiSignature } = require('../utils/solapiSignature.js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function recoverMessage91Logs() {
  console.log('🔍 91번 메시지 로그 복구 시작...\n');

  // 1. channel_sms 정보 확인
  const { data: sms } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('id', 91)
    .single();

  if (!sms) {
    console.log('❌ 91번 메시지를 찾을 수 없습니다.');
    return;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 channel_sms 정보:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`솔라피 그룹 ID: ${sms.solapi_group_id || '(없음)'}`);
  console.log(`수신자 수: ${sms.recipient_numbers?.length || 0}명`);
  console.log(`발송 시간: ${sms.sent_at || '(없음)'}\n`);

  if (!sms.solapi_group_id) {
    console.log('❌ 솔라피 그룹 ID가 없습니다. 복구할 수 없습니다.');
    return;
  }

  // 2. 솔라피에서 메시지 목록 조회
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 솔라피 API 조회 중...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const groupIds = sms.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean);
  console.log(`그룹 ID 개수: ${groupIds.length}개\n`);

  const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
  const allMessages = [];

  for (const groupId of groupIds) {
    try {
      console.log(`📡 그룹 ID ${groupId} 조회 중...`);
      
      // 1. 그룹 정보 먼저 확인
      const groupResponse = await fetch(
        `https://api.solapi.com/messages/v4/groups/${groupId}`,
        {
          method: 'GET',
          headers: authHeaders
        }
      );

      if (groupResponse.ok) {
        const groupData = await groupResponse.json();
        console.log(`   그룹 정보:`, JSON.stringify(groupData, null, 2).substring(0, 500));
      } else {
        const errorText = await groupResponse.text();
        console.log(`   그룹 정보 조회 실패: ${groupResponse.status} - ${errorText.substring(0, 200)}`);
      }

      // 2. 메시지 목록 조회
      const response = await fetch(
        `https://api.solapi.com/messages/v4/list?groupId=${groupId}&limit=500`,
        {
          method: 'GET',
          headers: authHeaders
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ 메시지 목록 조회 실패: ${response.status} - ${errorText.substring(0, 200)}`);
        continue;
      }

      const data = await response.json();
      const messages = data.messages || [];
      
      console.log(`   ✅ ${messages.length}개 메시지 발견`);
      if (messages.length > 0) {
        console.log(`   첫 번째 메시지:`, JSON.stringify(messages[0], null, 2).substring(0, 300));
      }
      allMessages.push(...messages);

    } catch (error) {
      console.error(`   ❌ 오류: ${error.message}`);
    }
  }

  console.log(`\n📊 총 ${allMessages.length}개 메시지 조회 완료\n`);

  // 그룹 정보에서 성공/실패 건수 확인
  let groupInfo = null;
  try {
    const groupResponse = await fetch(
      `https://api.solapi.com/messages/v4/groups/${groupIds[0]}`,
      {
        method: 'GET',
        headers: authHeaders
      }
    );
    if (groupResponse.ok) {
      groupInfo = await groupResponse.json();
      const count = groupInfo.count || groupInfo;
      console.log(`\n📊 그룹 정보:`);
      console.log(`   총: ${count.total || 0}건`);
      console.log(`   성공: ${count.sentSuccess || 0}건`);
      console.log(`   실패: ${count.sentFailed || 0}건`);
    }
  } catch (e) {
    console.error('그룹 정보 조회 오류:', e.message);
  }

  // 메시지 목록이 없어도 recipient_numbers 기반으로 복구 가능
  if (allMessages.length === 0 && sms.recipient_numbers && sms.recipient_numbers.length > 0) {
    console.log('\n⚠️  솔라피 메시지 목록을 조회할 수 없지만, recipient_numbers 기반으로 복구를 시도합니다.');
    console.log(`   recipient_numbers: ${sms.recipient_numbers.length}명`);
    
    // recipient_numbers의 모든 번호에 대해 message_logs 생성
    const logsToInsert = sms.recipient_numbers.map(phone => ({
      content_id: '91',
      customer_phone: phone,
      customer_id: null,
      message_type: (sms.message_type || 'mms').toLowerCase(),
      status: 'sent', // 기본값, 나중에 솔라피 동기화로 업데이트 가능
      channel: 'solapi',
      sent_at: sms.sent_at || new Date().toISOString()
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('message_logs')
      .upsert(logsToInsert, { onConflict: 'content_id,customer_phone' })
      .select();

    if (insertError) {
      console.error('❌ message_logs 복구 실패:', insertError);
    } else {
      console.log(`✅ ${inserted?.length || 0}개 로그 복구 완료 (recipient_numbers 기반)`);
      
      // 01041060273 포함 여부 확인
      const targetPhone = '01041060273';
      const formattedTarget = '010-4106-0273';
      const found = inserted?.some(log => {
        const logPhone = (log.customer_phone || '').replace(/[\-\s]/g, '');
        return logPhone === targetPhone || log.customer_phone === formattedTarget;
      });
      
      if (found) {
        console.log(`\n✅ ${targetPhone} 번호의 로그가 복구되었습니다.`);
      } else {
        console.log(`\n⚠️  ${targetPhone} 번호가 recipient_numbers에 없거나 복구되지 않았습니다.`);
      }
    }
    return;
  }

  if (allMessages.length === 0) {
    console.log('⚠️  솔라피에서 메시지를 찾을 수 없고, recipient_numbers도 없습니다.');
    return;
  }

  // 3. 01041060273 번호 찾기
  const targetPhone = '01041060273';
  const formattedTarget = '010-4106-0273';
  
  const targetMessages = allMessages.filter(msg => {
    const to = (msg.to || '').replace(/[\-\s]/g, '');
    return to === targetPhone || msg.to === formattedTarget || msg.to === targetPhone;
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎯 ${targetPhone} 관련 메시지: ${targetMessages.length}개`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (targetMessages.length > 0) {
    targetMessages.forEach((msg, i) => {
      console.log(`[${i + 1}]`);
      console.log(`  수신번호: ${msg.to}`);
      console.log(`  상태: ${msg.status || msg.statusCode || '(없음)'}`);
      console.log(`  상태코드: ${msg.statusCode || '(없음)'}`);
      console.log(`  상태메시지: ${msg.statusMessage || '(없음)'}`);
      console.log(`  발송시간: ${msg.dateCreated || msg.dateSent || '(없음)'}`);
      console.log('');
    });

    // 4. message_logs 복구
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💾 message_logs 복구 중...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const logsToInsert = targetMessages.map(msg => {
      const status = msg.status || 'sent';
      const sentAt = msg.dateCreated || msg.dateSent || sms.sent_at || new Date().toISOString();

      return {
        content_id: '91',
        customer_phone: msg.to || targetPhone,
        customer_id: null,
        message_type: (sms.message_type || 'mms').toLowerCase(),
        status: status.toLowerCase().includes('fail') ? 'failed' : 'sent',
        channel: 'solapi',
        sent_at: sentAt
      };
    });

    const { data: inserted, error: insertError } = await supabase
      .from('message_logs')
      .upsert(logsToInsert, { onConflict: 'content_id,customer_phone' })
      .select();

    if (insertError) {
      console.error('❌ message_logs 복구 실패:', insertError);
    } else {
      console.log(`✅ ${inserted?.length || 0}개 로그 복구 완료`);
    }

  } else {
    console.log(`⚠️  ${targetPhone} 번호로 발송된 메시지를 솔라피에서 찾을 수 없습니다.`);
    console.log('\n📋 솔라피에서 조회된 모든 수신번호 (처음 10개):');
    allMessages.slice(0, 10).forEach((msg, i) => {
      console.log(`  [${i + 1}] ${msg.to || '(없음)'}`);
    });
  }
}

recoverMessage91Logs();

