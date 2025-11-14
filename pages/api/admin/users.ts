import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        message: 'Supabase 클라이언트 초기화 실패'
      });
    }

    const { data: users, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('사용자 로드 오류:', error);
      return res.status(500).json({
        success: false,
        message: '사용자 데이터 로드 실패',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      users: users || []
    });
  } catch (error: any) {
    console.error('API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류',
      error: error.message
    });
  }
}

