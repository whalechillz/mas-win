import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids 배열이 필요합니다.' });
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('channel_sms')
      .update({ deleted_at: now })
      .in('id', ids);

    if (error) {
      console.error('SMS 일괄 삭제 오류:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, message: `총 ${ids.length}건 보관(삭제) 처리` });
  } catch (e) {
    console.error('SMS 일괄 삭제 예외:', e);
    return res.status(500).json({ success: false, message: e.message });
  }
}


