import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 [API 시작] update-image-scene 요청:', {
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { imageId, imageUrl, storyScene, displayOrder } = req.body;

  console.log('🔍 [API 처리] 요청 데이터:', { imageId, imageUrl, storyScene, displayOrder, imageIdType: typeof imageId });

  if (!imageId && !imageUrl) {
    console.error('❌ [API 에러] imageId 또는 imageUrl이 필요합니다');
    return res.status(400).json({ error: 'imageId or imageUrl is required' });
  }

  // storyScene이 null일 수 있음 (미할당으로 이동)
  const updateData: any = {
    story_scene: storyScene !== undefined ? storyScene : null,
    updated_at: new Date().toISOString()
  };

  if (displayOrder !== undefined) {
    updateData.display_order = displayOrder;
  }

  console.log('🔍 [API 처리] 업데이트 데이터:', updateData);

  // imageUrl이 있으면 URL 정규화 (인코딩 문제 해결)
  let normalizedImageUrl = imageUrl;
  if (imageUrl) {
    try {
      // URL 디코딩 및 정규화
      const urlObj = new URL(imageUrl);
      normalizedImageUrl = decodeURIComponent(urlObj.origin + urlObj.pathname);
      console.log('🔍 [API 처리] URL 정규화:', {
        원본: imageUrl,
        정규화: normalizedImageUrl
      });
    } catch (error) {
      normalizedImageUrl = decodeURIComponent(imageUrl.split('?')[0]);
      console.log('🔍 [API 처리] URL 정규화 (fallback):', {
        원본: imageUrl,
        정규화: normalizedImageUrl
      });
    }
  }

  // ⚠️ image_assets로 변경 (story_scene은 image_assets에 없을 수 있음)
  // imageId가 UUID 형식인지 확인 (36자 문자열, 하이픈 포함)
  // 숫자인 경우는 image_metadata 테이블의 ID일 수 있으므로 imageUrl 우선 사용
  
  // imageId가 UUID 형식인지 확인 (36자 문자열, 하이픈 포함)
  const isUUID = imageId && typeof imageId === 'string' && imageId.length === 36 && imageId.includes('-');
  const isNumericId = imageId && (typeof imageId === 'number' || (typeof imageId === 'string' && /^\d+$/.test(imageId)));
  
  let query = supabase
    .from('image_assets')
    .update(updateData);
  
  // imageUrl 우선 사용 (가장 안정적)
  if (normalizedImageUrl) {
    query = query.eq('cdn_url', normalizedImageUrl);
    console.log('🔍 [API 처리] 정규화된 cdn_url로 업데이트:', normalizedImageUrl);
  } else if (isUUID) {
    // UUID 형식인 경우 직접 사용
    query = query.eq('id', imageId);
    console.log('🔍 [API 처리] UUID imageId로 업데이트:', imageId);
  } else if (isNumericId) {
    // 숫자 ID인 경우, image_metadata 테이블에서 찾아서 image_assets로 변환
    console.log('⚠️ [API 처리] 숫자 imageId 감지, image_metadata에서 조회 후 변환 시도:', imageId);
    
    // image_metadata 테이블에서 조회 (있다면)
    const { data: metadataImage, error: metadataError } = await supabase
      .from('image_metadata')
      .select('image_url, cdn_url')
      .eq('id', parseInt(imageId.toString()))
      .maybeSingle();
    
    if (!metadataError && metadataImage) {
      const urlToUse = metadataImage.cdn_url || metadataImage.image_url;
      if (urlToUse) {
        // URL 정규화
        try {
          const urlObj = new URL(urlToUse);
          const normalizedUrl = decodeURIComponent(urlObj.origin + urlObj.pathname);
          query = query.eq('cdn_url', normalizedUrl);
          console.log('🔍 [API 처리] image_metadata에서 찾은 URL로 업데이트:', normalizedUrl);
        } catch {
          query = query.eq('cdn_url', urlToUse);
          console.log('🔍 [API 처리] image_metadata에서 찾은 URL로 업데이트 (정규화 실패):', urlToUse);
        }
      } else {
        return res.status(404).json({ error: '이미지를 찾을 수 없습니다. (URL 없음)' });
      }
    } else {
      return res.status(404).json({ error: '이미지를 찾을 수 없습니다. (image_metadata 조회 실패)' });
    }
  } else if (!normalizedImageUrl) {
    return res.status(400).json({ error: 'imageUrl 또는 유효한 imageId가 필요합니다.' });
  }

  // 업데이트 실행 (select() 추가하여 업데이트된 행 확인)
  const { data: updateResult, error: updateError } = await query.select();

  console.log('🔍 [API 처리] 업데이트 결과:', {
    data: updateResult,
    error: updateError,
    affectedRows: updateResult ? (Array.isArray(updateResult) ? updateResult.length : 1) : 0,
    updateResultType: Array.isArray(updateResult) ? 'array' : typeof updateResult,
    updateResultLength: Array.isArray(updateResult) ? updateResult.length : (updateResult ? 1 : 0)
  });
  
  // 업데이트된 데이터 상세 로그
  if (updateResult) {
    const resultArray = Array.isArray(updateResult) ? updateResult : [updateResult];
    console.log('🔍 [API 처리] 업데이트된 데이터 상세:');
    resultArray.forEach((row: any, index: number) => {
      console.log(`  [${index}]`, {
        id: row.id,
        cdn_url: row.cdn_url || row.image_url,
        story_scene: row.story_scene,
        story_scene_type: typeof row.story_scene,
        updated_at: row.updated_at,
        english_filename: row.english_filename
      });
    });
  }

  if (updateError) {
    console.error('❌ [API 에러] 업데이트 오류:', updateError);
    console.error('❌ [API 에러] 오류 상세:', {
      message: updateError.message,
      code: updateError.code,
      details: updateError.details,
      hint: updateError.hint
    });
    
    // story_scene 컬럼이 없는 경우 명확한 오류 메시지
    if (updateError.message && (updateError.message.includes('story_scene') || updateError.message.includes('column') && updateError.message.includes('does not exist'))) {
      console.error('❌ [API 에러] image_assets 테이블에 story_scene 컬럼이 없습니다. 데이터베이스 스키마를 업데이트해주세요.');
      return res.status(500).json({ 
        success: false,
        error: '데이터베이스 스키마 오류: story_scene 컬럼이 없습니다. database/add-story-scene-to-image-assets.sql 스크립트를 실행해주세요.',
        details: updateError.message 
      });
    }
    
    // 이미지를 찾을 수 없는 경우
    if (updateError.message && (updateError.message.includes('No rows') || updateError.message.includes('not found'))) {
      console.error('❌ [API 에러] 이미지를 찾을 수 없습니다. imageUrl로 재시도...');
      
      // imageUrl이 있으면 원본 URL로 재시도
      if (imageUrl && normalizedImageUrl !== imageUrl) {
        console.log('🔍 [API 처리] 원본 URL로 재시도:', imageUrl);
        const fallbackQuery = supabase
          .from('image_assets')
          .update(updateData)
          .eq('cdn_url', imageUrl)
          .select();
        
        const { data: fallbackResult, error: fallbackError } = await fallbackQuery;
        
        console.log('🔍 [API 처리] 재시도 결과:', {
          data: fallbackResult,
          error: fallbackError,
          affectedRows: fallbackResult ? (Array.isArray(fallbackResult) ? fallbackResult.length : 1) : 0
        });
        
        if (fallbackError) {
          console.error('❌ [API 에러] 재시도 실패:', fallbackError);
          return res.status(500).json({ 
            success: false,
            error: fallbackError.message || '이미지 업데이트 실패',
            details: fallbackError.details || fallbackError.hint
          });
        }
        
        if (!fallbackResult || (Array.isArray(fallbackResult) && fallbackResult.length === 0)) {
          console.error('❌ [API 에러] 재시도 후 업데이트된 행이 없습니다');
          return res.status(404).json({ 
            success: false,
            error: '이미지를 찾을 수 없습니다. image_assets 테이블에 해당 이미지의 메타데이터가 없을 수 있습니다.' 
          });
        }
        
        console.log('✅ [API 성공] 재시도 성공, 업데이트된 데이터:', fallbackResult);
        return res.status(200).json({ 
          success: true,
          message: '이미지 장면이 업데이트되었습니다.',
          usedFallback: true,
          updatedData: Array.isArray(fallbackResult) ? fallbackResult[0] : fallbackResult
        });
      }
      
      return res.status(404).json({ 
        success: false,
        error: '이미지를 찾을 수 없습니다. image_assets 테이블에 해당 이미지의 메타데이터가 없을 수 있습니다.',
        details: updateError.message
      });
    }
    
    // 기타 오류
    return res.status(500).json({ 
      success: false,
      error: updateError.message || '이미지 업데이트 실패',
      details: updateError.details || updateError.hint
    });
  }

  // 업데이트된 행 확인
  if (!updateResult || (Array.isArray(updateResult) && updateResult.length === 0)) {
    console.error('❌ [API 에러] 업데이트된 행이 없습니다. 메타데이터가 없을 수 있으므로 생성 시도...');
    
    // 메타데이터가 없는 경우, URL에서 정보를 추출하여 메타데이터 생성
    if (imageUrl) {
      try {
        // URL에서 경로 정보 추출
        const urlObj = new URL(imageUrl);
        const pathParts = urlObj.pathname.split('/');
        
        // originals/customers/{folder_name}/{date}/{filename} 형식에서 정보 추출
        const customersIndex = pathParts.indexOf('customers');
        if (customersIndex >= 0 && pathParts.length > customersIndex + 3) {
          const folderName = pathParts[customersIndex + 1];
          const dateFolder = pathParts[customersIndex + 2];
          const fileName = pathParts[pathParts.length - 1];
          
          console.log('🔍 [API 처리] 메타데이터 생성 시도:', {
            folderName,
            dateFolder,
            fileName,
            imageUrl
          });
          
          // customerId 추출 (folder_name에서)
          const { data: customerData } = await supabase
            .from('customers')
            .select('id, name')
            .eq('folder_name', folderName)
            .single();
          
          if (customerData) {
            // 이미지 타입 추출
            const extractImageTypeFromFileName = (fileName: string) => {
              const match = fileName.match(/_s\d+_(.+?)_\d+\./);
              return match ? match[1] : null;
            };
            
            const imageType = extractImageTypeFromFileName(fileName);
            
            // 메타데이터 생성 (image_assets 형식)
            // ⚠️ image_assets에는 많은 필드가 없으므로 기본 필드만 사용
            const newMetadata = {
              cdn_url: normalizedImageUrl || imageUrl,
              file_path: `originals/customers/${folderName}/${dateFolder}/${fileName}`,
              title: `${customerData.name} - ${dateFolder}`,
              alt_text: `${customerData.name} 고객 방문 이미지 (${dateFolder})`,
              ai_tags: [`customer-${customerData.id}`, `visit-${dateFolder}`],
              // ⚠️ image_assets에는 다음 필드들이 없음: story_scene, image_type, english_filename, original_filename, customer_name_en, customer_initials, image_quality, metadata, date_folder, source, channel, folder_path
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            console.log('🔍 [API 처리] 새 메타데이터 생성:', newMetadata);
            
            const { data: createdMetadata, error: createError } = await supabase
              .from('image_assets')
              .insert(newMetadata)
              .select()
              .single();
            
            if (createError) {
              console.error('❌ [API 에러] 메타데이터 생성 실패:', createError);
              return res.status(500).json({ 
                error: '메타데이터 생성 실패',
                details: createError.message 
              });
            }
            
            console.log('✅ [API 성공] 메타데이터 생성 완료:', createdMetadata);
            return res.status(200).json({ 
              success: true,
              message: '이미지 장면이 업데이트되었습니다. (메타데이터 생성됨)',
              updatedData: createdMetadata,
              metadataCreated: true
            });
          } else {
            console.error('❌ [API 에러] 고객 정보를 찾을 수 없습니다:', folderName);
          }
        }
      } catch (parseError) {
        console.error('❌ [API 에러] URL 파싱 실패:', parseError);
      }
    }
    
    return res.status(404).json({ error: '이미지를 찾을 수 없거나 업데이트할 수 없습니다.' });
  }

  const updatedData = Array.isArray(updateResult) ? updateResult[0] : updateResult;
  
  if (!updatedData) {
    console.error('❌ [API 에러] 업데이트된 데이터가 없습니다');
    return res.status(500).json({ 
      success: false,
      error: '업데이트된 데이터를 찾을 수 없습니다.'
    });
  }
  
  console.log('✅ [API 성공] 업데이트 완료, 업데이트된 데이터:', {
    id: updatedData.id,
    cdn_url: updatedData.cdn_url || updatedData.image_url,
    story_scene: updatedData.story_scene,
    updated_at: updatedData.updated_at
  });

  return res.status(200).json({ 
    success: true,
    message: '이미지 장면이 업데이트되었습니다.',
    updatedData: updatedData
  });
}
