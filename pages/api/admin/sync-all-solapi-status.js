import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../../utils/solapiSignature.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";

export default async function handler(req, res) {
  // 인증: API 키 또는 관리자 권한 확인 (선택적)
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const expectedApiKey = process.env.ADMIN_API_KEY; // 환경변수에 설정
  
  if (expectedApiKey && apiKey !== expectedApiKey) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized' 
    });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
    return res.status(500).json({ 
      success: false, 
      message: '솔라피 API 키가 설정되지 않았습니다.' 
    });
  }

  try {
    console.log('🔄 모든 솔라피 메시지 상태 동기화 시작...');

    // 1. solapi_group_id가 있는 모든 메시지 조회 (최근 24시간 내 발송된 것만)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: messages, error: fetchError } = await supabase
      .from('channel_sms')
      .select('id, solapi_group_id, status, success_count, fail_count, sent_count, sent_at')
      .not('solapi_group_id', 'is', null)
      .gte('sent_at', oneDayAgo.toISOString())
      .order('sent_at', { ascending: false })
      .limit(100); // 최대 100개만 처리 (성능 고려)

    if (fetchError) {
      throw new Error(`메시지 조회 오류: ${fetchError.message}`);
    }

    if (!messages || messages.length === 0) {
      return res.status(200).json({
        success: true,
        message: '동기화할 메시지가 없습니다.',
        synced: 0,
        failed: 0
      });
    }

    console.log(`📋 ${messages.length}개의 메시지 동기화 시작...`);

    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    let syncedCount = 0;
    let failedCount = 0;
    const results = [];

    // 2. 각 메시지의 그룹 ID로 솔라피 API 조회 및 업데이트
    for (const message of messages) {
      const groupId = message.solapi_group_id;
      
      if (!groupId) continue;

      try {
        // 솔라피 API로 그룹 정보 조회
        const solapiResponse = await fetch(
          `https://api.solapi.com/messages/v4/groups/${groupId}`,
          { 
            method: 'GET',
            headers: authHeaders 
          }
        );

        if (!solapiResponse.ok) {
          console.error(`솔라피 API 오류 (groupId: ${groupId}):`, solapiResponse.status);
          failedCount++;
          results.push({
            messageId: message.id,
            groupId,
            status: 'error',
            error: `솔라피 API 오류: ${solapiResponse.status}`
          });
          continue;
        }

        const solapiData = await solapiResponse.json();
        const groupInfo = solapiData.groupInfo || solapiData;
        const count = groupInfo.count || {};
        
        const getNumber = (...values) => {
          for (const value of values) {
            if (typeof value === 'number' && !Number.isNaN(value)) {
              return value;
            }
          }
          return 0;
        };

        let totalCount = getNumber(count.total, groupInfo.totalCount, solapiData.total, solapiData.totalCount);
        let successCount = getNumber(count.successful, count.success, count.successCount, groupInfo.successCount, solapiData.successful, solapiData.successCount);
        let failCount = getNumber(count.failed, count.fail, count.failCount, groupInfo.failCount, solapiData.failed, solapiData.failCount);
        let sendingCount = getNumber(count.sending, count.sendingCount, groupInfo.sendingCount, solapiData.sending, solapiData.sendingCount, totalCount - successCount - failCount);

        const registeredSuccess = getNumber(count.registeredSuccess, groupInfo.registeredSuccess, solapiData.registeredSuccess);
        const registeredFailed = getNumber(count.registeredFailed, groupInfo.registeredFailed, solapiData.registeredFailed);

        if (registeredSuccess || registeredFailed) {
          totalCount = Math.max(totalCount, registeredSuccess + registeredFailed, totalCount);
          successCount += registeredSuccess;
          failCount += registeredFailed;
        }

        // 상태 결정
        let finalStatus = message.status;
        if (sendingCount > 0) {
          finalStatus = 'partial';
        } else if (failCount === 0 && successCount > 0) {
          finalStatus = 'sent';
        } else if (successCount === 0 && failCount > 0) {
          finalStatus = 'failed';
        } else if (successCount > 0 && failCount > 0) {
          finalStatus = 'partial';
        }

        // DB 업데이트
        const { error: updateError } = await supabase
          .from('channel_sms')
          .update({
            status: finalStatus,
            sent_count: totalCount,
            success_count: successCount,
            fail_count: failCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', message.id);

        if (updateError) {
          console.error(`메시지 ID ${message.id} 업데이트 오류:`, updateError);
          failedCount++;
          results.push({
            messageId: message.id,
            groupId,
            status: 'error',
            error: updateError.message
          });
        } else {
          syncedCount++;
          results.push({
            messageId: message.id,
            groupId,
            status: 'success',
            data: {
              totalCount,
              successCount,
              failCount,
              sendingCount,
              finalStatus
            }
          });
          console.log(`✅ 메시지 ID ${message.id} 동기화 완료: ${finalStatus} (성공:${successCount}, 실패:${failCount})`);
        }

        // API 호출 제한 고려 (너무 빠르게 호출하지 않도록)
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 대기

      } catch (error) {
        console.error(`메시지 ID ${message.id} 동기화 오류:`, error);
        failedCount++;
        results.push({
          messageId: message.id,
          groupId,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`✅ 동기화 완료: 성공 ${syncedCount}개, 실패 ${failedCount}개`);

    return res.status(200).json({
      success: true,
      message: `동기화 완료: ${syncedCount}개 성공, ${failedCount}개 실패`,
      synced: syncedCount,
      failed: failedCount,
      total: messages.length,
      results: results.slice(0, 10) // 최대 10개 결과만 반환
    });

  } catch (error) {
    console.error('솔라피 일괄 동기화 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '솔라피 일괄 동기화 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

