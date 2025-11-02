// 이미지를 폴더로 이동하는 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageUrl, targetFolder } = req.body;

    if (!imageUrl || !targetFolder) {
      return res.status(400).json({ 
        error: 'imageUrl과 targetFolder가 필요합니다.' 
      });
    }

    console.log('📁 이미지 폴더 이동 시작:', { imageUrl, targetFolder });

    // 1. Storage URL에서 경로 추출
    const extractPathFromUrl = (url) => {
      // https://.../storage/v1/object/public/blog-images/path/to/image.jpg
      // 또는 https://.../storage/v1/object/public/blog-images/path/to/image.jpg?query
      const match = url.match(/blog-images\/([^?]+)/);
      if (match) {
        return match[1];
      }
      // 직접 경로인 경우 (이미 경로만)
      if (!url.includes('http') && !url.includes('storage')) {
        return url;
      }
      return null;
    };

    const currentPath = extractPathFromUrl(imageUrl);
    if (!currentPath) {
      return res.status(400).json({ 
        error: '이미지 URL에서 경로를 추출할 수 없습니다.',
        imageUrl 
      });
    }

    // 2. 파일명 추출
    const pathParts = currentPath.split('/');
    const fileName = pathParts[pathParts.length - 1];

    // 3. 목표 폴더 경로 생성
    let targetPath;
    if (targetFolder === 'all' || targetFolder === 'root' || targetFolder === '') {
      // 전체 폴더나 루트 폴더는 이동하지 않음 (현재 위치 유지)
      return res.status(400).json({ 
        success: false,
        error: '"전체 폴더"나 "루트 폴더"로는 이미지를 이동할 수 없습니다.',
        currentPath,
        targetFolder
      });
    } else {
      targetPath = `${targetFolder}/${fileName}`;
    }

    // 4. 같은 위치면 이동 불필요
    if (currentPath === targetPath) {
      return res.status(200).json({ 
        success: true,
        moved: false,
        message: '이미 해당 폴더에 있습니다.',
        currentPath,
        targetPath
      });
    }

    // 5. 폴더 존재 확인 및 생성
    if (targetFolder !== 'root' && targetFolder !== '') {
      const folderParts = targetFolder.split('/');
      for (let i = 0; i < folderParts.length; i++) {
        const partialPath = folderParts.slice(0, i + 1).join('/');
        // 폴더가 존재하는지 확인 (빈 배열 업로드로 폴더 생성)
        try {
          const { error: listError } = await supabase.storage
            .from('blog-images')
            .list(partialPath);
          
          // 에러가 있으면 폴더 생성 시도
          if (listError) {
            // 폴더 생성 (마커 파일 업로드)
            const markerPath = `${partialPath}/.folder`;
            await supabase.storage
              .from('blog-images')
              .upload(markerPath, new Blob(['folder marker'], { type: 'text/plain' }), {
                upsert: true,
                contentType: 'text/plain'
              });
            console.log(`✅ 폴더 생성: ${partialPath}`);
          }
        } catch (error) {
          console.warn(`⚠️ 폴더 확인 실패 (계속 진행): ${partialPath}`, error.message);
        }
      }
    }

    // 6. Storage에서 이미지 이동
    const { data, error } = await supabase.storage
      .from('blog-images')
      .move(currentPath, targetPath);

    if (error) {
      // 이미 대상 폴더에 파일이 있을 수 있음 (중복)
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        return res.status(400).json({ 
          success: false,
          error: '대상 폴더에 이미 같은 파일이 있습니다.',
          currentPath,
          targetPath
        });
      }
      
      throw error;
    }

    // 7. 새 URL 생성
    const { data: newUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(targetPath);

    // 8. 메타데이터 업데이트 (original_path, image_url)
    try {
      const normalizedOldUrl = imageUrl.split('?')[0].split('#')[0];
      const normalizedNewUrl = newUrlData.publicUrl.split('?')[0].split('#')[0];

      // image_url로 메타데이터 찾기
      const { data: metadata, error: metadataError } = await supabase
        .from('image_metadata')
        .select('id, image_url, original_path')
        .or(`image_url.eq.${imageUrl},image_url.eq.${normalizedOldUrl}`)
        .limit(1)
        .single();

      if (metadata && !metadataError) {
        // 메타데이터 업데이트
        const { error: updateError } = await supabase
          .from('image_metadata')
          .update({
            image_url: newUrlData.publicUrl,
            original_path: targetPath,
            updated_at: new Date().toISOString()
          })
          .eq('id', metadata.id);

        if (updateError) {
          console.warn('⚠️ 메타데이터 업데이트 실패:', updateError);
        } else {
          console.log('✅ 메타데이터 업데이트 완료:', metadata.id);
        }
      } else {
        console.warn('⚠️ 메타데이터를 찾을 수 없음:', { imageUrl, metadataError });
      }
    } catch (metadataError) {
      console.warn('⚠️ 메타데이터 업데이트 중 오류 (계속 진행):', metadataError);
    }

    console.log('✅ 이미지 이동 완료:', { currentPath, targetPath });

    return res.status(200).json({
      success: true,
      moved: true,
      message: '이미지가 성공적으로 이동되었습니다.',
      data: {
        currentPath,
        targetPath,
        newUrl: newUrlData.publicUrl
      }
    });

  } catch (error) {
    console.error('❌ 이미지 이동 오류:', error);
    return res.status(500).json({ 
      success: false,
      error: '이미지 이동 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

