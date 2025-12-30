import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const {
      title,
      content,
      messageType,
      message_type,
      imageUrl,
      image_url,
      shortLink,
      short_link,
      buttonLink,
      button_link,
      buttonText,
      button_text,
      emoji,
      tags,
      status = 'draft',
      calendarId,
      hub_content_id,
      channelKey,
      selectedRecipients,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '제목과 내용은 필수입니다.'
      });
    }

    // 카카오 버튼 링크 설정 (shortLink 또는 buttonLink 우선 사용)
    const finalButtonLink = button_link || buttonLink || short_link || shortLink || 'https://www.masgolf.co.kr/survey';
    const finalButtonText = button_text || buttonText || '설문 참여하기';

    // channel_kakao 테이블에 저장
    const { data: newKakaoChannel, error } = await supabase
      .from('channel_kakao')
      .insert({
        title,
        content,
        message_type: message_type || messageType || 'FRIENDTALK',
        template_id: null,
        button_text: finalButtonText,
        button_link: finalButtonLink,
        recipient_uuids: selectedRecipients || [],
        status: status || 'draft',
        calendar_id: hub_content_id || calendarId || null,
        image_url: image_url || imageUrl || null,
        emoji: emoji || null,
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : []),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ 카카오 채널 저장 오류:', error);
      return res.status(500).json({
        success: false,
        message: '카카오 채널 저장에 실패했습니다.',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: '카카오 채널이 저장되었습니다.',
      channelPostId: newKakaoChannel.id,
      data: newKakaoChannel
    });

  } catch (error: any) {
    console.error('❌ 카카오 채널 저장 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '카카오 채널 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

