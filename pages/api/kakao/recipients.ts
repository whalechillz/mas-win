import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 카카오 친구 목록 조회 및 중복 수신 방지
 * 
 * GET /api/kakao/recipients?excludeSmsRecipients=true&excludeSurveyParticipants=true&smsMessageIds=232,273,227,231
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      excludeSmsRecipients = 'true',
      excludeSurveyParticipants = 'true',
      smsMessageIds = '', // 콤마로 구분된 메시지 ID 목록 (예: "232,273,227,231")
    } = req.query as Record<string, string>;

    // 1. SMS 수신 고객 목록 조회 (메시지 ID 기반)
    let smsRecipients = new Set<string>();
    if (excludeSmsRecipients === 'true' && smsMessageIds) {
      const messageIdArray = smsMessageIds
        .split(',')
        .map(id => id.trim())
        .filter(id => id && !isNaN(Number(id)))
        .map(id => Number(id));

      if (messageIdArray.length > 0) {
        // message_logs에서 해당 메시지 ID들의 수신자 조회
        const { data: messageLogs, error: logsError } = await supabase
          .from('message_logs')
          .select('customer_phone')
          .in('content_id', messageIdArray.map(id => String(id)));

        if (logsError) {
          console.error('SMS 수신자 조회 오류:', logsError);
        } else if (messageLogs) {
          messageLogs.forEach(log => {
            if (log.customer_phone) {
              // 전화번호 정규화 (하이픈 제거)
              const normalized = log.customer_phone.replace(/[^0-9]/g, '');
              if (normalized.length >= 10) {
                smsRecipients.add(normalized);
              }
            }
          });
        }

        // channel_sms의 recipient_numbers에서도 조회 (백업)
        const { data: channelSms, error: smsError } = await supabase
          .from('channel_sms')
          .select('recipient_numbers')
          .in('id', messageIdArray);

        if (!smsError && channelSms) {
          channelSms.forEach(sms => {
            if (Array.isArray(sms.recipient_numbers)) {
              sms.recipient_numbers.forEach((phone: string) => {
                const normalized = phone.replace(/[^0-9]/g, '');
                if (normalized.length >= 10) {
                  smsRecipients.add(normalized);
                }
              });
            }
          });
        }
      }
    }

    // 2. 설문 참여 고객 목록 조회
    let surveyParticipants = new Set<string>();
    if (excludeSurveyParticipants === 'true') {
      const { data: surveys, error: surveyError } = await supabase
        .from('surveys')
        .select('phone');

      if (surveyError) {
        console.error('설문 참여자 조회 오류:', surveyError);
      } else if (surveys) {
        surveys.forEach(survey => {
          if (survey.phone) {
            const normalized = survey.phone.replace(/[^0-9]/g, '');
            if (normalized.length >= 10) {
              surveyParticipants.add(normalized);
            }
          }
        });
      }
    }

    // 3. 카카오 친구 목록 조회 (실제로는 카카오 API를 통해 조회해야 함)
    // 현재는 customers 테이블에서 카카오 친구 여부를 확인할 수 있는 필드가 있다고 가정
    // 실제 구현 시 카카오 비즈니스 API를 통해 친구 목록을 가져와야 함
    
    // 임시: customers 테이블에서 수신거부가 아닌 고객 중
    // SMS 수신자와 설문 참여자를 제외한 목록
    const { data: allCustomers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, phone, opt_out')
      .eq('opt_out', false)
      .not('phone', 'is', null);

    if (customersError) {
      console.error('고객 조회 오류:', customersError);
      return res.status(500).json({
        success: false,
        message: '고객 목록을 불러올 수 없습니다.',
        error: customersError.message,
      });
    }

    // 4. 필터링: SMS 수신자와 설문 참여자 제외
    const eligibleRecipients = (allCustomers || []).filter(customer => {
      if (!customer.phone) return false;
      
      const normalized = customer.phone.replace(/[^0-9]/g, '');
      if (normalized.length < 10) return false;

      // SMS 수신자 제외
      if (excludeSmsRecipients === 'true' && smsRecipients.has(normalized)) {
        return false;
      }

      // 설문 참여자 제외
      if (excludeSurveyParticipants === 'true' && surveyParticipants.has(normalized)) {
        return false;
      }

      return true;
    });

    // 5. 통계 정보
    const stats = {
      totalCustomers: allCustomers?.length || 0,
      smsRecipients: smsRecipients.size,
      surveyParticipants: surveyParticipants.size,
      eligibleRecipients: eligibleRecipients.length,
      excludedCount: (allCustomers?.length || 0) - eligibleRecipients.length,
    };

    return res.status(200).json({
      success: true,
      data: {
        recipients: eligibleRecipients.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
        })),
        stats,
        filters: {
          excludeSmsRecipients: excludeSmsRecipients === 'true',
          excludeSurveyParticipants: excludeSurveyParticipants === 'true',
          smsMessageIds: smsMessageIds ? smsMessageIds.split(',').map(id => Number(id.trim())) : [],
        },
      },
    });
  } catch (error: any) {
    console.error('카카오 수신자 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}

