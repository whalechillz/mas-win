// Send Marketing Message API
// /pages/api/marketing/send-message.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { HOOKING_MESSAGES, formatMessageForChannel } from '@/data/hooking-messages';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// SMS/카카오톡/이메일 서비스 설정
const SMS_API_KEY = process.env.SMS_API_KEY;
const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    messageId, 
    channel, 
    targetAudience, 
    sendNow,
    scheduledTime 
  } = req.body;

  if (!messageId || !channel) {
    return res.status(400).json({ 
      error: 'Message ID and channel are required' 
    });
  }

  try {
    // 메시지 가져오기
    const message = HOOKING_MESSAGES.messages.find(m => m.id === messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // 채널별 포맷팅
    const formattedMessage = formatMessageForChannel(messageId, channel);

    // 수신자 목록 가져오기
    const recipients = await getRecipients(targetAudience, channel);

    let sendResults = { success: 0, failed: 0, total: recipients.length };

    if (sendNow) {
      // 즉시 발송
      sendResults = await sendToChannel(
        channel,
        formattedMessage,
        recipients
      );
      
      // 발송 로그 저장
      await logMessageSend({
        messageId,
        channel,
        recipients: sendResults.total,
        success: sendResults.success,
        failed: sendResults.failed,
        sentAt: new Date().toISOString()
      });
    } else {
      // 스케줄 저장
      await scheduleMessage({
        messageId,
        channel,
        targetAudience,
        scheduledTime,
        status: 'scheduled'
      });
    }

    // 메시지 성과 업데이트
    await updateMessagePerformance(messageId, channel);

    return res.status(200).json({
      success: true,
      messageId,
      channel,
      recipientCount: recipients.length,
      sendResults,
      message: sendNow ? '발송 완료' : '스케줄 등록 완료'
    });

  } catch (error: any) {
    console.error('Message send error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to send message' 
    });
  }
}

/**
 * 수신자 목록 가져오기
 */
async function getRecipients(
  targetAudience: string[],
  channel: string
): Promise<any[]> {
  const recipients: any[] = [];
  
  // 기존 고객
  if (targetAudience.includes('existing_customers')) {
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('status', 'active')
      .not('phone', 'is', null);
    
    if (customers) {
      recipients.push(...customers);
    }
  }
  
  // 문의 고객
  if (targetAudience.includes('inquired_customers')) {
    const { data: inquiries } = await supabase
      .from('inquiries')
      .select('*')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
    
    if (inquiries) {
      recipients.push(...inquiries);
    }
  }
  
  // 채널별 구독자
  if (channel === 'kakao' && targetAudience.includes('channel_subscribers')) {
    const { data: subscribers } = await supabase
      .from('kakao_subscribers')
      .select('*')
      .eq('status', 'active');
    
    if (subscribers) {
      recipients.push(...subscribers);
    }
  }
  
  if (channel === 'email' && targetAudience.includes('email_subscribers')) {
    const { data: subscribers } = await supabase
      .from('email_subscribers')
      .select('*')
      .eq('status', 'active');
    
    if (subscribers) {
      recipients.push(...subscribers);
    }
  }
  
  // 중복 제거
  const uniqueRecipients = Array.from(
    new Map(recipients.map(r => [r.phone || r.email, r])).values()
  );
  
  return uniqueRecipients;
}

/**
 * 채널별 발송
 */
async function sendToChannel(
  channel: string,
  message: any,
  recipients: any[]
): Promise<{ success: number; failed: number; total: number }> {
  let success = 0;
  let failed = 0;
  
  for (const recipient of recipients) {
    try {
      switch (channel) {
        case 'sms':
          await sendSMS(recipient.phone, message);
          break;
        case 'kakao':
          await sendKakao(recipient.kakao_id || recipient.phone, message);
          break;
        case 'email':
          await sendEmail(recipient.email, message);
          break;
        case 'social':
          await postToSocial(message);
          break;
      }
      success++;
    } catch (error) {
      console.error(`Failed to send to ${recipient.phone || recipient.email}:`, error);
      failed++;
    }
  }
  
  return { success, failed, total: recipients.length };
}

/**
 * SMS 발송
 */
async function sendSMS(phone: string, message: string): Promise<void> {
  // 실제 구현에서는 SMS API 호출
  // 예: 알리고, 솔루션박스 등
  
  if (!SMS_API_KEY) {
    console.log('SMS (시뮬레이션):', phone, message);
    return;
  }
  
  // 실제 API 호출 예시
  /*
  const response = await fetch('https://api.aligo.in/send/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      key: SMS_API_KEY,
      user_id: 'masgolf',
      sender: '15880000',
      receiver: phone,
      msg: message,
      msg_type: 'SMS'
    })
  });
  */
  
  console.log(`SMS sent to ${phone}: ${message.substring(0, 50)}...`);
}

/**
 * 카카오톡 발송
 */
async function sendKakao(kakaoId: string, message: string): Promise<void> {
  // 실제 구현에서는 카카오 알림톡/친구톡 API 호출
  
  if (!KAKAO_API_KEY) {
    console.log('Kakao (시뮬레이션):', kakaoId, message);
    return;
  }
  
  // 실제 API 호출 예시
  /*
  const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KAKAO_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      template_object: JSON.stringify({
        object_type: 'text',
        text: message,
        link: {
          web_url: 'https://masgolf.co.kr',
          mobile_web_url: 'https://masgolf.co.kr'
        }
      })
    })
  });
  */
  
  console.log(`Kakao message sent to ${kakaoId}`);
}

/**
 * 이메일 발송
 */
async function sendEmail(email: string, message: any): Promise<void> {
  // 실제 구현에서는 SendGrid/Mailgun API 호출
  
  if (!SENDGRID_API_KEY) {
    console.log('Email (시뮬레이션):', email, message.subject);
    return;
  }
  
  // SendGrid 예시
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(SENDGRID_API_KEY);
  
  const msg = {
    to: email,
    from: 'info@masgolf.co.kr',
    subject: message.subject,
    text: message.preview,
    html: message.body
  };
  
  await sgMail.send(msg);
  */
  
  console.log(`Email sent to ${email}: ${message.subject}`);
}

/**
 * 소셜미디어 포스팅
 */
async function postToSocial(message: any): Promise<void> {
  // 실제 구현에서는 Facebook/Instagram API 호출
  
  console.log('Social media post:', message.post1);
  
  // Facebook Graph API 예시
  /*
  const response = await fetch(`https://graph.facebook.com/v12.0/me/feed`, {
    method: 'POST',
    body: new URLSearchParams({
      message: message.post1,
      access_token: FACEBOOK_TOKEN
    })
  });
  */
}

/**
 * 발송 로그 저장
 */
async function logMessageSend(data: any): Promise<void> {
  await supabase
    .from('message_send_logs')
    .insert({
      message_id: data.messageId,
      channel: data.channel,
      recipients: data.recipients,
      success: data.success,
      failed: data.failed,
      sent_at: data.sentAt,
      created_at: new Date().toISOString()
    });
}

/**
 * 스케줄 저장
 */
async function scheduleMessage(data: any): Promise<void> {
  await supabase
    .from('message_schedules')
    .insert({
      message_id: data.messageId,
      channel: data.channel,
      target_audience: data.targetAudience,
      scheduled_time: data.scheduledTime,
      status: data.status,
      created_at: new Date().toISOString()
    });
}

/**
 * 메시지 성과 업데이트
 */
async function updateMessagePerformance(
  messageId: string,
  channel: string
): Promise<void> {
  // 실제 구현에서는 클릭률, 전환율 등을 추적
  console.log(`Performance tracking for ${messageId} on ${channel}`);
}
