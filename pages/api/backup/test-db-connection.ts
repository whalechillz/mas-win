// pages/api/test-db-connection.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Supabase 연결 테스트
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 간단한 쿼리로 연결 확인
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .limit(1);

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id')
      .limit(1);

    // 실시간 메트릭 확인
    const { count: bookingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 7)).toISOString());

    const { count: contactCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 7)).toISOString());

    const hasBookingsAccess = !bookingsError;
    const hasContactsAccess = !contactsError;
    const isConnected = hasBookingsAccess && hasContactsAccess;

    res.status(isConnected ? 200 : 500).json({
      status: isConnected ? '✅ Database 연결 성공' : '❌ Database 연결 실패',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음',
      tableAccess: {
        bookings: hasBookingsAccess ? '✅ 접근 가능' : '❌ 접근 불가',
        contacts: hasContactsAccess ? '✅ 접근 가능' : '❌ 접근 불가'
      },
      recentData: {
        bookingsLast7Days: bookingCount || 0,
        contactsLast7Days: contactCount || 0,
        totalActiveData: (bookingCount || 0) + (contactCount || 0)
      },
      errors: {
        bookings: bookingsError?.message || null,
        contacts: contactsError?.message || null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      status: '❌ Database 연결 확인 실패'
    });
  }
}