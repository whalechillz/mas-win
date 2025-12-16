import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 시간 포맷팅 (예: 14:00 → 오후 2시)
function formatTime(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? '오후' : '오전';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${period} ${displayHour}시${minutes !== '00' ? ` ${minutes}분` : ''}`;
  } catch {
    return timeStr;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, message: '예약 ID가 필요합니다.' });
  }

  const bookingId = typeof id === 'string' ? parseInt(id) : id;

  // GET: 기존 예약 메시지 조회
  if (req.method === 'GET') {
    try {
      // metadata 필드로 조회 시도, 없으면 note 필드로 대체
      let reminders: any[] = [];
      let error: any = null;

      // 먼저 metadata로 조회 시도
      const { data: metadataReminders, error: metadataError } = await supabase
        .from('channel_sms')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false });

      if (!metadataError && metadataReminders) {
        // 클라이언트 측에서 필터링 (metadata 필드가 없을 수 있음)
        reminders = metadataReminders.filter((r: any) => {
          if (!r.metadata) return false;
          
          // metadata가 문자열인 경우 파싱
          let metadata = r.metadata;
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata);
            } catch (e) {
              return false;
            }
          }
          
          // booking_id 타입 불일치 해결 (숫자/문자열 모두 비교)
          const metadataBookingId = metadata.booking_id;
          const bookingIdNum = typeof bookingId === 'string' ? parseInt(bookingId) : bookingId;
          const metadataBookingIdNum = typeof metadataBookingId === 'string' 
            ? parseInt(metadataBookingId) 
            : metadataBookingId;
          
          return metadataBookingIdNum === bookingIdNum && 
                 metadata.notification_type === 'booking_reminder_2h';
        });
      } else {
        // metadata 필드가 없으면 note 필드로 조회
        const { data: noteReminders, error: noteError } = await supabase
          .from('channel_sms')
          .select('*')
          .like('note', `%예약 당일 알림: 예약 ID ${bookingId}%`)
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (!noteError && noteReminders) {
          reminders = noteReminders;
        } else {
          error = noteError;
        }
      }

      if (error) throw error;

      // ⭐ 추가: 디버깅 로그
      console.log(`[schedule-reminder] 예약 ID ${bookingId} 조회 결과:`, {
        found: reminders.length > 0,
        reminders: reminders.map(r => ({
          id: r.id,
          status: r.status,
          scheduled_at: r.scheduled_at,
          metadata: r.metadata,
          note: r.note,
        })),
      });

      if (reminders && reminders.length > 0) {
        return res.status(200).json({
          success: true,
          reminder: reminders[0],
        });
      }

      return res.status(200).json({
        success: true,
        reminder: null,
      });
    } catch (error: any) {
      console.error('예약 메시지 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '예약 메시지 조회에 실패했습니다.',
      });
    }
  }

  // POST: 예약 메시지 생성
  if (req.method === 'POST') {
    try {
      const { scheduled_at } = req.body;

      if (!scheduled_at) {
        return res.status(400).json({
          success: false,
          message: '발송 시간(scheduled_at)이 필요합니다.',
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

      // ⭐ 추가: scheduled_at 형식 검증 및 변환 (먼저 수행)
      let scheduledAtISO: string;
      try {
        const scheduledDate = new Date(scheduled_at);
        if (Number.isNaN(scheduledDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: '유효하지 않은 발송 시간 형식입니다.',
          });
        }
        scheduledAtISO = scheduledDate.toISOString();
      } catch (dateError: any) {
        return res.status(400).json({
          success: false,
          message: `발송 시간 변환 실패: ${dateError.message}`,
        });
      }

      // 전화번호 정규화
      const phone = booking.phone?.replace(/[\s\-+]/g, '') || '';
      if (!phone || !/^010\d{8}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: '유효한 전화번호가 없습니다.',
        });
      }

      // 메시지 템플릿 생성
      const formattedTime = formatTime(booking.time);
      const message = `[마쓰구골프] ${booking.name || '고객'}님, 안녕하세요! 오늘 ${formattedTime} 시타 예약이 있습니다.

고객님만을 위해 특별히 준비한 맞춤형 분석과 시타 체험을 통해 최상의 경험을 선사해 드리겠습니다. 준비해주세요!

📍 약도: https://www.masgolf.co.kr/contact

문의: 031-215-0013`;

      // 기존 예약 메시지가 있으면 삭제
      // 먼저 기존 메시지 조회
      const { data: existingReminders } = await supabase
        .from('channel_sms')
        .select('id, metadata, note')
        .eq('status', 'draft')
        .like('note', `%예약 당일 알림: 예약 ID ${bookingId}%`);

      if (existingReminders && existingReminders.length > 0) {
        // ID로 삭제
        const ids = existingReminders.map(r => r.id);
        await supabase
          .from('channel_sms')
          .delete()
          .in('id', ids);
      }

      // channel_sms 테이블에 예약 발송 저장
      const insertData: any = {
        message_type: 'LMS',
        message_text: message,
        recipient_numbers: [phone],
        status: 'draft',
        scheduled_at: scheduledAtISO, // ⭐ ISO 형식으로 저장
        note: `예약 당일 알림: 예약 ID ${bookingId}, 고객 ${booking.name}`,
      };

      // metadata 컬럼이 있으면 추가
      insertData.metadata = {
        booking_id: bookingId,
        notification_type: 'booking_reminder_2h',
        customer_id: booking.customer_id || null,
      };

      const { data: smsRecord, error: smsError } = await supabase
        .from('channel_sms')
        .insert(insertData)
        .select()
        .single();

      if (smsError) {
        // ⭐ 수정: 더 자세한 에러 로깅
        console.error('예약 메시지 저장 오류 상세:', {
          error: smsError,
          message: smsError.message,
          details: smsError.details,
          hint: smsError.hint,
          code: smsError.code,
          insertData: {
            ...insertData,
            metadata: insertData.metadata ? JSON.stringify(insertData.metadata) : null
          }
        });
        return res.status(500).json({
          success: false,
          message: `예약 메시지 저장에 실패했습니다: ${smsError.message || '알 수 없는 오류'}`,
          error: smsError.message,
          details: smsError.details,
          code: smsError.code
        });
      }

      return res.status(200).json({
        success: true,
        data: smsRecord,
        message: '당일 예약 메시지가 설정되었습니다.',
      });
    } catch (error: any) {
      console.error('예약 메시지 생성 오류:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '예약 메시지 생성에 실패했습니다.',
      });
    }
  }

  // PUT: 예약 메시지 수정
  if (req.method === 'PUT') {
    try {
      const { scheduled_at } = req.body;

      if (!scheduled_at) {
        return res.status(400).json({
          success: false,
          message: '발송 시간(scheduled_at)이 필요합니다.',
        });
      }

      // 기존 예약 메시지 조회 (note 필드로 조회)
      const { data: existingReminders, error: findError } = await supabase
        .from('channel_sms')
        .select('*')
        .like('note', `%예약 당일 알림: 예약 ID ${bookingId}%`)
        .eq('status', 'draft')
        .limit(1);

      if (findError) throw findError;

      if (!existingReminders || existingReminders.length === 0) {
        return res.status(404).json({
          success: false,
          message: '예약 메시지를 찾을 수 없습니다.',
        });
      }

      // ⭐ 추가: scheduled_at 형식 검증 및 변환
      let scheduledAtISO: string;
      try {
        const scheduledDate = new Date(scheduled_at);
        if (Number.isNaN(scheduledDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: '유효하지 않은 발송 시간 형식입니다.',
          });
        }
        scheduledAtISO = scheduledDate.toISOString();
      } catch (dateError: any) {
        return res.status(400).json({
          success: false,
          message: `발송 시간 변환 실패: ${dateError.message}`,
        });
      }

      // 예약 메시지 수정
      const { data: updatedReminder, error: updateError } = await supabase
        .from('channel_sms')
        .update({
          scheduled_at: scheduledAtISO, // ⭐ ISO 형식 사용
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingReminders[0].id)
        .select()
        .single();

      if (updateError) {
        console.error('예약 메시지 수정 오류:', updateError);
        return res.status(500).json({
          success: false,
          message: '예약 메시지 수정에 실패했습니다.',
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedReminder,
        message: '예약 메시지가 수정되었습니다.',
      });
    } catch (error: any) {
      console.error('예약 메시지 수정 오류:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '예약 메시지 수정에 실패했습니다.',
      });
    }
  }

  // DELETE: 예약 메시지 삭제
  if (req.method === 'DELETE') {
    try {
      // note 필드로 기존 메시지 조회 후 삭제
      const { data: existingReminders } = await supabase
        .from('channel_sms')
        .select('id')
        .like('note', `%예약 당일 알림: 예약 ID ${bookingId}%`)
        .eq('status', 'draft');

      if (existingReminders && existingReminders.length > 0) {
        const ids = existingReminders.map(r => r.id);
        const { error } = await supabase
          .from('channel_sms')
          .delete()
          .in('id', ids);

      if (error) {
        console.error('예약 메시지 삭제 오류:', error);
        return res.status(500).json({
          success: false,
          message: '예약 메시지 삭제에 실패했습니다.',
        });
      }

      return res.status(200).json({
        success: true,
        message: '예약 메시지가 취소되었습니다.',
      });
      }

      // 삭제할 메시지가 없으면 그대로 성공 처리
      return res.status(200).json({
        success: true,
        message: '예약 메시지가 없습니다.',
      });
    } catch (error: any) {
      console.error('예약 메시지 삭제 오류:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '예약 메시지 삭제에 실패했습니다.',
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
  });
}

