/**
 * 솔라피 그룹 ID를 기반으로 메시지 ID 332를 생성하는 스크립트
 * 
 * 사용법:
 * node scripts/create-message-332.js
 */

import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../utils/solapiSignature.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
  console.error('❌ 솔라피 API 키가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const groupId = "G4V2026010913193619BNE7GRBMIYNCC";
const messageId = 332;

async function fetchSolapiGroupInfo(groupId) {
  const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
  
  try {
    const response = await fetch(
      `https://api.solapi.com/messages/v4/groups/${groupId}`,
      { method: 'GET', headers: authHeaders }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`솔라피 API 오류: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`그룹 ${groupId} 조회 실패:`, error.message);
    return null;
  }
}

async function fetchSolapiMessageInfo(groupId) {
  const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
  
  try {
    // 그룹의 메시지 목록 조회
    const response = await fetch(
      `https://api.solapi.com/messages/v4/list?groupId=${groupId}&limit=1`,
      { method: 'GET', headers: authHeaders }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`솔라피 API 오류: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    // Solapi 응답 구조에 따라 messageList 또는 messages 배열에서 첫 번째 메시지 추출
    const messageList = data.messageList || data.messages || data.list || data.data || [];
    if (typeof messageList === 'object' && !Array.isArray(messageList)) {
      // messageList가 객체인 경우 (예: { "M4V...": { ... } }) 첫 번째 키의 값 반환
      const firstKey = Object.keys(messageList)[0];
      return messageList[firstKey] || null;
    }
    return messageList.length > 0 ? messageList[0] : null;
  } catch (error) {
    console.error(`메시지 ${groupId} 조회 실패:`, error.message);
    return null;
  }
}

async function createMessage332() {
  console.log(`\n🔄 메시지 ID 332 생성 및 동기화 시작...\n`);
  console.log(`그룹 ID: ${groupId}`);
  console.log(`메시지 ID: ${messageId}\n`);

  try {
    // 1. 기존 메시지 삭제 (있다면)
    const { error: deleteError } = await supabase
      .from('channel_sms')
      .delete()
      .eq('id', messageId);

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn(`   ⚠️  기존 메시지 삭제 중 오류 (무시):`, deleteError.message);
    } else {
      console.log(`   ✅ 기존 메시지 정리 완료`);
    }

    // 2. 솔라피에서 그룹 정보 조회
    await new Promise(resolve => setTimeout(resolve, 2000)); // API 제한 방지

    const groupInfo = await fetchSolapiGroupInfo(groupId);
    if (!groupInfo) {
      console.error(`   ❌ 그룹 정보를 가져올 수 없습니다.`);
      process.exit(1);
    }

    const group = groupInfo.groupInfo || groupInfo;
    const count = group.count || {};
    const dateCreated = group.dateCreated || group.dateSent || groupInfo.dateCreated || groupInfo.dateSent;
    const dateSent = group.dateSent || group.dateCreated || dateCreated;

    console.log(`   ✅ 그룹 정보 조회 성공`);
    console.log(`      생성일: ${dateCreated || '없음'}`);
    console.log(`      발송일: ${dateSent || '없음'}`);

    // 3. 솔라피에서 메시지 상세 정보 조회
    await new Promise(resolve => setTimeout(resolve, 2000)); // API 제한 방지

    const messageInfo = await fetchSolapiMessageInfo(groupId);
    if (!messageInfo) {
      console.warn(`   ⚠️  메시지 상세 정보를 가져올 수 없습니다. 기본값으로 생성합니다.`);
    }

    // 4. 메시지 데이터 구성
    const totalCount = count.total || count.totalCount || group.totalCount || 1;
    const successCount = count.successful || count.success || count.successCount || group.successCount || 1;
    const failCount = count.failed || count.fail || count.failCount || group.failCount || 0;

    // 메시지 내용: Solapi에서 가져온 text 필드 사용
    let messageText = messageInfo?.text || messageInfo?.content || '[메시지 내용 없음]';
    
    // subject가 있으면 메시지 앞에 추가 (LMS의 경우) - 중복 방지를 위해 text에 subject가 이미 포함되어 있는지 확인
    if (messageInfo?.subject && !messageText.startsWith(messageInfo.subject)) {
      messageText = `${messageInfo.subject}\n\n${messageText}`;
    }
    
    const recipientNumber = messageInfo?.to || '01066699000';
    const messageType = messageInfo?.type || group.type || 'LMS';
    const fromNumber = messageInfo?.from || group.from || '0312150013';

    // 5. 새 메시지 생성
    const newMessage = {
      id: messageId,
      message_type: messageType === 'LMS' ? 'LMS' : (messageType === 'SMS' ? 'SMS' : 'MMS'),
      message_text: messageText,
      recipient_numbers: recipientNumber ? [recipientNumber] : ['01066699000'],
      status: failCount === 0 && successCount > 0 ? 'sent' : (successCount > 0 ? 'partial' : 'failed'),
      solapi_group_id: groupId,
      solapi_message_id: messageInfo?._id || messageInfo?.messageId || null,
      sent_at: dateSent ? new Date(dateSent).toISOString() : new Date().toISOString(),
      sent_count: totalCount,
      success_count: successCount,
      fail_count: failCount,
      group_statuses: [{
        groupId: groupId,
        totalCount: totalCount,
        successCount: successCount,
        failCount: failCount,
        sendingCount: count.sending || count.sendingCount || 0,
        lastSyncedAt: new Date().toISOString(),
      }],
      message_category: 'prize', // 경품 메시지
      message_subcategory: 'prize_thank_you', // 감사 메시지
      honorific: null,
      created_at: dateCreated ? new Date(dateCreated).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('channel_sms')
      .insert(newMessage);

    if (insertError) {
      console.error(`   ❌ 메시지 생성 실패:`, insertError.message);
      console.error(`   상세:`, JSON.stringify(insertError, null, 2));
    } else {
      console.log(`   ✅ 메시지 ID ${messageId} 생성 완료!`);
      console.log(`      그룹 ID: ${groupId}`);
      console.log(`      상태: ${newMessage.status}`);
      console.log(`      발송일: ${newMessage.sent_at}`);
      console.log(`      성공: ${successCount}건, 실패: ${failCount}건`);
      console.log(`      카테고리: ${newMessage.message_category} / ${newMessage.message_subcategory}`);
    }

    // API 제한 방지를 위한 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error(`   ❌ 오류 발생:`, error.message);
    console.error(`   스택:`, error.stack);
  }
  console.log(`\n💡 SMS 리스트에서 확인하세요: /admin/sms-list\n`);
}

createMessage332()
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
