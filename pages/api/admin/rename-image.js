import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageId, newFileName, currentFileName } = req.body;

    if (!imageId || !newFileName) {
      return res.status(400).json({ 
        error: 'imageId와 newFileName이 필요합니다.' 
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase environment variables are not set.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('📝 이미지 파일명 변경 시작:', { imageId, newFileName, currentFileName });

    // 1. 현재 이미지 메타데이터 조회
    const { data: currentImage, error: fetchError } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !currentImage) {
      console.error('❌ 이미지 메타데이터 조회 실패:', fetchError);
      return res.status(404).json({
        error: '이미지를 찾을 수 없습니다.',
        details: fetchError?.message
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
    const { error: updateError } = await supabase
      .from('image_metadata')
      .update({
        file_name: newFilePath,
        image_url: urlData.publicUrl,
        title: newFileName // 제목도 새 파일명으로 업데이트
      })
      .eq('id', imageId);

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