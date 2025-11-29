import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 캘린더 데이터 조회 API
 * GET /api/bookings/calendar?start=2025-11-01&end=2025-11-30
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start와 end 파라미터가 필요합니다.' });
    }

    const startDate = start as string;
    const endDate = end as string;

    // 기간 내 예약 조회
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, date, time, name, phone, service_type, status, duration, location')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (bookingsError) throw bookingsError;

    // 날짜별로 그룹화
    const calendarData: Record<string, any[]> = {};
    
    if (bookings) {
      bookings.forEach(booking => {
        const date = booking.date;
        if (!calendarData[date]) {
          calendarData[date] = [];
        }
        calendarData[date].push({
          id: booking.id,
          time: booking.time,
          name: booking.name,
          phone: booking.phone,
          service_type: booking.service_type,
          status: booking.status,
          duration: booking.duration || 60,
          location: booking.location
        });
      });
    }

    return res.status(200).json({
      start: startDate,
      end: endDate,
      bookings: calendarData
    });
  } catch (error) {
    console.error('Calendar API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


