import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../../../utils/solapiSignature.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const KAKAO_ADMIN_KEY = process.env.KAKAO_ADMIN_KEY;
const KAKAO_PLUS_FRIEND_ID = process.env.KAKAO_PLUS_FRIEND_ID;
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;
const SOLAPI_API_URL = 'https://api.solapi.com/messages/v4/send';
const SOLAPI_SENDER = process.env.SOLAPI_SENDER || '0312150013';

/**
 * 카카오 채널 메시지 발송 API
 * 
 * POST /api/channels/kakao/send
 * Body: {
 *   channelPostId: number, // channel_kakao 테이블의 ID
 *   title?: string,
 *   content?: string,
 *   messageType?: 'ALIMTALK' | 'FRIENDTALK',
 *   templateType?: string,
 *   buttonText?: string,
 *   buttonLink?: string,
 *   imageUrl?: string,
 *   selectedRecipients?: string[] // 전화번호 배열 또는 UUID 배열
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const {
      channelPostId,
      title,
      content,
      messageType,
      message_type,
      templateType,
      buttonText,
      button_link,
      buttonLink,
      imageUrl,
      selectedRecipients,
    } = req.body;

    if (!channelPostId) {
      return res.status(400).json({
        success: false,
        message: 'channelPostId가 필요합니다.'
      });
    }

    // channel_kakao에서 메시지 정보 조회
    const { data: kakaoMessage, error: fetchError } = await supabase
      .from('channel_kakao')
      .select('*')
      .eq('id', channelPostId)
      .single();

    if (fetchError || !kakaoMessage) {
      console.error('❌ 카카오 메시지 조회 오류:', fetchError);
      return res.status(404).json({
        success: false,
        message: '카카오 메시지를 찾을 수 없습니다.',
        error: fetchError?.message
      });
    }

    // 최종 메시지 데이터 (요청 데이터 우선, 없으면 DB 데이터 사용)
    const finalContent = content || kakaoMessage.content || kakaoMessage.message_text || '';
    const finalTitle = title || kakaoMessage.title || null;
    const finalMessageType = message_type || messageType || kakaoMessage.message_type || 'FRIENDTALK';
    const finalTemplateType = templateType || kakaoMessage.template_type || 'BASIC_TEXT';
    const finalButtonText = buttonText || kakaoMessage.button_text || null;
    const finalButtonLink = button_link || buttonLink || kakaoMessage.button_link || null;
    const finalImageUrl = imageUrl || kakaoMessage.image_url || null;

    if (!finalContent) {
      return res.status(400).json({
        success: false,
        message: '메시지 내용이 없습니다.'
      });
    }

    // 수신자 처리
    let receiverUuids: string[] = [];
    const friendGroupId = req.body.friendGroupId as number | undefined;
    
    // 친구 그룹 타게팅
    if (friendGroupId) {
      const { data: group, error: groupError } = await supabase
        .from('kakao_recipient_groups')
        .select('recipient_uuids, recipient_count')
        .eq('id', friendGroupId)
        .eq('is_active', true)
        .single();

      if (groupError || !group) {
        return res.status(400).json({
          success: false,
          message: '선택한 친구 그룹을 찾을 수 없습니다.'
        });
      }

      if (group.recipient_uuids) {
        try {
          const parsed = typeof group.recipient_uuids === 'string'
            ? JSON.parse(group.recipient_uuids)
            : group.recipient_uuids;
          receiverUuids = Array.isArray(parsed) ? parsed : [];
        } catch {
          receiverUuids = [];
        }
      }

      if (receiverUuids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '선택한 친구 그룹에 등록된 친구가 없습니다.'
        });
      }

      console.log(`✅ 친구 그룹 타게팅: ${receiverUuids.length}명`);
    } else if (selectedRecipients && Array.isArray(selectedRecipients) && selectedRecipients.length > 0) {
      // 전화번호인지 UUID인지 확인
      const firstRecipient = selectedRecipients[0];
      if (typeof firstRecipient === 'string' && firstRecipient.match(/^[0-9-]+$/)) {
        // 전화번호인 경우 - 데이터베이스에서 UUID로 변환
        console.log('📞 전화번호를 UUID로 변환 중...', selectedRecipients.length);
        
        const normalizedPhones = selectedRecipients.map((phone: string) => 
          phone.replace(/[^0-9]/g, '')
        );

        const { data: mappings, error: mappingError } = await supabase
          .from('kakao_friend_mappings')
          .select('uuid, phone')
          .in('phone', normalizedPhones);

        if (mappingError) {
          console.error('❌ UUID 변환 오류:', mappingError);
          return res.status(500).json({
            success: false,
            message: '전화번호를 UUID로 변환하는 중 오류가 발생했습니다.',
            error: mappingError.message
          });
        }

        const phoneToUuidMap = new Map(
          (mappings || []).map((m: any) => [m.phone, m.uuid])
        );

        receiverUuids = normalizedPhones
          .map((phone: string) => phoneToUuidMap.get(phone))
          .filter((uuid: string | undefined) => uuid !== undefined) as string[];

        const notFoundCount = normalizedPhones.length - receiverUuids.length;
        if (notFoundCount > 0) {
          console.warn(`⚠️ ${notFoundCount}개의 전화번호에 해당하는 카카오 친구를 찾을 수 없습니다.`);
        }

        if (receiverUuids.length === 0) {
          return res.status(400).json({
            success: false,
            message: '전화번호에 해당하는 카카오 친구를 찾을 수 없습니다. 친구 목록을 동기화해주세요.',
            notFoundPhones: normalizedPhones.filter((phone: string) => !phoneToUuidMap.has(phone))
          });
        }

        console.log(`✅ ${receiverUuids.length}개의 UUID로 변환 완료`);
      } else {
        receiverUuids = selectedRecipients;
      }
    } else if (kakaoMessage.recipient_uuids) {
      // 저장된 recipient_uuids 사용
      try {
        const parsed = typeof kakaoMessage.recipient_uuids === 'string' 
          ? JSON.parse(kakaoMessage.recipient_uuids)
          : kakaoMessage.recipient_uuids;
        receiverUuids = Array.isArray(parsed) ? parsed : [];
      } catch {
        receiverUuids = [];
      }
    }

    if (receiverUuids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '수신자가 없습니다. 수신자를 선택해주세요.'
      });
    }

    // 카카오 API 발송
    if (!KAKAO_ADMIN_KEY) {
      console.warn('⚠️ KAKAO_ADMIN_KEY가 설정되지 않았습니다. 시뮬레이션 모드로 진행합니다.');
      
      // 시뮬레이션 모드: DB에만 저장하고 실제 발송은 하지 않음
      const now = new Date().toISOString();
      await supabase
        .from('channel_kakao')
        .update({
          status: 'sent',
          sent_at: now,
          sent_count: receiverUuids.length,
          success_count: receiverUuids.length,
          fail_count: 0
        })
        .eq('id', channelPostId);

      return res.status(200).json({
        success: true,
        message: '카카오 메시지가 저장되었습니다. (시뮬레이션 모드: 실제 발송은 KAKAO_ADMIN_KEY 설정 후 가능)',
        result: {
          successCount: receiverUuids.length,
          failCount: 0,
          totalCount: receiverUuids.length,
          mode: 'simulation'
        }
      });
    }

    let kakaoApiResult: any = null;
    let successCount = 0;
    let failCount = 0;
    let errorMessages: string[] = [];

    if (finalMessageType === 'FRIENDTALK') {
      // 친구톡 발송
      try {
        const templateObject: any = {
          object_type: 'text',
          text: finalContent
        };

        // 버튼이 있으면 추가
        if (finalButtonLink && finalButtonText) {
          templateObject.link = {
            web_url: finalButtonLink,
            mobile_web_url: finalButtonLink
          };
          templateObject.button_title = finalButtonText;
        }

        // 이미지가 있으면 추가 (와이드 이미지형)
        if (finalImageUrl && finalTemplateType === 'WIDE_IMAGE') {
          templateObject.object_type = 'feed';
          templateObject.content = {
            title: finalTitle || '',
            description: finalContent,
            image_url: finalImageUrl,
            link: finalButtonLink ? {
              web_url: finalButtonLink,
              mobile_web_url: finalButtonLink
            } : undefined
          };
          if (finalButtonText) {
            templateObject.buttons = [{
              title: finalButtonText,
              link: {
                web_url: finalButtonLink,
                mobile_web_url: finalButtonLink
              }
            }];
          }
        }

        console.log('📤 카카오 친구톡 발송 시도:', {
          receiverCount: receiverUuids.length,
          templateType: finalTemplateType,
          hasButton: !!(finalButtonLink && finalButtonText),
          hasImage: !!finalImageUrl
        });

        const kakaoResponse = await fetch('https://kapi.kakao.com/v1/api/talk/friends/message/default/send', {
          method: 'POST',
          headers: {
            'Authorization': `KakaoAK ${KAKAO_ADMIN_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            receiver_uuids: JSON.stringify(receiverUuids),
            template_object: JSON.stringify(templateObject)
          })
        });

        const kakaoData = await kakaoResponse.json();
        
        if (kakaoResponse.ok && !kakaoData.error) {
          kakaoApiResult = kakaoData;
          successCount = receiverUuids.length;
          console.log('✅ 카카오 친구톡 발송 성공:', kakaoData);
        } else {
          const errorMsg = kakaoData.msg || kakaoData.message || '카카오 API 발송 실패';
          errorMessages.push(errorMsg);
          failCount = receiverUuids.length;
          console.error('❌ 카카오 친구톡 발송 실패:', kakaoData);
          throw new Error(errorMsg);
        }
      } catch (apiError: any) {
        console.error('❌ 카카오 API 발송 오류:', apiError);
        failCount = receiverUuids.length;
        errorMessages.push(apiError.message || '카카오 API 호출 실패');
        
        // API 오류가 발생해도 DB에는 기록
      }
    } else if (finalMessageType === 'ALIMTALK') {
      // 알림톡 발송 (Solapi 사용)
      if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
        return res.status(500).json({
          success: false,
          message: '알림톡 발송을 위해 SOLAPI_API_KEY와 SOLAPI_API_SECRET이 필요합니다.'
        });
      }

      // 템플릿 ID 확인
      const templateId = kakaoMessage.template_id || req.body.templateId;
      if (!templateId) {
        return res.status(400).json({
          success: false,
          message: '알림톡 발송을 위해 템플릿 ID가 필요합니다. 메시지에 템플릿 ID를 설정해주세요.'
        });
      }

      // 전화번호로 변환 (receiverUuids가 전화번호인 경우)
      // 알림톡은 전화번호로 발송하므로, UUID가 아닌 전화번호가 필요
      let recipientPhones: string[] = [];
      
      if (selectedRecipients && Array.isArray(selectedRecipients) && selectedRecipients.length > 0) {
        // 전화번호 형식인지 확인
        const firstRecipient = selectedRecipients[0];
        if (typeof firstRecipient === 'string' && firstRecipient.match(/^[0-9-]+$/)) {
          // 전화번호인 경우 그대로 사용
          recipientPhones = selectedRecipients.map((phone: string) => phone.replace(/[^0-9]/g, ''));
        } else {
          // UUID인 경우 전화번호로 역변환 필요
          const { data: mappings } = await supabase
            .from('kakao_friend_mappings')
            .select('phone, uuid')
            .in('uuid', selectedRecipients);

          recipientPhones = (mappings || [])
            .map((m: any) => m.phone)
            .filter((phone: string | null) => phone !== null) as string[];
        }
      } else if (kakaoMessage.recipient_uuids) {
        // 저장된 recipient_uuids 사용 (전화번호 또는 UUID)
        try {
          const parsed = typeof kakaoMessage.recipient_uuids === 'string' 
            ? JSON.parse(kakaoMessage.recipient_uuids)
            : kakaoMessage.recipient_uuids;
          
          const recipients = Array.isArray(parsed) ? parsed : [];
          
          // 전화번호인지 UUID인지 확인
          if (recipients.length > 0) {
            const first = recipients[0];
            if (typeof first === 'string' && first.match(/^[0-9-]+$/)) {
              recipientPhones = recipients.map((phone: string) => phone.replace(/[^0-9]/g, ''));
            } else {
              // UUID인 경우 전화번호로 변환
              const { data: mappings } = await supabase
                .from('kakao_friend_mappings')
                .select('phone, uuid')
                .in('uuid', recipients);

              recipientPhones = (mappings || [])
                .map((m: any) => m.phone)
                .filter((phone: string | null) => phone !== null) as string[];
            }
          }
        } catch {
          recipientPhones = [];
        }
      }

      if (recipientPhones.length === 0) {
        return res.status(400).json({
          success: false,
          message: '수신자가 없습니다. 수신자를 선택해주세요.'
        });
      }

      try {
        // Solapi 서명 생성
        const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

        // 알림톡 발송 (각 수신자별로 개별 발송)
        const sendPromises = recipientPhones.map(async (phone: string) => {
          const response = await fetch(SOLAPI_API_URL, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              message: {
                to: phone,
                from: SOLAPI_SENDER,
                text: finalContent, // 알림톡은 템플릿 사용 시 text는 빈 문자열이지만, 일부 템플릿은 text도 필요
                type: 'ATA', // 알림톡 타입
                kakaoOptions: {
                  pfId: KAKAO_PLUS_FRIEND_ID || '마쓰구골프', // 플러스친구 ID
                  templateId: templateId,
                  // 변수 치환 (템플릿에 변수가 있는 경우)
                  variables: req.body.templateVariables || {}
                },
              },
            }),
          });

          const result = await response.json();
          return {
            phone,
            success: response.ok && result.statusCode === '2000',
            result
          };
        });

        const sendResults = await Promise.all(sendPromises);
        successCount = sendResults.filter((r: any) => r.success).length;
        failCount = sendResults.filter((r: any) => !r.success).length;

        // 실패한 발송의 오류 메시지 수집
        const failedResults = sendResults.filter((r: any) => !r.success);
        errorMessages = failedResults.map((r: any) => 
          r.result?.errorMessage || r.result?.message || '알림톡 발송 실패'
        );

        if (successCount > 0) {
          kakaoApiResult = {
            groupId: `alimtalk_${Date.now()}`,
            successCount,
            failCount
          };
          console.log(`✅ 알림톡 발송 성공: ${successCount}개, 실패: ${failCount}개`);
        } else {
          throw new Error(errorMessages[0] || '알림톡 발송 실패');
        }
      } catch (apiError: any) {
        console.error('❌ Solapi 알림톡 발송 오류:', apiError);
        failCount = recipientPhones.length;
        errorMessages.push(apiError.message || 'Solapi API 호출 실패');
      }
    }

    // 발송 결과 저장
    const now = new Date().toISOString();
    
    // channel_kakao 업데이트
    const updateData: any = {
      status: successCount > 0 ? 'sent' : 'failed',
      sent_at: now,
      sent_count: receiverUuids.length,
      success_count: successCount,
      fail_count: failCount,
      updated_at: now
    };

    if (kakaoApiResult?.group_id) {
      updateData.kakao_group_id = kakaoApiResult.group_id;
    }

    if (errorMessages.length > 0) {
      updateData.send_result = {
        errors: errorMessages,
        timestamp: now
      };
    }

    await supabase
      .from('channel_kakao')
      .update(updateData)
      .eq('id', channelPostId);

    // message_logs 기록
    const logsToInsert = receiverUuids.map((uuid: string, index: number) => ({
      content_id: String(channelPostId),
      customer_phone: uuid.match(/^[0-9-]+$/) ? uuid.replace(/[^0-9]/g, '') : null, // 전화번호인 경우만
      customer_id: null,
      message_type: finalMessageType.toLowerCase(),
      status: index < successCount ? 'sent' : 'failed',
      channel: 'kakao',
      sent_at: now,
      metadata: {
        receiver_uuid: uuid,
        kakao_group_id: kakaoApiResult?.group_id,
        error: index >= successCount ? errorMessages[0] : null
      }
    }));

    if (logsToInsert.length > 0) {
      await supabase
        .from('message_logs')
        .upsert(logsToInsert, { onConflict: 'content_id,customer_phone' });
    }

    return res.status(200).json({
      success: successCount > 0,
      message: successCount > 0 
        ? `카카오 메시지가 발송되었습니다. (성공: ${successCount}, 실패: ${failCount})`
        : `카카오 메시지 발송에 실패했습니다. (${errorMessages.join(', ')})`,
      result: {
        successCount,
        failCount,
        totalCount: receiverUuids.length,
        kakaoGroupId: kakaoApiResult?.group_id || null,
        errors: errorMessages.length > 0 ? errorMessages : undefined
      }
    });

  } catch (error: any) {
    console.error('❌ 카카오 메시지 발송 오류:', error);
    return res.status(500).json({
      success: false,
      message: '카카오 메시지 발송 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}


