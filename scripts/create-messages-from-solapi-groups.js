/**
 * 솔라피 그룹 ID를 기반으로 메시지 ID 326, 327, 328을 새로 생성하는 스크립트
 * 
 * 사용법:
 * node scripts/create-messages-from-solapi-groups.js
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

// 그룹 ID와 메시지 ID 매핑
const mappings = [
  { groupId: 'G4V20260109012603HPIPFLKGYF2RBSR', messageId: 326 },
  { groupId: 'G4V20260109094505XIRWUOMXAMSTRNC', messageId: 327 },
  { groupId: 'G4V20260109101717W0BIANHAVUIIFOY', messageId: 328 },
];

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
    const messages = data.messages || data.list || data.data || [];
    return messages.length > 0 ? messages[0] : null;
  } catch (error) {
    console.error(`메시지 ${groupId} 조회 실패:`, error.message);
    return null;
  }
}

async function createMessages() {
  console.log(`\n🔄 메시지 생성 시작...\n`);

  for (const { groupId, messageId } of mappings) {
    try {
      console.log(`\n📋 처리 중: 메시지 ID ${messageId} ← 그룹 ID ${groupId}`);

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
      console.log(`   📡 솔라피 그룹 정보 조회 중...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // API 제한 방지

      const groupInfo = await fetchSolapiGroupInfo(groupId);
      if (!groupInfo) {
        console.error(`   ❌ 그룹 정보를 가져올 수 없습니다.`);
        continue;
      }

      const group = groupInfo.groupInfo || groupInfo;
      const count = group.count || {};
      const dateCreated = group.dateCreated || group.dateSent || groupInfo.dateCreated || groupInfo.dateSent;
      const dateSent = group.dateSent || group.dateCreated || dateCreated;

      console.log(`   ✅ 그룹 정보 조회 성공`);
      console.log(`      생성일: ${dateCreated || '없음'}`);
      console.log(`      발송일: ${dateSent || '없음'}`);

      // 3. 메시지 ID 325의 데이터를 참고하여 기본값 설정
      const { data: referenceMessage } = await supabase
        .from('channel_sms')
        .select('message_text, recipient_numbers, message_type, message_category, message_subcategory, honorific')
        .eq('id', 325)
        .single();

      // 4. 솔라피에서 메시지 상세 정보 조회
      console.log(`   📡 솔라피 메시지 정보 조회 중...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // API 제한 방지

      const messageInfo = await fetchSolapiMessageInfo(groupId);

      // 5. 메시지 데이터 구성
      const totalCount = count.total || count.totalCount || group.totalCount || 1;
      const successCount = count.successful || count.success || count.successCount || group.successCount || 1;
      const failCount = count.failed || count.fail || count.failCount || group.failCount || 0;

      // 메시지 내용: 솔라피에서 가져온 것이 있으면 사용, 없으면 참고 메시지 사용
      const messageText = messageInfo?.text || messageInfo?.message || messageInfo?.content || referenceMessage?.message_text || '[메시지 내용 없음]';
      const recipientNumber = messageInfo?.to || messageInfo?.recipient || (referenceMessage?.recipient_numbers?.[0] || '');
      const messageType = messageInfo?.type || group.type || referenceMessage?.message_type || 'LMS';
      const fromNumber = messageInfo?.from || group.from || '0312150013';

      // 6. 새 메시지 생성
      const newMessage = {
        id: messageId,
        message_type: messageType === 'LMS' ? 'LMS' : (messageType === 'SMS' ? 'SMS' : 'MMS'),
        message_text: messageText,
        recipient_numbers: recipientNumber ? [recipientNumber] : (referenceMessage?.recipient_numbers || []),
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
        message_category: referenceMessage?.message_category || null,
        message_subcategory: referenceMessage?.message_subcategory || null,
        honorific: referenceMessage?.honorific || null,
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
      }

      // API 제한 방지를 위한 대기
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.error(`   ❌ 오류 발생:`, error.message);
      console.error(`   스택:`, error.stack);
    }
  }

  console.log(`\n✅ 메시지 생성 완료!\n`);
}

createMessages()
  .then(() => {
    console.log('✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
