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
      channelPostId, // 기존 메시지 ID (있으면 업데이트, 없으면 생성)
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

    // channelPostId가 있으면 업데이트, 없으면 생성
    const isUpdate = !!channelPostId;
    
    // 공통 데이터 객체
    const dataToSave: any = {
      title: isBasicTextType ? null : (title || null), // 기본 텍스트형이면 null
      content, // content 컬럼 사용
      message_text: content, // message_text 컬럼에도 저장 (NOT NULL 제약 대응)
      message_type: message_type || messageType || 'FRIENDTALK',
      template_type: templateType || 'BASIC_TEXT', // 항상 포함 (기본값)
      button_text: finalButtonText || null,
      button_link: finalButtonLink || null,
      recipient_uuids: finalRecipientUuids, // JSON 문자열 또는 null
      updated_at: new Date().toISOString()
    };

    // image_url, emoji, tags는 데이터베이스에 컬럼이 있는 경우에만 추가
    if (image_url || imageUrl) {
      dataToSave.image_url = image_url || imageUrl;
    }
    
    if (emoji !== undefined) {
      dataToSave.emoji = emoji || null;
    }
    
    // tags는 카카오 파트너센터에 없는 기능이므로 제거됨
    // 기존 데이터와의 호환성을 위해 tags 필드는 무시

    // 생성 시에만 추가되는 필드
    if (!isUpdate) {
      // template_id는 선택적이므로 null이어도 됨
      // dataToSave.template_id = null; // 명시적으로 null을 설정하지 않음 (컬럼이 없으면 추가 안 함)
      dataToSave.status = status || 'draft';
      dataToSave.calendar_id = hub_content_id || calendarId || null;
      dataToSave.created_at = new Date().toISOString();
    } else {
      // 업데이트 시에는 status와 calendar_id도 업데이트 가능
      if (status !== undefined) {
        dataToSave.status = status;
      }
      if (hub_content_id !== undefined || calendarId !== undefined) {
        dataToSave.calendar_id = hub_content_id || calendarId || null;
      }
    }

    // 디버깅: 저장 시도 데이터 로깅
    console.log(`📝 카카오 채널 ${isUpdate ? '업데이트' : '생성'} 시도:`, {
      channelPostId: isUpdate ? channelPostId : 'new',
      title: dataToSave.title,
      contentLength: dataToSave.content?.length,
      message_type: dataToSave.message_type,
      template_type: dataToSave.template_type,
      hasButton: !!(dataToSave.button_text && dataToSave.button_link),
      recipientCount: finalRecipientUuids ? JSON.parse(finalRecipientUuids).length : 0,
      status: dataToSave.status
    });

    let result;
    let error;

    if (isUpdate) {
      // 업데이트
      const { data: updatedKakaoChannel, error: updateError } = await supabase
        .from('channel_kakao')
        .update(dataToSave)
        .eq('id', channelPostId)
        .select()
        .single();

      result = updatedKakaoChannel;
      error = updateError;

      if (error) {
        console.error('❌ 카카오 채널 업데이트 오류:', error);
        console.error('❌ 오류 코드:', error.code);
        console.error('❌ 오류 메시지:', error.message);
        console.error('❌ 오류 상세:', error.details);
        console.error('❌ 오류 힌트:', error.hint);
        console.error('❌ 업데이트 시도한 데이터:', JSON.stringify(dataToSave, null, 2));
        
        return res.status(500).json({
          success: false,
          message: '카카오 채널 업데이트에 실패했습니다.',
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          attemptedData: dataToSave
        });
      }
    } else {
      // 생성
      const { data: newKakaoChannel, error: insertError } = await supabase
        .from('channel_kakao')
        .insert(dataToSave)
        .select()
        .single();

      result = newKakaoChannel;
      error = insertError;

      if (error) {
        console.error('❌ 카카오 채널 저장 오류:', error);
        console.error('❌ 오류 코드:', error.code);
        console.error('❌ 오류 메시지:', error.message);
        console.error('❌ 오류 상세:', error.details);
        console.error('❌ 오류 힌트:', error.hint);
        console.error('❌ 저장 시도한 데이터:', JSON.stringify(dataToSave, null, 2));
        
        return res.status(500).json({
          success: false,
          message: '카카오 채널 저장에 실패했습니다.',
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          attemptedData: dataToSave
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: isUpdate ? '카카오 채널이 업데이트되었습니다.' : '카카오 채널이 저장되었습니다.',
      channelPostId: result.id,
      data: result
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

