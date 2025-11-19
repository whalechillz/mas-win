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
    
    // 다양한 필드명 시도 (솔라피 API 문서에 따라 다를 수 있음)
    let totalCount = count.total || count.totalCount || groupInfo?.totalCount || groupInfo?.total || solapiData.total || solapiData.totalCount || 0;
    let successCount = count.successful || count.success || count.successCount || groupInfo?.successCount || groupInfo?.successful || groupInfo?.success || solapiData.successful || solapiData.successCount || 0;
    let failCount = count.failed || count.fail || count.failCount || groupInfo?.failCount || groupInfo?.failed || groupInfo?.fail || solapiData.failed || solapiData.failCount || 0;
    let sendingCount = count.sending || count.sendingCount || groupInfo?.sendingCount || groupInfo?.sending || solapiData.sending || solapiData.sendingCount || (totalCount - successCount - failCount);

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
    
    if (mismatch) {
      console.warn(`⚠️ 수신자 수 불일치 감지!`);
      console.warn(`   메시지 ID: ${messageId}`);
      console.warn(`   DB 수신자: ${recipientCount}명`);
      console.warn(`   솔라피 총 발송: ${totalCount}건`);
      console.warn(`   그룹 ID: ${groupId}`);
      console.warn(`   DB 그룹 ID: ${currentMessage.solapi_group_id || '없음'}`);
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
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        status: finalStatus,
        sent_count: finalTotalCount,
        success_count: successCount,
        fail_count: failCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (updateError) {
      console.error('DB 업데이트 오류:', updateError);
      throw updateError;
    }

    console.log(`✅ 동기화 완료: 상태=${finalStatus}, 성공=${successCount}건, 실패=${failCount}건, 총=${finalTotalCount}건`);

    return res.status(200).json({
      success: true,
      message: '솔라피 상태 동기화 완료',
      data: {
        messageId,
        groupId,
        totalCount: finalTotalCount,
        successCount,
        failCount,
        sendingCount,
        status: finalStatus,
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

