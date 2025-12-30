import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * 카카오 파트너센터 메시지 수동 동기화 API
 * 
 * 카카오 파트너센터에서 등록한 메시지 정보를 수동으로 입력받아
 * channel_kakao 테이블과 동기화합니다.
 * 
 * POST /api/kakao/manual-sync
 * Body: {
 *   kakaoMessageId: string, // 카카오 파트너센터 메시지 ID (예: 16147105)
 *   channelKakaoId?: number, // channel_kakao 테이블의 ID (선택)
 *   title?: string,
 *   content?: string,
 *   status?: string, // 'sent', 'draft', 'scheduled'
 *   sentAt?: string,
 *   sentCount?: number,
 *   successCount?: number,
 *   failCount?: number,
 *   buttonText?: string,
 *   buttonLink?: string,
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const {
      kakaoMessageId,
      channelKakaoId,
      title,
      content,
      status,
      sentAt,
      sentCount,
      successCount,
      failCount,
      buttonText,
      buttonLink,
    } = req.body;

    if (!kakaoMessageId) {
      return res.status(400).json({
        success: false,
        message: '카카오 메시지 ID가 필요합니다.'
      });
    }

    // channel_kakao 테이블 업데이트 또는 생성
    if (channelKakaoId) {
      // 기존 메시지 업데이트
      const updateData: any = {
        updated_at: new Date().toISOString(),
        kakao_group_id: kakaoMessageId,
      };

      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (status !== undefined) updateData.status = status;
      if (sentAt !== undefined) updateData.sent_at = sentAt;
      if (sentCount !== undefined) updateData.sent_count = sentCount;
      if (successCount !== undefined) updateData.success_count = successCount;
      if (failCount !== undefined) updateData.fail_count = failCount;
      if (buttonText !== undefined) updateData.button_text = buttonText;
      if (buttonLink !== undefined) updateData.button_link = buttonLink;

      const { data: updatedChannel, error: updateError } = await supabase
        .from('channel_kakao')
        .update(updateData)
        .eq('id', channelKakaoId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ channel_kakao 업데이트 오류:', updateError);
        return res.status(500).json({
          success: false,
          message: '메시지 동기화에 실패했습니다.',
          error: updateError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: '메시지가 동기화되었습니다.',
        data: updatedChannel,
        kakaoMessageId
      });
    } else {
      // 새 메시지 생성 (카카오 파트너센터에서만 등록된 경우)
      const insertData: any = {
        title: title || null,
        content: content || '카카오 파트너센터에서 등록된 메시지',
        message_type: 'FRIENDTALK',
        template_type: 'BASIC_TEXT',
        button_text: buttonText || null,
        button_link: buttonLink || null,
        kakao_group_id: kakaoMessageId,
        status: status || 'sent',
        sent_at: sentAt || new Date().toISOString(),
        sent_count: sentCount || 0,
        success_count: successCount || 0,
        fail_count: failCount || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newChannel, error: insertError } = await supabase
        .from('channel_kakao')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ channel_kakao 생성 오류:', insertError);
        return res.status(500).json({
          success: false,
          message: '메시지 동기화에 실패했습니다.',
          error: insertError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: '메시지가 동기화되었습니다.',
        data: newChannel,
        kakaoMessageId
      });
    }

  } catch (error: any) {
    console.error('❌ 카카오 메시지 수동 동기화 오류:', error);
    return res.status(500).json({
      success: false,
      message: '메시지 동기화 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

