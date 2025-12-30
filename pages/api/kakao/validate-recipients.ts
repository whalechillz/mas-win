import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 카카오 메시지 수신자 검증 (중복 수신 방지)
 * 
 * POST /api/kakao/validate-recipients
 * Body: { phoneNumbers: string[], smsMessageIds?: number[] }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { phoneNumbers, smsMessageIds = [] } = req.body;

    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: '전화번호 배열이 필요합니다.',
      });
    }

    // 전화번호 정규화
    const normalizedPhones = phoneNumbers.map(phone => 
      String(phone).replace(/[^0-9]/g, '')
    ).filter(phone => phone.length >= 10);

    if (normalizedPhones.length === 0) {
      return res.status(400).json({
        success: false,
        message: '유효한 전화번호가 없습니다.',
      });
    }

    // 1. SMS 수신자 확인
    const smsRecipients = new Set<string>();
    if (smsMessageIds.length > 0) {
      const { data: messageLogs } = await supabase
        .from('message_logs')
        .select('customer_phone')
        .in('content_id', smsMessageIds.map(id => String(id)));

      if (messageLogs) {
        messageLogs.forEach(log => {
          if (log.customer_phone) {
            const normalized = log.customer_phone.replace(/[^0-9]/g, '');
            smsRecipients.add(normalized);
          }
        });
      }

      // channel_sms의 recipient_numbers에서도 확인
      const { data: channelSms } = await supabase
        .from('channel_sms')
        .select('recipient_numbers')
        .in('id', smsMessageIds);

      if (channelSms) {
        channelSms.forEach(sms => {
          if (Array.isArray(sms.recipient_numbers)) {
            sms.recipient_numbers.forEach((phone: string) => {
              const normalized = phone.replace(/[^0-9]/g, '');
              smsRecipients.add(normalized);
            });
          }
        });
      }
    }

    // 2. 설문 참여자 확인
    const { data: surveys } = await supabase
      .from('surveys')
      .select('phone');

    const surveyParticipants = new Set<string>();
    if (surveys) {
      surveys.forEach(survey => {
        if (survey.phone) {
          const normalized = survey.phone.replace(/[^0-9]/g, '');
          surveyParticipants.add(normalized);
        }
      });
    }

    // 3. 수신거부 고객 확인
    const { data: optedOut } = await supabase
      .from('customers')
      .select('phone')
      .in('phone', normalizedPhones)
      .eq('opt_out', true);

    const optedOutPhones = new Set<string>();
    if (optedOut) {
      optedOut.forEach(customer => {
        if (customer.phone) {
          const normalized = customer.phone.replace(/[^0-9]/g, '');
          optedOutPhones.add(normalized);
        }
      });
    }

    // 4. 검증 결과 생성
    const validationResults = normalizedPhones.map(phone => {
      const isSmsRecipient = smsRecipients.has(phone);
      const isSurveyParticipant = surveyParticipants.has(phone);
      const isOptedOut = optedOutPhones.has(phone);
      
      const isValid = !isOptedOut;
      const warnings: string[] = [];
      
      if (isSmsRecipient) {
        warnings.push('SMS 수신자 (중복 수신 가능)');
      }
      if (isSurveyParticipant) {
        warnings.push('설문 참여자');
      }
      if (isOptedOut) {
        warnings.push('수신거부 고객');
      }

      return {
        phone,
        isValid,
        warnings,
        isSmsRecipient,
        isSurveyParticipant,
        isOptedOut,
      };
    });

    const validRecipients = validationResults.filter(r => r.isValid);
    const invalidRecipients = validationResults.filter(r => !r.isValid);
    const warningRecipients = validationResults.filter(r => r.warnings.length > 0 && r.isValid);

    return res.status(200).json({
      success: true,
      data: {
        total: normalizedPhones.length,
        valid: validRecipients.length,
        invalid: invalidRecipients.length,
        warnings: warningRecipients.length,
        results: validationResults,
        summary: {
          validRecipients: validRecipients.map(r => r.phone),
          invalidRecipients: invalidRecipients.map(r => r.phone),
          warningRecipients: warningRecipients.map(r => ({
            phone: r.phone,
            warnings: r.warnings,
          })),
        },
      },
    });
  } catch (error: any) {
    console.error('수신자 검증 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}

