import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const normalizePhone = (phone = '') => phone.replace(/[^0-9]/g, '');

const formatPhone = (phone = '') => {
  if (!phone) return '';
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  }
  if (phone.length === 10) {
    return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  return phone;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const phoneParam = typeof req.query.phone === 'string' ? req.query.phone : null;
  if (!phoneParam) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10) || 20, 100);
  const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);

  const normalizedPhone = normalizePhone(phoneParam);
  if (!normalizedPhone) {
    return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
  }
  const formattedPhone = formatPhone(normalizedPhone);

  try {
    const { data: logs, error: logsError, count } = await supabase
      .from('message_logs')
      .select('id, content_id, customer_phone, sent_at, status, message_type', { count: 'exact' })
      .or(`customer_phone.eq.${normalizedPhone},customer_phone.eq.${formattedPhone}`)
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      console.error('message_logs 조회 오류:', logsError);
      return res.status(500).json({ success: false, message: 'Failed to fetch message logs.' });
    }

    if (!logs || logs.length === 0) {
      return res.status(200).json({
        success: true,
        messages: [],
        total: count || 0,
        limit,
        offset
      });
    }

    const messageIds = Array.from(
      new Set(
        logs
          .map((log) => {
            const parsed = Number(log.content_id);
            return Number.isNaN(parsed) ? null : parsed;
          })
          .filter((id) => id !== null)
      )
    );

    let smsDetailsMap = new Map();
    if (messageIds.length > 0) {
      const { data: smsDetails, error: smsError } = await supabase
        .from('channel_sms')
        .select(
          'id, message_text, message_type, status, note, solapi_group_id, sent_at, success_count, fail_count, image_url, created_at'
        )
        .in('id', messageIds);

      if (smsError) {
        console.error('channel_sms 조회 오류:', smsError);
        // channel_sms 조회 실패해도 message_logs는 반환 (부분 실패 허용)
      } else {
        smsDetailsMap = new Map((smsDetails || []).map((item) => [item.id, item]));
      }
    }

    const messages = logs.map((log) => {
      const contentIdNumber = Number(log.content_id);
      const detail = !Number.isNaN(contentIdNumber) ? smsDetailsMap.get(contentIdNumber) : null;

      return {
        logId: log.id,
        messageId: Number.isNaN(contentIdNumber) ? null : contentIdNumber,
        messageText: detail?.message_text || null,
        messageType: detail?.message_type || log.message_type || null,
        sentAt: log.sent_at || detail?.sent_at || null,
        createdAt: detail?.created_at || null, // 메시지 생성 시간 추가
        sendStatus: log.status || null, // message_logs의 발송 상태 (실제 발송 결과)
        messageStatus: detail?.status || null, // channel_sms의 전체 메시지 상태
        note: detail?.note || null,
        solapiGroupId: detail?.solapi_group_id || null,
        successCount:
          detail?.success_count !== undefined ? detail.success_count : null,
        failCount: detail?.fail_count !== undefined ? detail.fail_count : null,
        imageUrl: detail?.image_url || null
      };
    });

    return res.status(200).json({
      success: true,
      messages,
      total: count || logs.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('고객 메시지 이력 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred.'
    });
  }
}

