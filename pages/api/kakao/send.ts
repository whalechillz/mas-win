import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 카카오 메시지 발송 API
 * 
 * POST /api/kakao/send
 * Body: {
 *   message: string,
 *   imageUrl?: string,
 *   recipients: string[],
 *   scheduleDate?: string,
 *   messageType?: 'ALIMTALK' | 'FRIENDTALK',
 *   title?: string
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      message,
      imageUrl,
      recipients,
      scheduleDate,
      messageType = 'FRIENDTALK',
      title,
    } = req.body;

    if (!message || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: '메시지 내용과 수신자 목록이 필요합니다.',
      });
    }

    // 전화번호 정규화
    const normalizedRecipients = recipients.map((phone: string) =>
      String(phone).replace(/[^0-9]/g, '')
    ).filter((phone: string) => phone.length >= 10);

    if (normalizedRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: '유효한 수신자가 없습니다.',
      });
    }

    // 수신거부 고객 제외
    const { data: optedOut } = await supabase
      .from('customers')
      .select('phone')
      .in('phone', normalizedRecipients)
      .eq('opt_out', true);

    const optedOutPhones = new Set<string>();
    if (optedOut) {
      optedOut.forEach(customer => {
        if (customer.phone) {
          const normalized = customer.phone.replace(/[^0-9]/g, '');
          optedOutPhones.add(normalized);
        }
      });
    }

    const validRecipients = normalizedRecipients.filter(phone => !optedOutPhones.has(phone));

    if (validRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: '수신거부 제외 후 발송 가능한 수신자가 없습니다.',
      });
    }

    // 카카오 채널 메시지 저장 (channel_kakao 테이블)
    const now = new Date().toISOString();
    const { data: kakaoMessage, error: insertError } = await supabase
      .from('channel_kakao')
      .insert({
        title: title || '카카오 메시지',
        message_text: message,
        message_type: messageType,
        image_url: imageUrl || null,
        status: scheduleDate ? 'scheduled' : 'draft',
        scheduled_at: scheduleDate || null,
        recipient_numbers: validRecipients,
        recipient_count: validRecipients.length,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (insertError) {
      console.error('카카오 메시지 저장 오류:', insertError);
      return res.status(500).json({
        success: false,
        message: '메시지 저장에 실패했습니다.',
        error: insertError.message,
      });
    }

    // 실제 카카오 API 발송은 여기서 구현해야 함
    // 현재는 저장만 하고, 실제 발송은 카카오 비즈니스 파트너센터에서 수동으로 해야 함
    // 또는 카카오 비즈니스 API를 연동해야 함

    // message_logs 기록 (발송 예정)
    if (kakaoMessage) {
      const logsToInsert = validRecipients.map((phone: string) => ({
        content_id: String(kakaoMessage.id),
        customer_phone: phone,
        customer_id: null,
        message_type: messageType.toLowerCase(),
        status: scheduleDate ? 'scheduled' : 'draft',
        channel: 'kakao',
        sent_at: scheduleDate || now,
      }));

      await supabase
        .from('message_logs')
        .upsert(logsToInsert, { onConflict: 'content_id,customer_phone' });
    }

    return res.status(200).json({
      success: true,
      data: {
        messageId: kakaoMessage?.id,
        recipientCount: validRecipients.length,
        excludedCount: normalizedRecipients.length - validRecipients.length,
        status: scheduleDate ? 'scheduled' : 'draft',
        scheduledAt: scheduleDate || null,
        message: '카카오 메시지가 저장되었습니다. 실제 발송은 카카오 비즈니스 파트너센터에서 진행해주세요.',
      },
    });
  } catch (error: any) {
    console.error('카카오 메시지 발송 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}

