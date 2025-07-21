export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { campaign_id, page } = req.body;
  
  // 환경변수 확인
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Supabase 동적 import
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 페이지 뷰 기록
    const { error: insertError } = await supabase.from('page_views').insert({
      campaign_id,
      page_url: page,
      user_agent: req.headers['user-agent'] || '',
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      referer: req.headers['referer'] || '',
      created_at: new Date().toISOString()
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to track view' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    return res.status(500).json({ error: error.message });
  }
}
