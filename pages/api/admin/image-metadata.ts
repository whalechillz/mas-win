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

      const { data, error } = await supabase
        .from('image_metadata')
        .select('*')
        .in('id', idArray);

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

      // 먼저 현재 이미지 정보 조회
      const { data: currentImage, error: fetchError } = await supabase
        .from('image_metadata')
        .select('id, customer_id, story_scene, is_scene_representative, image_url')
        .eq('id', imageId)
        .single();

      if (fetchError || !currentImage) {
        return res.status(404).json({ error: '이미지를 찾을 수 없습니다.' });
      }

      // 대표 이미지 설정 시 동영상 체크
      if (isSceneRepresentative === true) {
        const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
        const imageUrl = currentImage.image_url?.toLowerCase() || '';
        const isVideo = videoExtensions.some(ext => imageUrl.includes(ext));
        
        if (isVideo) {
          return res.status(400).json({ 
            success: false,
            error: '동영상은 대표 이미지로 설정할 수 없습니다. 이미지만 대표 이미지로 설정 가능합니다.' 
          });
        }
        
        if (!currentImage.story_scene) {
          return res.status(400).json({ 
            success: false,
            error: '장면이 할당되지 않은 이미지는 대표 이미지로 설정할 수 없습니다.' 
          });
        }
        
        const scene = storyScene || currentImage.story_scene;
        
        // 해당 장면의 기존 대표 이미지 모두 해제
        const { error: unsetError } = await supabase
          .from('image_metadata')
          .update({
            is_scene_representative: false,
            updated_at: new Date().toISOString()
          })
          .eq('customer_id', String(currentImage.customer_id)) // customer_id는 VARCHAR(50)이므로 문자열로 변환
          .eq('story_scene', scene)
          .eq('is_scene_representative', true);

        if (unsetError) {
          console.error('기존 대표 이미지 해제 오류:', unsetError);
          // 계속 진행 (트랜잭션이 아니므로)
        }
      }

      // 이미지 메타데이터 업데이트
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (isSceneRepresentative !== undefined) {
        updateData.is_scene_representative = isSceneRepresentative;
      }

      if (displayOrder !== undefined) {
        updateData.display_order = displayOrder;
      }

      if (storyScene !== undefined) {
        updateData.story_scene = storyScene;
      }

      const { data: updatedImage, error: updateError } = await supabase
        .from('image_metadata')
        .update(updateData)
        .eq('id', imageId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log('✅ 이미지 메타데이터 업데이트 완료:', {
        imageId,
        isSceneRepresentative,
        storyScene: storyScene || currentImage.story_scene
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
