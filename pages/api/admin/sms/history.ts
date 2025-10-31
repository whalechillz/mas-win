import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { contentId, page = '1', pageSize = '100' } = req.query as Record<string, string>;
    if (!contentId) return res.status(400).json({ success: false, message: 'contentId is required' });

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const sizeNum = Math.min(1000, Math.max(1, parseInt(pageSize as string, 10) || 100));
    const from = (pageNum - 1) * sizeNum;
    const to = from + sizeNum - 1;

    const { data, error, count } = await supabase
      .from('message_logs')
      .select('*', { count: 'exact' })
      .eq('content_id', String(contentId))
      .order('sent_at', { ascending: false })
      .range(from, to);

    if (error) return res.status(500).json({ success: false, message: error.message });

    const sent = (data || []).filter((d: any) => String(d.status || '').toLowerCase() !== 'failed').length;
    const failed = (data || []).filter((d: any) => String(d.status || '').toLowerCase() === 'failed').length;

    return res.status(200).json({ success: true, count, sent, failed, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
}

