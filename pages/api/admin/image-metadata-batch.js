import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// 단일 핸들러: 두 모드 지원
// 1) { imageUrls: string[] } → 메타데이터 조회
// 2) { paths: string[] } → file_name 기반 upsert(폴더 경로 보정)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase env not configured' });
    }
    const { imageUrls, paths } = req.body || {};

    // 모드 2: paths upsert
    if (Array.isArray(paths) && paths.length > 0) {
      const bucket = process.env.NEXT_PUBLIC_IMAGE_BUCKET || 'blog-images';
      const updates = paths.map((p) => {
        const folder = p.includes('/') ? p.substring(0, p.lastIndexOf('/')) : '';
        const base = p.includes('/') ? p.substring(p.lastIndexOf('/') + 1) : p;
        const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${p}`;
        return { file_name: base, image_url: url, folder_path: folder };
      });
      const { error } = await supabase
        .from('image_metadata')
        .upsert(updates, { onConflict: 'file_name' });
      if (error) return res.status(500).json({ error: error.message, details: { updates } });
      return res.status(200).json({ success: true, count: updates.length });
    }

    // 모드 1: imageUrls 조회
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ error: 'imageUrls or paths is required' });
    }

    const { data, error } = await supabase
      .from('image_metadata')
      .select('*')
      .in('image_url', imageUrls);
    if (error) return res.status(500).json({ error: error.message, where: 'select by imageUrls', count: imageUrls.length });

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
        format: row.format || '',
        folder_path: row.folder_path || ''
      };
    }
    return res.status(200).json({ metadata: map });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}

