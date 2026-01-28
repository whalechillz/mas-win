/**
 * 이미지 메타데이터 조회/수정 API
 * GET: 이미지 ID 배열로 이미지 메타데이터 조회
 * PATCH: 이미지 메타데이터 수정 (대표 이미지 설정 등)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: 이미지 메타데이터 조회
  if (req.method === 'GET') {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ error: 'ids 파라미터가 필요합니다.' });
    }

    try {
      // ID 배열 파싱
      const idArray = (ids as string).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

      if (idArray.length === 0) {
        return res.status(200).json({
          success: true,
          images: []
        });
      }

      // ⚠️ image_assets로 변경 (ID는 UUID이므로 문자열 배열로 변환 필요)
      const idStringArray = idArray.map(id => id.toString());
      const { data, error } = await supabase
        .from('image_assets')
        .select('*')
        .in('id', idStringArray);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        images: data || []
      });
    } catch (error: any) {
      console.error('이미지 메타데이터 조회 오류:', error);
      return res.status(500).json({
        success: false,
        error: error.message || '이미지 메타데이터 조회 실패'
      });
    }
  }

  // PATCH: 이미지 메타데이터 수정
  if (req.method === 'PATCH') {
    try {
      const { imageId, isSceneRepresentative, storyScene, displayOrder } = req.body;

      if (!imageId) {
        return res.status(400).json({ error: 'imageId가 필요합니다.' });
      }

      // ⚠️ image_assets로 변경 (customer_id, story_scene, is_scene_representative는 image_assets에 없음)
      // 먼저 현재 이미지 정보 조회
      const { data: currentImage, error: fetchError } = await supabase
        .from('image_assets')
        .select('id, cdn_url')
        .eq('id', imageId.toString())
        .single();

      if (fetchError || !currentImage) {
        return res.status(404).json({ error: '이미지를 찾을 수 없습니다.' });
      }

      // ⚠️ image_assets에는 customer_id, story_scene, is_scene_representative가 없으므로 이 기능은 지원되지 않음
      if (isSceneRepresentative !== undefined || storyScene !== undefined || displayOrder !== undefined) {
        return res.status(400).json({
          success: false,
          error: 'image_assets 테이블에는 customer_id, story_scene, is_scene_representative 필드가 없습니다. 이 기능은 현재 지원되지 않습니다.'
        });
      }

      // 이미지 메타데이터 업데이트 (기본 정보만)
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      const { data: updatedImage, error: updateError } = await supabase
        .from('image_assets')
        .update(updateData)
        .eq('id', imageId.toString())
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log('✅ 이미지 메타데이터 업데이트 완료:', {
        imageId
      });

      return res.status(200).json({
        success: true,
        image: updatedImage
      });

    } catch (error: any) {
      console.error('이미지 메타데이터 수정 오류:', error);
      return res.status(500).json({
        success: false,
        error: error.message || '이미지 메타데이터 수정 실패'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
