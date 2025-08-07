import { createClient } from '@supabase/supabase-js';
import { SLACK_API_URL } from '../../lib/api-config';

const supabaseUrl = 'https://yyytjudftvpmcnppaymw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      name,
      phone,
      date, 
      time, 
      club,
      notes
    } = req.body;

    console.log('=== BOOKING API 호출됨 ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key exists:', !!supabaseKey);
    console.log('Request method:', req.method);
    console.log('Content-Type:', req.headers['content-type']);

    // 필수 필드 확인
    if (!name || !phone || !date || !time || !club) {
      return res.status(400).json({ 
        success: false, 
        message: '모든 필수 정보를 입력해주세요.' 
      });
    }

    // 1. 고객 프로필 확인/생성
    let customerProfileId = null;
    
    console.log('고객 프로필 찾기 시작...');
    
    // 기존 고객 프로필 찾기
    const { data: existingProfile, error: profileFindError } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('phone', phone)
      .single();
      
    console.log('고객 프로필 찾기 결과:', { existingProfile, profileFindError });

    if (existingProfile) {
      customerProfileId = existingProfile.id;
      
      // 고객 정보 업데이트
      await supabase
        .from('customer_profiles')
        .update({
          name: name,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerProfileId);
    } else {
      // 새 고객 프로필 생성
      const { data: newProfile, error: profileError } = await supabase
        .from('customer_profiles')
        .insert({
          name: name,
          phone: phone
        })
        .select()
        .single();
      
      if (profileError) {
        console.error('고객 프로필 생성 오류:', profileError);
        throw profileError;
      }
      
      customerProfileId = newProfile.id;
    }

    // 2. 시타 예약 데이터 저장
    console.log('예약 데이터 저장 시작...');
    console.log('저장할 데이터:', {
      customer_profile_id: customerProfileId,
      name: name,
      phone: phone,
      date: date,
      time: time,
      club: club,
      notes: notes || '',
      status: 'pending'
    });
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_profile_id: customerProfileId,
        name: name,
        phone: phone,
        date: date,
        time: time,
        club: club,
        notes: notes || '',
        status: 'pending'
      })
      .select()
      .single();

    console.log('예약 저장 결과:', { booking, bookingError });
    
    if (bookingError) {
      console.error('예약 저장 오류:', bookingError);
      throw bookingError;
    }

    // 3. 슬랙 알림 전송
    try {
      console.log('슬랙 알림 전송 시작...');
      
      // 절대 URL로 변경
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
            name,
            phone,
            date,
            time,
            club,
            notes: notes || '',
            booking_id: booking.id
          }
        })
      });

      console.log('슬랙 응답 상태:', slackResponse.status);
      console.log('슬랙 응답 헤더:', Object.fromEntries(slackResponse.headers.entries()));

      if (!slackResponse.ok) {
        const errorText = await slackResponse.text();
        console.error('슬랙 알림 전송 실패:', errorText);
        console.error('슬랙 응답 상태:', slackResponse.status);
      } else {
        const responseText = await slackResponse.text();
        console.log('슬랙 알림 전송 성공:', responseText);
      }
    } catch (slackError) {
      console.error('슬랙 알림 에러:', slackError);
      console.error('슬랙 에러 스택:', slackError.stack);
      // 슬랙 알림 실패해도 예약은 계속 처리
    }

    // 성공 응답 반환
    return res.status(200).json({ 
      success: true, 
      message: '시타 예약이 완료되었습니다! 곧 연락드리겠습니다.',
      data: {
        booking_id: booking.id,
        customer_profile_id: customerProfileId,
        name,
        phone,
        date,
        time,
        club
      }
    });
    
  } catch (error) {
    console.error('Booking error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      success: false,
      message: '예약 처리 중 오류가 발생했습니다. 전화로 문의해주세요.',
      error: error.message,
      stack: error.stack,
      details: {
        name: req.body?.name,
        phone: req.body?.phone,
        date: req.body?.date,
        time: req.body?.time,
        club: req.body?.club,
        notes: req.body?.notes
      }
    });
  }
}
