import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageId, newFileName, currentFileName, imageUrl } = req.body;

    if (!newFileName) {
      return res.status(400).json({ 
        error: 'newFileName이 필요합니다.' 
      });
    }

    // currentFileName 또는 imageUrl이 없으면 오류
    if (!currentFileName && !imageUrl) {
      return res.status(400).json({ 
        error: 'currentFileName 또는 imageUrl이 필요합니다.' 
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase environment variables are not set.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('📝 이미지 파일명 변경 시작:', { imageId, newFileName, currentFileName, imageUrl });

    // 1. 현재 이미지 메타데이터 조회
    // imageId가 있고 temp-로 시작하지 않으면 ID로 조회, 아니면 file_name 또는 image_url로 조회
    let currentImage;
    let fetchError;
    
    if (imageId && !imageId.toString().startsWith('temp-') && !isNaN(imageId)) {
      // 숫자 ID로 조회 시도
      const { data, error } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('id', parseInt(imageId))
        .single();
      currentImage = data;
      fetchError = error;
    }
    
    // ID로 조회 실패하거나 ID가 없는 경우 file_name 또는 image_url로 조회
    if (!currentImage) {
      if (currentFileName) {
        const { data, error } = await supabase
          .from('image_metadata')
          .select('*')
          .eq('file_name', currentFileName)
          .single();
        currentImage = data;
        fetchError = error;
      } else if (imageUrl) {
        const { data, error } = await supabase
          .from('image_metadata')
          .select('*')
          .eq('image_url', imageUrl)
          .single();
        currentImage = data;
        fetchError = error;
      }
    }

    if (fetchError || !currentImage) {
      console.error('❌ 이미지 메타데이터 조회 실패:', fetchError);
      return res.status(404).json({
        error: '이미지를 찾을 수 없습니다.',
        details: fetchError?.message,
        debug: {
          imageId,
          currentFileName,
          imageUrl,
          searchMethod: imageId && !imageId.toString().startsWith('temp-') ? 'id' : (currentFileName ? 'file_name' : 'image_url')
        }
      });
    }

    console.log('✅ 현재 이미지 정보:', {
      currentFileName: currentImage.file_name,
      currentUrl: currentImage.image_url
    });

    // 2. 현재 파일 경로에서 새 파일 경로 생성
    const currentPath = currentImage.file_name;
    const pathParts = currentPath.split('/');
    const folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
    const fileExtension = pathParts[pathParts.length - 1].split('.').pop();
    const newFilePath = folderPath ? `${folderPath}/${newFileName}.${fileExtension}` : `${newFileName}.${fileExtension}`;

    console.log('📁 파일 경로 정보:', {
      currentPath,
      folderPath,
      newFilePath,
      fileExtension
    });

    // 3. 파일 다운로드
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('blog-images')
      .download(currentPath);

    if (downloadError) {
      console.error('❌ 파일 다운로드 실패:', downloadError);
      return res.status(500).json({
        error: '파일을 다운로드할 수 없습니다.',
        details: downloadError.message
      });
    }

    console.log('✅ 파일 다운로드 완료');

    // 4. 새 경로에 파일 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(newFilePath, downloadData, {
        contentType: downloadData.type || 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ 파일 업로드 실패:', uploadError);
      return res.status(500).json({
        error: '새 파일명으로 업로드할 수 없습니다.',
        details: uploadError.message
      });
    }

    console.log('✅ 새 경로에 파일 업로드 완료');

    // 5. 새 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(newFilePath);

    // 6. 기존 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove([currentPath]);

    if (deleteError) {
      console.warn('⚠️ 기존 파일 삭제 실패:', deleteError);
    } else {
      console.log('✅ 기존 파일 삭제 완료');
    }

    // 7. 메타데이터 업데이트
    // ID로 업데이트 시도, 실패하면 file_name 또는 image_url로 업데이트
    let updateError;
    if (currentImage.id && !isNaN(currentImage.id)) {
      const { error } = await supabase
        .from('image_metadata')
        .update({
          file_name: newFilePath,
          image_url: urlData.publicUrl,
          title: newFileName // 제목도 새 파일명으로 업데이트
        })
        .eq('id', currentImage.id);
      updateError = error;
    } else {
      // ID가 없거나 유효하지 않은 경우 file_name으로 업데이트
      const { error } = await supabase
        .from('image_metadata')
        .update({
          file_name: newFilePath,
          image_url: urlData.publicUrl,
          title: newFileName
        })
        .eq('file_name', currentPath);
      updateError = error;
    }

    if (updateError) {
      console.error('❌ 메타데이터 업데이트 실패:', updateError);
      return res.status(500).json({
        error: '메타데이터를 업데이트할 수 없습니다.',
        details: updateError.message
      });
    }

    console.log('✅ 메타데이터 업데이트 완료');

    return res.status(200).json({
      success: true,
      message: '파일명이 성공적으로 변경되었습니다.',
      newName: newFilePath,  // 하위 호환성 유지
      newUrl: urlData.publicUrl,  // 하위 호환성 유지
      data: {
        oldFileName: currentPath,
        newFileName: newFilePath,
        newUrl: urlData.publicUrl,
        imageId: imageId
      }
    });

  } catch (error) {
    console.error('Rename Image API Error:', error);
    return res.status(500).json({
      error: '파일명 변경 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}