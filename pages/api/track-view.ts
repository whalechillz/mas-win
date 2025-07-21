import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { campaign_id, page } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || '';

  try {
    await supabase.from('page_views').insert({
      campaign_id,
      page_url: page,
      user_agent: userAgent,
      ip_address: ip as string,
      referer,
      created_at: new Date().toISOString()
    });

    const { data: currentMetrics } = await supabase
      .from('campaign_metrics')
      .select('views')
      .eq('campaign_id', campaign_id)
      .single();

    if (currentMetrics) {
      await supabase
        .from('campaign_metrics')
        .update({ 
          views: (currentMetrics.views || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaign_id);
    } else {
      await supabase
        .from('campaign_metrics')
        .insert({
          campaign_id,
          views: 1,
          unique_visitors: 0,
          phone_clicks: 0,
          form_submissions: 0,
          quiz_completions: 0,
          conversion_rate: 0
        });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    return res.status(500).json({ error: 'Failed to track view' });
  }
}
