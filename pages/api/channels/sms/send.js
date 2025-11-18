import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../../../utils/solapiSignature.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";
const SOLAPI_SENDER = process.env.SOLAPI_SENDER || "";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      channelPostId,
      messageType,
      messageText,
      content, // formData에서 오는 필드명
      imageUrl,
      recipientNumbers,
      shortLink
    } = req.body;

    // 환경 변수 검증
    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SOLAPI_SENDER) {
      console.error('솔라피 환경 변수 누락:', {
        hasApiKey: !!SOLAPI_API_KEY,
        hasApiSecret: !!SOLAPI_API_SECRET,
        hasSender: !!SOLAPI_SENDER
      });
      return res.status(500).json({ 
        success: false, 
        message: 'SMS 서비스 설정이 완료되지 않았습니다.' 
      });
    }

    // 필수 필드 검증
    const messageContent = messageText || content;
    if (!channelPostId || !messageType || !messageContent || !recipientNumbers?.length) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 필드가 누락되었습니다.' 
      });
    }

    // 수신자 번호 형식 검증
    const validNumbers = recipientNumbers.filter(num => 
      /^010-\d{4}-\d{4}$/.test(num) || /^010\d{8}$/.test(num)
    );

    if (validNumbers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '유효한 수신자 번호가 없습니다.' 
      });
    }

    // 솔라피 발송 메시지 구성
    let finalMessage = messageContent;
    if (shortLink) {
      finalMessage += `\n\n링크: ${shortLink}`;
    }

    // 메시지 타입 매핑 (SMS300은 지원하지 않으므로 LMS로 변환)
    const solapiType = messageType === 'SMS300' ? 'LMS' : messageType;
    const fromNumber = SOLAPI_SENDER.replace(/[\-\s]/g, '');

    // 1) 수신거부(Opt-out) 고객 제외 처리
    let candidates = validNumbers.map(n => n.replace(/[\-\s]/g, ''));
    try {
      const { data: optedOut, error: optErr } = await supabase
        .from('customers')
        .select('phone')
        .in('phone', candidates)
        .eq('opt_out', true);
      if (optErr) {
        console.error('opt-out 조회 오류(무시하고 진행):', optErr);
      } else if (optedOut && optedOut.length) {
        const blocked = new Set(optedOut.map(o => String(o.phone)));
        candidates = candidates.filter(p => !blocked.has(p));
      }
    } catch (e) {
      console.error('opt-out 필터링 예외(무시하고 진행):', e);
    }

    if (candidates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '수신거부 제외 후 발송 가능한 수신자가 없습니다.'
      });
    }

    // [신규] 동일 허브콘텐츠(content_id)로 이미 보낸 번호는 제외 (내용과 무관하게 1회 원칙)
    let uniqueToSend = candidates;
    try {
      const { data: already } = await supabase
        .from('message_logs')
        .select('customer_phone')
        .eq('content_id', String(channelPostId))
        .in('customer_phone', candidates);
      if (already && already.length) {
        const sentSet = new Set(already.map(r => String(r.customer_phone)));
        uniqueToSend = candidates.filter(p => !sentSet.has(p));
      }
    } catch (e) {
      console.error('중복 발송 필터링 오류(무시하고 진행):', e);
    }

    if (uniqueToSend.length === 0) {
      return res.status(200).json({
        success: true,
        message: '동일 허브콘텐츠로 이미 모든 대상에게 발송되어 중복 제외되었습니다.',
        result: { groupIds: [], sentCount: 0, successCount: 0, failCount: 0 },
        duplicates: candidates.length
      });
    }

    // Solapi v4 API로 발송 (성공한 test-sms 방식 사용)
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

    // 전체 수신자 messages 구성
    const allMessages = uniqueToSend.map(num => ({
      to: num,
      from: fromNumber,
      text: finalMessage,
      type: solapiType,
      ...(solapiType === 'MMS' && imageUrl ? { imageId: imageUrl } : {})
    }));

    // MMS인데 이미지가 없으면 LMS로 변경
    if (solapiType === 'MMS' && !imageUrl) {
      for (const m of allMessages) m.type = 'LMS';
    }

    // 200건씩 청크 전송 및 응답 집계 (부분 성공 처리)
    const chunkSize = 200;
    let aggregated = { groupIds: [], messageResults: [], successCount: 0, failCount: 0 };
    const chunkErrors = []; // 실패한 청크 정보 저장
    const totalChunks = Math.ceil(allMessages.length / chunkSize);
    
    for (let i = 0; i < allMessages.length; i += chunkSize) {
      const chunkIndex = Math.floor(i / chunkSize) + 1;
      const chunk = allMessages.slice(i, i + chunkSize);
      const payload = { messages: chunk };
      
      try {
        const resp = await fetch('https://api.solapi.com/messages/v4/send-many/detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(payload)
        });
        const json = await resp.json();
        console.log(`Solapi chunk ${chunkIndex}/${totalChunks} 응답:`, json);
        
        if (!resp.ok) {
          // 청크 실패 시 오류 기록하지만 계속 진행
          const errorInfo = {
            chunkIndex,
            status: resp.status,
            error: json,
            messageCount: chunk.length,
            range: `${i + 1}-${Math.min(i + chunkSize, allMessages.length)}`
          };
          chunkErrors.push(errorInfo);
          console.error(`❌ 청크 ${chunkIndex} 발송 실패:`, errorInfo);
          
          // 실패한 청크의 메시지들을 failCount에 추가
          aggregated.failCount += chunk.length;
          
          // 실패한 메시지들을 messageResults에 추가 (status: 'failed')
          chunk.forEach((msg, idx) => {
            aggregated.messageResults.push({
              to: msg.to,
              status: 'failed',
              errorCode: json.errorCode || 'CHUNK_ERROR',
              errorMessage: json.errorMessage || `청크 ${chunkIndex} 발송 실패`
            });
          });
          
          continue; // 다음 청크 계속 진행
        }
        
        // 성공한 청크 처리
        aggregated.groupIds.push(json.groupInfo?.groupId);
        aggregated.messageResults.push(...(json.messages || []));
        aggregated.successCount += json.groupInfo?.successCount || 0;
        aggregated.failCount += json.groupInfo?.failCount || 0;
        
        console.log(`✅ 청크 ${chunkIndex} 발송 성공: ${json.groupInfo?.successCount || 0}건 성공, ${json.groupInfo?.failCount || 0}건 실패`);
        
      } catch (chunkError) {
        // 네트워크 오류 등 예외 처리
        const errorInfo = {
          chunkIndex,
          error: chunkError.message,
          messageCount: chunk.length,
          range: `${i + 1}-${Math.min(i + chunkSize, allMessages.length)}`
        };
        chunkErrors.push(errorInfo);
        console.error(`❌ 청크 ${chunkIndex} 예외 발생:`, errorInfo);
        
        // 실패한 청크의 메시지들을 failCount에 추가
        aggregated.failCount += chunk.length;
        
        // 실패한 메시지들을 messageResults에 추가
        chunk.forEach((msg) => {
          aggregated.messageResults.push({
            to: msg.to,
            status: 'failed',
            errorCode: 'NETWORK_ERROR',
            errorMessage: chunkError.message
          });
        });
      }
    }
    
    // 부분 성공 여부 확인
    const hasPartialSuccess = aggregated.successCount > 0 && aggregated.failCount > 0;
    const allFailed = aggregated.successCount === 0 && aggregated.failCount > 0;
    const allSuccess = aggregated.failCount === 0 && aggregated.successCount > 0;

    // per-recipient 로그 및 연락 이벤트 기록 (고객 매핑은 후속 단계에서 강화)
    try {
      const nowIso = new Date().toISOString();
      const logsToInsert = aggregated.messageResults.map((r, idx) => ({
        content_id: String(channelPostId),
        customer_phone: uniqueToSend[idx] || null,
        customer_id: null,
        message_type: (solapiType || 'SMS').toLowerCase(),
        status: (r.status || 'sent'),
        channel: 'solapi',
        sent_at: nowIso
      }));
      if (logsToInsert.length) {
        // 동일 content_id+phone은 1회만 기록(재시도 시 갱신)
        const { error: logErr } = await supabase
          .from('message_logs')
          .upsert(logsToInsert, { onConflict: 'content_id,customer_phone' });
        if (logErr) console.error('message_logs 적재 오류:', logErr);
      }
      const successCount = aggregated.messageResults.filter(r => (r.status || '').toLowerCase() !== 'failed').length;
      if (successCount > 0) {
        const { error: ceErr } = await supabase.from('contact_events').insert([
          {
            customer_id: null,
            occurred_at: nowIso,
            direction: 'outbound',
            channel: 'sms',
            note: `발송 ${successCount}건 (groupIds: ${aggregated.groupIds.filter(Boolean).join(',')})`,
            source: 'system'
          }
        ]);
        if (ceErr) console.error('contact_events 적재 오류:', ceErr);
      }
    } catch (e) {
      console.error('per-recipient 로깅 오류:', e);
    }

    // 발송 결과를 데이터베이스에 업데이트 (부분 성공도 처리)
    const finalStatus = allSuccess ? 'sent' : (hasPartialSuccess ? 'partial' : 'failed');
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        status: finalStatus,
        solapi_group_id: aggregated.groupIds[0] || null,
        solapi_message_id: null,
        sent_at: new Date().toISOString(),
        sent_count: uniqueToSend.length,
        success_count: aggregated.successCount,
        fail_count: aggregated.failCount
      })
      .eq('id', channelPostId);

    if (updateError) {
      console.error('SMS 상태 업데이트 오류:', updateError);
    }

    // AI 사용량 로그에도 SMS 발송 기록 추가
    try {
      const smsCost = validNumbers.length * 0.02; // SMS 1건당 0.02달러 가정
      const { error: aiLogError } = await supabase
        .from('ai_usage_logs')
        .insert([{
          api_endpoint: 'solapi-sms',
          model: 'SMS',
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
          cost: smsCost,
          improvement_type: 'sms-send-success',
          content_type: 'sms',
          user_agent: 'sms-sender',
          ip_address: null,
          created_at: new Date().toISOString()
        }]);

      if (aiLogError) {
        console.error('AI 사용량 로그 저장 오류:', aiLogError);
      }
    } catch (logError) {
      console.error('AI 사용량 로깅 중 예외:', logError);
    }

    // 응답 메시지 결정
    let responseMessage = 'SMS가 성공적으로 발송되었습니다.';
    let responseStatus = 200;
    
    if (hasPartialSuccess) {
      responseMessage = `부분 성공: ${aggregated.successCount}건 발송 성공, ${aggregated.failCount}건 실패`;
      responseStatus = 207; // Multi-Status (부분 성공)
    } else if (allFailed) {
      responseMessage = `발송 실패: 모든 메시지 발송에 실패했습니다.`;
      responseStatus = 500;
    }
    
    return res.status(responseStatus).json({
      success: !allFailed, // 부분 성공도 success: true
      result: {
        groupIds: aggregated.groupIds,
        sentCount: uniqueToSend.length,
        successCount: aggregated.successCount,
        failCount: aggregated.failCount,
        totalChunks: totalChunks,
        failedChunks: chunkErrors.length,
        chunkErrors: chunkErrors.length > 0 ? chunkErrors : undefined
      },
      duplicates: candidates.length - uniqueToSend.length,
      message: responseMessage,
      solapiResponse: aggregated,
      warnings: chunkErrors.length > 0 ? `일부 청크 발송 실패: ${chunkErrors.length}개 청크` : undefined
    });

  } catch (error) {
    console.error('SMS 발송 오류:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      requestData: {
        channelPostId: req.body.channelPostId,
        messageType: req.body.messageType,
        recipientCount: req.body.recipientNumbers?.length
      }
    });

    // 발송 실패 시 상태 업데이트
    if (req.body.channelPostId) {
      try {
        await supabase
          .from('channel_sms')
          .update({
            status: 'failed',
            sent_at: new Date().toISOString(),
            fail_count: req.body.recipientNumbers?.length || 0
          })
          .eq('id', req.body.channelPostId);
      } catch (updateError) {
        console.error('SMS 실패 상태 업데이트 오류:', updateError);
      }
    }

    // SMS 발송 실패도 AI 사용량 로그에 기록
    try {
      const smsCost = (req.body.recipientNumbers?.length || 0) * 0.02;
      const { error: aiLogError } = await supabase
        .from('ai_usage_logs')
        .insert([{
          api_endpoint: 'solapi-sms',
          model: 'SMS',
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
          cost: smsCost,
          improvement_type: 'sms-send-failed',
          content_type: 'sms',
          user_agent: 'sms-sender',
          ip_address: null,
          created_at: new Date().toISOString()
        }]);

      if (aiLogError) {
        console.error('AI 사용량 로그 저장 오류:', aiLogError);
      }
    } catch (logError) {
      console.error('AI 사용량 로깅 중 예외:', logError);
    }

    // 솔라피 API 오류인 경우 더 구체적인 메시지 제공
    let errorMessage = 'SMS 발송 중 오류가 발생했습니다.';
    if (error.message.includes('401')) {
      errorMessage = 'SMS 서비스 인증에 실패했습니다. API 키를 확인해주세요.';
    } else if (error.message.includes('400')) {
      errorMessage = 'SMS 요청 형식이 올바르지 않습니다.';
    } else if (error.message.includes('errorList')) {
      errorMessage = `SMS 발송 실패: ${error.message}`;
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: error.response?.data
    });
  }
}