import { createClient } from '@supabase/supabase-js';
import { generateShortCode, normalizeUrl } from '../../../lib/shortlink';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { targetUrl, utm, expiresAt } = req.body || {};
    if (!targetUrl) return res.status(400).json({ error: 'targetUrl required' });

    const normalized = normalizeUrl(targetUrl);
    // 생성 충돌 방지 루프 (최대 5회)
    let code = generateShortCode(6);
    for (let i = 0; i < 5; i++) {
      const { data: exists } = await supabase
        .from('short_links')
        .select('code')
        .eq('code', code)
        .single();
      if (!exists) break;
      code = generateShortCode(6);
    }

    const { error } = await supabase.from('short_links').insert({
      code,
      target_url: normalized,
      utm: utm || null,
      expires_at: expiresAt || null,
    });
    if (error) return res.status(500).json({ error: error.message });

    const base = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;
    return res.status(200).json({ shortUrl: `${base}/s/${code}`, code });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}



