import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { style, priority, current_distance, recommended_product } = req.body;

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

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Quiz result error:', error);
    res.status(500).json({ error: 'Failed to save quiz result' });
  }
}