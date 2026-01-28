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

      // image_url로 메타데이터 찾기 (여러 방법 시도)
      let metadata = null;
      let metadataError = null;
      
      // 방법 1: 정확한 imageUrl로 검색
      const { data: metadata1, error: error1 } = await supabase
        .from('image_assets')
        .select('id, image_url, cdn_url, file_path, original_path, ai_tags')
        .eq('image_url', imageUrl)
        .limit(1)
        .maybeSingle();
      
      if (metadata1 && !error1) {
        metadata = metadata1;
        console.log('✅ 메타데이터 발견 (방법 1: 정확한 URL):', metadata.id);
      } else {
        // 방법 2: 정규화된 URL로 검색
        const { data: metadata2, error: error2 } = await supabase
          .from('image_assets')
          .select('id, image_url, cdn_url, file_path, original_path, ai_tags')
          .eq('image_url', normalizedOldUrl)
          .limit(1)
          .maybeSingle();
        
        if (metadata2 && !error2) {
          metadata = metadata2;
          console.log('✅ 메타데이터 발견 (방법 2: 정규화된 URL):', metadata.id);
        } else {
          // 방법 3: 파일명으로 original_path 검색
          const fileName = currentPath.split('/').pop();
          if (fileName) {
            const { data: metadata3, error: error3 } = await supabase
              .from('image_assets')
              .select('id, image_url, cdn_url, file_path, original_path, ai_tags')
              .ilike('original_path', `%${fileName}`)
              .limit(5); // 여러 개일 수 있으므로 limit 증가
            
            if (metadata3 && metadata3.length > 0 && !error3) {
              // 정확한 경로와 일치하는 것 찾기
              const exactMatch = metadata3.find(m => 
                m.original_path === currentPath || 
                m.original_path.endsWith(`/${fileName}`) ||
                m.image_url.includes(fileName)
              );
              
              if (exactMatch) {
                metadata = exactMatch;
                console.log('✅ 메타데이터 발견 (방법 3: 파일명 기반):', metadata.id);
              } else if (metadata3.length === 1) {
                // 하나만 있으면 그것 사용
                metadata = metadata3[0];
                console.log('✅ 메타데이터 발견 (방법 3: 파일명 기반, 단일 결과):', metadata.id);
              } else {
                metadataError = new Error('파일명으로 여러 메타데이터 발견, 정확한 매칭 실패');
                console.warn('⚠️ 파일명으로 여러 메타데이터 발견:', metadata3.length);
              }
            } else {
              metadataError = error3 || error2 || error1;
            }
          } else {
            metadataError = error2 || error1;
          }
        }
      }

      if (metadata && !metadataError) {
        // file_path에서 날짜 추출
        const oldDateMatch = currentPath.match(/(\d{4}-\d{2}-\d{2})/);
        const newDateMatch = targetPath.match(/(\d{4}-\d{2}-\d{2})/);
        const oldDate = oldDateMatch ? oldDateMatch[1] : null;
        const newDate = newDateMatch ? newDateMatch[1] : null;
        
        // 고객 이미지인지 확인
        const isCustomerImage = currentPath.includes('/customers/') || targetPath.includes('/customers/');
        
        // ai_tags 업데이트 (고객 이미지이고 날짜가 변경된 경우)
        let updatedTags = Array.isArray(metadata.ai_tags) ? [...metadata.ai_tags] : [];
        if (isCustomerImage && oldDate && newDate && oldDate !== newDate) {
          // visit-{oldDate} 태그 제거
          updatedTags = updatedTags.filter(tag => tag !== `visit-${oldDate}`);
          // visit-{newDate} 태그 추가 (없으면)
          if (!updatedTags.includes(`visit-${newDate}`)) {
            updatedTags.push(`visit-${newDate}`);
          }
          console.log('📝 [이미지 이동] ai_tags 업데이트:', {
            imageId: metadata.id,
            oldDate,
            newDate,
            oldTags: metadata.ai_tags,
            newTags: updatedTags
          });
        }
        
        // 메타데이터 업데이트
        const updateData = {
          file_path: targetPath, // ⚠️ 추가: file_path 업데이트 (고객 이미지 조회에 필요)
          cdn_url: newUrlData.publicUrl, // ⚠️ 추가: cdn_url 업데이트 (프론트엔드에서 사용)
          image_url: newUrlData.publicUrl, // 기존
          original_path: targetPath, // 기존
          ai_tags: updatedTags, // ⚠️ 추가: ai_tags 업데이트 (날짜 태그)
          updated_at: new Date().toISOString()
        };
        
        const { error: updateError } = await supabase
          .from('image_assets')
          .update(updateData)
          .eq('id', metadata.id);

        if (updateError) {
          console.warn('⚠️ 메타데이터 업데이트 실패:', updateError);
        } else {
          console.log('✅ 메타데이터 업데이트 완료:', {
            imageId: metadata.id,
            oldPath: currentPath,
            newPath: targetPath,
            oldDate,
            newDate,
            tagsUpdated: isCustomerImage && oldDate && newDate && oldDate !== newDate
          });
        }
      } else {
        console.warn('⚠️ 메타데이터를 찾을 수 없음:', { 
          imageUrl, 
          normalizedOldUrl,
          currentPath,
          fileName: currentPath.split('/').pop(),
          error: metadataError?.message || metadataError 
        });
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

