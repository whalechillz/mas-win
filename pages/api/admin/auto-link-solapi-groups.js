/**
 * 솔라피에서 최근 발송된 그룹들을 조회하고 자동으로 DB 메시지와 연결하는 API
 * 
 * 솔라피 콘솔에서 직접 재발송한 경우 그룹 ID가 자동으로 연결되지 않는 문제를 해결
 */

import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../../utils/solapiSignature.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
    return res.status(500).json({ 
      success: false, 
      message: '솔라피 API 키가 설정되지 않았습니다.' 
    });
  }

  try {
    const { hours = 24, messageId = null } = req.body;
    
    // 최근 N시간 동안의 메시지 조회
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);
    
    console.log(`🔄 자동 그룹 ID 연결 시작: ${startDate.toISOString()} ~ ${endDate.toISOString()}`);

    // 1. 솔라피 API로 최근 메시지 그룹 조회
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    
    // 솔라피 메시지 목록 조회 (최근 N시간)
    const startDateStr = startDate.toISOString().split('.')[0] + 'Z';
    const endDateStr = endDate.toISOString().split('.')[0] + 'Z';
    
    const solapiResponse = await fetch(
      `https://api.solapi.com/messages/v4/list?startDate=${startDateStr}&endDate=${endDateStr}&limit=100`,
      { 
        method: 'GET',
        headers: authHeaders 
      }
    );

    if (!solapiResponse.ok) {
      const errorText = await solapiResponse.text();
      console.error('솔라피 API 오류:', solapiResponse.status, errorText);
      return res.status(500).json({
        success: false,
        message: `솔라피 API 오류: ${solapiResponse.status}`,
        error: errorText.substring(0, 500)
      });
    }

    const solapiData = await solapiResponse.json();
    const messages = solapiData.messages || solapiData.list || solapiData.data || [];
    
    console.log(`✅ 솔라피에서 ${messages.length}개 메시지 조회 완료`);

    // 2. 그룹 ID 추출 및 중복 제거
    const groupMap = new Map(); // groupId -> { dateCreated, messageCount, ... }
    
    for (const msg of messages) {
      const groupId = msg.groupId || msg.group_id;
      if (!groupId) continue;

      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          groupId,
          dateCreated: msg.dateCreated || msg.date_created || msg.createdAt || msg.created_at,
          dateSent: msg.dateSent || msg.date_sent || msg.sentAt || msg.sent_at,
          messageCount: 0,
          firstMessage: msg
        });
      }
      
      const groupInfo = groupMap.get(groupId);
      groupInfo.messageCount++;
    }

    const groups = Array.from(groupMap.values());
    console.log(`📊 ${groups.length}개 고유 그룹 ID 발견`);

    // 3. 각 그룹 ID에 대해 DB 메시지 찾기 및 연결
    let linkedCount = 0;
    let skippedCount = 0;
    const results = [];

    for (const group of groups) {
      const { groupId, dateCreated, dateSent, messageCount } = group;
      
      try {
        // 3-1. 이미 연결된 그룹인지 확인
        const { data: existingMessages } = await supabase
          .from('channel_sms')
          .select('id, solapi_group_id')
          .like('solapi_group_id', `%${groupId}%`)
          .limit(1);

        if (existingMessages && existingMessages.length > 0) {
          skippedCount++;
          results.push({
            groupId,
            status: 'already_linked',
            messageId: existingMessages[0].id
          });
          continue;
        }

        // 3-2. 시간 기반으로 메시지 찾기
        // 재발송 케이스: dateSent가 있으면 dateSent를 우선 사용 (재발송 시간 반영)
        const timeToUse = dateSent || dateCreated;
        if (!timeToUse) {
          results.push({
            groupId,
            status: 'no_time_info',
            error: '그룹 생성/발송 시간 정보가 없습니다.'
          });
          continue;
        }

        const groupTime = new Date(timeToUse);
        // 재발송 케이스를 고려하여 시간 범위를 더 넓게 설정 (30분)
        const startTime = new Date(groupTime.getTime() - 30 * 60 * 1000); // 30분 전
        const endTime = new Date(groupTime.getTime() + 30 * 60 * 1000); // 30분 후

        // 특정 메시지 ID가 지정된 경우 해당 메시지만 조회
        let query = supabase
          .from('channel_sms')
          .select('id, status, success_count, fail_count, sent_count, recipient_numbers, solapi_group_id, sent_at, created_at')
          .order('created_at', { ascending: false })
          .limit(20);

        // sent_at이 있으면 sent_at 기준으로 검색, 없으면 created_at 기준
        // 재발송의 경우 sent_at이 원래 발송 시간일 수 있으므로 created_at도 함께 검색
        const queryWithSentAt = supabase
          .from('channel_sms')
          .select('id, status, success_count, fail_count, sent_count, recipient_numbers, solapi_group_id, sent_at, created_at')
          .gte('sent_at', startTime.toISOString())
          .lte('sent_at', endTime.toISOString())
          .order('sent_at', { ascending: false })
          .limit(10);

        const queryWithCreatedAt = supabase
          .from('channel_sms')
          .select('id, status, success_count, fail_count, sent_count, recipient_numbers, solapi_group_id, sent_at, created_at')
          .gte('created_at', startTime.toISOString())
          .lte('created_at', endTime.toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        if (messageId) {
          query = query.eq('id', messageId);
        }

        // sent_at과 created_at 모두로 검색 (재발송 케이스 대응)
        const [sentAtResult, createdAtResult] = await Promise.all([
          queryWithSentAt,
          queryWithCreatedAt
        ]);

        const timeBasedMessages = [
          ...(sentAtResult.data || []),
          ...(createdAtResult.data || [])
        ].filter((msg, idx, self) => 
          idx === self.findIndex(m => m.id === msg.id)
        ); // 중복 제거

        const timeFindError = sentAtResult.error || createdAtResult.error;

        if (timeFindError) {
          console.error(`시간 기반 메시지 검색 오류 (${groupId}):`, timeFindError);
          results.push({
            groupId,
            status: 'error',
            error: timeFindError.message
          });
          continue;
        }

        if (!timeBasedMessages || timeBasedMessages.length === 0) {
          results.push({
            groupId,
            status: 'not_found',
            error: '시간 기반 검색으로 메시지를 찾을 수 없습니다.'
          });
          continue;
        }

        // 3-3. 수신자 수로도 매칭 시도 (더 정확한 매칭)
        // 그룹의 메시지 수와 메시지의 수신자 수가 일치하는 메시지 우선 선택
        let targetMessage = timeBasedMessages[0];
        
        if (messageCount > 0) {
          // 수신자 수가 일치하는 메시지 찾기
          const matchingByCount = timeBasedMessages.find(msg => {
            const recipientCount = msg.recipient_numbers?.length || 0;
            // 정확히 일치하거나 ±5명 차이 허용 (수신거부 등으로 인한 차이)
            return Math.abs(recipientCount - messageCount) <= 5;
          });
          
          if (matchingByCount) {
            targetMessage = matchingByCount;
            console.log(`✅ 수신자 수 매칭: 그룹 ${messageCount}건 ↔ 메시지 ${matchingByCount.recipient_numbers?.length || 0}명`);
          }
        }
        const existingGroupIds = targetMessage.solapi_group_id 
          ? targetMessage.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean)
          : [];
        
        // 이미 포함되어 있으면 스킵
        if (existingGroupIds.includes(groupId)) {
          skippedCount++;
          results.push({
            groupId,
            status: 'already_linked',
            messageId: targetMessage.id
          });
          continue;
        }

        // 그룹 ID 추가
        existingGroupIds.push(groupId);
        const newGroupIdsString = existingGroupIds.join(',');

        // 3-4. 솔라피 API로 그룹 상태 조회
        let successCount = 0;
        let failCount = 0;
        let totalCount = 0;
        let actualDateSent = dateSent;
        
        try {
          const groupInfoResponse = await fetch(
            `https://api.solapi.com/messages/v4/groups/${groupId}`,
            { method: 'GET', headers: authHeaders }
          );

          if (groupInfoResponse.ok) {
            const groupInfoData = await groupInfoResponse.json();
            const groupInfo = groupInfoData.groupInfo || groupInfoData;
            const count = groupInfo.count || {};
            
            totalCount = count.total || count.totalCount || groupInfo.totalCount || 0;
            successCount = count.successful || count.success || count.successCount || groupInfo.successCount || 0;
            failCount = count.failed || count.fail || count.failCount || groupInfo.failCount || 0;
            
            // 그룹 정보에서 발송일 업데이트
            actualDateSent = groupInfo.dateSent || groupInfo.date_sent || groupInfo.dateCreated || groupInfo.date_created || dateSent;
          }
        } catch (e) {
          console.warn(`그룹 정보 조회 실패 (${groupId}):`, e.message);
        }

        // 3-5. DB 업데이트
        const updateData = {
          solapi_group_id: newGroupIdsString,
          updated_at: new Date().toISOString()
        };

        // 발송일 업데이트 (재발송 시간 반영)
        if (actualDateSent) {
          updateData.sent_at = actualDateSent;
        }

        // 솔라피에서 조회한 통계가 있으면 업데이트
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
          console.error(`메시지 ID ${targetMessage.id} 업데이트 오류:`, updateError);
          results.push({
            groupId,
            status: 'error',
            messageId: targetMessage.id,
            error: updateError.message
          });
        } else {
          linkedCount++;
          console.log(`✅ 그룹 ID ${groupId} → 메시지 ID ${targetMessage.id} 연결 완료`);
          results.push({
            groupId,
            status: 'linked',
            messageId: targetMessage.id,
            previousGroupIds: targetMessage.solapi_group_id || '없음',
            newGroupIds: newGroupIdsString
          });
        }

      } catch (error) {
        console.error(`그룹 ${groupId} 처리 중 오류:`, error);
        results.push({
          groupId,
          status: 'error',
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `자동 연결 완료: ${linkedCount}개 연결, ${skippedCount}개 스킵`,
      summary: {
        totalGroups: groups.length,
        linked: linkedCount,
        skipped: skippedCount,
        errors: results.filter(r => r.status === 'error').length,
        notFound: results.filter(r => r.status === 'not_found').length
      },
      results
    });

  } catch (error) {
    console.error('자동 그룹 ID 연결 오류:', error);
    return res.status(500).json({
      success: false,
      message: '자동 연결 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

