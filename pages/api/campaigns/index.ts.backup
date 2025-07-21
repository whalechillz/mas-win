import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;

    // 상태 자동 업데이트
    await supabase.rpc('update_campaign_status');

    return res.status(200).json(campaigns || []);
  } catch (error) {
    console.error('Campaigns API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
}
