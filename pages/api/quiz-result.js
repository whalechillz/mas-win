const { createClient } = require('@supabase/supabase-js');

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
    const { style, priority, current_distance, recommended_product } = req.body;
    
    console.log('Quiz result received:', { style, priority, current_distance, recommended_product });

    // Supabase 연결 확인
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials not configured');
      throw new Error('Database configuration error');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // IP 주소와 User Agent 가져오기
    const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];

    // Supabase에 저장
    const { data, error } = await supabase
      .from('quiz_results')
      .insert({
        style,
        priority,
        current_distance,
        recommended_product,
        ip_address,
        user_agent
      });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    res.status(200).json({ 
      success: true, 
      message: '퀴즈 결과가 저장되었습니다.',
      data 
    });
    
  } catch (error) {
    console.error('Quiz result error:', error);
    res.status(500).json({ 
      error: 'Failed to save quiz result',
      message: error.message 
    });
  }
}