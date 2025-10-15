import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      channelPostId,
      messageType,
      messageText,
      imageUrl,
      recipientNumbers,
      shortLink
    } = req.body;

    // 필수 필드 검증
    if (!channelPostId || !messageType || !messageText || !recipientNumbers?.length) {
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
    let finalMessage = messageText;
    if (shortLink) {
      finalMessage += `\n\n링크: ${shortLink}`;
    }

    // 솔라피 API로 발송 (동적 import 사용)
    const { SolapiMessageService } = await import('solapi');
    const messageService = new SolapiMessageService(
      process.env.SOLAPI_API_KEY,
      process.env.SOLAPI_API_SECRET
    );

    const messages = validNumbers.map(to => {
      const message = {
        to: to.replace(/-/g, ''), // 하이픈 제거
        from: process.env.SOLAPI_SENDER,
        text: finalMessage,
        type: messageType
      };

      // MMS인 경우 이미지 추가
      if (messageType === 'MMS' && imageUrl) {
        message.imageId = imageUrl; // 이미지 ID 또는 URL
      }

      return message;
    });

    // 솔라피 API 호출
    const result = await messageService.send(messages);

    // 발송 결과를 데이터베이스에 업데이트
    const { error: updateError } = await supabase
      .from('channel_sms')
      .update({
        status: 'sent',
        solapi_group_id: result.groupId,
        solapi_message_id: result.messageId,
        sent_at: new Date().toISOString(),
        sent_count: validNumbers.length,
        success_count: result.successCount || validNumbers.length,
        fail_count: result.failCount || 0
      })
      .eq('id', channelPostId);

    if (updateError) {
      console.error('SMS 상태 업데이트 오류:', updateError);
    }

    return res.status(200).json({ 
      success: true, 
      result: {
        groupId: result.groupId,
        messageId: result.messageId,
        sentCount: validNumbers.length,
        successCount: result.successCount || validNumbers.length,
        failCount: result.failCount || 0
      },
      message: 'SMS가 성공적으로 발송되었습니다.' 
    });

  } catch (error) {
    console.error('SMS 발송 오류:', error);
    
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

    return res.status(500).json({ 
      success: false, 
      message: 'SMS 발송 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
}
