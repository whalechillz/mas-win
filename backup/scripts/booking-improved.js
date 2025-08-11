import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yyytjudftvpmcnppaymw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;
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
      quiz_result_id,  // 퀴즈 결과 ID
      date, 
      time, 
      club,
      
      // quiz_result_id가 없는 경우를 위한 폴백
      name,
      phone
    } = req.body;

    let finalQuizResultId = quiz_result_id;

    // quiz_result_id가 없으면 phone으로 찾기
    if (!finalQuizResultId && phone) {
      const { data: existingQuiz } = await supabase
        .from('quiz_results')
        .select('id')
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingQuiz) {
        finalQuizResultId = existingQuiz.id;
      } else if (name && phone) {
        // 퀴즈 결과가 없으면 기본 정보로 생성
        const { data: newQuiz } = await supabase
          .from('quiz_results')
          .insert({ name, phone })
          .select()
          .single();
        
        if (newQuiz) {
          finalQuizResultId = newQuiz.id;
        }
      }
    }

    // 예약 생성
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        quiz_result_id: finalQuizResultId,
        date: date || new Date().toISOString().split('T')[0],
        time: time || '미정',
        club: club || '추천 대기',
        status: '대기중'
      })
      .select(`
        *,
        quiz_results (
          name,
          phone,
          swing_style,
          priority,
          current_distance,
          recommended_flex
        )
      `)
      .single();

    if (error) throw error;

    // 슬랙 알림
    const customerInfo = booking.quiz_results || { name, phone };
    
    try {
      await fetch('/api/slack/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking',
          data: {
            name: customerInfo.name,
            phone: customerInfo.phone,
            date: booking.date,
            time: booking.time,
            club: booking.club,
            swing_style: customerInfo.swing_style,
            priority: customerInfo.priority,
            current_distance: customerInfo.current_distance
          }
        })
      });
    } catch (slackError) {
      console.error('Slack notification failed:', slackError);
    }

    return res.status(200).json({ 
      success: true,
      booking_id: booking.id,
      message: '예약이 완료되었습니다. 곧 연락드리겠습니다.'
    });
    
  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
