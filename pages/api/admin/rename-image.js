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
        .from('image_assets')
        .select('*')
        .eq('id', parseInt(imageId))
        .single();
      currentImage = data;
      fetchError = error;
    }
    
    // ID로 조회 실패하거나 ID가 없는 경우 image_url로 조회
    // 주의: image_metadata 테이블에는 file_name 컬럼이 없고 image_url만 있음
    if (!currentImage) {
      if (imageUrl) {
        const { data, error } = await supabase
          .from('image_assets')
          .select('*')
          .eq('image_url', imageUrl)
          .single();
        currentImage = data;
        fetchError = error;
      } else if (currentFileName) {
        // currentFileName이 제공된 경우, image_url에서 파일 경로 추출하여 매칭 시도
        // Storage URL 형식: https://...supabase.co/storage/v1/object/public/blog-images/path/to/file.jpg
        const storageBaseUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/`;
        const constructedUrl = `${storageBaseUrl}${currentFileName}`;
        
        const { data, error } = await supabase
          .from('image_assets')
          .select('*')
          .eq('image_url', constructedUrl)
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
          searchMethod: imageId && !imageId.toString().startsWith('temp-') ? 'id' : 'image_url'
        }
      });
    }

    // 2. image_url에서 Storage 경로 추출
    // Storage URL 형식: https://...supabase.co/storage/v1/object/public/blog-images/path/to/file.jpg
    const storageBaseUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/`;
    let currentPath;
    
    if (currentImage.image_url && currentImage.image_url.includes(storageBaseUrl)) {
      // image_url에서 Storage 경로 추출
      currentPath = currentImage.image_url.replace(storageBaseUrl, '');
    } else if (currentFileName) {
      // image_url이 없거나 형식이 다른 경우 currentFileName 사용
      currentPath = currentFileName;
    } else {
      // URL에서 직접 추출 시도 (다른 형식의 URL인 경우)
      const urlMatch = currentImage.image_url?.match(/blog-images\/(.+)$/);
      currentPath = urlMatch ? urlMatch[1] : null;
    }
    
    if (!currentPath) {
      console.error('❌ Storage 경로를 추출할 수 없습니다:', currentImage.image_url);
      return res.status(400).json({
        error: 'Storage 경로를 추출할 수 없습니다.',
        imageUrl: currentImage.image_url
      });
    }
    
    console.log('✅ 현재 이미지 정보:', {
      imageUrl: currentImage.image_url,
      extractedPath: currentPath
    });
    const pathParts = currentPath.split('/');
    const folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
    const currentFileNameOnly = pathParts[pathParts.length - 1];
    
    // ✅ newFileName에 이미 확장자가 있는지 확인 (중복 확장자 방지)
    let cleanNewFileName = newFileName;
    const hasExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(newFileName);
    
    if (hasExtension) {
      // 이미 확장자가 있으면 확장자 제거 (나중에 다시 추가)
      cleanNewFileName = newFileName.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
      console.log('📝 새 파일명에서 확장자 제거:', cleanNewFileName);
    }
    
    // 기존 파일의 확장자 추출
    const fileExtension = currentFileNameOnly.split('.').pop();
    const newFilePath = folderPath ? `${folderPath}/${cleanNewFileName}.${fileExtension}` : `${cleanNewFileName}.${fileExtension}`;
    
    console.log('📁 파일 경로 정보 (확장자 처리):', {
      originalNewFileName: newFileName,
      cleanNewFileName,
      fileExtension,
      newFilePath
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
    // image_metadata 테이블에는 file_name 컬럼이 없고 image_url만 있음
    // image_url을 새 URL로 업데이트하고 title도 새 파일명으로 업데이트
    let updateError;
    if (currentImage.id && !isNaN(currentImage.id)) {
      const { error } = await supabase
        .from('image_assets')
        .update({
          image_url: urlData.publicUrl,
          title: newFileName // 제목도 새 파일명으로 업데이트
        })
        .eq('id', currentImage.id);
      updateError = error;
    } else {
      // ID가 없거나 유효하지 않은 경우 image_url로 업데이트
      const { error } = await supabase
        .from('image_assets')
        .update({
          image_url: urlData.publicUrl,
          title: newFileName
        })
        .eq('image_url', currentImage.image_url);
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