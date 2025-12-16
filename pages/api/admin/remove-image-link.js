/**
 * 링크 이미지 삭제 API
 * - image_metadata에서 태그만 제거 (실제 파일은 삭제하지 않음)
 * - channel_sms.image_url도 NULL로 업데이트 (해당 메시지 ID가 있는 경우)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { imageUrl, folderPath, messageId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ 
        success: false,
        error: 'imageUrl이 필요합니다.'
      });
    }

    console.log('🔗 링크 삭제 시작:', {
      imageUrl: imageUrl.substring(0, 50) + '...',
      folderPath,
      messageId
    });

    // 1. image_metadata에서 원본 이미지 찾기
    const { data: imageMetadata, error: metaError } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('image_url', imageUrl)
      .maybeSingle();

    if (metaError) {
      console.error('❌ image_metadata 조회 실패:', metaError);
      return res.status(500).json({
        success: false,
        error: '이미지 메타데이터를 찾을 수 없습니다.',
        details: metaError.message
      });
    }

    if (!imageMetadata) {
      return res.status(404).json({
        success: false,
        error: '이미지 메타데이터를 찾을 수 없습니다.'
      });
    }

    // 2. 태그에서 해당 메시지 ID 제거
    const currentTags = imageMetadata.tags || [];
    let tagToRemove = null;
    
    if (messageId) {
      tagToRemove = `sms-${messageId}`;
    } else if (folderPath) {
      // folderPath에서 메시지 ID 추출 (예: originals/mms/2025-12-05/154)
      const match = folderPath.match(/\/(\d+)$/);
      if (match) {
        tagToRemove = `sms-${match[1]}`;
      }
    }

    if (!tagToRemove) {
      return res.status(400).json({
        success: false,
        error: '메시지 ID를 찾을 수 없습니다. folderPath 또는 messageId를 제공해주세요.'
      });
    }

    // 태그가 이미 없는 경우
    if (!currentTags.includes(tagToRemove)) {
      return res.status(200).json({
        success: true,
        message: '링크가 이미 제거되어 있습니다.',
        removedTag: tagToRemove
      });
    }

    // 태그 제거
    const updatedTags = currentTags.filter(tag => tag !== tagToRemove);

    // 3. image_metadata 업데이트
    const { data: updatedMetadata, error: updateError } = await supabase
      .from('image_metadata')
      .update({
        tags: updatedTags,
        updated_at: new Date().toISOString()
      })
      .eq('id', imageMetadata.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ image_metadata 업데이트 실패:', updateError);
      return res.status(500).json({
        success: false,
        error: '태그 업데이트 실패',
        details: updateError.message
      });
    }

    console.log('✅ 태그 업데이트 완료:', {
      removedTag: tagToRemove,
      remainingTags: updatedTags
    });

    // 4. channel_sms.image_url도 NULL로 업데이트 (해당 메시지 ID가 있는 경우)
    if (messageId) {
      const messageIdNum = parseInt(messageId);
      if (!isNaN(messageIdNum)) {
        const { error: smsUpdateError } = await supabase
          .from('channel_sms')
          .update({
            image_url: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', messageIdNum);

        if (smsUpdateError) {
          console.warn('⚠️ channel_sms 업데이트 실패 (무시):', smsUpdateError);
          // channel_sms 업데이트 실패해도 링크 삭제는 성공으로 처리
        } else {
          console.log('✅ channel_sms.image_url NULL로 업데이트 완료:', messageIdNum);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: '링크가 성공적으로 삭제되었습니다.',
      removedTag: tagToRemove,
      remainingTags: updatedTags,
      updatedMetadataId: updatedMetadata.id
    });

  } catch (error) {
    console.error('❌ 링크 삭제 API 오류:', error);
    return res.status(500).json({
      success: false,
      error: '링크 삭제 중 서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}











