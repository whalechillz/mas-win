import { sendSlackNotification } from '../../../lib/slack-notification.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 날짜에 요일 추가
function formatDateWithDay(dateStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}(${dayOfWeek})`;
  } catch {
    return dateStr;
  }
}

// 시간에서 초 제거
function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.split(':').slice(0, 2).join(':');
}

/**
 * 예약 정보를 Slack 메시지로 포맷팅
 */
function formatBookingSlackMessage(booking, type) {
  const blocks = [];

  // 헤더
  const typeLabels = {
    booking_created: '📝 예약 신청',
    booking_confirmed: '✅ 예약 확정',
    booking_completed: '🎉 예약 완료',
  };

  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: `${typeLabels[type] || '📋 예약 알림'}`,
      emoji: true,
    },
  });

  blocks.push({ type: 'divider' });

  // 예약 정보
  blocks.push({
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: `*고객명:*\n${booking.name || '-'}`,
      },
      {
        type: 'mrkdwn',
        text: `*전화번호:*\n${formatPhoneNumber(booking.phone) || '-'}`,
      },
      {
        type: 'mrkdwn',
        text: `*예약일시:*\n${formatDateWithDay(booking.date) || '-'} ${formatTime(booking.time) || ''}`,
      },
      {
        type: 'mrkdwn',
        text: `*서비스:*\n${booking.service_type || '-'}`,
      },
    ],
  });

  // 상태 정보
  if (booking.status) {
    const statusLabels = {
      pending: '⏳ 대기중',
      confirmed: '✅ 확정',
      completed: '🎉 완료',
      cancelled: '❌ 취소',
    };

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*상태:* ${statusLabels[booking.status] || booking.status}`,
      },
    });
  }

  // 참석 상태
  if (booking.attendance_status) {
    const attendanceLabels = {
      pending: '⏳ 참석 대기',
      attended: '✅ 참석',
      no_show: '⚠️ 노쇼',
      cancelled: '❌ 참석 취소',
    };

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*참석 상태:* ${attendanceLabels[booking.attendance_status] || booking.attendance_status}`,
      },
    });
  }

  // 메모
  if (booking.notes) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*메모:*\n\`\`\`${booking.notes}\`\`\``,
      },
    });
  }

  // 예약 상세 링크 (관리자 페이지)
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/booking`;
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `<${adminUrl}|📋 예약 관리 페이지에서 확인하기>`,
    },
  });

  return {
    username: '예약 알림봇',
    icon_emoji: ':calendar:',
    text: `${typeLabels[type] || '예약 알림'}: ${booking.name || '고객'}`,
    blocks,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { type, bookingId } = req.body;

    if (!type || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'type과 bookingId는 필수입니다.',
      });
    }

    if (!['booking_created', 'booking_confirmed', 'booking_completed'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 type입니다.',
      });
    }

    // 예약 정보 조회
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다.',
      });
    }

    // Slack 메시지 포맷팅
    const slackMessage = formatBookingSlackMessage(booking, type);

    // Slack 알림 전송
    try {
      await sendSlackNotification(slackMessage);
      return res.status(200).json({
        success: true,
        message: 'Slack 알림이 전송되었습니다.',
      });
    } catch (slackError) {
      console.error('Slack 알림 전송 오류:', slackError);
      return res.status(500).json({
        success: false,
        message: slackError.message || 'Slack 알림 전송에 실패했습니다.',
      });
    }
  } catch (error) {
    console.error('예약 Slack 알림 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '알림 전송 중 오류가 발생했습니다.',
    });
  }
}



