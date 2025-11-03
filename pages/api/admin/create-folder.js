import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { folderPath } = req.body;
    if (!folderPath) {
      return res.status(400).json({ error: 'folderPath가 필요합니다.' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase environment variables are not set.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 폴더 생성은 저장소에 폴더 표시용 더미 파일 업로드로 처리
    const markerPath = `${folderPath.replace(/\/$/, '')}/.keep`;
    const content = Buffer.from('placeholder');
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(markerPath, content, {
        contentType: 'text/plain; charset=utf-8',
        upsert: true,
      });

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    return res.status(200).json({ success: true, path: folderPath });
  } catch (error) {
    console.error('Create Folder API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}


