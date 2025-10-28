import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Solapi HMAC-SHA256 인증 함수들
function generateSignature(apiSecret, dateTime, salt) {
  const data = dateTime + salt;
  return crypto
    .createHmac('sha256', apiSecret)
    .update(data)
    .digest('hex');
}

function createAuthHeader(apiKey, apiSecret) {
  const dateTime = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const signature = generateSignature(apiSecret, dateTime, salt);
  
  // Authorization 헤더를 따옴표로 감싸서 구성
  return `HMAC-SHA256 apiKey="${apiKey}", date="${dateTime}", salt="${salt}", signature="${signature}"`;
}

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
    if (!process.env.SOLAPI_API_KEY || !process.env.SOLAPI_API_SECRET || !process.env.SOLAPI_SENDER) {
      console.error('솔라피 환경 변수 누락:', {
        hasApiKey: !!process.env.SOLAPI_API_KEY,
        hasApiSecret: !!process.env.SOLAPI_API_SECRET,
        hasSender: !!process.env.SOLAPI_SENDER
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

    // 메시지 타입 매핑 및 메시지 배열 구성
    const solapiType = messageType === 'SMS300' ? 'SMS' : messageType;
    const fromNumber = (process.env.SOLAPI_SENDER || '0312150013').replace(/[^0-9]/g, '');
    const messages = validNumbers.map(to => {
      const toNumber = to.replace(/[^0-9]/g, '');
      const msg = { to: toNumber, from: fromNumber, text: finalMessage, type: solapiType };
      if (solapiType === 'MMS' && imageUrl) {
        msg.imageId = imageUrl; // 사전 업로드된 imageId 필요
      }
      return msg;
    });

  // Solapi v3 API 사용 (fetch API)
  const basicAuth = Buffer.from(`${process.env.SOLAPI_API_KEY}:${process.env.SOLAPI_API_SECRET}`).toString('base64');
  
  console.log('API Key:', process.env.SOLAPI_API_KEY);
  console.log('API Secret:', process.env.SOLAPI_API_SECRET);
  console.log('Basic Auth:', basicAuth);
  
  const response = await fetch('https://api.solapi.com/messages/v3/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${basicAuth}`
    },
    body: JSON.stringify({
      message: messages[0] // 첫 번째 메시지만 전송
    })
  });
  
  const result = { data: await response.json() };

    // 발송 결과를 데이터베이스에 업데이트
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        status: 'sent',
        solapi_group_id: result.data.groupId,
        solapi_message_id: result.data.messageId,
        sent_at: new Date().toISOString(),
        sent_count: validNumbers.length,
        success_count: result.data.successCount || validNumbers.length,
        fail_count: result.data.failCount || 0
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
        groupId: result.data.groupId,
        messageId: result.data.messageId,
        sentCount: validNumbers.length,
        successCount: result.data.successCount || validNumbers.length,
        failCount: result.data.failCount || 0
      },
      message: 'SMS가 성공적으로 발송되었습니다.' 
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
    if (error.response?.status === 401) {
      errorMessage = 'SMS 서비스 인증에 실패했습니다. API 키를 확인해주세요.';
    } else if (error.response?.status === 400) {
      errorMessage = 'SMS 요청 형식이 올바르지 않습니다.';
    } else if (error.response?.data?.errorList) {
      errorMessage = `SMS 발송 실패: ${error.response.data.errorList.map(e => e.reason).join(', ')}`;
    }

    return res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: error.message,
      details: error.response?.data
    });
  }
}