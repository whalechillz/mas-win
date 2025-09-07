export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 실시간 데이터 강제 업데이트
    const { data: pageViews, error: viewsError } = await supabase
      .from('page_views')
      .select('campaign_id, COUNT(*) as count')
      .group('campaign_id');

    if (viewsError) throw viewsError;

    // campaign_metrics 업데이트
    for (const view of pageViews) {
      const { error: updateError } = await supabase
        .from('campaign_metrics')
        .update({ 
          views: view.count,
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', view.campaign_id);

      if (updateError) {
        console.error('Update error for campaign:', view.campaign_id, updateError);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Data refreshed successfully',
      updated_campaigns: pageViews.length
    });
  } catch (error) {
    console.error('Force refresh error:', error);
    return res.status(500).json({ error: error.message });
  }
}
