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
      quiz_result_id,
      date, 
      time, 
      club,
      // 폴백을 위한 필드들
      name,
      phone,
      swing_style,
      priority,
      current_distance,
      recommended_flex,
      expected_distance,
      campaign_source
    } = req.body;

    console.log('Booking request:', req.body);

    let finalQuizResultId = quiz_result_id;

    // quiz_result_id가 없으면 phone으로 찾거나 새로 생성
    if (!finalQuizResultId && phone) {
      // 기존 퀴즈 결과 찾기
      const { data: existingQuiz } = await supabase
        .from('quiz_results')
        .select('id')
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingQuiz) {
        finalQuizResultId = existingQuiz.id;
        
        // 추가 정보가 있으면 업데이트
        if (swing_style || priority || current_distance) {
          await supabase
            .from('quiz_results')
            .update({
              swing_style: swing_style || undefined,
              priority: priority || undefined,
              current_distance: current_distance || undefined,
              recommended_flex: recommended_flex || undefined,
              expected_distance: expected_distance || undefined,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingQuiz.id);
        }
      } else if (name && phone) {
        // 새 퀴즈 결과 생성
        const { data: newQuiz, error: quizError } = await supabase
          .from('quiz_results')
          .insert({
            name,
            phone,
            swing_style,
            priority,
            current_distance,
            recommended_flex,
            expected_distance,
            campaign_source: campaign_source || 'direct-booking'
          })
          .select()
          .single();
        
        if (quizError) throw quizError;
        finalQuizResultId = newQuiz.id;
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
      .select()
      .single();

    if (error) throw error;

    // 고객 정보 가져오기
    let customerInfo = { name, phone };
    if (finalQuizResultId) {
      const { data: quizData } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('id', finalQuizResultId)
        .single();
      
      if (quizData) {
        customerInfo = quizData;
      }
    }

    // 슬랙 알림
    try {
      const slackMessage = `🏌️ 새로운 시타 예약!
이름: ${customerInfo.name}
전화: ${customerInfo.phone}
날짜: ${booking.date}
시간: ${booking.time}
클럽: ${booking.club}
${customerInfo.swing_style ? `스타일: ${customerInfo.swing_style}` : ''}
${customerInfo.priority ? `우선순위: ${customerInfo.priority}` : ''}
${customerInfo.current_distance ? `현재거리: ${customerInfo.current_distance}` : ''}`;

      await fetch(SLACK_API_URL, {
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
            current_distance: customerInfo.current_distance,
            recommended_flex: customerInfo.recommended_flex
          }
        })
      });
    } catch (slackError) {
      console.error('Slack notification failed:', slackError);
    }

    return res.status(200).json({ 
      success: true,
      booking_id: booking.id,
      quiz_result_id: finalQuizResultId,
      message: '예약이 완료되었습니다. 곧 연락드리겠습니다.',
      data: booking
    });
    
  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
