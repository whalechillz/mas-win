import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 개별 예약 조회/수정/삭제 API
 * GET /api/bookings/[id] - 예약 상세 조회
 * PUT /api/bookings/[id] - 예약 수정
 * DELETE /api/bookings/[id] - 예약 삭제
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '예약 ID가 필요합니다.' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // 예약 상세 조회 (사진 포함)
        const { data: booking, error: getError } = await supabase
          .from('bookings')
          .select(`
            *,
            booking_photos(id, image_url, storage_path, file_name, photo_type, description, taken_at, created_at)
          `)
          .eq('id', parseInt(id))
          .single();

        if (getError) throw getError;

        if (!booking) {
          return res.status(404).json({ error: '예약을 찾을 수 없습니다.' });
        }

        return res.status(200).json(booking);

      case 'PUT':
        // 예약 수정
        const updateData = req.body;
        const { id: updateId, ...restUpdateData } = updateData;

        // 상태 변경 시 타임스탬프 자동 설정
        if (restUpdateData.status === 'confirmed' && !restUpdateData.confirmed_at) {
          restUpdateData.confirmed_at = new Date().toISOString();
        }
        if (restUpdateData.status === 'completed' && !restUpdateData.completed_at) {
          restUpdateData.completed_at = new Date().toISOString();
        }
        if (restUpdateData.status === 'cancelled' && !restUpdateData.cancelled_at) {
          restUpdateData.cancelled_at = new Date().toISOString();
        }

        // 기존 예약 정보 확인 (확정 알림 발송을 위해)
        const { data: existingBooking } = await supabase
          .from('bookings')
          .select('status, date, time')
          .eq('id', parseInt(id))
          .single();

        const previousStatus = existingBooking?.status || 'pending';
        const newStatus = restUpdateData.status || previousStatus;
        
        // 시간 변경 여부 확인
        const timeChanged = existingBooking && 
          (restUpdateData.date !== undefined && restUpdateData.date !== existingBooking.date) ||
          (restUpdateData.time !== undefined && restUpdateData.time !== existingBooking.time);

        const { data: updatedBooking, error: updateError } = await supabase
          .from('bookings')
          .update(restUpdateData)
          .eq('id', parseInt(id))
          .select()
          .single();

        if (updateError) throw updateError;

        // 알림 발송 조건:
        // 1. 상태가 'pending' → 'confirmed'로 변경된 경우
        // 2. 이미 'confirmed' 상태이고 시간이 변경된 경우
        const shouldSendNotification = 
          (previousStatus !== 'confirmed' && newStatus === 'confirmed') ||
          (previousStatus === 'confirmed' && newStatus === 'confirmed' && timeChanged);

        if (shouldSendNotification) {
          const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000';

          const notificationReason = timeChanged && previousStatus === 'confirmed' 
            ? '시간 변경으로 인한 재발송' 
            : '예약 확정';

          // 고객에게 예약 확정 SMS 발송
          try {
            console.log(`고객 예약 확정 SMS 발송 시작... (${notificationReason})`);
            const customerSmsResponse = await fetch(`${baseUrl}/api/bookings/notify-customer`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: parseInt(id),
                notificationType: 'booking_confirmed',
              }),
            });
            const customerSmsResult = await customerSmsResponse.json();
            console.log('고객 확정 SMS 발송 결과:', customerSmsResult);
          } catch (customerSmsError) {
            console.error('고객 확정 SMS 발송 에러:', customerSmsError);
            // 고객 SMS 실패해도 예약 업데이트는 계속 처리
          }

          // 스탭진에게 예약 확정 SMS 발송
          try {
            console.log(`스탭진 예약 확정 SMS 발송 시작... (${notificationReason})`);
            const staffSmsResponse = await fetch(`${baseUrl}/api/bookings/notify-staff`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: parseInt(id),
                notificationType: 'confirmed',
              }),
            });
            const staffSmsResult = await staffSmsResponse.json();
            console.log('스탭진 확정 SMS 발송 결과:', staffSmsResult);
          } catch (staffSmsError) {
            console.error('스탭진 확정 SMS 발송 에러:', staffSmsError);
            // 스탭진 SMS 실패해도 예약 업데이트는 계속 처리
          }

          // 슬랙 알림 발송 (설정에 따라)
          try {
            const { data: settings } = await supabase
              .from('booking_settings')
              .select('enable_slack_notification')
              .eq('id', '00000000-0000-0000-0000-000000000001')
              .single();

            if (settings?.enable_slack_notification !== false) {
              const baseUrl = process.env.VERCEL_URL 
                ? `https://${process.env.VERCEL_URL}` 
                : 'http://localhost:3000';
              
              const slackResponse = await fetch(`${baseUrl}/api/slack/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'booking_confirmed',
                  data: {
                    booking_id: parseInt(id),
                    ...updatedBooking,
                  },
                }),
              });
              console.log('슬랙 확정 알림 발송 결과:', slackResponse.status);
            }
          } catch (slackError) {
            console.error('슬랙 확정 알림 에러:', slackError);
            // 슬랙 알림 실패해도 예약 업데이트는 계속 처리
          }
        }

        return res.status(200).json(updatedBooking);

      case 'DELETE':
        // 예약 삭제
        const { error: deleteError } = await supabase
          .from('bookings')
          .delete()
          .eq('id', parseInt(id));

        if (deleteError) throw deleteError;

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Booking API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

