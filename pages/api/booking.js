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

    // Supabase 부분을 임시로 비활성화하고 테스트
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials missing');
      // 환경변수가 없어도 일단 성공 응답
      return res.status(200).json({ 
        success: true, 
        message: '예약이 접수되었습니다 (테스트 모드)',
        data: { name, phone, date, time, club },
        testMode: true
      });
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Supabase에 저장 시도
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          name,
          phone,
          date,
          time,
          club,
          status: 'pending'
        })
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        // Supabase 에러가 있어도 일단 성공 응답
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
        data 
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      // DB 에러가 있어도 일단 성공 응답
      return res.status(200).json({ 
        success: true, 
        message: '예약이 접수되었습니다 (DB 연결 실패)',
        data: { name, phone, date, time, club },
        dbError: dbError.message
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