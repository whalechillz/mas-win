/**
 * 특정 그룹 ID를 메시지에 연결하는 스크립트
 * 
 * 사용법:
 * node scripts/link-specific-group-id.js <groupId> [messageId]
 * 
 * 예시:
 * node scripts/link-specific-group-id.js "G4V20260109094505XIRWUOMXAMSTRNC"
 * node scripts/link-specific-group-id.js "G4V20260109094505XIRWUOMXAMSTRNC" 325
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

async function linkGroupId(groupId, messageId = null) {
  console.log(`\n🔄 그룹 ID 연결 시작...\n`);
  console.log(`그룹 ID: ${groupId}`);
  if (messageId) {
    console.log(`메시지 ID: ${messageId}\n`);
  }

  try {
    // 1. 솔라피 API로 그룹 정보 조회
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    
    console.log('📡 솔라피 그룹 정보 조회 중...');
    const groupResponse = await fetch(
      `https://api.solapi.com/messages/v4/groups/${groupId}`,
      { method: 'GET', headers: authHeaders }
    );

    if (!groupResponse.ok) {
      const errorText = await groupResponse.text();
      console.error(`❌ 솔라피 그룹 조회 실패: ${groupResponse.status}`);
      console.error(`오류: ${errorText.substring(0, 200)}`);
      process.exit(1);
    }

    const groupData = await groupResponse.json();
    const groupInfo = groupData.groupInfo || groupData;
    const dateCreated = groupInfo.dateCreated || groupInfo.dateSent || groupData.dateCreated || groupData.dateSent;
    
    console.log(`✅ 그룹 정보 조회 성공`);
    console.log(`   생성일: ${dateCreated || '없음'}`);
    
    if (!dateCreated) {
      console.error('❌ 그룹 생성 시간 정보가 없습니다.');
      process.exit(1);
    }

    // 2. 시간 기반으로 메시지 찾기
    const groupTime = new Date(dateCreated);
    const startTime = new Date(groupTime.getTime() - 10 * 60 * 1000); // 10분 전
    const endTime = new Date(groupTime.getTime() + 10 * 60 * 1000); // 10분 후

    console.log(`\n🔍 메시지 검색 중...`);
    console.log(`   시간 범위: ${startTime.toISOString()} ~ ${endTime.toISOString()}`);

    let query = supabase
      .from('channel_sms')
      .select('id, status, success_count, fail_count, sent_count, recipient_numbers, solapi_group_id, sent_at, created_at')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    // sent_at이 있는 경우도 검색
    const query2 = supabase
      .from('channel_sms')
      .select('id, status, success_count, fail_count, sent_count, recipient_numbers, solapi_group_id, sent_at, created_at')
      .gte('sent_at', startTime.toISOString())
      .lte('sent_at', endTime.toISOString())
      .order('sent_at', { ascending: false })
      .limit(20);

    if (messageId) {
      query = query.eq('id', messageId);
      // messageId가 있으면 직접 조회
      const { data: directMessage, error: directError } = await supabase
        .from('channel_sms')
        .select('id, status, success_count, fail_count, sent_count, recipient_numbers, solapi_group_id, sent_at, created_at')
        .eq('id', messageId)
        .single();

      if (!directError && directMessage) {
        await linkGroupToMessage(groupId, directMessage, groupData, authHeaders);
        return;
      } else {
        console.error(`❌ 메시지 ID ${messageId}를 찾을 수 없습니다.`);
        process.exit(1);
      }
    }

    const { data: timeBasedMessages, error: timeFindError } = await query;

    if (timeFindError) {
      console.error(`❌ 메시지 검색 오류:`, timeFindError);
      process.exit(1);
    }

    if (!timeBasedMessages || timeBasedMessages.length === 0) {
      // sent_at 기준으로도 검색
      const { data: sentBasedMessages, error: sentError } = await query2;
      
      if (sentError) {
        console.error(`❌ 메시지 검색 오류:`, sentError);
        process.exit(1);
      }

      if (!sentBasedMessages || sentBasedMessages.length === 0) {
        console.error(`❌ 시간 기반 검색으로 메시지를 찾을 수 없습니다.`);
        console.log(`\n💡 다음을 확인하세요:`);
        console.log(`   1. 메시지가 해당 시간대에 생성되었는지`);
        console.log(`   2. 그룹 ID가 올바른지`);
        console.log(`   3. 메시지 ID를 직접 지정: node scripts/link-specific-group-id.js "${groupId}" <messageId>`);
        process.exit(1);
      }

      // 가장 가까운 메시지 선택
      const targetMessage = sentBasedMessages[0];
      await linkGroupToMessage(groupId, targetMessage, groupData, authHeaders);
    } else {
      // 가장 가까운 메시지 선택
      const targetMessage = timeBasedMessages[0];
      await linkGroupToMessage(groupId, targetMessage, groupData, authHeaders);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

async function linkGroupToMessage(groupId, targetMessage, groupData, authHeaders) {
  console.log(`\n📋 대상 메시지:`);
  console.log(`   ID: ${targetMessage.id}`);
  console.log(`   상태: ${targetMessage.status}`);
  console.log(`   현재 그룹 ID: ${targetMessage.solapi_group_id || '없음'}`);
  console.log(`   수신자: ${targetMessage.recipient_numbers?.length || 0}명`);

  // 이미 연결되어 있는지 확인
  const existingGroupIds = targetMessage.solapi_group_id 
    ? targetMessage.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean)
    : [];
  
  if (existingGroupIds.includes(groupId)) {
    console.log(`\n✅ 이미 연결되어 있습니다.`);
    // 동기화만 수행
    await syncMessageStatus(targetMessage.id, groupId, groupData, authHeaders);
    return;
  }

  // 그룹 ID 추가
  existingGroupIds.push(groupId);
  const newGroupIdsString = existingGroupIds.join(',');

  // 솔라피에서 통계 조회
  const groupInfo = groupData.groupInfo || groupData;
  const count = groupInfo.count || {};
  const totalCount = count.total || count.totalCount || groupInfo.totalCount || 0;
  const successCount = count.successful || count.success || count.successCount || groupInfo.successCount || 0;
  const failCount = count.failed || count.fail || count.failCount || groupInfo.failCount || 0;
  const dateSent = groupInfo.dateSent || groupData.dateSent || groupInfo.dateCreated || groupData.dateCreated;

  console.log(`\n📊 솔라피 통계:`);
  console.log(`   총: ${totalCount}건`);
  console.log(`   성공: ${successCount}건`);
  console.log(`   실패: ${failCount}건`);
  console.log(`   발송일: ${dateSent || '없음'}`);

  // DB 업데이트
  const updateData = {
    solapi_group_id: newGroupIdsString,
    updated_at: new Date().toISOString()
  };

  // 발송일 업데이트
  if (dateSent) {
    updateData.sent_at = dateSent;
  }

  // 통계 업데이트
  if (totalCount > 0) {
    updateData.sent_count = totalCount;
  }
  if (successCount > 0 || failCount > 0) {
    updateData.success_count = Math.max(targetMessage.success_count || 0, successCount);
    updateData.fail_count = Math.max(targetMessage.fail_count || 0, failCount);
    
    // 상태 업데이트
    if (failCount === 0 && successCount > 0) {
      updateData.status = 'sent';
    } else if (successCount === 0 && failCount > 0) {
      updateData.status = 'failed';
    } else if (successCount > 0 && failCount > 0) {
      updateData.status = 'partial';
    }
  }

  const { error: updateError } = await supabase
    .from('channel_sms')
    .update(updateData)
    .eq('id', targetMessage.id);

  if (updateError) {
    console.error(`❌ 메시지 업데이트 실패:`, updateError);
    process.exit(1);
  }

  console.log(`\n✅ 그룹 ID 연결 완료!`);
  console.log(`   메시지 ID: ${targetMessage.id}`);
  console.log(`   새 그룹 IDs: ${newGroupIdsString}`);
  if (dateSent) {
    console.log(`   발송일 업데이트: ${dateSent}`);
  }
  console.log(`\n💡 SMS 리스트에서 확인하세요: /admin/sms-list\n`);
}

async function syncMessageStatus(messageId, groupId, groupData, authHeaders) {
  console.log(`\n🔄 메시지 상태 동기화 중...`);
  
  const groupInfo = groupData.groupInfo || groupData;
  const count = groupInfo.count || {};
  const totalCount = count.total || count.totalCount || groupInfo.totalCount || 0;
  const successCount = count.successful || count.success || count.successCount || groupInfo.successCount || 0;
  const failCount = count.failed || count.fail || count.failCount || groupInfo.failCount || 0;
  const dateSent = groupInfo.dateSent || groupData.dateSent || groupInfo.dateCreated || groupData.dateCreated;

  const updateData = {
    updated_at: new Date().toISOString()
  };

  if (dateSent) {
    updateData.sent_at = dateSent;
  }

  if (totalCount > 0) {
    updateData.sent_count = totalCount;
  }
  if (successCount > 0 || failCount > 0) {
    updateData.success_count = successCount;
    updateData.fail_count = failCount;
    
    if (failCount === 0 && successCount > 0) {
      updateData.status = 'sent';
    } else if (successCount === 0 && failCount > 0) {
      updateData.status = 'failed';
    } else if (successCount > 0 && failCount > 0) {
      updateData.status = 'partial';
    }
  }

  const { error: updateError } = await supabase
    .from('channel_sms')
    .update(updateData)
    .eq('id', messageId);

  if (updateError) {
    console.error(`❌ 상태 동기화 실패:`, updateError);
  } else {
    console.log(`✅ 상태 동기화 완료!`);
    if (dateSent) {
      console.log(`   발송일 업데이트: ${dateSent}`);
    }
  }
}

// 명령줄 인자 파싱
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('❌ 사용법: node scripts/link-specific-group-id.js <groupId> [messageId]');
  console.error('   예시: node scripts/link-specific-group-id.js "G4V20260109094505XIRWUOMXAMSTRNC"');
  console.error('   예시: node scripts/link-specific-group-id.js "G4V20260109094505XIRWUOMXAMSTRNC" 325');
  process.exit(1);
}

const groupId = args[0];
const messageId = args[1] ? parseInt(args[1]) : null;

if (isNaN(messageId) && messageId !== null) {
  console.error('❌ 메시지 ID는 숫자여야 합니다.');
  process.exit(1);
}

linkGroupId(groupId, messageId)
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
