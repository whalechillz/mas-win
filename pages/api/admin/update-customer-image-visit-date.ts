/**
 * 고객 이미지 방문일자 수정 API
 * ai_tags의 visit-{date} 태그 및 file_path 업데이트
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method Not Allowed' 
    });
  }

  try {
    const { imageId, newVisitDate, customerId } = req.body;

    if (!imageId || !newVisitDate || !customerId) {
      return res.status(400).json({
        success: false,
        error: 'imageId, newVisitDate, customerId가 필요합니다.'
      });
    }

    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newVisitDate)) {
      return res.status(400).json({
        success: false,
        error: '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD 형식 필요)'
      });
    }

    console.log('📝 [방문일자 수정 API] 요청 수신:', {
      imageId,
      newVisitDate,
      customerId
    });

    // 1. 이미지 조회
    const { data: image, error: imageError } = await supabase
      .from('image_assets')
      .select('id, file_path, ai_tags, filename')
      .eq('id', imageId)
      .single();

    if (imageError || !image) {
      console.error('❌ [방문일자 수정 API] 이미지 조회 실패:', imageError);
      return res.status(404).json({
        success: false,
        error: '이미지를 찾을 수 없습니다.',
        details: imageError?.message
      });
    }

    console.log('✅ [방문일자 수정 API] 이미지 조회 완료:', {
      imageId: image.id,
      currentFilePath: image.file_path?.substring(0, 100),
      currentTags: image.ai_tags
    });

    // 2. ai_tags에서 visit-{oldDate} 태그 제거 및 visit-{newDate} 추가
    const currentTags = Array.isArray(image.ai_tags) ? image.ai_tags : [];
    
    // 기존 visit-{date} 태그 찾기
    const oldVisitTag = currentTags.find((tag: string) => tag.startsWith('visit-'));
    const oldDate = oldVisitTag ? oldVisitTag.replace('visit-', '') : null;
    
    // visit- 태그 제거 후 새 태그 추가
    const updatedTags = currentTags
      .filter((tag: string) => !tag.startsWith('visit-'))
      .concat([`visit-${newVisitDate}`]);

    console.log('📝 [방문일자 수정 API] ai_tags 업데이트:', {
      oldTags: currentTags,
      oldDate,
      newDate: newVisitDate,
      newTags: updatedTags
    });

    // 3. file_path 업데이트 (날짜 폴더 변경)
    let newFilePath = image.file_path;
    if (image.file_path) {
      // 날짜 폴더 패턴 찾기 및 교체
      const dateFolderPattern = /\/(\d{4}-\d{2}-\d{2})\//;
      if (dateFolderPattern.test(image.file_path)) {
        newFilePath = image.file_path.replace(dateFolderPattern, `/${newVisitDate}/`);
      } else {
        // 날짜 폴더가 없으면 추가 (고객 폴더 구조에 맞춰)
        // originals/customers/{folderName}/{date}/{filename}
        const pathParts = image.file_path.split('/');
        const customerFolderIndex = pathParts.findIndex(part => part === 'customers');
        if (customerFolderIndex >= 0 && customerFolderIndex < pathParts.length - 1) {
          // customers 다음 폴더가 고객 폴더, 그 다음이 날짜 폴더
          const filename = pathParts[pathParts.length - 1];
          const customerFolder = pathParts[customerFolderIndex + 1];
          newFilePath = `originals/customers/${customerFolder}/${newVisitDate}/${filename}`;
        }
      }
    }

    console.log('📝 [방문일자 수정 API] file_path 업데이트:', {
      oldFilePath: image.file_path?.substring(0, 100),
      newFilePath: newFilePath?.substring(0, 100)
    });

    // 4. 실제 Storage 파일 이동 (file_path가 변경된 경우)
    if (newFilePath && newFilePath !== image.file_path && image.file_path) {
      try {
        // 목표 폴더 존재 확인 및 생성
        const targetFolderParts = newFilePath.split('/').slice(0, -1).join('/');
        if (targetFolderParts) {
          // 폴더 존재 확인 (빈 배열로 list 시도)
          const { error: listError } = await supabase.storage
            .from('blog-images')
            .list(targetFolderParts);
          
          // 폴더가 없으면 생성 (마커 파일 업로드)
          if (listError) {
            const markerPath = `${targetFolderParts}/.folder`;
            await supabase.storage
              .from('blog-images')
              .upload(markerPath, new Blob(['folder marker'], { type: 'text/plain' }), {
                upsert: true,
                contentType: 'text/plain'
              });
            console.log(`✅ [방문일자 수정 API] 폴더 생성: ${targetFolderParts}`);
          }
        }

        // Storage에서 파일 이동
        console.log('📁 [방문일자 수정 API] Storage 파일 이동 시작:', {
          from: image.file_path.substring(0, 100),
          to: newFilePath.substring(0, 100)
        });

        const { data: moveData, error: moveError } = await supabase.storage
          .from('blog-images')
          .move(image.file_path, newFilePath);

        if (moveError) {
          // 이미 대상 폴더에 파일이 있을 수 있음 (중복)
          if (moveError.message?.includes('duplicate') || moveError.message?.includes('already exists') || moveError.statusCode === '409') {
            console.warn('⚠️ [방문일자 수정 API] 파일이 이미 존재함, 메타데이터만 업데이트:', {
              newFilePath: newFilePath.substring(0, 100),
              error: moveError.message
            });
            // 메타데이터만 업데이트 (파일은 이미 존재)
          } else {
            console.error('❌ [방문일자 수정 API] Storage 파일 이동 실패:', moveError);
            // 파일 이동 실패 시에도 메타데이터는 업데이트 (나중에 수동으로 이동 가능)
            console.warn('⚠️ [방문일자 수정 API] 파일 이동 실패했지만 메타데이터는 업데이트합니다.');
          }
        } else {
          console.log('✅ [방문일자 수정 API] Storage 파일 이동 완료');
        }
      } catch (storageError: any) {
        console.error('❌ [방문일자 수정 API] Storage 파일 이동 중 예외:', storageError);
        // 파일 이동 실패 시에도 메타데이터는 업데이트
        console.warn('⚠️ [방문일자 수정 API] 파일 이동 실패했지만 메타데이터는 업데이트합니다.');
      }
    }

    // 5. cdn_url 업데이트 (file_path 변경 시)
    let newCdnUrl = null;
    if (newFilePath && newFilePath !== image.file_path) {
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(newFilePath);
      newCdnUrl = publicUrl;
    }

    // 6. DB 업데이트
    const updateData: any = {
      ai_tags: updatedTags,
      file_path: newFilePath,
      updated_at: new Date().toISOString()
    };

    // cdn_url도 업데이트 (변경된 경우)
    if (newCdnUrl) {
      updateData.cdn_url = newCdnUrl;
    }

    const { data: updatedImage, error: updateError } = await supabase
      .from('image_assets')
      .update(updateData)
      .eq('id', imageId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [방문일자 수정 API] DB 업데이트 실패:', updateError);
      return res.status(500).json({
        success: false,
        error: '메타데이터 업데이트 실패',
        details: updateError.message
      });
    }

    console.log('✅ [방문일자 수정 API] DB 업데이트 완료:', {
      imageId: updatedImage.id,
      newVisitDate,
      newFilePath: updatedImage.file_path?.substring(0, 100),
      newTags: updatedImage.ai_tags
    });

    return res.status(200).json({
      success: true,
      image: updatedImage,
      oldDate,
      newDate: newVisitDate
    });

  } catch (error: any) {
    console.error('❌ [방문일자 수정 API] 예외 발생:', error);
    return res.status(500).json({
      success: false,
      error: '방문일자 수정 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}
