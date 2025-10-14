import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase env missing' });
  }

  try {
    const { paths = [] } = req.body || {};
    if (!Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ error: 'paths array required' });
    }

    const proto = (req.headers['x-forwarded-proto'] || 'https');
    const host = req.headers.host;
    const baseUrl = `${proto}://${host}`;

    const results = [];
    for (const path of paths) {
      try {
        // 1) extract exif
        const exifResp = await fetch(`${baseUrl}/api/admin/extract-exif`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path }),
        });
        if (!exifResp.ok) {
          const text = await exifResp.text();
          throw new Error(`extract-exif failed: ${exifResp.status} ${text}`);
        }
        const exifJson = await exifResp.json();
        const meta = exifJson.meta || {};

        // 2) upsert metadata
        const fileName = path.includes('/') ? path.substring(path.lastIndexOf('/') + 1) : path;
        const folderPath = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_IMAGE_BUCKET || 'blog-images'}/${path}`;

        const upsertResp = await fetch(`${baseUrl}/api/admin/upsert-image-metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_name: fileName,
            image_url: publicUrl,
            folder_path: folderPath,
            width: meta.width || null,
            height: meta.height || null,
            gps_lat: meta.gps_lat ?? null,
            gps_lng: meta.gps_lng ?? null,
            taken_at: meta.taken_at ?? null,
          }),
        });
        if (!upsertResp.ok) {
          const text = await upsertResp.text();
          throw new Error(`upsert failed: ${upsertResp.status} ${text}`);
        }
        const upsertJson = await upsertResp.json();
        results.push({ path, success: true, data: upsertJson.data || null, meta });
      } catch (e) {
        results.push({ path, success: false, error: e.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    // count 필드도 함께 반환(프론트 호환)
    return res.status(200).json({ success: true, successCount, count: successCount, results });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}


