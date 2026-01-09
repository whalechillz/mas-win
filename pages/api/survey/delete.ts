import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: '설문 ID가 필요합니다.',
      });
    }

    // 설문 삭제
    const { error: deleteError } = await supabase
      .from('surveys')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('설문 삭제 오류:', deleteError);
      return res.status(500).json({
        success: false,
        message: '설문 삭제에 실패했습니다.',
        error: deleteError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: '설문이 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('설문 삭제 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}

