import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageId, currentPath } = req.body;

    if (!imageId || !currentPath) {
      return res.status(400).json({ 
        error: 'imageId와 currentPath가 필요합니다.' 
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase environment variables are not set.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('📁 이미지 루트 이동 시작:', { imageId, currentPath });

    // 1. 현재 이미지 메타데이터 조회
    console.log('🔍 메타데이터 조회 시도:', imageId);
    const { data: currentImage, error: fetchError } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('id', imageId)
      .single();

    console.log('📊 메타데이터 조회 결과:', { 
      found: !!currentImage, 
      error: fetchError?.message,
      imageData: currentImage ? {
        id: currentImage.id,
        // file_name 컬럼 없음, image_url만 사용
        image_url: currentImage.image_url
      } : null
    });

    if (fetchError || !currentImage) {
      console.error('❌ 이미지 메타데이터 조회 실패:', fetchError);
      return res.status(404).json({
        error: '이미지를 찾을 수 없습니다.',
        details: fetchError?.message,
        debug: {
          imageId,
          currentPath,
          errorType: 'metadata_not_found'
        }
      });
    }

    console.log('✅ 현재 이미지 정보:', {
      currentFileName: currentImage.file_name,
      currentUrl: currentImage.image_url
    });

    // 2. 파일명 추출 (폴더 경로 제거)
    const pathParts = currentPath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const newPath = fileName; // 루트에 저장

    console.log('📁 파일 경로 정보:', {
      currentPath,
      fileName,
      newPath
    });

    // 3. 파일 존재 여부 확인 (여러 경로 시도)
    console.log('🔍 파일 존재 여부 확인 시작');
    let actualFilePath = null;
    
    // 가능한 경로들 시도
    const possiblePaths = [
      currentPath,
      currentImage.file_name,
      `duplicated/2025/${fileName}`,
      `duplicated/2025-10-14/${fileName}`,
      `duplicated/2025-10-14-1/${fileName}`
    ];
    
    for (const testPath of possiblePaths) {
      try {
        console.log(`🔍 경로 테스트: ${testPath}`);
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(testPath);
        
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          actualFilePath = testPath;
          console.log(`✅ 파일 발견: ${testPath}`);
          break;
        } else {
          console.log(`❌ 파일 없음: ${testPath} (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ 경로 테스트 실패: ${testPath}`, error.message);
      }
    }
    
    if (!actualFilePath) {
      console.error('❌ 모든 경로에서 파일을 찾을 수 없습니다');
      return res.status(404).json({
        error: '파일을 찾을 수 없습니다.',
        details: '모든 가능한 경로에서 파일을 찾을 수 없습니다.',
        debug: {
          currentPath,
          fileName,
          testedPaths: possiblePaths
        }
      });
    }
    
    console.log(`✅ 실제 파일 경로 확인: ${actualFilePath}`);

    // 4. 파일 다운로드 (실제 경로 사용)
    console.log('🔍 스토리지 파일 다운로드 시도:', actualFilePath);
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('blog-images')
      .download(actualFilePath);

    console.log('📊 스토리지 다운로드 결과:', {
      success: !!downloadData,
      error: downloadError?.message,
      filePath: actualFilePath
    });

    if (downloadError) {
      console.error('❌ 파일 다운로드 실패:', downloadError);
      return res.status(500).json({
        error: '파일을 다운로드할 수 없습니다.',
        details: downloadError.message,
        debug: {
          actualFilePath,
          errorType: 'storage_file_not_found'
        }
      });
    }

    console.log('✅ 파일 다운로드 완료');

    // 4. 루트에 파일 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(newPath, downloadData, {
        contentType: downloadData.type || 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ 파일 업로드 실패:', uploadError);
      return res.status(500).json({
        error: '루트에 파일을 업로드할 수 없습니다.',
        details: uploadError.message
      });
    }

    console.log('✅ 루트에 파일 업로드 완료');

    // 5. 새 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(newPath);

    // 6. 기존 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove([actualFilePath]);

    if (deleteError) {
      console.warn('⚠️ 기존 파일 삭제 실패:', deleteError);
    } else {
      console.log('✅ 기존 파일 삭제 완료');
    }

    // 7. 메타데이터 업데이트
    // 주의: image_metadata 테이블에는 file_name 컬럼이 없고 image_url만 있음
    const { error: updateError } = await supabase
      .from('image_metadata')
      .update({
        image_url: urlData.publicUrl
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
      message: '이미지가 루트로 이동되었습니다.',
      data: {
        oldPath: currentPath,
        newPath: newPath,
        newUrl: urlData.publicUrl,
        imageId: imageId
      }
    });

  } catch (error) {
    console.error('Move Image to Root API Error:', error);
    return res.status(500).json({
      error: '이미지 이동 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}
