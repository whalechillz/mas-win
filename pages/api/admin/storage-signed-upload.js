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

    // 파일 존재 여부 확인 (서명 URL 발급 전에 체크)
    const pathParts = path.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const folderPath = pathParts.slice(0, -1).join('/');

    try {
      const { data: files, error: listError } = await supabase.storage
        .from('blog-images')
        .list(folderPath || '', {
          limit: 1000
        });

      if (!listError && files) {
        const fileExists = files.some(f => f.name === fileName);
        if (fileExists) {
          // 파일이 이미 존재함 - 409 Conflict 반환
          return res.status(409).json({ 
            error: 'The resource already exists',
            exists: true,
            path: path
          });
        }
      }
    } catch (checkError) {
      // 파일 존재 확인 실패는 무시하고 계속 진행 (서명 URL 발급 시도)
      console.warn('⚠️ 파일 존재 확인 실패, 계속 진행:', checkError.message);
    }

    // 파일이 없으면 서명 URL 발급
    const { data, error } = await supabase
      .storage
      .from('blog-images')
      .createSignedUploadUrl(path);

    if (error) {
      // "already exists" 에러도 409로 처리
      if (error.message?.includes('already exists') || error.message?.includes('resource already')) {
        return res.status(409).json({ 
          error: 'The resource already exists',
          exists: true,
          path: path
        });
      }
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


