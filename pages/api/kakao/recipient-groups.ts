import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * 카카오 수신자 그룹 관리 API
 * 
 * GET /api/kakao/recipient-groups - 그룹 목록 조회
 * GET /api/kakao/recipient-groups?id=1 - 특정 그룹 조회
 * POST /api/kakao/recipient-groups - 그룹 생성
 * PUT /api/kakao/recipient-groups - 그룹 수정
 * DELETE /api/kakao/recipient-groups?id=1 - 그룹 삭제
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 그룹 목록 조회
  if (req.method === 'GET') {
    try {
      const { id } = req.query;

      if (id) {
        // 특정 그룹 조회
        const { data: group, error } = await supabase
          .from('kakao_recipient_groups')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !group) {
          return res.status(404).json({
            success: false,
            message: '그룹을 찾을 수 없습니다.'
          });
        }

        return res.status(200).json({
          success: true,
          data: group
        });
      }

      // 전체 그룹 목록 조회
      const { data: groups, error } = await supabase
        .from('kakao_recipient_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ 그룹 목록 조회 오류:', error);
        return res.status(500).json({
          success: false,
          message: '그룹 목록 조회에 실패했습니다.',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: groups || [],
        count: groups?.length || 0
      });

    } catch (error: any) {
      console.error('❌ 그룹 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '그룹 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 그룹 생성
  if (req.method === 'POST') {
    try {
      const { name, description, recipientUuids, recipientPhones } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: '그룹 이름은 필수입니다.'
        });
      }

      // 수신자 처리
      let finalRecipientUuids: any[] = [];
      if (recipientUuids && Array.isArray(recipientUuids)) {
        finalRecipientUuids = recipientUuids;
      } else if (recipientPhones && Array.isArray(recipientPhones)) {
        // 전화번호를 UUID로 변환
        const normalizedPhones = recipientPhones.map((phone: string) => 
          phone.replace(/[^0-9]/g, '')
        );

        const { data: mappings } = await supabase
          .from('kakao_friend_mappings')
          .select('uuid, phone')
          .in('phone', normalizedPhones);

        const phoneToUuidMap = new Map(
          (mappings || []).map((m: any) => [m.phone, m.uuid])
        );

        finalRecipientUuids = normalizedPhones
          .map((phone: string) => phoneToUuidMap.get(phone))
          .filter((uuid: string | undefined) => uuid !== undefined) as string[];
      }

      const { data: newGroup, error } = await supabase
        .from('kakao_recipient_groups')
        .insert({
          name,
          description: description || null,
          recipient_uuids: finalRecipientUuids.length > 0 ? JSON.stringify(finalRecipientUuids) : null,
          recipient_count: finalRecipientUuids.length,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ 그룹 생성 오류:', error);
        return res.status(500).json({
          success: false,
          message: '그룹 생성에 실패했습니다.',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: '그룹이 생성되었습니다.',
        data: newGroup
      });

    } catch (error: any) {
      console.error('❌ 그룹 생성 오류:', error);
      return res.status(500).json({
        success: false,
        message: '그룹 생성 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 그룹 수정
  if (req.method === 'PUT') {
    try {
      const { id, name, description, recipientUuids, recipientPhones, isActive } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '그룹 ID가 필요합니다.'
        });
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.is_active = isActive;

      // 수신자 업데이트
      if (recipientUuids !== undefined || recipientPhones !== undefined) {
        let finalRecipientUuids: any[] = [];
        
        if (recipientUuids && Array.isArray(recipientUuids)) {
          finalRecipientUuids = recipientUuids;
        } else if (recipientPhones && Array.isArray(recipientPhones)) {
          // 전화번호를 UUID로 변환
          const normalizedPhones = recipientPhones.map((phone: string) => 
            phone.replace(/[^0-9]/g, '')
          );

          const { data: mappings } = await supabase
            .from('kakao_friend_mappings')
            .select('uuid, phone')
            .in('phone', normalizedPhones);

          const phoneToUuidMap = new Map(
            (mappings || []).map((m: any) => [m.phone, m.uuid])
          );

          finalRecipientUuids = normalizedPhones
            .map((phone: string) => phoneToUuidMap.get(phone))
            .filter((uuid: string | undefined) => uuid !== undefined) as string[];
        }

        updateData.recipient_uuids = finalRecipientUuids.length > 0 
          ? JSON.stringify(finalRecipientUuids) 
          : null;
        updateData.recipient_count = finalRecipientUuids.length;
      }

      const { data: updatedGroup, error } = await supabase
        .from('kakao_recipient_groups')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ 그룹 수정 오류:', error);
        return res.status(500).json({
          success: false,
          message: '그룹 수정에 실패했습니다.',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: '그룹이 수정되었습니다.',
        data: updatedGroup
      });

    } catch (error: any) {
      console.error('❌ 그룹 수정 오류:', error);
      return res.status(500).json({
        success: false,
        message: '그룹 수정 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 그룹 삭제
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '그룹 ID가 필요합니다.'
        });
      }

      const { error } = await supabase
        .from('kakao_recipient_groups')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ 그룹 삭제 오류:', error);
        return res.status(500).json({
          success: false,
          message: '그룹 삭제에 실패했습니다.',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: '그룹이 삭제되었습니다.'
      });

    } catch (error: any) {
      console.error('❌ 그룹 삭제 오류:', error);
      return res.status(500).json({
        success: false,
        message: '그룹 삭제 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method Not Allowed'
  });
}







