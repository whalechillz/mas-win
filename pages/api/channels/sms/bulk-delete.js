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
    // 대상 상태/연동 여부 조회
    const { data: rows, error: readErr } = await supabase
      .from('channel_sms')
      .select('id, status, solapi_group_id, solapi_message_id')
      .in('id', ids);
    if (readErr) return res.status(500).json({ success: false, message: readErr.message });

    const hardIds = (rows || []).filter(r => !(r.solapi_group_id || r.solapi_message_id)).map(r => r.id);
    const softIds = (rows || []).filter(r => (r.solapi_group_id || r.solapi_message_id)).map(r => r.id);

    if (hardIds.length) {
      const { error: delErr } = await supabase.from('channel_sms').delete().in('id', hardIds);
      if (delErr) return res.status(500).json({ success: false, message: delErr.message });
    }
    if (softIds.length) {
      const { error: updErr } = await supabase
        .from('channel_sms')
        .update({ deleted_at: now })
        .in('id', softIds);
      if (updErr) return res.status(500).json({ success: false, message: updErr.message });
    }

    return res.status(200).json({ success: true, message: `완전 삭제 ${hardIds.length}건, 보관 처리 ${softIds.length}건` });
  } catch (e) {
    console.error('SMS 일괄 삭제 예외:', e);
    return res.status(500).json({ success: false, message: e.message });
  }
}


