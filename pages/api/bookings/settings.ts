import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 예약 설정 조회/수정 API
 * GET /api/bookings/settings - 예약 설정 조회
 * PUT /api/bookings/settings - 예약 설정 수정
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

  try {
    switch (req.method) {
      case 'GET':
        // 예약 설정 조회
        const { data: settings, error: getError } = await supabase
          .from('booking_settings')
          .select('*')
          .eq('id', SETTINGS_ID)
          .single();

        if (getError) {
          // 설정이 없으면 기본값 반환
          if (getError.code === 'PGRST116') {
            return res.status(200).json({
              id: SETTINGS_ID,
              disable_same_day_booking: false,
              disable_weekend_booking: false,
              min_advance_hours: 24,
              max_advance_days: 14,
              max_weekly_slots: 10,
              auto_block_excess_slots: true,
              show_call_message: true,
              call_message_text: '원하시는 시간에 예약이 어려우신가요? 전화로 문의해주세요.',
              updated_at: new Date().toISOString()
            });
          }
          throw getError;
        }

        return res.status(200).json(settings);

      case 'PUT':
        // 예약 설정 수정
        const { 
          disable_same_day_booking, 
          disable_weekend_booking, 
          min_advance_hours,
          max_advance_days,
          max_weekly_slots,
          auto_block_excess_slots,
          show_call_message,
          call_message_text
        } = req.body;

        // 기존 설정 조회 (없으면 기본값 사용)
        const { data: existingSettings } = await supabase
          .from('booking_settings')
          .select('*')
          .eq('id', SETTINGS_ID)
          .single();

        // 모든 필드를 포함한 완전한 업데이트 데이터
        const updateData = {
          id: SETTINGS_ID,
          disable_same_day_booking: typeof disable_same_day_booking === 'boolean' 
            ? disable_same_day_booking 
            : (existingSettings?.disable_same_day_booking ?? false),
          disable_weekend_booking: typeof disable_weekend_booking === 'boolean'
            ? disable_weekend_booking
            : (existingSettings?.disable_weekend_booking ?? false),
          min_advance_hours: typeof min_advance_hours === 'number'
            ? min_advance_hours
            : (existingSettings?.min_advance_hours ?? 24),
          max_advance_days: typeof max_advance_days === 'number'
            ? max_advance_days
            : (existingSettings?.max_advance_days ?? 14),
          max_weekly_slots: typeof max_weekly_slots === 'number'
            ? max_weekly_slots
            : (existingSettings?.max_weekly_slots ?? 10),
          auto_block_excess_slots: typeof auto_block_excess_slots === 'boolean'
            ? auto_block_excess_slots
            : (existingSettings?.auto_block_excess_slots ?? true),
          show_call_message: typeof show_call_message === 'boolean'
            ? show_call_message
            : (existingSettings?.show_call_message ?? true),
          call_message_text: typeof call_message_text === 'string'
            ? call_message_text
            : (existingSettings?.call_message_text ?? '원하시는 시간에 예약이 어려우신가요? 전화로 문의해주세요.'),
          updated_at: new Date().toISOString()
        };

        const { data: updatedSettings, error: updateError } = await supabase
          .from('booking_settings')
          .upsert(updateData, {
            onConflict: 'id'
          })
          .select()
          .single();

        if (updateError) {
          console.error('설정 업데이트 오류:', updateError);
          throw updateError;
        }

        return res.status(200).json(updatedSettings);

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Booking Settings API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

