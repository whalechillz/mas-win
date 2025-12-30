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
      templateType,
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

    // 기본 텍스트형이 아닌 경우에만 제목 필수 체크
    const isBasicTextType = templateType === 'BASIC_TEXT';

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '내용은 필수입니다.'
      });
    }

    if (!isBasicTextType && !title) {
      return res.status(400).json({
        success: false,
        message: '제목은 필수입니다.'
      });
    }

    // 카카오 버튼 링크 설정 (shortLink 또는 buttonLink 우선 사용)
    // 빈 값이면 null로 저장 (버튼 없음)
    const finalButtonLink = button_link || buttonLink || short_link || shortLink || null;
    const finalButtonText = button_text || buttonText || null;

    // recipient_uuids 처리: 배열이면 JSON 문자열로 변환, 빈 배열이면 null
    let finalRecipientUuids: string | null = null;
    if (selectedRecipients && Array.isArray(selectedRecipients) && selectedRecipients.length > 0) {
      finalRecipientUuids = JSON.stringify(selectedRecipients);
    } else if (selectedRecipients && typeof selectedRecipients === 'string') {
      finalRecipientUuids = selectedRecipients;
    }

    // channel_kakao 테이블에 저장 (기존 API 구조와 동일하게)
    const insertData: any = {
      title: isBasicTextType ? null : (title || null), // 기본 텍스트형이면 null
      content,
      message_type: message_type || messageType || 'FRIENDTALK',
      template_type: templateType || 'BASIC_TEXT', // 항상 포함 (기본값)
      template_id: null,
      button_text: finalButtonText || null,
      button_link: finalButtonLink || null,
      recipient_uuids: finalRecipientUuids, // JSON 문자열 또는 null
      status: status || 'draft',
      calendar_id: hub_content_id || calendarId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // image_url, emoji, tags는 데이터베이스에 컬럼이 있는 경우에만 추가
    if (image_url || imageUrl) {
      insertData.image_url = image_url || imageUrl;
    }
    
    if (emoji) {
      insertData.emoji = emoji;
    }
    
    if (tags) {
      // tags가 배열이면 JSON 문자열로 변환, 문자열이면 그대로 사용
      insertData.tags = Array.isArray(tags) 
        ? JSON.stringify(tags) 
        : (typeof tags === 'string' ? tags : null);
    }

    // 디버깅: 저장 시도 데이터 로깅
    console.log('📝 카카오 채널 저장 시도:', {
      title: insertData.title,
      contentLength: insertData.content?.length,
      message_type: insertData.message_type,
      template_type: insertData.template_type,
      hasButton: !!(insertData.button_text && insertData.button_link),
      recipientCount: finalRecipientUuids ? JSON.parse(finalRecipientUuids).length : 0,
      status: insertData.status
    });

    const { data: newKakaoChannel, error } = await supabase
      .from('channel_kakao')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ 카카오 채널 저장 오류:', error);
      console.error('❌ 오류 코드:', error.code);
      console.error('❌ 오류 메시지:', error.message);
      console.error('❌ 오류 상세:', error.details);
      console.error('❌ 오류 힌트:', error.hint);
      console.error('❌ 저장 시도한 데이터:', JSON.stringify(insertData, null, 2));
      
      return res.status(500).json({
        success: false,
        message: '카카오 채널 저장에 실패했습니다.',
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        attemptedData: insertData
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

