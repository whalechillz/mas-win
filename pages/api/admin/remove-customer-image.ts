/**
 * 고객 이미지 목록에서 제거 API
 * Storage 파일은 유지하고, image_assets의 ai_tags에서 customer-{customerId} 태그만 제거
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
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
    const { imageId, customerId, imageUrl } = req.body;

    if (!imageId && !imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'imageId 또는 imageUrl이 필요합니다.'
      });
    }

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'customerId가 필요합니다.'
      });
    }

    console.log('🔍 [목록 제거 API] 고객 이미지 목록에서 제거 시작:', {
      imageId,
      imageUrl: imageUrl?.substring(0, 100),
      customerId,
      timestamp: new Date().toISOString()
    });

    // 이미지 조회
    console.log('📡 [목록 제거 API] 이미지 조회 시작:', {
      hasImageId: !!imageId,
      hasImageUrl: !!imageUrl,
      queryType: imageId ? 'byId' : 'byUrl'
    });

    let imageQuery = supabase
      .from('image_assets')
      .select('id, cdn_url, ai_tags')
      .maybeSingle();

    if (imageId) {
      imageQuery = imageQuery.eq('id', imageId);
      console.log('🔍 [목록 제거 API] ID로 이미지 조회:', { imageId });
    } else if (imageUrl) {
      imageQuery = imageQuery.eq('cdn_url', imageUrl);
      console.log('🔍 [목록 제거 API] URL로 이미지 조회:', { imageUrl: imageUrl.substring(0, 100) });
    }

    const { data: image, error: imageError } = await imageQuery;

    console.log('📥 [목록 제거 API] 이미지 조회 결과:', {
      found: !!image,
      imageId: image?.id,
      imageUrl: image?.cdn_url?.substring(0, 100),
      currentTags: image?.ai_tags,
      error: imageError
    });

    if (imageError || !image) {
      console.error('❌ [목록 제거 API] 이미지를 찾을 수 없음:', {
        imageError,
        errorCode: imageError?.code,
        errorMessage: imageError?.message,
        searchedImageId: imageId,
        searchedImageUrl: imageUrl?.substring(0, 100)
      });
      return res.status(404).json({
        success: false,
        error: '이미지를 찾을 수 없습니다.',
        details: imageError?.message || '이미지가 존재하지 않습니다.'
      });
    }

    // ai_tags에서 customer-{customerId} 태그 제거
    const customerTag = `customer-${customerId}`;
    const currentTags = Array.isArray(image.ai_tags) ? image.ai_tags : [];
    const hasCustomerTag = currentTags.includes(customerTag);
    const updatedTags = currentTags.filter((tag: string) => tag !== customerTag);

    console.log('📝 [목록 제거 API] 태그 업데이트:', {
      imageId: image.id,
      customerTag,
      currentTags,
      hasCustomerTag,
      updatedTags,
      tagRemoved: hasCustomerTag
    });

    if (!hasCustomerTag) {
      console.warn('⚠️ [목록 제거 API] 이미 고객 태그가 없음:', {
        imageId: image.id,
        customerTag,
        currentTags
      });
      return res.status(200).json({
        success: true,
        message: '이미 고객 목록에서 제거된 이미지입니다.',
        alreadyRemoved: true,
        image: image
      });
    }

    // ai_tags 업데이트
    console.log('📝 [목록 제거 API] DB 업데이트 시작:', {
      imageId: image.id,
      updateData: {
        ai_tags: updatedTags,
        updated_at: new Date().toISOString()
      }
    });

    const { data: updatedImage, error: updateError } = await supabase
      .from('image_assets')
      .update({
        ai_tags: updatedTags,
        updated_at: new Date().toISOString()
      })
      .eq('id', image.id)
      .select()
      .single();

    console.log('📥 [목록 제거 API] DB 업데이트 결과:', {
      success: !!updatedImage && !updateError,
      updatedImageId: updatedImage?.id,
      updatedTags: updatedImage?.ai_tags,
      error: updateError,
      errorCode: updateError?.code,
      errorMessage: updateError?.message
    });

    if (updateError) {
      console.error('❌ [목록 제거 API] 태그 업데이트 실패:', {
        updateError,
        errorCode: updateError.code,
        errorMessage: updateError.message,
        errorDetails: updateError.details,
        imageId: image.id
      });
      return res.status(500).json({
        success: false,
        error: '태그 업데이트에 실패했습니다.',
        details: updateError.message
      });
    }

    console.log('✅ [목록 제거 API] 고객 이미지 목록에서 제거 완료:', {
      imageId: image.id,
      removedTag: customerTag,
      remainingTags: updatedTags,
      updatedImageId: updatedImage?.id
    });

    return res.status(200).json({
      success: true,
      message: '이미지가 고객 목록에서 제거되었습니다. (Storage 파일은 유지됩니다)',
      image: updatedImage
    });

  } catch (error: any) {
    console.error('❌ [목록 제거] 오류:', error);
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
