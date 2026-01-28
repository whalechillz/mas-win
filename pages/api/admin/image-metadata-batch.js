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

    // 모드 2: paths upsert (image_assets 사용)
    if (Array.isArray(paths) && paths.length > 0) {
      const bucket = process.env.NEXT_PUBLIC_IMAGE_BUCKET || 'blog-images';
      const updates = paths.map((p) => {
        const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${p}`;
        // image_assets에는 cdn_url과 file_path 사용
        return { 
          cdn_url: url,
          file_path: p
        };
      });
      const { error } = await supabase
        .from('image_assets')
        .upsert(updates, { onConflict: 'cdn_url' });
      if (error) return res.status(500).json({ error: error.message, where: 'upsert paths', count: updates.length });
      return res.status(200).json({ success: true, count: updates.length });
    }

    // 모드 1: imageUrls 조회
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ error: 'imageUrls or paths is required' });
    }

    const normalized = Array.from(new Set(imageUrls.filter((u) => typeof u === 'string' && u.length > 0)));
    if (normalized.length === 0) return res.status(200).json({ metadata: {} });

    const { data, error } = await supabase
      .from('image_assets')
      .select('*')
      .in('cdn_url', normalized);
    if (error) return res.status(500).json({ error: error.message, where: 'select by imageUrls', count: normalized.length });

    const map = {};
    for (const row of data || []) {
      map[row.cdn_url] = {
        alt_text: row.alt_text || '',
        tags: Array.isArray(row.ai_tags) ? row.ai_tags : [],
        title: row.title || '',
        description: row.description || '',
        category_id: null, // image_assets에는 category_id가 없음
        prompt: row.prompt || '',
        file_size: row.file_size || 0,
        width: row.width || 0,
        height: row.height || 0,
        format: row.format || '',
        folder_path: row.file_path || ''
      };
    }
    return res.status(200).json({ metadata: map });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}

