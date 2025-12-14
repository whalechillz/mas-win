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
    // 1. message_logs 조회 (기존 방식)
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

    // 2. channel_sms에서 직접 조회 (예약 관련 메시지 포함)
    // recipient_numbers 배열에 해당 전화번호가 포함된 레코드 조회
    const { data: channelSmsRecords, error: channelSmsError } = await supabase
      .from('channel_sms')
      .select('id, message_text, message_type, status, note, solapi_group_id, sent_at, scheduled_at, success_count, fail_count, image_url, created_at, recipient_numbers, metadata')
      .order('created_at', { ascending: false })
      .limit(limit * 2); // 충분히 가져온 후 필터링

    if (channelSmsError) {
      console.error('channel_sms 조회 오류:', channelSmsError);
      // channel_sms 조회 실패해도 message_logs는 반환
    }

    // recipient_numbers 배열에서 해당 전화번호가 포함된 레코드만 필터링
    const filteredChannelSms = (channelSmsRecords || []).filter((record) => {
      if (!record.recipient_numbers || !Array.isArray(record.recipient_numbers)) return false;
      return record.recipient_numbers.some((phone) => {
        const normalized = normalizePhone(phone);
        const formatted = formatPhone(normalized);
        return normalized === normalizedPhone || formatted === formattedPhone || 
               normalized === formattedPhone || formatted === normalizedPhone;
      });
    });

    // 3. message_logs 처리 (기존 로직)
    const messageIds = Array.from(
      new Set(
        (logs || [])
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
      } else {
        smsDetailsMap = new Map((smsDetails || []).map((item) => [item.id, item]));
      }
    }

    // 4. message_logs 기반 메시지 변환
    const messagesFromLogs = (logs || []).map((log) => {
      const contentIdNumber = Number(log.content_id);
      const detail = !Number.isNaN(contentIdNumber) ? smsDetailsMap.get(contentIdNumber) : null;

      return {
        logId: log.id,
        messageId: Number.isNaN(contentIdNumber) ? null : contentIdNumber,
        messageText: detail?.message_text || null,
        messageType: detail?.message_type || log.message_type || null,
        sentAt: log.sent_at || detail?.sent_at || null,
        createdAt: detail?.created_at || null,
        sendStatus: log.status || null,
        messageStatus: detail?.status || null,
        note: detail?.note || null,
        solapiGroupId: detail?.solapi_group_id || null,
        successCount: detail?.success_count !== undefined ? detail.success_count : null,
        failCount: detail?.fail_count !== undefined ? detail.fail_count : null,
        imageUrl: detail?.image_url || null,
        isBookingMessage: false,
      };
    });

    // 5. channel_sms 기반 메시지 변환 (예약 관련 메시지)
    const messagesFromChannelSms = filteredChannelSms
      .filter((record) => {
        // message_logs에 이미 포함된 메시지는 제외 (중복 방지)
        return !messageIds.includes(record.id);
      })
      .map((record) => {
        // metadata에서 예약 정보 확인
        const isBookingMessage = record.metadata?.booking_id || record.note?.includes('예약');

        return {
          logId: null, // channel_sms 직접 조회는 logId 없음
          messageId: record.id,
          messageText: record.message_text || null,
          messageType: record.message_type || null,
          sentAt: record.sent_at || record.scheduled_at || record.created_at || null,
          createdAt: record.created_at || null,
          sendStatus: record.status === 'sent' ? 'sent' : record.status === 'draft' ? 'pending' : 'failed',
          messageStatus: record.status || null,
          note: record.note || null,
          solapiGroupId: record.solapi_group_id || null,
          successCount: record.success_count !== undefined ? record.success_count : null,
          failCount: record.fail_count !== undefined ? record.fail_count : null,
          imageUrl: record.image_url || null,
          isBookingMessage: isBookingMessage,
          bookingId: record.metadata?.booking_id || null,
          notificationType: record.metadata?.notification_type || null,
        };
      });

    // 6. 두 결과 병합 및 정렬
    const allMessages = [...messagesFromLogs, ...messagesFromChannelSms]
      .sort((a, b) => {
        const dateA = new Date(a.sentAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.sentAt || b.createdAt || 0).getTime();
        return dateB - dateA; // 최신순
      })
      .slice(offset, offset + limit); // 페이지네이션

    return res.status(200).json({
      success: true,
      messages: allMessages,
      total: (count || 0) + filteredChannelSms.length,
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

