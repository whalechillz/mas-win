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
    const { style, priority, current_distance, recommended_product } = req.body;
    
    console.log('Quiz result received:', { style, priority, current_distance, recommended_product });

    // IP 주소와 User Agent 가져오기
    const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];

    // 데이터 삽입 시도
    const { data, error } = await supabase
      .from('quiz_results')
      .insert([{
        style,
        priority,
        current_distance,
        recommended_product,
        ip_address,
        user_agent
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

    console.log('Quiz result saved successfully:', data);

    return res.status(200).json({ 
      success: true, 
      message: '퀴즈 결과가 저장되었습니다.',
      data: data[0]
    });
    
  } catch (error) {
    console.error('Quiz result error:', error);
    res.status(500).json({ 
      error: 'Failed to save quiz result',
      message: error.message
    });
  }
}