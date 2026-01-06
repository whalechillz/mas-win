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

// 주소 정규화 함수: 주소 미제공 고객을 표준 플레이스홀더로 변환
function normalizeAddress(address: string | null | undefined): string | null {
  if (!address || !address.trim()) {
    return null;
  }
  
  const trimmed = address.trim();
  
  // 이미 표준 플레이스홀더인 경우 그대로 사용
  const placeholders = ['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'];
  if (placeholders.includes(trimmed)) {
    return trimmed;
  }
  
  // "직접방문", "직접 방문" 등 다양한 표현을 표준화
  const lowerTrimmed = trimmed.toLowerCase();
  if ((lowerTrimmed.includes('직접') && lowerTrimmed.includes('방문')) ||
      lowerTrimmed === '직접방문' ||
      lowerTrimmed === '직접 방문') {
    return '[직접방문]';
  }
  
  return trimmed;
}

// 주소가 지오코딩 가능한지 확인 (플레이스홀더 제외)
function isGeocodableAddress(address: string | null | undefined): boolean {
  if (!address || !address.trim()) return false;
  
  const normalized = normalizeAddress(address);
  if (!normalized) return false;
  
  // 플레이스홀더는 지오코딩 불가
  const placeholders = ['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'];
  return !placeholders.includes(normalized);
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
  
  // 기존 고객 조회 (정규화된 전화번호로 비교)
  // 마이그레이션 후에는 직접 조회 가능하지만, 마이그레이션 전 데이터도 고려하여 정규화 비교
  const { data: allCustomers } = await supabase
    .from('customers')
    .select('id, phone')
    .limit(1000);
  
  const existingCustomer = allCustomers?.find((c) => {
    if (!c.phone) return false;
    const customerPhoneNormalized = normalizePhoneNumber(c.phone);
    return customerPhoneNormalized === normalizedPhone;
  });
  
  const now = new Date().toISOString();
  
  if (existingCustomer) {
    // 기존 고객 정보 업데이트
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: surveyData.name,
        phone: normalizedPhone, // 정규화된 형식으로 저장
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
        phone: normalizedPhone, // 정규화된 형식으로 저장
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
    if (!name || !phone || !selected_model) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다. (이름, 전화번호, 모델 선택)',
      });
    }

    // 주소 정규화 (주소가 없으면 null, 있으면 정규화)
    const normalizedAddress = normalizeAddress(address);

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
      address: normalizedAddress || '',
    });

    // 설문 데이터 저장
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .insert({
        name,
        phone: normalizedPhone, // 정규화된 형식으로 저장 (포맷팅하지 않음)
        age: ageNum,
        age_group: ageGroup,
        address: normalizedAddress, // 정규화된 주소 저장
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

    // 고객 정보 업데이트: 최신 설문 정보 반영
    if (customerId && survey) {
      try {
        // 기존 설문 수 조회
        const { count: surveyCount } = await supabase
          .from('surveys')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customerId);

        // 고객 테이블 업데이트
        await supabase
          .from('customers')
          .update({
            latest_survey_date: survey.created_at,
            latest_selected_model: survey.selected_model,
            latest_important_factors: survey.important_factors || [],
            latest_additional_feedback: survey.additional_feedback || null,
            survey_count: surveyCount || 0,
            last_contact_date: survey.created_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', customerId);

        // 상담 이력 자동 생성
        try {
          await supabase.from('customer_consultations').insert({
            customer_id: customerId,
            consultation_type: 'survey',
            consultation_date: survey.created_at,
            consultant_name: '시스템',
            topic: '설문 참여',
            content: `설문 참여: ${survey.selected_model} 선택${survey.important_factors?.length ? `, 중요 요소: ${survey.important_factors.join(', ')}` : ''}${survey.additional_feedback ? `, 피드백: ${survey.additional_feedback.substring(0, 100)}` : ''}`,
            related_survey_id: survey.id,
            tags: ['설문', survey.selected_model, ...(survey.important_factors || [])],
            follow_up_required: false,
          });
        } catch (consultationError) {
          // 상담 이력 생성 실패해도 설문 저장은 유지
          console.error('상담 이력 생성 오류 (무시):', consultationError);
        }
      } catch (updateError) {
        // 고객 정보 업데이트 실패해도 설문 저장은 유지
        console.error('고객 정보 업데이트 오류 (무시):', updateError);
      }
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


