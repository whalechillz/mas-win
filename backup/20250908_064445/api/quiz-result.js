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
      name, 
      phone, 
      email,
      swing_style, 
      priority, 
      current_distance, 
      recommended_flex, 
      expected_distance,
      recommended_club,
      campaign_source 
    } = req.body;

    console.log('Quiz result received:', req.body);

    // 필수 필드 확인
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: '이름과 연락처는 필수입니다.' 
      });
    }

    // 기존 퀴즈 결과 확인
    const { data: existingQuiz } = await supabase
      .from('quiz_results')
      .select('id')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let quizResult;

    if (existingQuiz) {
      // 기존 결과 업데이트
      const { data, error } = await supabase
        .from('quiz_results')
        .update({
          name,
          email,
          swing_style,
          priority,
          current_distance,
          recommended_flex,
          expected_distance,
          recommended_club,
          campaign_source,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingQuiz.id)
        .select()
        .single();

      if (error) throw error;
      quizResult = data;
    } else {
      // 새 퀴즈 결과 생성
      const { data, error } = await supabase
        .from('quiz_results')
        .insert({
          name,
          phone,
          email,
          swing_style,
          priority,
          current_distance,
          recommended_flex,
          expected_distance,
          recommended_club,
          campaign_source: campaign_source || 'funnel-2025-07'
        })
        .select()
        .single();

      if (error) throw error;
      quizResult = data;
    }

    // 슬랙 알림
    try {
      const slackMessage = `🏌️ 새로운 퀴즈 결과!
이름: ${name}
전화: ${phone}
스타일: ${swing_style}
우선순위: ${priority}
현재 거리: ${current_distance}
추천 제품: ${recommended_club || recommended_flex}
${existingQuiz ? '(기존 고객 업데이트)' : '(신규 고객)'}`;

      await fetch('/api/slack/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quiz',
          message: slackMessage
        })
      });
    } catch (slackError) {
      console.error('Slack notification failed:', slackError);
    }

    return res.status(200).json({ 
      success: true,
      quiz_result_id: quizResult.id,
      message: '퀴즈 결과가 저장되었습니다.',
      data: quizResult
    });
    
  } catch (error) {
    console.error('Quiz save error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
