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
      console.error('Supabase error:', error);
      return res.status(200).json({ 
        success: false, 
        message: 'DB 저장 실패',
        error: error.message
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
      message: error.message
    });
  }
}