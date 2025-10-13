import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { imageUrls = [] } = req.body || {};
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ error: 'imageUrls is required' });
    }

    console.log('🔍 Fetching metadata for images:', imageUrls.length);

    // image_metadata 테이블에서 image_url로 조회
    const { data, error } = await supabase
      .from('image_metadata')
      .select('*')
      .in('image_url', imageUrls);
    
    if (error) {
      console.error('❌ Supabase query error:', error);
      throw error;
    }

    console.log('✅ Found metadata for', data?.length || 0, 'images');

    const map = {};
    for (const row of data || []) {
      map[row.image_url] = {
        alt_text: row.alt_text || '',
        tags: row.tags || [],
        title: row.title || '',
        description: row.description || '',
        category_id: row.category_id || null,
        prompt: row.prompt || '',
        file_size: row.file_size || 0,
        width: row.width || 0,
        height: row.height || 0,
        format: row.format || ''
      };
    }
    
    return res.status(200).json({ metadata: map });
  } catch (e) {
    console.error('❌ Batch metadata error:', e);
    return res.status(500).json({ 
      error: 'Internal error', 
      details: e.message,
      code: e.code 
    });
  }
}


