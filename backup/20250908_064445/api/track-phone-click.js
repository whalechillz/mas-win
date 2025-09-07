export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { campaign_id } = req.body;
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // campaign_metrics 테이블 업데이트
    const { error: updateError } = await supabase
      .from('campaign_metrics')
      .update({ 
        phone_clicks: supabase.rpc('increment', { row_id: campaign_id, column_name: 'phone_clicks' }),
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaign_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to track phone click' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Track phone click error:', error);
    return res.status(500).json({ error: error.message });
  }
}
