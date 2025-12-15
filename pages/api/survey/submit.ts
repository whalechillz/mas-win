import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { sendSlackNotification } from '@/lib/slack-notification';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// 전화번호 정규화 함수
function normalizePhoneNumber(phone: string): string {
  // 하이픈, 공백 제거
  let cleaned = phone.replace(/[-\s]/g, '');
  
  // 82로 시작하면 0으로 변경
  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  // 01로 시작하지 않으면 010으로 시작하도록 변경
  if (!cleaned.startsWith('01')) {
    cleaned = '010' + cleaned;
  }
  
  return cleaned;
}

// 전화번호 포맷팅 함수
function formatPhoneNumber(phone: string): string {
  const cleaned = normalizePhoneNumber(phone);
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  return cleaned;
}

// 나이를 연령대 그룹으로 변환
function convertAgeToAgeGroup(age: number | string): string {
  const ageNum = typeof age === 'string' ? parseInt(age) : age;
  if (isNaN(ageNum)) return '';
  if (ageNum < 20) return '10대';
  if (ageNum < 30) return '20대';
  if (ageNum < 40) return '30대';
  if (ageNum < 50) return '40대';
  if (ageNum < 60) return '50대';
  if (ageNum < 70) return '60대';
  if (ageNum < 80) return '70대';
  return '80대 이상';
}

// 고객 동기화 함수
async function syncCustomerToSurvey(surveyData: {
  name: string;
  phone: string;
  age: number | null;
  age_group: string;
  address: string;
}): Promise<number | null> {
  const normalizedPhone = normalizePhoneNumber(surveyData.phone);
  const formattedPhone = formatPhoneNumber(normalizedPhone);
  
  // 기존 고객 조회
  const { data: existingCustomer, error: findError } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', formattedPhone)
    .single();
  
  if (findError && findError.code !== 'PGRST116') { // PGRST116 = not found
    console.error('고객 조회 오류:', findError);
    return null;
  }
  
  const now = new Date().toISOString();
  
  if (existingCustomer) {
    // 기존 고객 정보 업데이트
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: surveyData.name,
        age: surveyData.age,
        age_group: surveyData.age_group,
        address: surveyData.address || null,
        last_contact_date: now,
        updated_at: now,
      })
      .eq('id', existingCustomer.id);
    
    if (updateError) {
      console.error('고객 업데이트 오류:', updateError);
      return null;
    }
    
    return existingCustomer.id;
  } else {
    // 신규 고객 생성
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert({
        name: surveyData.name,
        phone: formattedPhone,
        age: surveyData.age,
        age_group: surveyData.age_group,
        address: surveyData.address || null,
        first_inquiry_date: now,
        last_contact_date: now,
        opt_out: false,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();
    
    if (createError) {
      console.error('고객 생성 오류:', createError);
      return null;
    }
    
    return newCustomer.id;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      name,
      phone,
      age,
      selected_model,
      important_factors,
      additional_feedback,
      address,
    } = req.body;

    // 필수 필드 검증
    if (!name || !phone || !selected_model || !address) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다. (이름, 전화번호, 모델 선택, 주소)',
      });
    }

    // 전화번호 정규화 및 검증
    const normalizedPhone = normalizePhoneNumber(phone);
    if (normalizedPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: '올바른 전화번호를 입력해주세요.',
      });
    }

    // 연령대 계산
    const ageNum = age ? parseInt(String(age)) : null;
    const ageGroup = ageNum ? convertAgeToAgeGroup(ageNum) : '';

    // 고객 동기화
    const customerId = await syncCustomerToSurvey({
      name,
      phone: normalizedPhone,
      age: ageNum,
      age_group: ageGroup,
      address,
    });

    // 설문 데이터 저장
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .insert({
        name,
        phone: formatPhoneNumber(normalizedPhone),
        age: ageNum,
        age_group: ageGroup,
        address,
        selected_model: selected_model,
        important_factors: Array.isArray(important_factors) ? important_factors : [],
        additional_feedback: additional_feedback || null,
        customer_id: customerId,
        campaign_source: 'muziik-survey-2025',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (surveyError) {
      console.error('설문 저장 오류:', surveyError);
      return res.status(500).json({
        success: false,
        message: '설문 저장에 실패했습니다.',
        error: surveyError.message,
      });
    }

    // 슬랙 알림 (실패해도 설문 저장은 유지)
    try {
      const formattedDate = new Date(survey.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
      const factorMap: Record<string, string> = {
        distance: '비거리',
        direction: '방향성',
        feel: '타구감',
      };
      const factorNames = (survey.important_factors || []).map((f: string) => factorMap[f] || f);

      const blocks = [
        {
          type: 'header',
          text: { type: 'plain_text', text: '📝 신규 설문 접수', emoji: true },
        },
        { type: 'divider' },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*이름*\n${survey.name}` },
            { type: 'mrkdwn', text: `*연락처*\n${survey.phone}` },
            { type: 'mrkdwn', text: `*연령대*\n${survey.age_group || '미입력'}` },
            { type: 'mrkdwn', text: `*선택 모델*\n${survey.selected_model}` },
            { type: 'mrkdwn', text: `*중요 요소*\n${factorNames.join(', ') || '미입력'}` },
            { type: 'mrkdwn', text: `*제출시각*\n${formattedDate}` },
          ],
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*주소*\n${survey.address || '미입력'}` },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*추가 의견*\n${survey.additional_feedback || '없음'}` },
        },
      ];

      await sendSlackNotification({
        username: '설문 알림봇',
        icon_emoji: ':clipboard:',
        text: `신규 설문: ${survey.name}`,
        blocks,
      });
    } catch (slackError) {
      console.error('슬랙 알림 오류 (무시):', slackError);
    }

    return res.status(200).json({
      success: true,
      data: survey,
      message: '설문이 성공적으로 제출되었습니다.',
    });
  } catch (error: any) {
    console.error('설문 제출 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}


