import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { status = 'all', calendar_id } = req.query;

    let query = supabase
      .from('channel_sms')
      .select('*, calendar_id, solapi_group_id, group_statuses') // ⭐ group_statuses 포함
      .order('created_at', { ascending: false });

    // 소프트 삭제 제외
    query = query.is('deleted_at', null);

    // 상태별 필터링
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // 허브 콘텐츠별 필터링
    if (calendar_id) {
      query = query.eq('calendar_id', calendar_id);
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