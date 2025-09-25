export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    campaign_id, 
    page, 
    blog_title, 
    blog_slug, 
    blog_category,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    referrer,
    search_keyword,
    traffic_source
  } = req.body;
  
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

    // 기본 조회수 추적
    const { error: insertError } = await supabase.from('page_views').insert({
      campaign_id,
      page_url: page,
      user_agent: req.headers['user-agent'] || '',
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      referer: req.headers['referer'] || '',
      created_at: new Date().toISOString()
    });

    // 블로그 상세 추적 (블로그 페이지인 경우)
    if (blog_title && blog_slug) {
      const { error: blogError } = await supabase.from('blog_analytics').insert({
        blog_title,
        blog_slug,
        blog_category,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        referrer,
        search_keyword,
        traffic_source,
        user_agent: req.headers['user-agent'] || '',
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        page_url: page,
        created_at: new Date().toISOString()
      });

      if (blogError) {
        console.error('Blog analytics insert error:', blogError);
      }
    }

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
