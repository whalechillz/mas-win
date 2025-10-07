import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { imageNames = [] } = req.body || {};
    if (!Array.isArray(imageNames) || imageNames.length === 0) {
      return res.status(400).json({ error: 'imageNames is required' });
    }

    // 메타데이터 테이블: image_metadata (가정) name, alt_text, keywords, title, description, category
    const { data, error } = await supabase
      .from('image_metadata')
      .select('*')
      .in('name', imageNames);
    if (error) throw error;

    const map = {};
    for (const row of data || []) {
      map[row.name] = {
        alt_text: row.alt_text || '',
        keywords: row.keywords || [],
        title: row.title || '',
        description: row.description || '',
        category: row.category || ''
      };
    }
    return res.status(200).json({ metadata: map });
  } catch (e) {
    console.error('batch metadata error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}


