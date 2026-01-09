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
    // 배열 필드 검색은 Supabase에서 직접 지원하지 않으므로 모든 레코드를 가져온 후 필터링
    const { data: channelSmsRecords, error: channelSmsError } = await supabase
      .from('channel_sms')
      .select('id, message_text, message_type, status, note, solapi_group_id, sent_at, scheduled_at, success_count, fail_count, image_url, created_at, recipient_numbers, metadata, message_category, message_subcategory')
      .order('created_at', { ascending: false })
      .limit(limit * 10); // 충분히 가져온 후 필터링 (중복 제거를 위해 더 많이 가져옴)

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
          'id, message_text, message_type, status, note, solapi_group_id, sent_at, success_count, fail_count, image_url, created_at, metadata, message_category, message_subcategory'
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

      // detail에서 예약 정보 확인 (더 강화된 로직)
      let isBookingMessage = false;
      if (detail) {
        // metadata가 객체인지 문자열인지 확인
        let metadata = detail.metadata;
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            metadata = null;
          }
        }

        // 예약 메시지 판단 조건
        isBookingMessage = !!(
          (metadata && metadata.booking_id) ||
          detail.note?.includes('예약') ||
          detail.note?.includes('시타') ||
          detail.message_text?.includes('예약') ||
          detail.message_text?.includes('시타') ||
          detail.note?.includes('스탭진 알림')
        );

        return {
          logId: log.id,
          messageId: Number.isNaN(contentIdNumber) ? null : contentIdNumber,
          messageText: detail.message_text || null,
          messageType: detail.message_type || log.message_type || null,
          sentAt: log.sent_at || detail.sent_at || null,
          createdAt: detail.created_at || null,
          sendStatus: log.status || null,
          messageStatus: detail.status || null,
          note: detail.note || null,
          solapiGroupId: detail.solapi_group_id || null,
          successCount: detail.success_count !== undefined ? detail.success_count : null,
          failCount: detail.fail_count !== undefined ? detail.fail_count : null,
          imageUrl: detail.image_url || null,
          isBookingMessage: isBookingMessage,
          bookingId: (metadata && metadata.booking_id) || null,
          notificationType: (metadata && metadata.notification_type) || null,
          messageCategory: detail.message_category || null, // ⭐ 추가
          messageSubcategory: detail.message_subcategory || null, // ⭐ 추가
        };
      } else {
        // detail이 null인 경우 (channel_sms에 없는 메시지)
        // 같은 시간대에 channel_sms에 있는 메시지를 찾아서 매칭 시도
        let matchedMessage = null;
        if (log.sent_at) {
          const logTime = new Date(log.sent_at).getTime();
          matchedMessage = filteredChannelSms.find(record => {
            const recordTime = new Date(record.sent_at || record.created_at || 0).getTime();
            // 1분 이내의 메시지 찾기
            return Math.abs(logTime - recordTime) < 60 * 1000;
          });
        }
        
        // 매칭된 메시지가 있으면 그 정보 사용
        if (matchedMessage) {
          let metadata = matchedMessage.metadata;
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata);
            } catch (e) {
              metadata = null;
            }
          }
          
          const isBookingMessage = !!(
            (metadata && metadata.booking_id) ||
            matchedMessage.note?.includes('예약') ||
            matchedMessage.note?.includes('시타') ||
            matchedMessage.message_text?.includes('예약') ||
            matchedMessage.message_text?.includes('시타') ||
            matchedMessage.note?.includes('스탭진 알림')
          );
          
          return {
            logId: log.id,
            messageId: matchedMessage.id,
            messageText: matchedMessage.message_text || null,
            messageType: matchedMessage.message_type || log.message_type || null,
            sentAt: log.sent_at || matchedMessage.sent_at || null,
            createdAt: matchedMessage.created_at || null,
            sendStatus: log.status || null,
            messageStatus: matchedMessage.status || null,
            note: matchedMessage.note || null,
            solapiGroupId: matchedMessage.solapi_group_id || null,
            successCount: matchedMessage.success_count !== undefined ? matchedMessage.success_count : null,
            failCount: matchedMessage.fail_count !== undefined ? matchedMessage.fail_count : null,
            imageUrl: matchedMessage.image_url || null,
            isBookingMessage: isBookingMessage,
            bookingId: (metadata && metadata.booking_id) || null,
            notificationType: (metadata && metadata.notification_type) || null,
            messageCategory: matchedMessage.message_category || null,
            messageSubcategory: matchedMessage.message_subcategory || null,
          };
        }
        
        // 매칭되지 않은 경우 (message_logs만 있는 메시지)
        return {
          logId: log.id,
          messageId: Number.isNaN(contentIdNumber) ? null : contentIdNumber,
          messageText: null,
          messageType: log.message_type || null,
          sentAt: log.sent_at || null,
          createdAt: null,
          sendStatus: log.status || null,
          messageStatus: null,
          note: null,
          solapiGroupId: null,
          successCount: null,
          failCount: null,
          imageUrl: null,
          isBookingMessage: false, // detail이 없으면 홍보 메시지로 간주
          bookingId: null,
          notificationType: null,
          messageCategory: null,
          messageSubcategory: null,
        };
      }
    });

    // 5. channel_sms 기반 메시지 변환 (예약 관련 메시지)
    const messagesFromChannelSms = filteredChannelSms
      .filter((record) => {
        // message_logs에 이미 포함된 메시지는 제외 (중복 방지)
        return !messageIds.includes(record.id);
      })
      .map((record) => {
        // metadata가 객체인지 문자열인지 확인
        let metadata = record.metadata;
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            metadata = null;
          }
        }

        // 예약 메시지 판단 조건 (더 강화된 로직)
        const isBookingMessage = !!(
          (metadata && metadata.booking_id) ||
          record.note?.includes('예약') ||
          record.note?.includes('시타') ||
          record.message_text?.includes('예약') ||
          record.message_text?.includes('시타') ||
          record.note?.includes('스탭진 알림')
        );

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
          bookingId: (metadata && metadata.booking_id) || null,
          notificationType: (metadata && metadata.notification_type) || null,
          messageCategory: record.message_category || null,
          messageSubcategory: record.message_subcategory || null,
        };
      });

    // 6. 두 결과 병합 및 중복 제거
    // messageId를 우선 기준으로 중복 제거 (같은 메시지가 여러 번 나타나는 것 방지)
    const messageMap = new Map();
    
    [...messagesFromLogs, ...messagesFromChannelSms].forEach(msg => {
      // messageId가 있으면 그것을 키로 사용 (가장 정확)
      // 없으면 solapiGroupId + sentAt 조합 사용
      // 그것도 없으면 logId + sentAt 사용
      let key;
      if (msg.messageId) {
        key = `id_${msg.messageId}`;
      } else if (msg.solapiGroupId && msg.sentAt) {
        // 그룹 ID와 발송 시간으로 중복 판단 (같은 그룹, 같은 시간 = 같은 메시지)
        const groupId = msg.solapiGroupId.split(',')[0].trim(); // 여러 그룹 ID 중 첫 번째만 사용
        const sentAtStr = new Date(msg.sentAt).toISOString().substring(0, 16); // 분 단위까지
        key = `group_${groupId}_${sentAtStr}`;
      } else if (msg.logId && msg.sentAt) {
        const sentAtStr = new Date(msg.sentAt).toISOString().substring(0, 16);
        key = `log_${msg.logId}_${sentAtStr}`;
      } else {
        // 키를 만들 수 없으면 건너뜀
        return;
      }
      
      // 이미 존재하는 메시지와 비교
      const existing = messageMap.get(key);
      if (!existing) {
        // 새 메시지 추가
        messageMap.set(key, msg);
      } else {
        // 기존 메시지와 병합 (더 많은 정보가 있는 것으로 선택)
        // messageId가 있는 것이 우선
        if (!existing.messageId && msg.messageId) {
          messageMap.set(key, { ...existing, ...msg });
        } else if (existing.messageId && !msg.messageId) {
          // 기존 것이 더 나음, 유지
        } else if (existing.messageId && msg.messageId && existing.messageId !== msg.messageId) {
          // 둘 다 messageId가 있지만 다른 경우, 더 최근 것으로 선택
          const existingDate = new Date(existing.sentAt || existing.createdAt || 0).getTime();
          const msgDate = new Date(msg.sentAt || msg.createdAt || 0).getTime();
          if (msgDate > existingDate) {
            messageMap.set(key, msg);
          }
        } else {
          // messageText가 있는 것이 우선
          if (!existing.messageText && msg.messageText) {
            // 새 메시지에 내용이 있으면 교체
            messageMap.set(key, { ...existing, ...msg });
          } else if (existing.messageText && !msg.messageText) {
            // 기존 것이 더 나음, 유지
          } else if (existing.messageText && msg.messageText) {
            // 둘 다 있으면 더 긴 내용을 가진 것으로 선택
            if (msg.messageText.length > existing.messageText.length) {
              messageMap.set(key, { ...existing, ...msg });
            }
          } else {
            // 둘 다 없으면 더 최근 것으로 선택
            const existingDate = new Date(existing.sentAt || existing.createdAt || 0).getTime();
            const msgDate = new Date(msg.sentAt || msg.createdAt || 0).getTime();
            if (msgDate > existingDate) {
              messageMap.set(key, msg);
            }
          }
        }
      }
    });
    
    // 7. 정렬 및 페이지네이션
    const allMessages = Array.from(messageMap.values())
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

