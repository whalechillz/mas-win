import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials missing');
      return res.status(200).json({ 
        success: true, 
        message: '예약이 접수되었습니다 (환경변수 누락)',
        data: { name, phone, date, time, club },
        testMode: true
      });
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Supabase에 저장
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
        console.error('Supabase insert error:', error);
        return res.status(200).json({ 
          success: true, 
          message: '예약이 접수되었습니다 (DB 저장 실패)',
          data: { name, phone, date, time, club },
          dbError: error.message
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: '예약이 완료되었습니다.',
        data: data[0]
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(200).json({ 
        success: true, 
        message: '예약이 접수되었습니다 (DB 연결 실패)',
        data: { name, phone, date, time, club },
        dbError: dbError.toString()
      });
    }
    
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ 
      error: 'Failed to process booking',
      message: error.message 
    });
  }
}