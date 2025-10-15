import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { calendarId } = req.body || {};
    if (!calendarId) return res.status(400).json({ error: 'calendarId required' });

    // 1) 캘린더 항목 조회
    const { data: item, error: itemErr } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('id', calendarId)
      .single();
    if (itemErr || !item) return res.status(404).json({ error: 'Calendar item not found' });

    // 이미 연결되어 있으면 그대로 반환
    if (item.blog_post_id) return res.status(200).json({ blogPostId: item.blog_post_id, attached: true });

    // 2) 블로그 초안 생성
    const draft = {
      title: item.title || '새 블로그 포스트',
      content: item.description || '',
      category: item.content_type || 'blog',
      status: 'draft',
      audience_stage: item.audience_stage || 'awareness',
      conversion_goal: (item.conversion_tracking?.goal) || 'homepage_visit',
      target_product: item.target_product || 'all',
      meta_description: item.seo_meta?.description || '',
      meta_keywords: item.seo_meta?.keywords || '',
    };

    const { data: created, error: createErr } = await supabase
      .from('blog_posts')
      .insert(draft)
      .select('id')
      .single();
    if (createErr) return res.status(500).json({ error: createErr.message });

    // 3) 캘린더 항목에 연결 저장
    const { error: updateErr } = await supabase
      .from('cc_content_calendar')
      .update({ blog_post_id: created.id })
      .eq('id', calendarId);
    if (updateErr) return res.status(500).json({ error: updateErr.message });

    return res.status(200).json({ blogPostId: created.id, attached: false });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}


