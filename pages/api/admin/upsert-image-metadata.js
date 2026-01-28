import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase environment variables are not set.' });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const {
      file_name,
      image_url,
      folder_path = '',
      source = 'uploaded',
      channel = 'etc',
      size_key = '',
      date_folder = '',
      alt_text = '',
      title = '',
      description = '',
      keywords = [],
      width = null,
      height = null,
      file_size = null,
      gps_lat = null,
      gps_lng = null,
      taken_at = null,
    } = req.body || {};

    if (!file_name || !image_url) {
      return res.status(400).json({ error: 'file_name and image_url are required' });
    }

    const payload = {
      file_name,
      image_url,
      folder_path,
      source,
      channel,
      size_key,
      date_folder,
      alt_text,
      title,
      description,
      tags: Array.isArray(keywords) ? keywords : [],
      width,
      height,
      file_size,
      gps_lat,
      gps_lng,
      taken_at,
      updated_at: new Date().toISOString(),
    };

    // upsert by file_name
    const { data, error } = await supabase
        .from('image_assets')
      .upsert(payload, { onConflict: 'file_name' })
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data: data?.[0] || null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}


