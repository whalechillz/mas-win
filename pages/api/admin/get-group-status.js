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

  const { groupIds } = req.body;

  if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'groupIds 배열이 필요합니다.' 
    });
  }

  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
    return res.status(500).json({ 
      success: false, 
      message: '솔라피 API 키가 설정되지 않았습니다.' 
    });
  }

  try {
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    const groupStatuses = [];

    // 각 그룹 ID별로 상태 조회
    for (const groupId of groupIds) {
      try {
        const solapiResponse = await fetch(
          `https://api.solapi.com/messages/v4/groups/${groupId.trim()}`,
          { 
            method: 'GET',
            headers: authHeaders 
          }
        );

        if (!solapiResponse.ok) {
          groupStatuses.push({
            groupId: groupId.trim(),
            success: false,
            error: `솔라피 API 오류: ${solapiResponse.status}`
          });
          continue;
        }

        const solapiData = await solapiResponse.json();
        const groupInfo = solapiData.groupInfo || solapiData;
        const count = groupInfo.count || {};
        
        // RAW DATA 구조에 맞게 수정 (count.sentSuccess, count.sentFailed 등)
        let totalCount = count.total || count.sentTotal || count.totalCount || groupInfo?.totalCount || groupInfo?.total || 0;
        let successCount = count.sentSuccess || count.successful || count.success || count.successCount || groupInfo?.successCount || groupInfo?.successful || 0;
        let failCount = count.sentFailed || count.failed || count.fail || count.failCount || groupInfo?.failCount || groupInfo?.failed || 0;
        let sendingCount = count.sentPending || count.sending || count.sendingCount || groupInfo?.sendingCount || (totalCount - successCount - failCount);

        // 메시지 목록으로 재조회 (카운트가 0인 경우)
        if (totalCount === 0 || (successCount === 0 && failCount === 0 && totalCount > 0)) {
          try {
            const messageListResponse = await fetch(
              `https://api.solapi.com/messages/v4/list?groupId=${groupId.trim()}&limit=1000`,
              { 
                method: 'GET',
                headers: authHeaders 
              }
            );
            
            if (messageListResponse.ok) {
              const messageListData = await messageListResponse.json();
              if (messageListData.messages && Array.isArray(messageListData.messages)) {
                const messages = messageListData.messages;
                totalCount = messages.length;
                
                successCount = messages.filter(m => {
                  const status = String(m.status || '').toUpperCase();
                  const statusCode = String(m.statusCode || '');
                  return status === 'COMPLETE' || status === 'DELIVERED' || statusCode === '4000';
                }).length;
                
                failCount = messages.filter(m => {
                  const status = String(m.status || '').toUpperCase();
                  const statusCode = String(m.statusCode || '');
                  return status === 'FAILED' || status === 'REJECTED' || 
                         (statusCode && statusCode !== '4000' && statusCode !== '2000' && statusCode !== '3000');
                }).length;
                
                sendingCount = messages.filter(m => {
                  const status = String(m.status || '').toUpperCase();
                  const statusCode = String(m.statusCode || '');
                  return status === 'SENDING' || status === 'PENDING' || statusCode === '2000' || statusCode === '3000';
                }).length;
              }
            }
          } catch (listError) {
            console.error(`메시지 목록 조회 오류 (groupId: ${groupId}):`, listError.message);
          }
        }

        const statusData = {
          groupId: groupId.trim(),
          success: true,
          totalCount,
          successCount,
          failCount,
          sendingCount
        };
        
        groupStatuses.push(statusData);
        
        // ⭐ DB 업데이트: 그룹별 상세 정보 저장
        try {
          // 해당 그룹 ID를 가진 메시지 찾기
          const { data: messages, error: findError } = await supabase
            .from('channel_sms')
            .select('id, group_statuses')
            .like('solapi_group_id', `%${groupId.trim()}%`);
          
          if (!findError && messages && messages.length > 0) {
            for (const message of messages) {
              const existingStatuses = message.group_statuses || [];
              const updatedStatuses = [...existingStatuses];
              
              // 기존 상태 찾기
              const existingIndex = updatedStatuses.findIndex(
                s => s.groupId === groupId.trim()
              );
              
              const statusToSave = {
                groupId: groupId.trim(),
                successCount: successCount || 0,
                failCount: failCount || 0,
                totalCount: totalCount || 0,
                sendingCount: sendingCount || 0,
                lastSyncedAt: new Date().toISOString()
              };
              
              if (existingIndex >= 0) {
                updatedStatuses[existingIndex] = statusToSave;
              } else {
                updatedStatuses.push(statusToSave);
              }
              
              // DB 업데이트
              await supabase
                .from('channel_sms')
                .update({ 
                  group_statuses: updatedStatuses,
                  updated_at: new Date().toISOString()
                })
                .eq('id', message.id);
            }
          }
        } catch (dbError) {
          console.error(`DB 업데이트 오류 (groupId: ${groupId}):`, dbError.message);
          // DB 업데이트 실패해도 API 응답은 정상 반환
        }
      } catch (error) {
        groupStatuses.push({
          groupId: groupId.trim(),
          success: false,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      groupStatuses
    });

  } catch (error) {
    console.error('그룹 상태 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '그룹 상태 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}





