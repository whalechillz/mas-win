import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const KAKAO_ADMIN_KEY = process.env.KAKAO_ADMIN_KEY;

/**
 * 카카오 친구 목록 조회 및 전화번호 → UUID 변환
 * 
 * GET /api/kakao/friends?phone=01012345678
 * GET /api/kakao/friends (전체 친구 목록)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { phone, sync = 'false' } = req.query;

      // 카카오 친구 목록 동기화 요청
      if (sync === 'true') {
        if (!KAKAO_ADMIN_KEY) {
          return res.status(500).json({
            success: false,
            message: 'KAKAO_ADMIN_KEY가 설정되지 않았습니다.'
          });
        }

        try {
          // 카카오 친구 목록 조회 API 호출
          const kakaoResponse = await fetch('https://kapi.kakao.com/v1/api/talk/friends', {
            method: 'GET',
            headers: {
              'Authorization': `KakaoAK ${KAKAO_ADMIN_KEY}`
            }
          });

          // 상세한 에러 처리
          if (!kakaoResponse.ok) {
            let errorData: any = {};
            const errorText = await kakaoResponse.text();
            
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { msg: errorText || '알 수 없는 오류' };
            }

            // 상태 코드별 상세 처리
            let errorMessage = '카카오 친구 목록 조회 실패';
            let errorCode = 'API_ERROR';

            if (kakaoResponse.status === 401) {
              errorMessage = '카카오 API 인증에 실패했습니다. 친구 목록 조회 API는 OAuth 2.0 Access Token이 필요합니다. Admin Key는 사용할 수 없습니다.';
              errorCode = 'AUTH_FAILED';
            } else if (kakaoResponse.status === 403) {
              errorMessage = '카카오 비즈니스 채널 연동이 필요하거나 권한이 없습니다.';
              errorCode = 'PERMISSION_DENIED';
            } else if (kakaoResponse.status === 400) {
              errorMessage = `잘못된 요청입니다: ${errorData.msg || errorText}`;
              errorCode = 'BAD_REQUEST';
            } else if (kakaoResponse.status >= 500) {
              errorMessage = `카카오 API 서버 오류 (${kakaoResponse.status}): ${errorData.msg || '서버 오류'}`;
              errorCode = 'SERVER_ERROR';
            } else {
              errorMessage = errorData.msg || errorText || '카카오 친구 목록 조회 실패';
            }

            console.error('❌ 카카오 API 오류 상세:', {
              status: kakaoResponse.status,
              statusText: kakaoResponse.statusText,
              errorCode,
              errorData,
              errorText
            });

            return res.status(500).json({
              success: false,
              message: errorMessage,
              errorCode,
              error: errorData,
              status: kakaoResponse.status
            });
          }

          // 응답 파싱
          let kakaoData: any = {};
          try {
            const responseText = await kakaoResponse.text();
            kakaoData = JSON.parse(responseText);
          } catch (parseError: any) {
            console.error('❌ 카카오 API 응답 파싱 오류:', parseError);
            return res.status(500).json({
              success: false,
              message: '카카오 API 응답을 파싱할 수 없습니다.',
              errorCode: 'PARSE_ERROR',
              error: parseError.message
            });
          }

          const friends = kakaoData.elements || [];

          // 데이터베이스에 저장/업데이트
          const mappings = friends.map((friend: any) => ({
            uuid: friend.uuid,
            phone: friend.phone_number || null,
            nickname: friend.profile_nickname || null,
            thumbnail_image: friend.profile_thumbnail_image || null,
            synced_at: new Date().toISOString()
          }));

          // upsert로 저장
          for (const mapping of mappings) {
            await supabase
              .from('kakao_friend_mappings')
              .upsert(mapping, { onConflict: 'uuid' });
          }

          return res.status(200).json({
            success: true,
            message: `${friends.length}명의 친구 목록이 동기화되었습니다.`,
            count: friends.length
          });
        } catch (apiError: any) {
          console.error('❌ 카카오 친구 목록 동기화 오류:', apiError);
          return res.status(500).json({
            success: false,
            message: '카카오 친구 목록 동기화에 실패했습니다.',
            error: apiError.message
          });
        }
      }

      // 전화번호로 UUID 조회
      if (phone) {
        const normalizedPhone = (phone as string).replace(/[^0-9]/g, '');
        
        const { data: mapping, error } = await supabase
          .from('kakao_friend_mappings')
          .select('uuid, phone, nickname, thumbnail_image')
          .eq('phone', normalizedPhone)
          .single();

        if (error || !mapping) {
          return res.status(404).json({
            success: false,
            message: '해당 전화번호의 카카오 친구를 찾을 수 없습니다.',
            phone: normalizedPhone
          });
        }

        return res.status(200).json({
          success: true,
          data: mapping
        });
      }

      // 전체 친구 목록 조회
      const { data: friends, error } = await supabase
        .from('kakao_friend_mappings')
        .select('uuid, phone, nickname, thumbnail_image, synced_at')
        .order('synced_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('❌ 친구 목록 조회 오류:', error);
        return res.status(500).json({
          success: false,
          message: '친구 목록 조회에 실패했습니다.',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: friends || [],
        count: friends?.length || 0
      });

    } catch (error: any) {
      console.error('❌ 카카오 친구 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '카카오 친구 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 전화번호 배열을 UUID 배열로 변환
  if (req.method === 'POST') {
    try {
      const { phones } = req.body;

      if (!phones || !Array.isArray(phones)) {
        return res.status(400).json({
          success: false,
          message: '전화번호 배열이 필요합니다.'
        });
      }

      const normalizedPhones = phones.map((phone: string) => phone.replace(/[^0-9]/g, ''));

      const { data: mappings, error } = await supabase
        .from('kakao_friend_mappings')
        .select('uuid, phone')
        .in('phone', normalizedPhones);

      if (error) {
        console.error('❌ UUID 변환 오류:', error);
        return res.status(500).json({
          success: false,
          message: 'UUID 변환에 실패했습니다.',
          error: error.message
        });
      }

      const phoneToUuidMap = new Map(
        (mappings || []).map((m: any) => [m.phone, m.uuid])
      );

      const result = normalizedPhones.map((phone: string) => ({
        phone,
        uuid: phoneToUuidMap.get(phone) || null,
        found: phoneToUuidMap.has(phone)
      }));

      return res.status(200).json({
        success: true,
        data: result,
        foundCount: result.filter((r: any) => r.found).length,
        totalCount: result.length
      });

    } catch (error: any) {
      console.error('❌ 전화번호 → UUID 변환 오류:', error);
      return res.status(500).json({
        success: false,
        message: '전화번호 → UUID 변환 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method Not Allowed'
  });
}







