import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, date, time, club } = req.body;
    
    console.log('Booking received:', { name, phone, date, time, club });

    // 먼저 테이블이 존재하는지 확인
    const { data: tableCheck, error: tableError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Table access error:', tableError);
      return res.status(200).json({ 
        success: false, 
        message: '테이블 접근 오류',
        error: tableError.message,
        hint: tableError.hint || 'RLS 정책을 확인하세요'
      });
    }

    // 데이터 삽입 시도
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        name,
        phone,
        date,
        time,
        club,
        status: 'pending'
      }])
      .select();

    if (error) {
      console.error('Insert error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      // RLS 에러인지 확인
      if (error.code === '42501') {
        return res.status(200).json({ 
          success: false, 
          message: 'RLS 정책으로 인한 저장 실패',
          error: 'Row Level Security 정책이 INSERT를 차단하고 있습니다.',
          solution: 'Supabase 대시보드에서 bookings 테이블의 RLS 정책을 확인하세요.'
        });
      }

      return res.status(200).json({ 
        success: false, 
        message: '예약 저장 실패',
        error: error.message,
        details: error.details,
        hint: error.hint
      });
    }

    console.log('Booking saved successfully:', data);

    return res.status(200).json({ 
      success: true, 
      message: '예약이 완료되었습니다.',
      data: data[0]
    });
    
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ 
      error: 'Failed to process booking',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}