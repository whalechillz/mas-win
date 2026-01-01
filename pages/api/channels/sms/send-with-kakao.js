import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../../../utils/solapiSignature.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";
const SOLAPI_SENDER = process.env.SOLAPI_SENDER || "";
const KAKAO_ADMIN_KEY = process.env.KAKAO_ADMIN_KEY;
const KAKAO_PLUS_FRIEND_ID = process.env.KAKAO_PLUS_FRIEND_ID || '마쓰구골프';
const SOLAPI_API_URL = 'https://api.solapi.com/messages/v4/send';

/**
 * SMS 발송 시 카카오톡 대행 발송 API
 * 친구 추가된 번호는 카카오톡으로, 그 외는 SMS로 발송
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      channelPostId,
      messageType, // SMS/LMS/MMS
      messageText,
      content,
      imageUrl,
      recipientNumbers,
      shortLink,
      honorific = '고객님',
      // 카카오톡 발송 옵션
      kakaoSendEnabled = false,
      kakaoMessageType = 'FRIENDTALK', // 'FRIENDTALK' | 'ALIMTALK'
      kakaoFallbackToSms = true,
      kakaoRecipientGroupId = null,
      kakaoTemplateId = null
    } = req.body;

    if (!channelPostId || !recipientNumbers?.length) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다.'
      });
    }

    const messageContent = messageText || content || '';
    const normalizedPhones = recipientNumbers.map((phone) => 
      phone.replace(/[^0-9]/g, '')
    ).filter((phone) => phone.length >= 10);

    if (normalizedPhones.length === 0) {
      return res.status(400).json({
        success: false,
        message: '유효한 수신자가 없습니다.'
      });
    }

    // 수신거부 고객 제외
    const { data: optedOut } = await supabase
      .from('customers')
      .select('phone')
      .in('phone', normalizedPhones)
      .eq('opt_out', true);

    const optedOutPhones = new Set((optedOut || []).map((c) => c.phone?.replace(/[^0-9]/g, '')));
    const validPhones = normalizedPhones.filter((phone) => !optedOutPhones.has(phone));

    if (validPhones.length === 0) {
      return res.status(400).json({
        success: false,
        message: '수신거부 제외 후 발송 가능한 수신자가 없습니다.'
      });
    }

    let kakaoRecipients = [];
    let kakaoRecipientPhones = []; // UUID 변환용 전화번호
    let smsRecipients = [];

    if (kakaoSendEnabled) {
      // 수신자 그룹 사용
      if (kakaoRecipientGroupId) {
        const { data: group } = await supabase
          .from('kakao_recipient_groups')
          .select('recipient_uuids')
          .eq('id', kakaoRecipientGroupId)
          .single();

        if (group && group.recipient_uuids) {
          const uuids = typeof group.recipient_uuids === 'string' 
            ? JSON.parse(group.recipient_uuids)
            : group.recipient_uuids;
          kakaoRecipients = Array.isArray(uuids) ? uuids : [];
        }
      } else {
        // 전화번호를 UUID로 변환
        const { data: mappings } = await supabase
          .from('kakao_friend_mappings')
          .select('uuid, phone')
          .in('phone', validPhones);

        const phoneToUuidMap = new Map(
          (mappings || []).map((m) => [m.phone?.replace(/[^0-9]/g, ''), m.uuid])
        );

        // 친구인 번호와 친구가 아닌 번호 분리
        validPhones.forEach((phone) => {
          const normalizedPhone = phone.replace(/[^0-9]/g, '');
          const uuid = phoneToUuidMap.get(normalizedPhone);
          if (uuid) {
            kakaoRecipients.push(uuid);
            kakaoRecipientPhones.push(phone); // 원본 전화번호 저장
          } else {
            smsRecipients.push(phone);
          }
        });
      }

      // 친구가 아닌 번호 처리
      if (!kakaoFallbackToSms) {
        // 발송 건너뛰기
        smsRecipients = [];
      }
    } else {
      // 카카오톡 발송 비활성화 시 모든 번호를 SMS로
      smsRecipients = validPhones;
    }

    const results = {
      kakao: { success: 0, fail: 0, total: 0 },
      sms: { success: 0, fail: 0, total: 0 }
    };

    // 카카오톡 발송
    if (kakaoSendEnabled && kakaoRecipients.length > 0) {
      try {
        // 카카오 메시지 저장
        const { data: kakaoMessage } = await supabase
          .from('channel_kakao')
          .insert({
            title: null,
            content: messageContent,
            message_text: messageContent,
            message_type: kakaoMessageType,
            template_type: 'BASIC_TEXT',
            template_id: kakaoTemplateId || null,
            button_text: null,
            button_link: shortLink || null,
            image_url: imageUrl || null,
            recipient_uuids: JSON.stringify(kakaoRecipients),
            status: 'draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (kakaoMessage) {
          // 카카오 발송 API 호출 (내부 API 호출)
          const baseUrl = req.headers.origin || 'http://localhost:3000';
          const kakaoSendResponse = await fetch(`${baseUrl}/api/channels/kakao/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channelPostId: kakaoMessage.id,
              content: messageContent,
              messageType: kakaoMessageType,
              templateType: 'BASIC_TEXT',
              templateId: kakaoTemplateId,
              imageUrl: imageUrl || null,
              buttonLink: shortLink || null,
              selectedRecipients: kakaoRecipients.length > 0 && typeof kakaoRecipients[0] === 'string' && !kakaoRecipients[0].match(/^[0-9-]+$/)
                ? kakaoRecipients // UUID인 경우
                : kakaoRecipientPhones.length > 0 
                  ? kakaoRecipientPhones 
                  : validPhones // 전화번호인 경우
            })
          });

          const kakaoResult = await kakaoSendResponse.json();
          if (kakaoResult.success) {
            results.kakao.success = kakaoResult.result?.successCount || kakaoRecipients.length;
            results.kakao.fail = kakaoResult.result?.failCount || 0;
            results.kakao.total = kakaoRecipients.length;
          } else {
            results.kakao.fail = kakaoRecipients.length;
            results.kakao.total = kakaoRecipients.length;
          }
        }
      } catch (kakaoError) {
        console.error('카카오톡 발송 오류:', kakaoError);
        results.kakao.fail = kakaoRecipients.length;
        results.kakao.total = kakaoRecipients.length;
      }
    }

    // SMS 발송 (친구가 아닌 번호 또는 카카오톡 비활성화)
    if (smsRecipients.length > 0) {
      // 기존 SMS 발송 API 호출
      const smsSendResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/channels/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelPostId,
          messageType,
          messageText: messageContent,
          content: messageContent,
          imageUrl: imageUrl || null,
          shortLink: shortLink || null,
          recipientNumbers: smsRecipients,
          honorific
        })
      });

      const smsResult = await smsSendResponse.json();
      if (smsResult.success) {
        results.sms.success = smsResult.result?.successCount || smsRecipients.length;
        results.sms.fail = smsResult.result?.failCount || 0;
        results.sms.total = smsRecipients.length;
      } else {
        results.sms.fail = smsRecipients.length;
        results.sms.total = smsRecipients.length;
      }
    }

    const totalSuccess = results.kakao.success + results.sms.success;
    const totalFail = results.kakao.fail + results.sms.fail;
    const totalSent = results.kakao.total + results.sms.total;

    return res.status(200).json({
      success: totalSuccess > 0,
      message: `발송 완료: 카카오톡 ${results.kakao.success}건, SMS ${results.sms.success}건`,
      result: {
        kakao: results.kakao,
        sms: results.sms,
        totalSuccess,
        totalFail,
        totalSent
      }
    });

  } catch (error) {
    console.error('카카오톡 대행 발송 오류:', error);
    return res.status(500).json({
      success: false,
      message: '발송 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

