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

    // Solapi 연동 여부 조회 (group_id가 있으면 연동된 것으로 판단)
    const { data: row, error: readErr } = await supabase
      .from('channel_sms')
      .select('status, solapi_group_id, solapi_message_id')
      .eq('id', id)
      .single();
    if (readErr) {
      console.error('삭제 전 조회 오류:', readErr);
      return res.status(500).json({ success: false, message: readErr.message });
    }

    const linkedWithSolapi = !!(row?.solapi_group_id || row?.solapi_message_id);

    let error;
    if (!linkedWithSolapi) {
      // 실제 삭제 (초안 또는 Solapi 미연동 데이터)
      ({ error } = await supabase.from('channel_sms').delete().eq('id', id));
    } else {
      // 보관(소프트 삭제)
      ({ error } = await supabase
        .from('channel_sms')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id));
    }

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
      message: linkedWithSolapi ? '보관 처리되었습니다.' : '완전 삭제되었습니다.'
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
