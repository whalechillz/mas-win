import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yyytjudftvpmcnppaymw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== 슬랙 테스트 API 호출됨 ===');
    console.log('환경변수 확인:');
    console.log('SLACK_WEBHOOK_URL:', process.env.SLACK_WEBHOOK_URL ? '설정됨' : '설정되지 않음');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // 1. 슬랙 알림 테스트
    console.log('슬랙 알림 테스트 시작...');
    
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const slackResponse = await fetch(`${baseUrl}/api/slack/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'booking',
        data: {
          name: '테스트 사용자',
          phone: '010-1234-5678',
          date: '2025-01-20',
          time: '10:00',
          club: '시크릿웨폰',
          notes: '슬랙 알림 테스트',
          booking_id: 'test-123'
        }
      })
    });

    console.log('슬랙 응답 상태:', slackResponse.status);
    console.log('슬랙 응답 헤더:', Object.fromEntries(slackResponse.headers.entries()));

    const slackResult = await slackResponse.text();
    console.log('슬랙 응답 내용:', slackResult);

    // 2. 예약 데이터 테스트
    console.log('예약 데이터 테스트 시작...');
    const { data: testBooking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, name, phone, date, time, club')
      .limit(1)
      .single();

    console.log('예약 데이터 결과:', { testBooking, bookingError });

    return res.status(200).json({
      success: true,
      message: '슬랙 테스트 완료',
      data: {
        slackStatus: slackResponse.status,
        slackResult: slackResult,
        bookingData: testBooking,
        bookingError: bookingError?.message,
        environment: {
          slackWebhookConfigured: !!process.env.SLACK_WEBHOOK_URL,
          nodeEnv: process.env.NODE_ENV,
          baseUrl: baseUrl
        }
      }
    });

  } catch (error) {
    console.error('슬랙 테스트 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '테스트 중 오류 발생',
      error: error.message,
      stack: error.stack
    });
  }
} 