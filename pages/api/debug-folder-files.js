import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase environment variables are not set.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { folderPath } = req.query;
    
    console.log('🔍 폴더 디버깅:', folderPath || '루트');

    // 1. 지정된 폴더의 파일들 조회
    const { data: folderFiles, error: folderError } = await supabase.storage
      .from('blog-images')
      .list(folderPath || '', {
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (folderError) {
      console.error('❌ 폴더 조회 에러:', folderError);
      return res.status(500).json({
        success: false,
        error: folderError.message,
        folderPath: folderPath || '루트'
      });
    }

    // 2. 각 파일의 상세 정보 수집
    const fileDetails = [];
    for (const file of folderFiles || []) {
      if (file.id) { // 파일인 경우만 (폴더 제외)
        const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fullPath);
        
        // 파일 존재 확인
        let exists = false;
        try {
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          exists = response.ok;
        } catch (error) {
          console.log('⚠️ 파일 존재 확인 실패:', fullPath, error.message);
        }

        fileDetails.push({
          name: file.name,
          fullPath: fullPath,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          publicUrl: urlData.publicUrl,
          exists: exists
        });
      }
    }

    // 3. 메타데이터와 매칭 확인
    const { data: metadata, error: metadataError } = await supabase
      .from('image_metadata')
      .select('*')
      .like('file_name', folderPath ? `%${folderPath}%` : '%');

    return res.status(200).json({
      success: true,
      folderPath: folderPath || '루트',
      files: fileDetails,
      metadata: metadata || [],
      totalFiles: fileDetails.length,
      existingFiles: fileDetails.filter(f => f.exists).length,
      metadataCount: metadata?.length || 0
    });

  } catch (error) {
    console.error('Debug Folder Files API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack,
    });
  }
}
