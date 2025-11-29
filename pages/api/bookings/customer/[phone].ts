import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 전화번호로 고객 예약 조회 API
 * GET /api/bookings/customer/010-1234-5678
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ error: 'phone 파라미터가 필요합니다.' });
    }

    const phoneNumber = phone as string;

    // 고객 정보 조회
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phoneNumber)
      .single();

    // 예약 히스토리 조회
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_photos(id, image_url, photo_type, created_at)
      `)
      .eq('phone', phoneNumber)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (bookingsError) throw bookingsError;

    // 사진 개수 계산
    const bookingsWithPhotoCount = bookings?.map(booking => ({
      ...booking,
      photo_count: (booking.booking_photos as any[])?.length || 0,
      booking_photos: undefined // 응답에서 제거
    })) || [];

    return res.status(200).json({
      customer: customer || null,
      bookings: bookingsWithPhotoCount,
      total_bookings: bookingsWithPhotoCount.length
    });
  } catch (error) {
    console.error('Customer bookings API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


