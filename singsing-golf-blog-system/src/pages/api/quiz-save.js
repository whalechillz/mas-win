import { createClient } from '@supabase/supabase-js';
import { SLACK_API_URL } from '../../lib/api-config';

const supabaseUrl = 'https://yyytjudftvpmcnppaymw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';
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
      // 고객 정보
      name, 
      phone, 
      email,
      
      // 퀴즈 결과
      swing_style, 
      priority, 
      current_distance, 
      recommended_flex, 
      expected_distance,
      recommended_club,
      
      // 캠페인 추적
      campaign_source,
      utm_source,
      utm_medium,
      utm_campaign
    } = req.body;

    // 1. 기존 퀴즈 결과 확인 (전화번호로)
    const { data: existingQuiz } = await supabase
      .from('quiz_results')
      .select('id')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let quizResultId;

    if (existingQuiz) {
      // 기존 결과 업데이트
      const { data: updatedQuiz, error: updateError } = await supabase
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
          utm_source,
          utm_medium,
          utm_campaign,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingQuiz.id)
        .select()
        .single();

      if (updateError) throw updateError;
      quizResultId = updatedQuiz.id;
    } else {
      // 새 퀴즈 결과 생성
      const { data: newQuiz, error: insertError } = await supabase
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
          campaign_source,
          utm_source,
          utm_medium,
          utm_campaign
        })
        .select()
        .single();

      if (insertError) throw insertError;
      quizResultId = newQuiz.id;
    }

    // 슬랙 알림
    try {
      await fetch(SLACK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quiz',
          data: {
            name,
            phone,
            swing_style,
            priority,
            current_distance,
            recommended_club,
            is_update: !!existingQuiz
          }
        })
      });
    } catch (slackError) {
      console.error('Slack notification failed:', slackError);
    }

    return res.status(200).json({ 
      success: true,
      quiz_result_id: quizResultId,
      message: '퀴즈 결과가 저장되었습니다.'
    });
    
  } catch (error) {
    console.error('Quiz save error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
