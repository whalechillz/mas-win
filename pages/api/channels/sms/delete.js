import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: '메시지 ID는 필수입니다.'
      });
    }

    // 소프트 삭제: deleted_at 설정
    const { error } = await supabase
      .from('channel_sms')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('SMS 삭제 오류:', error);
      return res.status(500).json({
        success: false,
        message: 'SMS 삭제 중 오류가 발생했습니다.',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'SMS가 성공적으로 삭제(보관)되었습니다.'
    });

  } catch (error) {
    console.error('SMS 삭제 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
}
