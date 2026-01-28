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

    // 필수 파라미터 검증
    if (!imageId || !customerId || typeof isRepresentative !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'imageId, customerId, isRepresentative (boolean)가 필요합니다.'
      });
    }

    // 1. 이미지 소유권 확인 (customerId와 imageId 매칭)
    // 고객의 folder_name 가져오기
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('folder_name')
      .eq('id', customerId)
      .maybeSingle();

    if (customerError || !customer) {
      return res.status(404).json({
        success: false,
        error: '고객을 찾을 수 없습니다.'
      });
    }

    if (!customer.folder_name) {
      return res.status(400).json({
        success: false,
        error: '고객의 folder_name이 없습니다.'
      });
    }

    // 이미지가 해당 고객의 것인지 확인 (file_path로 검증)
    const { data: image, error: imageError } = await supabase
      .from('image_assets')
      .select('id, file_path, ai_tags')
      .eq('id', imageId)
      .maybeSingle();

    if (imageError || !image) {
      return res.status(404).json({
        success: false,
        error: '이미지를 찾을 수 없습니다.'
      });
    }

    // file_path로 소유권 확인
    const isCustomerImage = image.file_path?.includes(`originals/customers/${customer.folder_name}/`);
    
    // ai_tags로도 확인 (이중 체크)
    const hasCustomerTag = Array.isArray(image.ai_tags) && 
      image.ai_tags.some((tag: string) => tag === `customer-${customerId}`);

    if (!isCustomerImage && !hasCustomerTag) {
      return res.status(403).json({
        success: false,
        error: '이 이미지는 해당 고객의 이미지가 아닙니다.'
      });
    }

    // 2. 대표 이미지 설정/해제
    if (isRepresentative) {
      // 해당 고객의 다른 대표 이미지 모두 false로 설정
      // file_path로 필터링하여 해당 고객의 이미지만 대상
      const { error: unsetError } = await supabase
        .from('image_assets')
        .update({ is_customer_representative: false })
        .ilike('file_path', `originals/customers/${customer.folder_name}/%`);

      if (unsetError) {
        console.error('기존 대표 이미지 해제 오류:', unsetError);
        return res.status(500).json({
          success: false,
          error: '기존 대표 이미지 해제 실패: ' + unsetError.message
        });
      }

      // 선택한 이미지를 대표 이미지로 설정
      const { error: setError } = await supabase
        .from('image_assets')
        .update({ 
          is_customer_representative: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', imageId);

      if (setError) {
        console.error('대표 이미지 설정 오류:', setError);
        return res.status(500).json({
          success: false,
          error: '대표 이미지 설정 실패: ' + setError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: '대표 이미지로 설정되었습니다.',
        imageId,
        customerId
      });

    } else {
      // 대표 이미지 해제
      const { error: unsetError } = await supabase
        .from('image_assets')
        .update({ 
          is_customer_representative: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', imageId);

      if (unsetError) {
        console.error('대표 이미지 해제 오류:', unsetError);
        return res.status(500).json({
          success: false,
          error: '대표 이미지 해제 실패: ' + unsetError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: '대표 이미지가 해제되었습니다.',
        imageId,
        customerId
      });
    }

  } catch (error: any) {
    console.error('대표 이미지 설정/해제 오류:', error);
    return res.status(500).json({
      success: false,
      error: '서버 오류: ' + (error.message || '알 수 없는 오류')
    });
  }
}
