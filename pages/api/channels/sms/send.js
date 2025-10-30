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

    // Solapi v4 API로 발송 (성공한 test-sms 방식 사용)
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

    // 전체 수신자 messages 구성
    const allMessages = candidates.map(num => ({
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

    // 200건씩 청크 전송 및 응답 집계
    const chunkSize = 200;
    let aggregated = { groupIds: [], messageResults: [], successCount: 0, failCount: 0 };
    for (let i = 0; i < allMessages.length; i += chunkSize) {
      const chunk = allMessages.slice(i, i + chunkSize);
      const payload = { messages: chunk };
      const resp = await fetch('https://api.solapi.com/messages/v4/send-many/detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload)
      });
      const json = await resp.json();
      console.log('Solapi chunk 응답:', json);
      if (!resp.ok) {
        throw new Error(`Solapi API 오류: ${resp.status} - ${JSON.stringify(json)}`);
      }
      aggregated.groupIds.push(json.groupInfo?.groupId);
      aggregated.messageResults.push(...(json.messages || []));
      aggregated.successCount += json.groupInfo?.successCount || 0;
      aggregated.failCount += json.groupInfo?.failCount || 0;
    }

    // per-recipient 로그 및 연락 이벤트 기록 (고객 매핑은 후속 단계에서 강화)
    try {
      const nowIso = new Date().toISOString();
      const logsToInsert = aggregated.messageResults.map(r => ({
        customer_id: null,
        message_type: (solapiType || 'SMS').toLowerCase(),
        status: (r.status || 'sent'),
        channel: 'solapi',
        sent_at: nowIso
      }));
      if (logsToInsert.length) {
        const { error: logErr } = await supabase.from('message_logs').insert(logsToInsert);
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

    // 발송 결과를 데이터베이스에 업데이트
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        status: 'sent',
        solapi_group_id: aggregated.groupIds[0] || null,
        solapi_message_id: null,
        sent_at: new Date().toISOString(),
        sent_count: candidates.length,
        success_count: aggregated.successCount || candidates.length,
        fail_count: aggregated.failCount || 0
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

    return res.status(200).json({
      success: true,
      result: {
        groupIds: aggregated.groupIds,
        sentCount: candidates.length,
        successCount: aggregated.successCount || candidates.length,
        failCount: aggregated.failCount || 0
      },
      message: 'SMS가 성공적으로 발송되었습니다.',
      solapiResponse: aggregated
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