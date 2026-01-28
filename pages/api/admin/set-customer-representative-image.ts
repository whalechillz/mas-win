/**
 * 고객 대표 이미지 설정/해제 API
 * POST /api/admin/set-customer-representative-image
 * 
 * Body: {
 *   imageId: UUID,
 *   customerId: number,
 *   isRepresentative: boolean
 * }
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
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method Not Allowed' 
    });
  }

  try {
    const { imageId, customerId, isRepresentative } = req.body;

    console.log('🖼️ [대표 이미지 설정 API] 요청 수신:', {
      imageId,
      customerId,
      isRepresentative,
      timestamp: new Date().toISOString()
    });

    // 필수 파라미터 검증
    if (!imageId || !customerId || typeof isRepresentative !== 'boolean') {
      console.error('❌ [대표 이미지 설정 API] 필수 파라미터 누락:', {
        imageId: !!imageId,
        customerId: !!customerId,
        isRepresentative: typeof isRepresentative
      });
      return res.status(400).json({
        success: false,
        error: 'imageId, customerId, isRepresentative (boolean)가 필요합니다.'
      });
    }

    // 1. 이미지 소유권 확인 (customerId와 imageId 매칭)
    // 고객의 folder_name 가져오기
    console.log('🔍 [대표 이미지 설정 API] 고객 정보 조회 시작:', { customerId });
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('folder_name')
      .eq('id', customerId)
      .maybeSingle();

    if (customerError) {
      console.error('❌ [대표 이미지 설정 API] 고객 조회 오류:', customerError);
      return res.status(404).json({
        success: false,
        error: '고객을 찾을 수 없습니다: ' + customerError.message
      });
    }

    if (!customer) {
      console.error('❌ [대표 이미지 설정 API] 고객을 찾을 수 없음:', { customerId });
      return res.status(404).json({
        success: false,
        error: '고객을 찾을 수 없습니다.'
      });
    }

    console.log('✅ [대표 이미지 설정 API] 고객 정보 조회 완료:', {
      customerId,
      folder_name: customer.folder_name
    });

    if (!customer.folder_name) {
      console.error('❌ [대표 이미지 설정 API] 고객의 folder_name이 없음:', { customerId });
      return res.status(400).json({
        success: false,
        error: '고객의 folder_name이 없습니다.'
      });
    }

    // 이미지가 해당 고객의 것인지 확인 (file_path로 검증)
    console.log('🔍 [대표 이미지 설정 API] 이미지 정보 조회 시작:', { imageId });
    const { data: image, error: imageError } = await supabase
      .from('image_assets')
      .select('id, file_path, ai_tags, is_customer_representative, filename, cdn_url')
      .eq('id', imageId)
      .maybeSingle();

    if (imageError) {
      console.error('❌ [대표 이미지 설정 API] 이미지 조회 오류:', imageError);
      return res.status(404).json({
        success: false,
        error: '이미지를 찾을 수 없습니다: ' + imageError.message
      });
    }

    if (!image) {
      console.error('❌ [대표 이미지 설정 API] 이미지를 찾을 수 없음:', { imageId });
      return res.status(404).json({
        success: false,
        error: '이미지를 찾을 수 없습니다.'
      });
    }

    console.log('✅ [대표 이미지 설정 API] 이미지 정보 조회 완료:', {
      imageId,
      file_path: image.file_path,
      ai_tags: image.ai_tags,
      current_is_customer_representative: image.is_customer_representative
    });

    // file_path로 소유권 확인
    const expectedPath = `originals/customers/${customer.folder_name}/`;
    const isCustomerImage = image.file_path?.includes(expectedPath);
    
    // ai_tags로도 확인 (이중 체크)
    const expectedTag = `customer-${customerId}`;
    const hasCustomerTag = Array.isArray(image.ai_tags) && 
      image.ai_tags.some((tag: string) => tag === expectedTag);

    console.log('🔍 [대표 이미지 설정 API] 소유권 확인:', {
      expectedPath,
      isCustomerImage,
      expectedTag,
      hasCustomerTag,
      ai_tags: image.ai_tags
    });

    if (!isCustomerImage && !hasCustomerTag) {
      console.error('❌ [대표 이미지 설정 API] 소유권 확인 실패:', {
        imageId,
        customerId,
        file_path: image.file_path,
        ai_tags: image.ai_tags
      });
      return res.status(403).json({
        success: false,
        error: '이 이미지는 해당 고객의 이미지가 아닙니다.'
      });
    }

    // 2. 대표 이미지 설정/해제
    if (isRepresentative) {
      console.log('🔄 [대표 이미지 설정 API] 대표 이미지 설정 시작:', {
        imageId,
        customerId,
        folder_name: customer.folder_name
      });

      // 해당 고객의 다른 대표 이미지 모두 false로 설정
      // file_path로 필터링하여 해당 고객의 이미지만 대상
      const { data: unsetData, error: unsetError } = await supabase
        .from('image_assets')
        .update({ is_customer_representative: false })
        .ilike('file_path', `originals/customers/${customer.folder_name}/%`)
        .neq('id', imageId) // 현재 이미지는 제외
        .select('id');

      if (unsetError) {
        console.error('❌ [대표 이미지 설정 API] 기존 대표 이미지 해제 오류:', unsetError);
        return res.status(500).json({
          success: false,
          error: '기존 대표 이미지 해제 실패: ' + unsetError.message
        });
      }

      console.log('✅ [대표 이미지 설정 API] 기존 대표 이미지 해제 완료:', {
        unsetCount: unsetData?.length || 0,
        unsetIds: unsetData?.map(img => img.id) || []
      });

      // 선택한 이미지를 대표 이미지로 설정
      // file_path가 올바른지 확인하고 cdn_url도 함께 업데이트
      let updateData: any = {
        is_customer_representative: true,
        updated_at: new Date().toISOString()
      };
      
      // file_path가 올바른지 확인하고 cdn_url 생성
      if (image.file_path) {
        // file_path에 파일명이 있는지 확인
        const pathParts = image.file_path.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        const isDateFolder = /^\d{4}-\d{2}-\d{2}$/.test(lastPart);
        
        let actualFilePath = image.file_path;
        let newCdnUrl: string | null = null;
        
        // file_path가 폴더 경로만 있으면 파일명 추가
        if (isDateFolder || !lastPart.includes('.')) {
            // filename에서 파일명 추출
            const fileName = image.filename;
          if (fileName) {
            actualFilePath = `${image.file_path}/${fileName}`;
            console.log('📝 [대표 이미지 설정 API] file_path에 파일명 추가:', {
              imageId,
              originalFilePath: image.file_path,
              correctedFilePath: actualFilePath.substring(0, 100),
              fileName
            });
          } else {
            console.warn('⚠️ [대표 이미지 설정 API] file_path와 filename 모두 없음:', {
              imageId,
              file_path: image.file_path
            });
            // filename이 없으면 cdn_url 업데이트하지 않음 (기존 cdn_url 유지)
          }
        }
        
        // cdn_url 생성 (수정된 file_path 기반)
        if (actualFilePath !== image.file_path || !isDateFolder) {
          const { data: { publicUrl } } = supabase.storage
            .from('blog-images')
            .getPublicUrl(actualFilePath);
          newCdnUrl = publicUrl;
          
          // 중복 확인: 같은 cdn_url을 가진 다른 이미지가 있는지 확인
          const { data: duplicates, error: dupError } = await supabase
            .from('image_assets')
            .select('id, filename, file_path')
            .eq('cdn_url', publicUrl)
            .neq('id', imageId);
          
          if (dupError) {
            console.error('❌ [대표 이미지 설정 API] 중복 확인 오류:', dupError);
          } else if (duplicates && duplicates.length > 0) {
            console.warn('⚠️ [대표 이미지 설정 API] 중복된 cdn_url 발견:', {
              imageId,
              newCdnUrl: publicUrl.substring(0, 100),
              duplicates: duplicates.map(d => ({ id: d.id, filename: d.filename }))
            });
            
            // 중복된 이미지의 cdn_url을 NULL로 설정 (UNIQUE 제약 조건 위반 방지)
            const duplicateIds = duplicates.map(d => d.id);
            const { error: nullifyError } = await supabase
              .from('image_assets')
              .update({ cdn_url: null, updated_at: new Date().toISOString() })
              .in('id', duplicateIds);
            
            if (nullifyError) {
              console.error('❌ [대표 이미지 설정 API] 중복 이미지 cdn_url NULL 설정 실패:', nullifyError);
              // 중복 처리 실패 시에도 계속 진행 (나중에 수동 처리 가능)
            } else {
              console.log('✅ [대표 이미지 설정 API] 중복 이미지 cdn_url NULL 설정 완료:', {
                duplicateIds,
                count: duplicates.length
              });
            }
          }
          
          updateData.cdn_url = publicUrl;
          updateData.file_path = actualFilePath; // 수정된 file_path도 업데이트
          
          console.log('📝 [대표 이미지 설정 API] file_path와 cdn_url 업데이트:', {
            imageId,
            file_path: actualFilePath.substring(0, 100),
            cdn_url: publicUrl.substring(0, 100)
          });
        } else {
          // file_path가 변경되지 않았고 filename도 없으면 cdn_url 업데이트하지 않음
          console.log('📝 [대표 이미지 설정 API] file_path 변경 없음, cdn_url 업데이트 건너뜀:', {
            imageId,
            file_path: image.file_path
          });
        }
      }
      
      const { data: setData, error: setError } = await supabase
        .from('image_assets')
        .update(updateData)
        .eq('id', imageId)
        .select('id, is_customer_representative, file_path, cdn_url');

      if (setError) {
        console.error('❌ [대표 이미지 설정 API] 대표 이미지 설정 오류:', setError);
        return res.status(500).json({
          success: false,
          error: '대표 이미지 설정 실패: ' + setError.message
        });
      }

      console.log('✅ [대표 이미지 설정 API] 대표 이미지 설정 완료:', {
        imageId,
        customerId,
        updatedData: setData?.[0]
      });

      return res.status(200).json({
        success: true,
        message: '대표 이미지로 설정되었습니다.',
        imageId,
        customerId
      });

    } else {
      console.log('🔄 [대표 이미지 설정 API] 대표 이미지 해제 시작:', {
        imageId,
        customerId
      });

      // 대표 이미지 해제
      const { data: unsetData, error: unsetError } = await supabase
        .from('image_assets')
        .update({ 
          is_customer_representative: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', imageId)
        .select('id, is_customer_representative');

      if (unsetError) {
        console.error('❌ [대표 이미지 설정 API] 대표 이미지 해제 오류:', unsetError);
        return res.status(500).json({
          success: false,
          error: '대표 이미지 해제 실패: ' + unsetError.message
        });
      }

      console.log('✅ [대표 이미지 설정 API] 대표 이미지 해제 완료:', {
        imageId,
        customerId,
        updatedData: unsetData?.[0]
      });

      return res.status(200).json({
        success: true,
        message: '대표 이미지가 해제되었습니다.',
        imageId,
        customerId
      });
    }

  } catch (error: any) {
    console.error('❌ [대표 이미지 설정 API] 예외 발생:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({
      success: false,
      error: '서버 오류: ' + (error.message || '알 수 없는 오류')
    });
  }
}
