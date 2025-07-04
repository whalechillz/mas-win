import { supabaseAdmin } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  // 환경변수 확인
  console.log('Environment check:', {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
    slackWebhook: process.env.SLACK_WEBHOOK_URL ? 'Set' : 'Not set'
  });

  try {
    // 테이블 확인 (Admin 클라이언트 사용)
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('count');
    
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('contacts')
      .select('count');

    // 테스트 데이터 삽입
    const testData = {
      name: 'TEST',
      phone: '010-0000-0000',
      date: '2025-07-03',
      time: '14:00',
      club: 'TEST',
      status: 'pending'
    };

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert([testData])
      .select();

    res.status(200).json({
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
        slackWebhook: process.env.SLACK_WEBHOOK_URL ? 'Set' : 'Not set'
      },
      tableCheck: {
        bookings: bookingsError ? bookingsError.message : 'OK',
        contacts: contactsError ? contactsError.message : 'OK'
      },
      testInsert: error ? {
        error: error.message,
        code: error.code,
        details: error.details
      } : {
        success: true,
        data: data
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}