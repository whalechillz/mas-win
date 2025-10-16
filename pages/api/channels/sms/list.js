import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { status = 'all' } = req.query;

    let query = supabase
      .from('channel_sms')
      .select('*')
      .order('created_at', { ascending: false });

    // 상태별 필터링
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('SMS 목록 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: 'SMS 목록 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      messages: messages || [],
      total: messages?.length || 0
    });

  } catch (error) {
    console.error('SMS 목록 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
}
