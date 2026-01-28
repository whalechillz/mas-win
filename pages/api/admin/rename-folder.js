import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { oldFolderPath, newFolderPath } = req.body;

    if (!oldFolderPath || !newFolderPath) {
      return res.status(400).json({ 
        error: 'oldFolderPath와 newFolderPath가 필요합니다.' 
      });
    }

    if (oldFolderPath === newFolderPath) {
      return res.status(400).json({ 
        error: '새 폴더명이 기존과 동일합니다.' 
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase environment variables are not set.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('📁 폴더명 변경 시작:', { oldFolderPath, newFolderPath });

    // 1. 기존 폴더의 모든 파일 조회
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(oldFolderPath, {
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

    console.log(`📁 ${files.length}개 파일 발견`);

    // 2. 각 파일을 새 폴더로 이동
    const movedFiles = [];
    const errors = [];

    for (const file of files) {
      if (file.id) { // 파일인 경우만 (폴더 제외)
        const oldFilePath = `${oldFolderPath}/${file.name}`;
        const newFilePath = `${newFolderPath}/${file.name}`;

        try {
          // 파일 다운로드
          const { data: downloadData, error: downloadError } = await supabase.storage
            .from('blog-images')
            .download(oldFilePath);

          if (downloadError) {
            throw new Error(`다운로드 실패: ${downloadError.message}`);
          }

          // 새 위치에 업로드
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(newFilePath, downloadData, {
              contentType: file.metadata?.mimetype || 'image/jpeg',
              upsert: false
            });

          if (uploadError) {
            throw new Error(`업로드 실패: ${uploadError.message}`);
          }

          // 기존 파일 삭제
          const { error: deleteError } = await supabase.storage
            .from('blog-images')
            .remove([oldFilePath]);

          if (deleteError) {
            console.warn('⚠️ 기존 파일 삭제 실패:', deleteError);
          }

          movedFiles.push({
            fileName: file.name,
            oldPath: oldFilePath,
            newPath: newFilePath
          });

          console.log(`✅ 파일 이동 완료: ${file.name}`);

        } catch (error) {
          console.error(`❌ 파일 이동 실패: ${file.name}`, error);
          errors.push({
            fileName: file.name,
            error: error.message
          });
        }
      }
    }

    // 3. 메타데이터 업데이트
    // 주의: image_metadata 테이블에는 file_name 컬럼이 없고 image_url만 있음
    let metadataUpdated = 0;
    if (movedFiles.length > 0) {
      for (const movedFile of movedFiles) {
        const oldImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-images/${movedFile.oldPath}`;
        const newImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-images/${movedFile.newPath}`;
        
        const { error: metadataError } = await supabase
          .from('image_assets')
          .update({
            image_url: newImageUrl
          })
          .eq('image_url', oldImageUrl);

        if (metadataError) {
          console.warn('⚠️ 메타데이터 업데이트 실패:', movedFile.fileName, metadataError);
        } else {
          metadataUpdated++;
        }
      }
    }

    console.log(`📁 폴더명 변경 완료: ${movedFiles.length}개 파일 이동, ${metadataUpdated}개 메타데이터 업데이트`);

    return res.status(200).json({
      success: true,
      message: `폴더명이 변경되었습니다: ${oldFolderPath} → ${newFolderPath}`,
      movedFiles: movedFiles.length,
      metadataUpdated: metadataUpdated,
      errors: errors.length,
      details: {
        movedFiles,
        errors
      }
    });

  } catch (error) {
    console.error('Rename Folder API Error:', error);
    return res.status(500).json({
      error: '폴더명 변경 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}
