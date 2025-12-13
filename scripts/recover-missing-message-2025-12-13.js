require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { createSolapiSignature } = require('../utils/solapiSignature');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;

if (!supabaseUrl || !supabaseKey || !SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function recoverMissingMessage(groupId) {
  console.log(`\n🔄 누락된 메시지 복구 시작: 그룹 ID ${groupId}\n`);

  try {
    // 1. 이미 DB에 있는지 확인
    const { data: existing } = await supabase
      .from('channel_sms')
      .select('id, solapi_group_id, note, sent_at')
      .ilike('solapi_group_id', `%${groupId}%`)
      .is('deleted_at', null);

    if (existing && existing.length > 0) {
      console.log('⚠️ 이미 DB에 존재하는 메시지:');
      existing.forEach(msg => {
        console.log(`   ID: ${msg.id}, 그룹 ID: ${msg.solapi_group_id}, 메모: ${msg.note}`);
      });
      return { recovered: false, reason: 'already_exists', existing };
    }

    // 2. 솔라피에서 메시지 정보 조회
    // 각 API 호출마다 새로운 signature 생성 (재사용 방지)
    let authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    
    // 그룹 정보 조회
    const groupResponse = await fetch(
      `https://api.solapi.com/messages/v4/groups/${groupId}`,
      { method: 'GET', headers: authHeaders }
    );

    if (!groupResponse.ok) {
      const errorText = await groupResponse.text();
      console.error(`❌ 그룹 정보 조회 실패: ${groupResponse.status} - ${errorText}`);
      return { recovered: false, reason: 'group_fetch_failed', error: errorText };
    }

    const groupData = await groupResponse.json();
    const groupInfo = groupData.groupInfo || groupData;
    
    console.log('✅ 솔라피 그룹 정보 조회 성공:');
    console.log(`   상태: ${groupInfo.status || 'unknown'}`);
    console.log(`   발송일: ${groupInfo.dateSent || groupInfo.dateCreated || '없음'}\n`);

    // 메시지 목록 조회 (새로운 signature 생성)
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 지연으로 signature 재사용 방지
    authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    
    const messageListResponse = await fetch(
      `https://api.solapi.com/messages/v4/list?groupId=${groupId}&limit=10`,
      { method: 'GET', headers: authHeaders }
    );

    if (!messageListResponse.ok) {
      const errorText = await messageListResponse.text();
      console.error(`❌ 메시지 목록 조회 실패: ${messageListResponse.status} - ${errorText}`);
      return { recovered: false, reason: 'message_list_fetch_failed', error: errorText };
    }

    const messageListData = await messageListResponse.json();
    
    // 다양한 응답 구조 지원
    let messages = [];
    if (Array.isArray(messageListData)) {
      messages = messageListData;
    } else if (messageListData.messages && Array.isArray(messageListData.messages)) {
      messages = messageListData.messages;
    } else if (messageListData.list && Array.isArray(messageListData.list)) {
      messages = messageListData.list;
    } else if (messageListData.data && Array.isArray(messageListData.data)) {
      messages = messageListData.data;
    } else if (messageListData.messageList && typeof messageListData.messageList === 'object') {
      // messageList가 객체인 경우 (키가 메시지 ID, 값이 메시지 객체)
      messages = Object.values(messageListData.messageList);
    }

    if (messages.length === 0) {
      console.error('❌ 메시지를 찾을 수 없습니다.');
      console.error('   응답 구조:', Object.keys(messageListData));
      return { recovered: false, reason: 'no_messages', response: messageListData };
    }

    console.log(`✅ ${messages.length}개 메시지 발견\n`);

    // 3. 메시지 정보 추출
    const firstMessage = messages[0];
    const messageText = firstMessage.text || '';
    const messageType = firstMessage.type || 'LMS';
    const dateSent = firstMessage.dateCreated || groupInfo.dateSent || new Date().toISOString();
    
    // 수신자 번호 추출
    const recipientNumbers = messages
      .map(msg => msg.to)
      .filter(Boolean)
      .map(num => {
        const cleaned = num.replace(/[-\s]/g, '');
        if (cleaned.length === 11) {
          return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
        }
        return num;
      });
    
    const uniqueRecipients = [...new Set(recipientNumbers)];
    
    // 성공/실패 카운트
    let successCount = 0;
    let failCount = 0;
    messages.forEach(msg => {
      const statusCode = msg.statusCode || '';
      if (statusCode === '4000') {
        successCount++;
      } else if (statusCode && statusCode !== '4000') {
        failCount++;
      }
    });

    console.log('📋 추출된 메시지 정보:');
    console.log(`   메시지 내용: ${messageText.substring(0, 50)}...`);
    console.log(`   타입: ${messageType}`);
    console.log(`   수신자: ${uniqueRecipients.join(', ')}`);
    console.log(`   성공: ${successCount}건, 실패: ${failCount}건\n`);

    // 4. note 필드에서 예약 정보 추출
    let note = `솔라피에서 복구: 그룹 ID ${groupId}`;
    if (messageText.includes('시타 예약')) {
      if (messageText.includes('접수')) {
        note = `스탭진 알림 received: 예약 ID (복구)`;
      } else if (messageText.includes('확정')) {
        note = `스탭진 알림 confirmed: 예약 ID (복구)`;
      }
    }

    // 5. DB에 저장
    const { data: newMessage, error: insertError } = await supabase
      .from('channel_sms')
      .insert({
        message_type: messageType,
        message_text: messageText,
        recipient_numbers: uniqueRecipients,
        status: failCount === 0 ? 'sent' : (successCount > 0 ? 'partial' : 'failed'),
        sent_at: dateSent,
        sent_count: messages.length,
        success_count: successCount,
        fail_count: failCount,
        solapi_group_id: groupId,
        note: note,
        created_at: dateSent,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ DB 저장 실패:', insertError);
      return { recovered: false, reason: 'db_insert_failed', error: insertError };
    }

    console.log('✅ 메시지 복구 완료!');
    console.log(`   새 메시지 ID: ${newMessage.id}`);
    console.log(`   수신자: ${uniqueRecipients.length}명`);
    console.log(`   발송일: ${dateSent}\n`);

    return { recovered: true, messageId: newMessage.id, groupId };

  } catch (error) {
    console.error('❌ 복구 중 오류:', error);
    return { recovered: false, reason: 'exception', error: error.message };
  }
}

// 특정 시간대의 솔라피 메시지 목록 조회하여 그룹 ID 추출
async function findGroupsByTime(targetDate, startTime, endTime) {
  console.log(`\n🔍 솔라피에서 ${targetDate} ${startTime} ~ ${endTime} 시간대 그룹 조회 중...\n`);

  try {
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    
    // 메시지 목록 조회 (날짜 필터링)
    const startDateTime = `${targetDate}T${startTime}:00`;
    const endDateTime = `${targetDate}T${endTime}:59`;
    
    const messagesResponse = await fetch(
      `https://api.solapi.com/messages/v4/list?startDate=${startDateTime}&endDate=${endDateTime}&limit=100`,
      { method: 'GET', headers: authHeaders }
    );

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      console.error(`❌ 메시지 목록 조회 실패: ${messagesResponse.status} - ${errorText}`);
      return [];
    }

    const messagesData = await messagesResponse.json();
    
    // 그룹 ID 추출
    const groupIdSet = new Set();
    const messages = messagesData.messages || messagesData.list || messagesData.data || [];
    
    messages.forEach(msg => {
      if (msg.groupId) {
        groupIdSet.add(msg.groupId);
      }
    });

    const groupIds = Array.from(groupIdSet);
    console.log(`✅ ${groupIds.length}개 그룹 발견\n`);
    return groupIds;

  } catch (error) {
    console.error('❌ 그룹 조회 중 오류:', error);
    return [];
  }
}

// 메인 실행
async function main() {
  console.log('='.repeat(80));
  console.log('🔍 2025. 12. 13. 17:18 시간대 누락 메시지 복구');
  console.log('='.repeat(80));

  // 명령줄 인자로 그룹 ID가 제공된 경우
  const groupIdsFromArgs = process.argv.slice(2).filter(arg => !arg.startsWith('--'));

  let groupIds = [];

  if (groupIdsFromArgs.length > 0) {
    // 직접 그룹 ID 제공
    groupIds = groupIdsFromArgs;
    console.log(`\n📋 제공된 그룹 ID: ${groupIds.length}개\n`);
  } else {
    // 자동으로 해당 시간대 그룹 찾기
    console.log('\n🔍 솔라피에서 해당 시간대 그룹 자동 검색 중...\n');
    groupIds = await findGroupsByTime('2025-12-13', '17:18', '17:19');
    
    if (groupIds.length === 0) {
      console.error('\n❌ 해당 시간대의 그룹을 찾을 수 없습니다.');
      console.error('\n사용법: node scripts/recover-missing-message-2025-12-13.js <그룹ID1> [그룹ID2] ...');
      console.error('예: node scripts/recover-missing-message-2025-12-13.js G4V20251213171841HWTS1FRPYJYHAKI');
      process.exit(1);
    }
  }

  // DB에 이미 있는 그룹 ID 필터링
  const { data: existingMessages } = await supabase
    .from('channel_sms')
    .select('solapi_group_id')
    .is('deleted_at', null);

  const existingGroupIds = new Set();
  existingMessages?.forEach(msg => {
    if (msg.solapi_group_id) {
      msg.solapi_group_id.split(',').forEach(id => {
        existingGroupIds.add(id.trim());
      });
    }
  });

  const missingGroupIds = groupIds.filter(gid => !existingGroupIds.has(gid));

  if (missingGroupIds.length === 0) {
    console.log('✅ 모든 그룹이 이미 DB에 존재합니다.\n');
    process.exit(0);
  }

  console.log(`📊 누락된 그룹: ${missingGroupIds.length}개\n`);

  const results = [];
  for (const groupId of missingGroupIds) {
    const result = await recoverMissingMessage(groupId);
    results.push({ groupId, ...result });
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 복구 결과 요약');
  console.log('='.repeat(80));
  
  const recovered = results.filter(r => r.recovered).length;
  const failed = results.filter(r => !r.recovered && r.reason !== 'already_exists').length;
  const alreadyExists = results.filter(r => r.reason === 'already_exists').length;
  
  console.log(`✅ 복구 성공: ${recovered}개`);
  console.log(`⚠️ 이미 존재: ${alreadyExists}개`);
  console.log(`❌ 복구 실패: ${failed}개\n`);

  results.forEach((result, idx) => {
    if (result.recovered) {
      console.log(`   ${idx + 1}. 그룹 ID ${result.groupId}: ✅ 복구 완료 (메시지 ID: ${result.messageId})`);
    } else if (result.reason === 'already_exists') {
      console.log(`   ${idx + 1}. 그룹 ID ${result.groupId}: ⚠️ 이미 존재`);
    } else {
      console.log(`   ${idx + 1}. 그룹 ID ${result.groupId}: ❌ 실패 (${result.reason})`);
    }
  });

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('\n❌ 치명적 오류:', error);
  process.exit(1);
});

