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

        const { data: updatedBooking, error: updateError } = await supabase
          .from('bookings')
          .update(restUpdateData)
          .eq('id', parseInt(id))
          .select()
          .single();

        if (updateError) throw updateError;

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

