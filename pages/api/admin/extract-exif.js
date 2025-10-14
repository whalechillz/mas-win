import { createClient } from '@supabase/supabase-js';
import exifr from 'exifr';
import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

// req: { path: string } or { publicUrl: string }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.NEXT_PUBLIC_IMAGE_BUCKET || 'blog-images';
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase env missing' });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { path, publicUrl } = req.body || {};
    if (!path && !publicUrl) {
      return res.status(400).json({ error: 'path or publicUrl required' });
    }

    let arrayBuffer;
    if (path) {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error) return res.status(404).json({ error: `download failed: ${error.message}` });
      arrayBuffer = await data.arrayBuffer();
    } else {
      const resp = await fetch(publicUrl);
      if (!resp.ok) return res.status(404).json({ error: `fetch failed: ${resp.status}` });
      arrayBuffer = await resp.arrayBuffer();
    }

    const buffer = Buffer.from(arrayBuffer);

    // 1) exifr 우선 (가장 정교한 EXIF/GPS)
    let parsed = null;
    try {
      parsed = await exifr.parse(buffer, { gps: true, tiff: true, ifd0: true, exif: true, xmp: true, icc: false, iptc: true });
    } catch (_) {}

    // 2) 보조: sharp 메타데이터 (기본 width/height, orientation 등)
    let sharpMeta = null;
    try {
      sharpMeta = await sharp(buffer).metadata();
    } catch (_) {}

    const gps_lat = parsed?.latitude ?? null;
    const gps_lng = parsed?.longitude ?? null;
    const taken_at = parsed?.DateTimeOriginal || parsed?.CreateDate || null;
    const width = sharpMeta?.width ?? parsed?.ExifImageWidth ?? null;
    const height = sharpMeta?.height ?? parsed?.ExifImageHeight ?? null;

    return res.status(200).json({
      success: true,
      exif: parsed || null,
      meta: {
        width,
        height,
        orientation: sharpMeta?.orientation ?? null,
        taken_at,
        gps_lat,
        gps_lng,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}


