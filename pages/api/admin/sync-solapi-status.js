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

  const { messageId, groupId } = req.body;

  if (!messageId || !groupId) {
    return res.status(400).json({ 
      success: false, 
      message: 'messageId와 groupId가 필요합니다.' 
    });
  }

  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
    return res.status(500).json({ 
      success: false, 
      message: '솔라피 API 키가 설정되지 않았습니다.' 
    });
  }

  try {
    console.log(`🔄 솔라피 동기화 시작: messageId=${messageId}, groupId=${groupId}`);

    // 1. 솔라피 API로 그룹 상태 조회
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    
    // 솔라피 v4 API: 그룹 정보 조회
    // 참고: 솔라피 API 문서에 따라 엔드포인트가 다를 수 있음
    const solapiResponse = await fetch(
      `https://api.solapi.com/messages/v4/groups/${groupId}`,
      { 
        method: 'GET',
        headers: authHeaders 
      }
    );

    if (!solapiResponse.ok) {
      const errorText = await solapiResponse.text();
      console.error('솔라피 API 오류:', solapiResponse.status, errorText);
      
      // 더 자세한 에러 정보 제공
      let errorMessage = `솔라피 API 오류: ${solapiResponse.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errorMessage) {
          errorMessage = errorJson.errorMessage;
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch (e) {
        // JSON 파싱 실패 시 원본 텍스트 사용
        if (errorText && errorText.length < 200) {
          errorMessage = errorText;
        }
      }
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: errorText.substring(0, 500),
        statusCode: solapiResponse.status
      });
    }

    const solapiData = await solapiResponse.json();
    console.log('솔라피 그룹 정보 (전체):', JSON.stringify(solapiData, null, 2));

    // 2. 상태 추출 - 다양한 응답 구조 지원
    // 솔라피 API 응답 구조는 다양할 수 있으므로 여러 경로 시도
    let groupInfo = solapiData.groupInfo || solapiData;
    let count = {};
    
    // count 객체 찾기 (다양한 경로 시도)
    if (groupInfo && groupInfo.count) {
      count = groupInfo.count;
    } else if (solapiData.count) {
      count = solapiData.count;
    } else if (groupInfo && typeof groupInfo === 'object') {
      // groupInfo 자체가 count 정보를 포함할 수 있음
      count = groupInfo;
    }
    
    // RAW DATA 구조에 맞게 수정 (count.sentSuccess, count.sentFailed 등)
    const getNumber = (...values) => {
      for (const value of values) {
        if (typeof value === 'number' && !Number.isNaN(value)) {
          return value;
        }
      }
      return 0;
    };

    let totalCount = getNumber(
      count.total,
      count.sentTotal,
      count.totalCount,
      groupInfo?.totalCount,
      groupInfo?.total,
      solapiData.total,
      solapiData.totalCount
    );

    let successCount = getNumber(
      count.sentSuccess,
      count.successful,
      count.success,
      count.successCount,
      groupInfo?.successCount,
      groupInfo?.successful,
      groupInfo?.success,
      solapiData.successful,
      solapiData.successCount
    );

    let failCount = getNumber(
      count.sentFailed,
      count.failed,
      count.fail,
      count.failCount,
      groupInfo?.failCount,
      groupInfo?.failed,
      groupInfo?.fail,
      solapiData.failed,
      solapiData.failCount
    );

    let sendingCount = getNumber(
      count.sentPending,
      count.sending,
      count.sendingCount,
      groupInfo?.sendingCount,
      groupInfo?.sending,
      solapiData.sending,
      solapiData.sendingCount,
      totalCount - successCount - failCount
    );

    const registeredSuccess = getNumber(
      count.registeredSuccess,
      groupInfo?.registeredSuccess,
      solapiData.registeredSuccess
    );
    const registeredFailed = getNumber(
      count.registeredFailed,
      groupInfo?.registeredFailed,
      solapiData.registeredFailed
    );

    if (registeredSuccess || registeredFailed) {
      totalCount = Math.max(totalCount, registeredSuccess + registeredFailed, totalCount);
      successCount += registeredSuccess;
      failCount += registeredFailed;
    }

    console.log(`📊 솔라피 그룹 정보에서 추출 결과:`);
    console.log(`   - 총: ${totalCount}건`);
    console.log(`   - 성공: ${successCount}건`);
    console.log(`   - 실패: ${failCount}건`);
    console.log(`   - 발송중: ${sendingCount}건`);
    console.log(`   - 응답 구조 키:`, Object.keys(solapiData));
    if (groupInfo && typeof groupInfo === 'object') {
      console.log(`   - groupInfo 키:`, Object.keys(groupInfo));
    }
    if (count && typeof count === 'object') {
      console.log(`   - count 키:`, Object.keys(count));
    }

    // 그룹 정보에서 성공/실패 카운트를 찾지 못한 경우, 메시지 목록 API로 재조회
    // 메시지 목록 API가 더 정확한 정보를 제공할 수 있음
    if (successCount === 0 && failCount === 0) {
      console.log('⚠️ 그룹 정보에서 성공/실패 카운트를 찾지 못했습니다. 메시지 목록 API로 재조회 시도...');
      
      try {
        const messageListResponse = await fetch(
          `https://api.solapi.com/messages/v4/list?groupId=${groupId}&limit=1000`,
          { 
            method: 'GET',
            headers: authHeaders 
          }
        );
        
        if (messageListResponse.ok) {
          const messageListData = await messageListResponse.json();
          console.log('📋 메시지 목록 조회 성공:', messageListData.messages?.length || 0, '개 메시지');
          console.log('📋 메시지 목록 응답 구조:', Object.keys(messageListData));
          
          if (messageListData.messages && Array.isArray(messageListData.messages) && messageListData.messages.length > 0) {
            // 개별 메시지 상태로 카운트 계산
            const messages = messageListData.messages;
            
            // 첫 번째 메시지의 구조 확인
            if (messages.length > 0) {
              console.log('📋 첫 번째 메시지 구조:', Object.keys(messages[0]));
              console.log('📋 첫 번째 메시지 상태:', {
                status: messages[0].status,
                statusCode: messages[0].statusCode,
                statusMessage: messages[0].statusMessage
              });
            }
            
            totalCount = messages.length;
            
            successCount = messages.filter(m => {
              const status = String(m.status || '').toUpperCase();
              const statusCode = String(m.statusCode || '');
              const statusMessage = String(m.statusMessage || '').toUpperCase();
              
              // 다양한 성공 조건 확인
              return status === 'COMPLETE' || 
                     status === 'DELIVERED' || 
                     statusCode === '4000' ||
                     statusMessage.includes('성공') ||
                     statusMessage.includes('완료') ||
                     statusMessage.includes('DELIVERED');
            }).length;
            
            failCount = messages.filter(m => {
              const status = String(m.status || '').toUpperCase();
              const statusCode = String(m.statusCode || '');
              const statusMessage = String(m.statusMessage || '').toUpperCase();
              
              // 실패 조건 확인
              return status === 'FAILED' || 
                     status === 'REJECTED' ||
                     (statusCode && statusCode !== '4000' && statusCode !== '2000' && statusCode !== '3000' && statusCode !== '1000') ||
                     statusMessage.includes('실패') ||
                     statusMessage.includes('FAILED');
            }).length;
            
            sendingCount = messages.filter(m => {
              const status = String(m.status || '').toUpperCase();
              const statusCode = String(m.statusCode || '');
              
              // 발송중 조건 확인
              return status === 'SENDING' || 
                     status === 'PENDING' || 
                     status === 'ACCEPTED' ||
                     statusCode === '2000' ||
                     statusCode === '3000';
            }).length;
            
            console.log(`📊 메시지 목록에서 추출: 총 ${totalCount}건, 성공 ${successCount}건, 실패 ${failCount}건, 발송중 ${sendingCount}건`);
          } else {
            console.warn('⚠️ 메시지 목록이 비어있습니다.');
          }
        } else {
          const errorText = await messageListResponse.text();
          console.warn('⚠️ 메시지 목록 조회 실패:', messageListResponse.status, errorText.substring(0, 200));
        }
      } catch (listError) {
        console.error('❌ 메시지 목록 조회 오류:', listError.message);
      }
    } else if (totalCount === 0 && successCount === 0 && failCount === 0) {
      console.warn('⚠️ 모든 카운트가 0입니다. 응답 구조를 확인하세요.');
      console.warn('   원본 응답:', JSON.stringify(solapiData, null, 2));
    }

    console.log(`📊 솔라피 상태 최종 추출 결과:`);
    console.log(`   - 총: ${totalCount}건`);
    console.log(`   - 성공: ${successCount}건`);
    console.log(`   - 실패: ${failCount}건`);
    console.log(`   - 발송중: ${sendingCount}건`);

    // 3. 그룹 ID 유효성 검증 (솔라피에서 그룹이 존재하는지 확인)
    if (totalCount === 0 && successCount === 0 && failCount === 0) {
      // 그룹 정보가 없으면 그룹 ID가 잘못되었을 수 있음
      console.warn(`⚠️ 솔라피에서 그룹 정보를 찾을 수 없습니다. 그룹 ID가 잘못되었을 수 있습니다: ${groupId}`);
      
      // DB에서 이 그룹 ID를 사용하는 다른 메시지 확인
      const { data: otherMessages } = await supabase
        .from('channel_sms')
        .select('id, status, recipient_numbers')
        .eq('solapi_group_id', groupId);
      
      if (otherMessages && otherMessages.length > 0) {
        console.warn(`⚠️ 이 그룹 ID를 사용하는 다른 메시지:`, otherMessages.map(m => `#${m.id} (${m.status}, ${m.recipient_numbers?.length || 0}명)`));
      }
    }

    // 4. DB에서 현재 메시지 정보 조회
    const { data: currentMessage, error: fetchError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError || !currentMessage) {
      throw new Error(`메시지를 찾을 수 없습니다: ${fetchError?.message}`);
    }

    // 메시지의 solapi_group_id와 요청한 groupId가 일치하는지 확인
    if (currentMessage.solapi_group_id && currentMessage.solapi_group_id !== groupId) {
      console.warn(`⚠️ 그룹 ID 불일치: DB=${currentMessage.solapi_group_id}, 요청=${groupId}`);
      console.warn(`   이 메시지는 다른 그룹 ID를 가지고 있습니다.`);
    }
    
    // 그룹이 존재하지 않고 메시지가 초안 상태면 그룹 ID 제거
    if (totalCount === 0 && successCount === 0 && failCount === 0 && currentMessage.status === 'draft') {
      console.warn(`⚠️ 초안 메시지에 잘못된 그룹 ID가 연결되어 있습니다. 그룹 ID를 제거합니다.`);
      
      const { error: clearError } = await supabase
        .from('channel_sms')
        .update({
          solapi_group_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);
      
      if (clearError) {
        console.error('그룹 ID 제거 오류:', clearError);
      } else {
        console.log('✅ 잘못된 그룹 ID 제거 완료');
      }
      
      return res.status(200).json({
        success: true,
        message: '초안 메시지의 잘못된 그룹 ID를 제거했습니다.',
        data: {
          messageId,
          groupId,
          action: 'cleared_invalid_group_id',
          reason: '초안 메시지에 존재하지 않는 그룹 ID가 연결되어 있었습니다.'
        }
      });
    }

    // 수신자 수와 솔라피 결과 비교
    const recipientCount = currentMessage.recipient_numbers?.length || 0;
    const mismatch = totalCount > 0 && totalCount !== recipientCount;
    
    // 누락된 그룹 ID 찾기: 수신자 수가 200 이상이고 솔라피 발송 건수가 200의 배수일 때
    let allGroupIds = currentMessage.solapi_group_id ? 
      currentMessage.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean) : 
      [];
    
    if (mismatch && recipientCount > 200 && totalCount < recipientCount) {
      console.log(`🔍 누락된 그룹 ID 찾기 시작...`);
      console.log(`   수신자: ${recipientCount}명, 현재 그룹 발송: ${totalCount}건`);
      
      try {
        // 발송 시간 기준으로 ±5분 범위 내의 그룹 찾기
        const sentAt = currentMessage.sent_at ? new Date(currentMessage.sent_at) : new Date();
        const startTime = new Date(sentAt.getTime() - 5 * 60 * 1000); // 5분 전
        const endTime = new Date(sentAt.getTime() + 5 * 60 * 1000); // 5분 후
        
        // 솔라피 메시지 로그 API로 같은 시간대 그룹 찾기
        // 참고: 솔라피 API는 시간 범위로 검색할 수 있지만, 여기서는 간단히 첫 번째 그룹 ID의 패턴을 기반으로 추정
        // 실제로는 솔라피 콘솔에서 수동으로 확인하거나, 발송 시 로그를 확인해야 함
        
        console.log(`   ⚠️ 자동 그룹 ID 찾기는 제한적입니다.`);
        console.log(`   솔라피 콘솔에서 같은 시간대(${startTime.toISOString()} ~ ${endTime.toISOString()})의 그룹을 확인하세요.`);
        console.log(`   또는 발송 시 서버 로그에서 모든 그룹 ID를 확인할 수 있습니다.`);
      } catch (searchError) {
        console.error('그룹 ID 검색 오류:', searchError);
      }
    }
    
    if (mismatch) {
      console.warn(`⚠️ 수신자 수 불일치 감지!`);
      console.warn(`   메시지 ID: ${messageId}`);
      console.warn(`   DB 수신자: ${recipientCount}명`);
      console.warn(`   솔라피 총 발송: ${totalCount}건`);
      console.warn(`   그룹 ID: ${groupId}`);
      console.warn(`   DB 그룹 ID: ${currentMessage.solapi_group_id || '없음'}`);
      console.warn(`   현재 저장된 그룹 수: ${allGroupIds.length}개`);
    } else if (totalCount === 0 && recipientCount > 0) {
      console.warn(`⚠️ 솔라피 총 발송 건수가 0입니다. 응답 구조를 확인하세요.`);
    } else {
      console.log(`✅ 수신자 수 일치: ${recipientCount}명`);
    }

    // 5. 상태 결정
    let finalStatus = currentMessage.status;
    if (sendingCount > 0) {
      finalStatus = 'partial'; // 일부 발송중
    } else if (failCount === 0 && successCount > 0) {
      finalStatus = 'sent'; // 모두 성공
    } else if (successCount === 0 && failCount > 0) {
      finalStatus = 'failed'; // 모두 실패
    } else if (successCount > 0 && failCount > 0) {
      finalStatus = 'partial'; // 부분 성공
    } else if (totalCount > 0 && successCount === 0 && failCount === 0) {
      // 총 건수는 있지만 성공/실패 정보가 없는 경우 (발송 중일 수 있음)
      finalStatus = 'partial';
    } else if (totalCount === 0 && recipientCount > 0) {
      // 솔라피에서 정보를 가져오지 못한 경우, 기존 상태 유지
      console.warn('⚠️ 솔라피에서 발송 정보를 가져오지 못했습니다. 기존 상태를 유지합니다.');
    }

    // 6. DB 업데이트 (totalCount가 0이면 수신자 수 사용)
    const finalTotalCount = totalCount > 0 ? totalCount : recipientCount;
    
    // ⭐ group_statuses 업데이트
    const existingStatuses = currentMessage.group_statuses || [];
    const updatedStatuses = [...existingStatuses];
    
    // 기존 상태 찾기
    const existingIndex = updatedStatuses.findIndex(
      s => s.groupId === groupId
    );
    
    // ⭐ successCount가 totalCount를 초과하지 않도록 제한
    const maxSuccessCount = Math.min(successCount || 0, finalTotalCount || 0);
    const maxFailCount = Math.min(failCount || 0, finalTotalCount || 0);
    const maxSendingCount = Math.min(sendingCount || 0, finalTotalCount || 0);
    
    // ⭐ success + fail + sending이 totalCount를 초과하지 않도록 조정
    let finalSuccessCount = maxSuccessCount;
    let finalFailCount = maxFailCount;
    let finalSendingCount = maxSendingCount;
    
    const totalStatusCount = maxSuccessCount + maxFailCount + maxSendingCount;
    if (totalStatusCount > finalTotalCount && finalTotalCount > 0) {
      console.warn(`⚠️ 그룹 ${groupId}: 상태 합계(${totalStatusCount})가 총 건수(${finalTotalCount})를 초과합니다. 조정합니다.`);
      const ratio = finalTotalCount / totalStatusCount;
      finalSuccessCount = Math.round(maxSuccessCount * ratio);
      finalFailCount = Math.round(maxFailCount * ratio);
      finalSendingCount = Math.max(0, finalTotalCount - finalSuccessCount - finalFailCount); // 나머지는 sending으로
      
      console.warn(`   조정 전: 성공=${maxSuccessCount}, 실패=${maxFailCount}, 발송중=${maxSendingCount}`);
      console.warn(`   조정 후: 성공=${finalSuccessCount}, 실패=${finalFailCount}, 발송중=${finalSendingCount}`);
    }
    
    const statusToSave = {
      groupId: groupId,
      successCount: finalSuccessCount,
      failCount: finalFailCount,
      totalCount: finalTotalCount || 0,
      sendingCount: finalSendingCount,
      lastSyncedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      updatedStatuses[existingIndex] = statusToSave;
    } else {
      updatedStatuses.push(statusToSave);
    }
    
    // ⭐ 전체 그룹 기준 집계 (상태 결정에 사용)
    // solapi_group_id에 포함된 그룹만 집계 (중복 제거 및 검증)
    const validGroupIds = currentMessage.solapi_group_id 
      ? currentMessage.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean)
      : [];

    console.log(`🔍 집계 전 상태 확인:`);
    console.log(`   - 메시지 ID: ${messageId}`);
    console.log(`   - 수신자 수: ${recipientCount}명`);
    console.log(`   - 유효한 그룹 IDs: ${validGroupIds.join(', ')}`);
    console.log(`   - 기존 group_statuses 개수: ${updatedStatuses.length}개`);
    updatedStatuses.forEach((status, idx) => {
      console.log(`   - [${idx}] 그룹 ID: ${status.groupId}, 성공: ${status.successCount}, 실패: ${status.failCount}, 총: ${status.totalCount}`);
    });

    // 중복 제거 및 유효한 그룹만 필터링
    const uniqueStatuses = updatedStatuses.filter((status, index, self) => {
      // 1. 중복 제거 (같은 groupId가 여러 번 있으면 첫 번째만 사용)
      const firstIndex = self.findIndex(s => s.groupId === status.groupId);
      if (firstIndex !== index) {
        console.warn(`⚠️ 중복된 그룹 ID 발견: ${status.groupId}, 첫 번째 항목만 사용`);
        return false;
      }
      
      // 2. solapi_group_id에 포함된 그룹만 집계
      if (validGroupIds.length > 0 && !validGroupIds.includes(status.groupId)) {
        console.warn(`⚠️ 유효하지 않은 그룹 ID 제외: ${status.groupId} (메시지의 solapi_group_id에 없음)`);
        return false;
      }
      
      return true;
    });

    console.log(`🔍 필터링 후 상태:`);
    console.log(`   - 유효한 group_statuses 개수: ${uniqueStatuses.length}개`);
    uniqueStatuses.forEach((status, idx) => {
      console.log(`   - [${idx}] 그룹 ID: ${status.groupId}, 성공: ${status.successCount}, 실패: ${status.failCount}, 총: ${status.totalCount}`);
    });

    const aggregateCounts = uniqueStatuses.reduce(
      (acc, statusEntry) => {
        acc.success += statusEntry.successCount || 0;
        acc.fail += statusEntry.failCount || 0;
        acc.sending += statusEntry.sendingCount || 0;
        acc.total += statusEntry.totalCount || 0;
        return acc;
      },
      { success: 0, fail: 0, sending: 0, total: 0 }
    );

    console.log(`📊 집계 결과:`);
    console.log(`   - 성공: ${aggregateCounts.success}건`);
    console.log(`   - 실패: ${aggregateCounts.fail}건`);
    console.log(`   - 발송중: ${aggregateCounts.sending}건`);
    console.log(`   - 총: ${aggregateCounts.total}건`);

    // ⭐ 수신자 수를 초과하지 않도록 제한 (recipientCount는 위에서 이미 선언됨)
    if (aggregateCounts.total > recipientCount && recipientCount > 0) {
      console.warn(`⚠️ 집계된 총 건수(${aggregateCounts.total})가 수신자 수(${recipientCount})를 초과합니다. 수신자 수로 제한합니다.`);
      const ratio = recipientCount / aggregateCounts.total;
      aggregateCounts.success = Math.min(Math.round(aggregateCounts.success * ratio), recipientCount);
      aggregateCounts.fail = Math.min(Math.round(aggregateCounts.fail * ratio), recipientCount);
      aggregateCounts.sending = Math.min(Math.round(aggregateCounts.sending * ratio), recipientCount);
      aggregateCounts.total = recipientCount;
    }

    let aggregatedFinalStatus = currentMessage.status;
    if (aggregateCounts.sending > 0) {
      aggregatedFinalStatus = 'partial';
    } else if (aggregateCounts.fail === 0 && aggregateCounts.success > 0) {
      aggregatedFinalStatus = 'sent';
    } else if (aggregateCounts.success === 0 && aggregateCounts.fail > 0) {
      aggregatedFinalStatus = 'failed';
    } else if (aggregateCounts.success > 0 && aggregateCounts.fail > 0) {
      aggregatedFinalStatus = 'partial';
    } else if (finalTotalCount > 0 && aggregateCounts.success === 0 && aggregateCounts.fail === 0) {
      aggregatedFinalStatus = 'partial';
    }

    const aggregatedTotalCount = aggregateCounts.total || finalTotalCount;
    const aggregatedSuccessCount = aggregateCounts.success || successCount || 0;
    const aggregatedFailCount = aggregateCounts.fail || failCount || 0;
    const aggregatedSendingCount = aggregateCounts.sending || sendingCount || 0;

    // ⭐ 솔라피 API 응답에서 발송일 추출
    let sentAt = currentMessage.sent_at; // 기존 값 유지
    const solapiDateSent = solapiData.dateSent || solapiData.dateCreated || groupInfo?.dateSent || groupInfo?.dateCreated;
    if (solapiDateSent) {
      try {
        const parsedDate = new Date(solapiDateSent);
        if (!isNaN(parsedDate.getTime())) {
          sentAt = parsedDate.toISOString();
          console.log(`📅 발송일 업데이트: ${sentAt} (솔라피: ${solapiDateSent})`);
        }
      } catch (dateError) {
        console.warn(`⚠️ 발송일 파싱 실패: ${solapiDateSent}`, dateError);
      }
    }

    const updateData = {
      status: aggregatedFinalStatus,
      sent_count: aggregatedTotalCount,
      success_count: aggregatedSuccessCount,
      fail_count: aggregatedFailCount,
      group_statuses: uniqueStatuses, // ⭐ 그룹별 상세 정보 저장 (중복 제거 및 검증된 항목만)
      updated_at: new Date().toISOString()
    };

    // ⭐ sent_at이 없거나 솔라피에서 가져온 날짜가 더 정확한 경우 업데이트
    if (sentAt && (!currentMessage.sent_at || sentAt !== currentMessage.sent_at)) {
      updateData.sent_at = sentAt;
    }

    const { error: updateError } = await supabase
      .from('channel_sms')
      .update(updateData)
      .eq('id', messageId);

    if (updateError) {
      console.error('DB 업데이트 오류:', updateError);
      throw updateError;
    }

    console.log(`✅ 동기화 완료: 상태=${aggregatedFinalStatus}, 성공=${aggregatedSuccessCount}건, 실패=${aggregatedFailCount}건, 총=${aggregatedTotalCount}건`);

    return res.status(200).json({
      success: true,
      message: '솔라피 상태 동기화 완료',
      data: {
        messageId,
        groupId,
        totalCount: aggregatedTotalCount,
        successCount: aggregatedSuccessCount,
        failCount: aggregatedFailCount,
        sendingCount: aggregatedSendingCount,
        status: aggregatedFinalStatus,
        previousStatus: currentMessage.status,
        recipientCount, // DB 수신자 수
        mismatch, // 불일치 여부
        rawResponse: process.env.NODE_ENV === 'development' ? solapiData : undefined // 개발 환경에서만 원본 응답 포함
      }
    });

  } catch (error) {
    console.error('솔라피 동기화 오류:', error);
    console.error('에러 스택:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: error.message || '솔라피 동기화 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        messageId: req.body?.messageId,
        groupId: req.body?.groupId,
        errorName: error.name
      } : undefined
    });
  }
}

