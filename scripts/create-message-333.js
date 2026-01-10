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

const groupId = "G4V20260109132522V805EGXRNNEWZI9";
const messageId = 333;

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
    return await response.json();
  } catch (error) {
    console.error(`그룹 ${groupId} 조회 실패:`, error.message);
    return null;
  }
}

async function fetchSolapiMessageInfo(groupId) {
  const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
  try {
    const response = await fetch(
      `https://api.solapi.com/messages/v4/list?groupId=${groupId}&limit=1`,
      { method: 'GET', headers: authHeaders }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`솔라피 API 오류: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    const messageList = data.messageList || data.messages || data.list || data.data || [];
    if (typeof messageList === 'object' && !Array.isArray(messageList)) {
      const firstKey = Object.keys(messageList)[0];
      return messageList[firstKey] || null;
    }
    return messageList.length > 0 ? messageList[0] : null;
  } catch (error) {
    console.error(`메시지 ${groupId} 조회 실패:`, error.message);
    return null;
  }
}

async function createMessage333() {
  console.log(`\n🔄 메시지 ID 333 생성 및 동기화 시작...\n`);
  console.log(`그룹 ID: ${groupId}`);
  console.log(`메시지 ID: ${messageId}\n`);

  try {
    const { error: deleteError } = await supabase
      .from('channel_sms')
      .delete()
      .eq('id', messageId);

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn(`   ⚠️  기존 메시지 삭제 중 오류 (무시):`, deleteError.message);
    } else {
      console.log(`   ✅ 기존 메시지 정리 완료`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

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

    await new Promise(resolve => setTimeout(resolve, 2000));

    const messageInfo = await fetchSolapiMessageInfo(groupId);
    if (!messageInfo) {
      console.warn(`   ⚠️  메시지 상세 정보를 가져올 수 없습니다. 기본값으로 생성합니다.`);
    }

    const totalCount = count.total || count.totalCount || group.totalCount || 1;
    const successCount = count.successful || count.success || count.successCount || group.successCount || 1;
    const failCount = count.failed || count.fail || count.failCount || group.failCount || 0;

    let messageText = messageInfo?.text || messageInfo?.content || '[메시지 내용 없음]';
    
    if (messageInfo?.subject && !messageText.startsWith(messageInfo.subject)) {
      messageText = `${messageInfo.subject}\n\n${messageText}`;
    }
    
    const recipientNumber = messageInfo?.to || '01066699000';
    const messageType = messageInfo?.type || group.type || 'LMS';
    const fromNumber = messageInfo?.from || group.from || '0312150013';

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
      message_category: 'prize',
      message_subcategory: 'prize_thank_you',
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

    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error(`   ❌ 오류 발생:`, error.message);
    console.error(`   스택:`, error.stack);
  }
  console.log(`\n💡 SMS 리스트에서 확인하세요: /admin/sms-list\n`);
}

createMessage333()
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
