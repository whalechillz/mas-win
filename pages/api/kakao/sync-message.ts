import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * 카카오 비즈니스 파트너센터 메시지 동기화 API
 * 
 * 카카오 파트너센터에서 등록한 메시지의 상태를 조회하고
 * channel_kakao 테이블과 동기화합니다.
 * 
 * POST /api/kakao/sync-message
 * Body: {
 *   kakaoMessageId: string, // 카카오 파트너센터 메시지 ID (예: 16147105)
 *   channelKakaoId?: number, // channel_kakao 테이블의 ID (선택)
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { kakaoMessageId, channelKakaoId } = req.body;

    if (!kakaoMessageId) {
      return res.status(400).json({
        success: false,
        message: '카카오 메시지 ID가 필요합니다.'
      });
    }

    // TODO: 카카오 비즈니스 API를 통해 메시지 정보 조회
    // 현재는 수동으로 입력받은 정보를 저장하는 방식
    
    // 카카오 비즈니스 API 키 확인
    const KAKAO_ADMIN_KEY = process.env.KAKAO_ADMIN_KEY;
    const KAKAO_PLUS_FRIEND_ID = process.env.KAKAO_PLUS_FRIEND_ID;

    if (!KAKAO_ADMIN_KEY) {
      return res.status(400).json({
        success: false,
        message: '카카오 Admin 키가 설정되지 않았습니다. 환경 변수 KAKAO_ADMIN_KEY를 설정해주세요.'
      });
    }

    // 카카오 비즈니스 API로 메시지 정보 조회
    // 참고: https://developers.kakao.com/docs/latest/ko/kakaotalk-channel/rest-api
    let kakaoMessageInfo = null;
    try {
      // 카카오 비즈니스 파트너센터 API 엔드포인트
      // 실제 API 문서 확인 필요
      const response = await fetch(`https://kapi.kakao.com/v1/api/talk/channels/${KAKAO_PLUS_FRIEND_ID}/messages/${kakaoMessageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `KakaoAK ${KAKAO_ADMIN_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        kakaoMessageInfo = await response.json();
      } else {
        console.warn('⚠️ 카카오 API 메시지 조회 실패, 수동 동기화 모드로 진행');
      }
    } catch (apiError) {
      console.warn('⚠️ 카카오 API 호출 실패, 수동 동기화 모드로 진행:', apiError);
    }

    // channel_kakao 테이블 업데이트 또는 생성
    if (channelKakaoId) {
      // 기존 메시지 업데이트
      const updateData: any = {
        updated_at: new Date().toISOString(),
        kakao_group_id: kakaoMessageId, // 카카오 파트너센터 메시지 ID 저장
      };

      // 카카오 API에서 조회한 정보가 있으면 추가
      if (kakaoMessageInfo) {
        updateData.status = kakaoMessageInfo.status || 'sent';
        updateData.sent_at = kakaoMessageInfo.sent_at || null;
        updateData.sent_count = kakaoMessageInfo.recipient_count || 0;
        updateData.success_count = kakaoMessageInfo.success_count || 0;
        updateData.fail_count = kakaoMessageInfo.fail_count || 0;
      }

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
        title: kakaoMessageInfo?.title || null,
        content: kakaoMessageInfo?.content || '카카오 파트너센터에서 등록된 메시지',
        message_type: kakaoMessageInfo?.message_type || 'FRIENDTALK',
        template_type: 'BASIC_TEXT',
        button_text: kakaoMessageInfo?.button_text || null,
        button_link: kakaoMessageInfo?.button_link || null,
        kakao_group_id: kakaoMessageId,
        status: kakaoMessageInfo?.status || 'sent',
        sent_at: kakaoMessageInfo?.sent_at || new Date().toISOString(),
        sent_count: kakaoMessageInfo?.recipient_count || 0,
        success_count: kakaoMessageInfo?.success_count || 0,
        fail_count: kakaoMessageInfo?.fail_count || 0,
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
    console.error('❌ 카카오 메시지 동기화 오류:', error);
    return res.status(500).json({
      success: false,
      message: '메시지 동기화 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

