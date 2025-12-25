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

      // ⭐ 개선: status='draft' 또는 'sent' 모두 조회 (더 넓은 범위)
      const { data: metadataReminders, error: metadataError } = await supabase
        .from('channel_sms')
        .select('*')
        .in('status', ['draft', 'sent', 'partial'])
        .order('created_at', { ascending: false });

      const bookingIdNum = typeof bookingId === 'string' ? parseInt(bookingId) : bookingId;
      
      console.log(`[schedule-reminder] 예약 ID ${bookingId} (${bookingIdNum}) 전체 조회:`, {
        total: metadataReminders?.length || 0,
        sample: metadataReminders?.slice(0, 3).map((r: any) => ({
          id: r.id,
          status: r.status,
          note: r.note,
          metadata: r.metadata,
        })),
      });

      if (!metadataError && metadataReminders) {
        // 클라이언트 측에서 필터링 (metadata 필드가 없을 수 있음)
        reminders = metadataReminders.filter((r: any) => {
          // metadata로 먼저 확인
          if (r.metadata) {
            let metadata = r.metadata;
            if (typeof metadata === 'string') {
              try {
                metadata = JSON.parse(metadata);
              } catch (e) {
                // 파싱 실패 시 다음 조건으로
              }
            }
            
            if (metadata && typeof metadata === 'object') {
              // booking_id 타입 불일치 해결 (숫자/문자열 모두 비교)
              const metadataBookingId = metadata.booking_id;
              const metadataBookingIdNum = typeof metadataBookingId === 'string' 
                ? parseInt(metadataBookingId) 
                : metadataBookingId;
              
              if (metadataBookingIdNum === bookingIdNum && 
                  metadata.notification_type === 'booking_reminder_2h') {
                return true;
              }
            }
          }
          
          // note 필드로도 확인 (예약 ID 포함 여부)
          // ⭐ 수정: '예약 당일 알림' 조건 제거 (너무 넓어서 다른 예약 메시지도 매칭됨)
          // ⭐ 추가: '스탭진 알림' 등 다른 타입의 메시지는 제외
          if (r.note && typeof r.note === 'string') {
            // ⭐ 수정: '예약 당일 알림'으로 시작하고 예약 ID가 포함된 경우만 매칭
            const hasBookingId = r.note.includes(`예약 ID ${bookingId}`) || 
                                 r.note.includes(`예약 ID ${bookingIdNum}`);
            const isReminderMessage = r.note.includes('예약 당일 알림');
            // ⭐ 추가: '스탭진 알림' 등 다른 타입은 제외
            const isOtherType = r.note.includes('스탭진 알림') || 
                               r.note.includes('확정 알림') ||
                               r.note.includes('접수 알림');
            
            if (hasBookingId && isReminderMessage && !isOtherType) {
              return true;
            }
          }
          
          return false;
        });
      } else {
        // metadata 필드가 없으면 note 필드로 조회
        const { data: noteReminders, error: noteError } = await supabase
          .from('channel_sms')
          .select('*')
          .like('note', `%예약 당일 알림: 예약 ID ${bookingId}%`)
          .in('status', ['draft', 'sent', 'partial'])
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (!noteError && noteReminders) {
          reminders = noteReminders;
        } else {
          // note 필드로도 찾지 못하면 예약 ID만으로 검색
          const { data: idReminders, error: idError } = await supabase
            .from('channel_sms')
            .select('*')
            .like('note', `%예약 ID ${bookingId}%`)
            .in('status', ['draft', 'sent', 'partial'])
            .order('created_at', { ascending: false })
            .limit(5);
          
          if (!idError && idReminders) {
            reminders = idReminders;
          } else {
            error = idError || noteError;
          }
        }
      }

      if (error) throw error;

      // ⭐ 추가: 디버깅 로그
      console.log('[schedule-reminder][GET] 결과', {
        bookingId,
        found: reminders.length > 0,
        totalFiltered: reminders.length,
        reminders: reminders.map(r => {
          let metadata = r.metadata;
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata);
            } catch (e) {
              // 파싱 실패
            }
          }
          return {
            id: r.id,
            status: r.status,
            scheduled_at: r.scheduled_at,
            solapi_group_id: r.solapi_group_id || null,
            metadata_booking_id: metadata?.booking_id,
          };
        }),
      });

      // ⭐ 수정: 필터링된 결과 중에서 정확히 일치하는 것만 선택
      if (reminders && reminders.length > 0) {
        // ⭐ 추가: booking_id가 정확히 일치하고 '예약 당일 알림' 타입인 메시지만 선택
        const exactMatch = reminders.find((r: any) => {
          // metadata로 확인 (가장 정확함)
          if (r.metadata) {
            let metadata = r.metadata;
            if (typeof metadata === 'string') {
              try {
                metadata = JSON.parse(metadata);
              } catch (e) {
                return false;
              }
            }
            if (metadata && typeof metadata === 'object') {
              const metadataBookingId = metadata.booking_id;
              const metadataBookingIdNum = typeof metadataBookingId === 'string' 
                ? parseInt(metadataBookingId) 
                : metadataBookingId;
              // ⭐ 추가: notification_type이 'booking_reminder_2h'인 경우만
              const isReminderType = metadata.notification_type === 'booking_reminder_2h';
              return metadataBookingIdNum === bookingIdNum && isReminderType;
            }
          }
          // note로 확인 (metadata가 없는 경우)
          if (r.note && typeof r.note === 'string') {
            const hasBookingId = r.note.includes(`예약 ID ${bookingId}`) || 
                                 r.note.includes(`예약 ID ${bookingIdNum}`);
            // ⭐ 추가: '예약 당일 알림'으로 시작하는 메시지만
            const isReminderMessage = r.note.startsWith('예약 당일 알림') || 
                                     r.note.includes('예약 당일 알림:');
            // ⭐ 추가: 다른 타입의 메시지는 제외
            const isOtherType = r.note.includes('스탭진 알림') || 
                               r.note.includes('확정 알림') ||
                               r.note.includes('접수 알림');
            return hasBookingId && isReminderMessage && !isOtherType;
          }
          return false;
        });

        if (exactMatch) {
          console.log(`[schedule-reminder] 정확히 일치하는 메시지 발견: ID ${exactMatch.id}`);
          return res.status(200).json({
            success: true,
            reminder: exactMatch,
          });
        } else {
          console.log(`[schedule-reminder] ⚠️ 필터링된 결과 중 정확히 일치하는 메시지 없음`);
          // 정확히 일치하는 것이 없으면 null 반환
          return res.status(200).json({
            success: true,
            reminder: null,
          });
        }
      }

      return res.status(200).json({
        success: true,
        reminder: null,
      });
    } catch (error: any) {
      console.error('[schedule-reminder][GET] ERROR', {
        bookingId,
        error: error.message,
        stack: error.stack,
      });
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
      const message = `친애하는 ${booking.name || '고객'} 고객님, 
안녕하세요! 마쓰구골프입니다.
오늘은 고객님의 최대 비거리 드라이버 시타 서비스 예약일입니다. 고객님만을 위해 특별히 준비한 맞춤형 분석과 시타 체험을 통해 최상의 경험을 선사해 드리겠습니다.

▶ 예약시간: ${formattedTime}
▶ 약도 안내: https://www.masgolf.co.kr/contact

고객님의 편의를 위해 
일정 조정이 필요하시다면 언제든지 편하게 연락 주시면 최상의 경험을 위해 최선을 다하겠습니다.

☎ 마쓰구 수원본점
수원시 영통구 법조로149번길 200 마스골프
TEL 031-215-0013
무료 080-028-8888 (무료 상담)
OPEN 09:00~17:00(월~금)`;

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

      // ⭐ 수정: GET 요청과 동일하게 여러 상태와 metadata로도 조회
      let existingReminders: any[] = [];
      let findError: any = null;

      const bookingIdNum = typeof bookingId === 'string' ? parseInt(bookingId) : bookingId;

      // 1. metadata 필드로 조회 시도 (status: draft, sent, partial 모두)
      const { data: metadataReminders, error: metadataError } = await supabase
        .from('channel_sms')
        .select('*')
        .in('status', ['draft', 'sent', 'partial'])
        .order('created_at', { ascending: false });

      if (!metadataError && metadataReminders) {
        // metadata로 필터링
        existingReminders = metadataReminders.filter((r: any) => {
          // metadata로 먼저 확인
          if (r.metadata) {
            let metadata = r.metadata;
            if (typeof metadata === 'string') {
              try {
                metadata = JSON.parse(metadata);
              } catch (e) {
                // 파싱 실패 시 다음 조건으로
              }
            }
            
            if (metadata && typeof metadata === 'object') {
              // booking_id 타입 불일치 해결 (숫자/문자열 모두 비교)
              const metadataBookingId = metadata.booking_id;
              const metadataBookingIdNum = typeof metadataBookingId === 'string' 
                ? parseInt(metadataBookingId) 
                : metadataBookingId;
              
              if (metadataBookingIdNum === bookingIdNum && 
                  metadata.notification_type === 'booking_reminder_2h') {
                return true;
              }
            }
          }
          
          // note 필드로도 확인 (예약 ID 포함 여부)
          // ⭐ 수정: '예약 당일 알림' 조건 제거 (너무 넓어서 다른 예약 메시지도 매칭됨)
          // ⭐ 추가: '스탭진 알림' 등 다른 타입의 메시지는 제외
          if (r.note && typeof r.note === 'string') {
            // ⭐ 수정: '예약 당일 알림'으로 시작하고 예약 ID가 포함된 경우만 매칭
            const hasBookingId = r.note.includes(`예약 ID ${bookingId}`) || 
                                 r.note.includes(`예약 ID ${bookingIdNum}`);
            const isReminderMessage = r.note.includes('예약 당일 알림');
            // ⭐ 추가: '스탭진 알림' 등 다른 타입은 제외
            const isOtherType = r.note.includes('스탭진 알림') || 
                               r.note.includes('확정 알림') ||
                               r.note.includes('접수 알림');
            
            if (hasBookingId && isReminderMessage && !isOtherType) {
              return true;
            }
          }
          
          return false;
        });
      }

      // 2. metadata로 찾지 못하면 note 필드로 조회
      if (existingReminders.length === 0) {
        const { data: noteReminders, error: noteError } = await supabase
          .from('channel_sms')
          .select('*')
          .like('note', `%예약 당일 알림: 예약 ID ${bookingId}%`)
          .in('status', ['draft', 'sent', 'partial'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (!noteError && noteReminders) {
          existingReminders = noteReminders;
        } else {
          // note 필드로도 찾지 못하면 예약 ID만으로 검색
          const { data: idReminders, error: idError } = await supabase
            .from('channel_sms')
            .select('*')
            .like('note', `%예약 ID ${bookingId}%`)
            .in('status', ['draft', 'sent', 'partial'])
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (!idError && idReminders) {
            existingReminders = idReminders;
          } else {
            findError = idError || noteError || metadataError;
          }
        }
      }

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
      const bookingIdNum = typeof bookingId === 'string' ? parseInt(bookingId) : bookingId;
      let reminderIds: string[] = [];

      // 1. metadata로 조회
      const { data: metadataReminders, error: metadataError } = await supabase
        .from('channel_sms')
        .select('id, metadata')
        .in('status', ['draft', 'sent', 'partial']);

      if (!metadataError && metadataReminders) {
        const matchedReminders = metadataReminders.filter((r: any) => {
          if (!r.metadata) return false;
          
          let metadata = r.metadata;
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata);
            } catch (e) {
              return false;
            }
          }
          
          if (metadata && typeof metadata === 'object') {
            const metadataBookingId = metadata.booking_id;
            const metadataBookingIdNum = typeof metadataBookingId === 'string' 
              ? parseInt(metadataBookingId) 
              : metadataBookingId;
            
            return metadataBookingIdNum === bookingIdNum && 
                   metadata.notification_type === 'booking_reminder_2h';
          }
          
          return false;
        });
        
        reminderIds.push(...matchedReminders.map((r: any) => r.id));
      }

      // 2. note 필드로도 조회 (metadata로 찾지 못한 경우)
      if (reminderIds.length === 0) {
        const { data: noteReminders, error: noteError } = await supabase
          .from('channel_sms')
          .select('id')
          .like('note', `%예약 당일 알림: 예약 ID ${bookingId}%`)
          .in('status', ['draft', 'sent', 'partial']);

        if (!noteError && noteReminders) {
          reminderIds.push(...noteReminders.map((r: any) => r.id));
        }
      }

      // 3. 삭제 실행
      if (reminderIds.length > 0) {
        const { error } = await supabase
          .from('channel_sms')
          .delete()
          .in('id', reminderIds);

        if (error) {
          console.error('예약 메시지 삭제 오류:', error);
          return res.status(500).json({
            success: false,
            message: '예약 메시지 삭제에 실패했습니다.',
          });
        }

        console.log(`[schedule-reminder] 예약 ID ${bookingId} 메시지 삭제 완료: ${reminderIds.length}개`);
        return res.status(200).json({
          success: true,
          message: '예약 메시지가 취소되었습니다.',
        });
      }

      // 삭제할 메시지가 없으면 그대로 성공 처리
      console.log(`[schedule-reminder] 예약 ID ${bookingId} 삭제할 메시지 없음`);
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

