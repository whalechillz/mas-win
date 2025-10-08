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
    const { oldName, newName } = req.body;

    if (!oldName || !newName) {
      return res.status(400).json({ error: 'oldName and newName are required' });
    }

    if (oldName === newName) {
      return res.status(200).json({ message: 'No change needed' });
    }

    console.log('📝 파일명 변경 요청:', oldName, '→', newName);

    // 1. 먼저 Supabase Storage에서 파일 존재 확인
    console.log('🔍 Storage에서 파일 검색 중:', oldName);
    
    const bucketName = 'blog-images'; // 갤러리에서 사용하는 버킷명
    console.log('🪣 사용할 버킷명:', bucketName);
    
    // Storage에서 파일 존재 확인
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from(bucketName)
      .list('', {
        search: oldName
      });

    if (storageError) {
      console.error('❌ Storage 조회 오류:', storageError);
      return res.status(500).json({ error: 'Storage access error' });
    }

    // 정확한 파일명으로 찾기
    const targetFile = storageFiles?.find(file => file.name === oldName);
    
    if (!targetFile) {
      console.error('❌ Storage에서 파일을 찾을 수 없음:', oldName);
      
      // 디버깅: 비슷한 파일명들을 찾아보기
      console.log('🔍 비슷한 파일명 검색 중...');
      const { data: allFiles, error: allError } = await supabase.storage
        .from(bucketName)
        .list('', {
          limit: 10,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (!allError && allFiles) {
        console.log('📋 최근 10개 파일명들:', allFiles.map(f => f.name));
      }
      
      return res.status(404).json({ 
        error: 'File not found in storage',
        searchedName: oldName,
        similarFiles: allFiles?.map(f => f.name) || []
      });
    }

    console.log('📁 Storage에서 찾은 파일:', targetFile);

    // 3. Supabase Storage에서 파일 다운로드
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(oldName);

    if (downloadError) {
      console.error('❌ 파일 다운로드 오류:', downloadError);
      return res.status(404).json({ error: `File not found in storage bucket: ${bucketName}` });
    }

    // 4. 새 파일명으로 업로드 (같은 버킷에)
    // 확장자 처리: 원본 파일에 확장자가 없으면 새 파일명에서 확장자를 제거
    let finalNewName = newName;
    const originalExtension = oldName.split('.').pop();
    const newExtension = newName.split('.').pop();
    
    // 원본에 확장자가 없고 새 파일명에 확장자가 있으면 확장자 제거
    if (!originalExtension || originalExtension === oldName) {
      if (newExtension && newExtension !== newName) {
        finalNewName = newName.replace(`.${newExtension}`, '');
        console.log('🔧 확장자 제거:', newName, '→', finalNewName);
      }
    }
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(finalNewName, downloadData, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ 파일 업로드 오류:', uploadError);
      return res.status(500).json({ error: 'Failed to upload renamed file' });
    }

    // 5. 기존 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([oldName]);

    if (deleteError) {
      console.error('❌ 기존 파일 삭제 오류:', deleteError);
      // 새 파일은 업로드되었으므로 계속 진행
    }

    // 6. 데이터베이스에서 메타데이터 업데이트 (새 URL 포함)
    const newUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${finalNewName}`;
    
    // 먼저 기존 메타데이터가 있는지 확인
    const { data: existingMetadata, error: checkError } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('name', oldName)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ 메타데이터 확인 오류:', checkError);
      // 메타데이터가 없어도 파일명 변경은 성공으로 처리
    } else if (existingMetadata) {
      // 메타데이터가 있으면 업데이트
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({ 
          name: finalNewName,
          url: newUrl,
          updated_at: new Date().toISOString()
        })
        .eq('name', oldName);

      if (updateError) {
        console.error('❌ 메타데이터 업데이트 오류:', updateError);
        // 메타데이터 업데이트 실패해도 파일명 변경은 성공으로 처리
      } else {
        console.log('✅ 메타데이터 업데이트 완료');
      }
    } else {
      console.log('ℹ️ 메타데이터가 없어서 업데이트 건너뜀');
    }

    console.log('✅ 파일명 변경 완료:', oldName, '→', finalNewName);

    res.status(200).json({ 
      message: 'File renamed successfully',
      oldName,
      newName: finalNewName,
      originalNewName: newName,
      newUrl: newUrl,
      bucketName: bucketName
    });

  } catch (error) {
    console.error('❌ 파일명 변경 오류:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
