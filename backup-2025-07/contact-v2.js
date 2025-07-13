import { createClient } from '@supabase/supabase-js';

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
      name,
      phone,
      call_times,
      inquiry_type,
      message,
      preferred_contact_time,
      // 퀴즈 데이터
      swing_style,
      priority,
      current_distance,
      campaign_source
    } = req.body;

    console.log('Contact request:', req.body);

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
      } else if (name && phone) {
        // 새 퀴즈 결과 생성 - 여기에 퀴즈 데이터 저장
        const { data: newQuiz, error: quizError } = await supabase
          .from('quiz_results')
          .insert({
            name,
            phone,
            swing_style,
            priority,
            current_distance,
            campaign_source: campaign_source || 'direct-contact'
          })
          .select()
          .single();
        
        if (quizError) throw quizError;
        finalQuizResultId = newQuiz.id;
      }
    }

    // 문의 생성 - quiz_result_id만 저장 (중복 필드 제거)
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        quiz_result_id: finalQuizResultId,
        name: name,
        phone: phone,
        call_times: call_times || preferred_contact_time || '상담 가능 시간 미정',
        campaign_source: campaign_source || 'direct-contact'
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
      const slackMessage = `📞 새로운 문의!
이름: ${customerInfo.name}
전화: ${customerInfo.phone}
통화 가능 시간: ${contact.call_times}
${customerInfo.swing_style ? `스타일: ${customerInfo.swing_style}` : ''}
${customerInfo.priority ? `우선순위: ${customerInfo.priority}` : ''}
${customerInfo.current_distance ? `현재거리: ${customerInfo.current_distance}` : ''}`;

      await fetch('/api/slack/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          message: slackMessage
        })
      });
    } catch (slackError) {
      console.error('Slack notification failed:', slackError);
    }

    return res.status(200).json({ 
      success: true,
      contact_id: contact.id,
      quiz_result_id: finalQuizResultId,
      message: '문의가 접수되었습니다. 곧 연락드리겠습니다.',
      data: contact
    });
    
  } catch (error) {
    console.error('Contact error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
