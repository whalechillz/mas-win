import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * 카카오 메시지 일괄 동기화 API
 * 
 * CSV/JSON 형식의 메시지 데이터를 받아서 일괄 동기화합니다.
 * 
 * POST /api/kakao/bulk-sync
 * Body: {
 *   messages: [
 *     {
 *       kakaoMessageId: string,
 *       title?: string,
 *       content?: string,
 *       messageType?: 'ALIMTALK' | 'FRIENDTALK',
 *       status?: 'sent' | 'draft' | 'scheduled',
 *       sentCount?: number,
 *       successCount?: number,
 *       failCount?: number,
 *       sentAt?: string,
 *       buttonText?: string,
 *       buttonLink?: string
 *     }
 *   ]
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: '메시지 배열이 필요합니다.'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    // 각 메시지 동기화
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      if (!msg.kakaoMessageId) {
        results.failed++;
        results.errors.push({
          index: i,
          message: 'kakaoMessageId가 필요합니다.'
        });
        continue;
      }

      try {
        // 기존 메시지 확인 (kakao_group_id로)
        const { data: existing } = await supabase
          .from('channel_kakao')
          .select('id')
          .eq('kakao_group_id', msg.kakaoMessageId)
          .single();

        if (existing) {
          // 업데이트
          const updateData: any = {
            updated_at: new Date().toISOString()
          };

          if (msg.title !== undefined) updateData.title = msg.title;
          if (msg.content !== undefined) updateData.content = msg.content;
          if (msg.messageType !== undefined) updateData.message_type = msg.messageType;
          if (msg.status !== undefined) updateData.status = msg.status;
          if (msg.sentAt !== undefined) updateData.sent_at = msg.sentAt;
          if (msg.sentCount !== undefined) updateData.sent_count = msg.sentCount;
          if (msg.successCount !== undefined) updateData.success_count = msg.successCount;
          if (msg.failCount !== undefined) updateData.fail_count = msg.failCount;
          if (msg.buttonText !== undefined) updateData.button_text = msg.buttonText;
          if (msg.buttonLink !== undefined) updateData.button_link = msg.buttonLink;

          const { error: updateError } = await supabase
            .from('channel_kakao')
            .update(updateData)
            .eq('id', existing.id);

          if (updateError) {
            throw updateError;
          }

          results.success++;
        } else {
          // 새 메시지 생성
          const insertData: any = {
            title: msg.title || null,
            content: msg.content || '카카오 파트너센터에서 등록된 메시지',
            message_type: msg.messageType || 'FRIENDTALK',
            template_type: 'BASIC_TEXT',
            button_text: msg.buttonText || null,
            button_link: msg.buttonLink || null,
            kakao_group_id: msg.kakaoMessageId,
            status: msg.status || 'sent',
            sent_at: msg.sentAt || new Date().toISOString(),
            sent_count: msg.sentCount || 0,
            success_count: msg.successCount || 0,
            fail_count: msg.failCount || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: insertError } = await supabase
            .from('channel_kakao')
            .insert(insertData);

          if (insertError) {
            throw insertError;
          }

          results.success++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          index: i,
          kakaoMessageId: msg.kakaoMessageId,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `일괄 동기화 완료: 성공 ${results.success}개, 실패 ${results.failed}개`,
      results
    });

  } catch (error: any) {
    console.error('❌ 카카오 메시지 일괄 동기화 오류:', error);
    return res.status(500).json({
      success: false,
      message: '일괄 동기화 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}


