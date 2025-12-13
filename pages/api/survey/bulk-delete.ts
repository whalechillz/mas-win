import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '삭제할 설문 ID가 필요합니다.' });
    }

    // 일괄 삭제
    const { error } = await supabase
      .from('surveys')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('일괄 삭제 오류:', error);
      return res.status(500).json({
        success: false,
        message: '일괄 삭제 중 오류가 발생했습니다.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `${ids.length}개의 설문이 삭제되었습니다.`,
    });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}


