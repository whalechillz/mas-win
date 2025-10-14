import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { path } = req.body || {};
    if (!path) {
      return res.status(400).json({ error: 'path is required' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase environment variables are not set');
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase
      .storage
      .from('blog-images')
      .createSignedUploadUrl(path);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      path,
      token: data?.token,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}


