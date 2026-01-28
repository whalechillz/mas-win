import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { folderPath } = req.body;

    if (!folderPath) {
      return res.status(400).json({ 
        error: 'folderPath가 필요합니다.' 
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase environment variables are not set.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('🗑️ 폴더 삭제 시작:', folderPath);

    // 1. 폴더의 모든 파일 조회
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ 폴더 조회 에러:', listError);
      return res.status(500).json({
        error: '폴더를 조회할 수 없습니다.',
        details: listError.message
      });
    }

    if (!files || files.length === 0) {
      return res.status(404).json({
        error: '폴더가 비어있거나 존재하지 않습니다.'
      });
    }

    console.log(`🗑️ ${files.length}개 파일 삭제 예정`);

    // 2. 모든 파일 삭제
    const filePaths = files
      .filter(file => file.id) // 파일인 경우만 (폴더 제외)
      .map(file => `${folderPath}/${file.name}`);

    if (filePaths.length === 0) {
      return res.status(404).json({
        error: '삭제할 파일이 없습니다.'
      });
    }

    const { data: deleteData, error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove(filePaths);

    if (deleteError) {
      console.error('❌ 파일 삭제 에러:', deleteError);
      return res.status(500).json({
        error: '파일 삭제에 실패했습니다.',
        details: deleteError.message
      });
    }

    console.log(`✅ ${filePaths.length}개 파일 삭제 완료`);

    // 3. 메타데이터 삭제
    let metadataDeleted = 0;
    for (const filePath of filePaths) {
      const { error: metadataError } = await supabase
        .from('image_assets')
        .delete()
        .like('file_name', `%${filePath}%`);

      if (metadataError) {
        console.warn('⚠️ 메타데이터 삭제 실패:', filePath, metadataError);
      } else {
        metadataDeleted++;
      }
    }

    console.log(`🗑️ 폴더 삭제 완료: ${filePaths.length}개 파일, ${metadataDeleted}개 메타데이터 삭제`);

    return res.status(200).json({
      success: true,
      message: `폴더가 삭제되었습니다: ${folderPath}`,
      deletedFiles: filePaths.length,
      metadataDeleted: metadataDeleted,
      deletedFilePaths: filePaths
    });

  } catch (error) {
    console.error('Delete Folder API Error:', error);
    return res.status(500).json({
      error: '폴더 삭제 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}
