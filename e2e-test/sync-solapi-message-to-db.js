const { createClient } = require('@supabase/supabase-js');
const { createSolapiSignature } = require('../utils/solapiSignature');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";

// Solapi에서 그룹 정보 조회
async function getSolapiGroupInfo(groupId) {
  if (!groupId || !SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
    console.error('❌ Solapi 인증 정보가 없습니다.');
    return null;
  }

  try {
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    console.log(`🔍 Solapi API 호출: GET https://api.solapi.com/messages/v4/groups/${groupId}`);
    console.log(`   API Key 길이: ${SOLAPI_API_KEY?.length || 0}자`);
    
    // Solapi API v4 그룹 조회 엔드포인트
    const url = `https://api.solapi.com/messages/v4/groups/${groupId}`;
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      }
    });

    const responseText = await response.text();
    console.log(`📥 응답 상태: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`❌ Solapi 그룹 조회 실패 (${groupId}):`, response.status, response.statusText);
      try {
        const errorData = JSON.parse(responseText);
        console.error('   오류 상세:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('   응답 본문:', responseText.substring(0, 500));
      }
      return null;
    }

    const data = JSON.parse(responseText);
    console.log('✅ Solapi 그룹 정보 조회 성공');
    return data;
  } catch (error) {
    console.error(`❌ Solapi 그룹 조회 오류 (${groupId}):`, error.message);
    console.error('   스택:', error.stack);
    return null;
  }
}

// Solapi 메시지 목록 조회 (API 문서 참고: /messages/v4/list?groupId=...)
async function getSolapiMessageList(groupId) {
  if (!groupId || !SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
    return null;
  }

  try {
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    const url = `https://api.solapi.com/messages/v4/list?groupId=${groupId}&limit=200`;
    console.log(`🔍 Solapi 메시지 목록 조회: GET ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      }
    });

    const responseText = await response.text();
    console.log(`📥 응답 상태: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`❌ Solapi 메시지 목록 조회 실패 (${groupId}):`, response.status, response.statusText);
      try {
        const errorData = JSON.parse(responseText);
        console.error('   오류 상세:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('   응답 본문:', responseText.substring(0, 500));
      }
      return null;
    }

    const data = JSON.parse(responseText);
    console.log(`✅ Solapi 메시지 목록 조회 성공: ${data.messages?.length || 0}개 메시지`);
    return data;
  } catch (error) {
    console.error(`❌ Solapi 메시지 목록 조회 오류 (${groupId}):`, error.message);
    return null;
  }
}

// Solapi 그룹 정보를 DB에 동기화
async function syncSolapiMessageToDB(groupId) {
  console.log(`\n🔄 Solapi 그룹 정보를 DB에 동기화 시작: ${groupId}\n`);

  // 1. 메시지 목록 조회 (API 문서: /messages/v4/list?groupId=...)
  // 그룹 정보 조회가 실패해도 메시지 목록 조회만으로도 동기화 가능
  const messageList = await getSolapiMessageList(groupId);
  if (!messageList || !messageList.messages || messageList.messages.length === 0) {
    console.error('❌ Solapi 메시지 목록을 가져올 수 없습니다.');
    return null;
  }

  console.log(`✅ Solapi 메시지 목록 조회 성공: ${messageList.messages.length}개 메시지\n`);

  // 2. 그룹 정보 조회 (선택적, 실패해도 계속 진행)
  let groupInfoData = null;
  const groupInfo = await getSolapiGroupInfo(groupId);
  if (groupInfo) {
    groupInfoData = groupInfo.groupInfo || groupInfo;
    if (groupInfoData) {
      console.log('✅ Solapi 그룹 정보 조회 성공:');
      console.log(`   상태: ${groupInfoData.status || 'unknown'}`);
      console.log(`   성공: ${groupInfoData.successCount || 0}건`);
      console.log(`   실패: ${groupInfoData.failCount || 0}건`);
      console.log(`   발송중: ${groupInfoData.sendingCount || 0}건`);
      console.log(`   발송일: ${groupInfoData.dateSent || '없음'}\n`);
    }
  } else {
    console.warn('⚠️ 그룹 정보 조회 실패 (메시지 목록만으로 진행)\n');
  }

  // 3. 메시지 정보 추출
  let messageText = '';
  let messageType = 'MMS';
  let recipientNumbers = [];
  let imageUrl = null;
  let successCount = 0;
  let failCount = 0;
  let sendingCount = 0;
  let dateSent = '';

  const firstMessage = messageList.messages[0];
  messageText = firstMessage.text || '';
  messageType = firstMessage.type || 'MMS';
  imageUrl = firstMessage.imageId || null;
  dateSent = firstMessage.dateCreated || firstMessage.dateUpdated || '';
  
  // 수신자 번호 추출 및 상태 카운트
  recipientNumbers = messageList.messages
    .map(msg => {
      // 상태 코드로 성공/실패 판단
      const statusCode = msg.statusCode || '';
      const status = msg.status || '';
      
      if (statusCode === '4000' || status === 'COMPLETE' || status === 'DELIVERED') {
        successCount++;
      } else if (status === 'SENDING' || status === 'PENDING') {
        sendingCount++;
      } else if (statusCode && statusCode !== '4000') {
        failCount++;
      }
      
      return msg.to;
    })
    .filter(Boolean)
    .map(num => {
      // 하이픈 형식으로 변환 (01012345678 -> 010-1234-5678)
      const cleaned = num.replace(/[-\s]/g, '');
      if (cleaned.length === 11) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
      }
      return num;
    });
  
  // 중복 제거
  recipientNumbers = [...new Set(recipientNumbers)];

  const totalCount = messageList.messages.length;

  console.log('📋 추출된 메시지 정보:');
  console.log(`   메시지 내용: ${messageText.substring(0, 50)}... (${messageText.length}자)`);
  console.log(`   메시지 타입: ${messageType}`);
  console.log(`   수신자 수: ${recipientNumbers.length}명`);
  console.log(`   총 발송: ${totalCount}건`);
  console.log(`   성공: ${successCount}건, 실패: ${failCount}건, 발송중: ${sendingCount}건`);
  console.log(`   이미지 URL: ${imageUrl || '없음'}\n`);

  // 4. DB에 저장
  // 발송일은 메시지의 dateCreated 또는 그룹 정보의 dateSent 사용
  const sentAt = dateSent 
    ? new Date(dateSent).toISOString() 
    : (groupInfoData?.dateSent ? new Date(groupInfoData.dateSent).toISOString() : new Date().toISOString());
  
  // 성공/실패 건수는 메시지 목록에서 추출한 값 우선 사용, 없으면 그룹 정보 사용
  const finalSuccessCount = successCount > 0 ? successCount : (groupInfoData?.successCount || 0);
  const finalFailCount = failCount > 0 ? failCount : (groupInfoData?.failCount || 0);
  const finalSendingCount = sendingCount > 0 ? sendingCount : (groupInfoData?.sendingCount || 0);

  const { data: newMessage, error } = await supabase
    .from('channel_sms')
    .insert({
      message_text: messageText || 'Solapi에서 동기화된 메시지',
      message_type: messageType,
      status: 'sent',
      solapi_group_id: groupId,
      solapi_message_id: null,
      sent_at: sentAt,
      sent_count: totalCount,
      success_count: finalSuccessCount,
      fail_count: finalFailCount,
      // 발송중 건수는 저장하지 않지만 로그에 표시
      recipient_numbers: recipientNumbers,
      image_url: imageUrl,
      created_at: sentAt,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('❌ DB 저장 실패:', error);
    return null;
  }

  console.log('✅ DB 저장 성공!');
  console.log(`   새 메시지 ID: ${newMessage.id}`);
  console.log(`   수신자 수: ${recipientNumbers.length}명`);
  console.log(`   발송 건수: ${totalCount}건\n`);

  return newMessage;
}

// 메인 함수
async function main() {
  const GROUP_ID = process.argv[2] || 'G4V202511181317011LMZKTZGSYH56HC';
  
  console.log('🚀 Solapi 메시지를 DB에 동기화 시작...\n');
  console.log(`📋 그룹 ID: ${GROUP_ID}\n`);

  // 먼저 DB에 이미 있는지 확인
  const { data: existing } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('solapi_group_id', GROUP_ID)
    .single();

  if (existing) {
    console.log('✅ 이미 DB에 존재하는 메시지입니다:');
    console.log(`   메시지 ID: ${existing.id}`);
    console.log(`   상태: ${existing.status}`);
    console.log(`   수신자 수: ${existing.recipient_numbers?.length || 0}명`);
    console.log(`   발송 건수: ${existing.sent_count || 0}건\n`);
    return;
  }

  // DB에 없으면 동기화
  const result = await syncSolapiMessageToDB(GROUP_ID);
  
  if (result) {
    console.log(`\n✅ 동기화 완료!`);
    console.log(`   메시지 ID: ${result.id}`);
    console.log(`   SMS 편집 페이지: http://localhost:3000/admin/sms?id=${result.id}`);
  } else {
    console.error('\n❌ 동기화 실패');
    process.exit(1);
  }
}

main();

