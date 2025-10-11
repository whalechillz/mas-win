import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧹 Replicate 중복 이미지 정리 시작...');

    // blog-images 버킷에서 replicate-flux로 시작하는 파일들 조회
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      throw new Error(`파일 목록 조회 실패: ${listError.message}`);
    }

    // replicate-flux로 시작하는 파일들 필터링
    const replicateFiles = files.filter(file => 
      file.name.startsWith('replicate-flux-')
    );

    console.log(`🔍 발견된 replicate-flux 파일들: ${replicateFiles.length}개`);

    if (replicateFiles.length === 0) {
      return res.status(200).json({
        success: true,
        message: '정리할 replicate-flux 파일이 없습니다.',
        deletedCount: 0
      });
    }

    // 파일명들 추출
    const fileNames = replicateFiles.map(file => file.name);
    
    // Supabase Storage에서 삭제
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove(fileNames);

    if (deleteError) {
      throw new Error(`파일 삭제 실패: ${deleteError.message}`);
    }

    console.log(`✅ ${fileNames.length}개의 replicate-flux 파일 삭제 완료`);

    return res.status(200).json({
      success: true,
      message: `${fileNames.length}개의 replicate-flux 중복 파일이 정리되었습니다.`,
      deletedFiles: fileNames,
      deletedCount: fileNames.length
    });

  } catch (error) {
    console.error('❌ Replicate 중복 이미지 정리 실패:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
