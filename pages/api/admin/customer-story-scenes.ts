/**
 * 고객 스토리 장면 설명 관리 API
 * GET: 장면 설명 목록 조회
 * POST: 장면 설명 저장/수정
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // 장면 설명 목록 조회
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({ error: 'customerId가 필요합니다.' });
    }

    try {
      const { data, error } = await supabase
        .from('customer_story_scenes')
        .select('*')
        .eq('customer_id', customerId)
        .order('scene_number', { ascending: true });

      if (error) {
        // 테이블이 없으면 빈 배열 반환
        if (error.code === 'PGRST116') {
          return res.status(200).json({
            success: true,
            scenes: []
          });
        }
        throw error;
      }

      return res.status(200).json({
        success: true,
        scenes: data || []
      });
    } catch (error: any) {
      console.error('장면 설명 조회 오류:', error);
      return res.status(500).json({
        success: false,
        error: error.message || '장면 설명 조회 실패'
      });
    }
  }

  if (req.method === 'POST') {
    // 장면 설명 저장/수정
    const { customerId, sceneNumber, description } = req.body;

    if (!customerId || !sceneNumber) {
      return res.status(400).json({ error: 'customerId와 sceneNumber가 필요합니다.' });
    }

    try {
      // 기존 장면 설명 확인
      const { data: existing } = await supabase
        .from('customer_story_scenes')
        .select('id')
        .eq('customer_id', customerId)
        .eq('scene_number', sceneNumber)
        .single();

      if (existing) {
        // 수정
        const { data, error } = await supabase
          .from('customer_story_scenes')
          .update({
            description: description || '',
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;

        return res.status(200).json({
          success: true,
          scene: data
        });
      } else {
        // 생성
        const { data, error } = await supabase
          .from('customer_story_scenes')
          .insert({
            customer_id: customerId,
            scene_number: sceneNumber,
            description: description || ''
          })
          .select()
          .single();

        if (error) throw error;

        return res.status(200).json({
          success: true,
          scene: data
        });
      }
    } catch (error: any) {
      console.error('장면 설명 저장 오류:', error);
      return res.status(500).json({
        success: false,
        error: error.message || '장면 설명 저장 실패'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
