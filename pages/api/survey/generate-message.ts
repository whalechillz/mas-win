import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// 모델명 매핑
const MODEL_NAMES: Record<string, string> = {
  'beryl-47g': '풀티타늄 베릴 47g',
  'beryl-42g': '풀티타늄 베릴 42g',
  'sapphire-53g': '원플렉스 사파이어 53g',
  'sapphire-44g': '원플렉스 사파이어 44g',
};

// 중요 요소 한글명 매핑
const FACTOR_NAMES: Record<string, string> = {
  distance: '비거리',
  direction: '방향성',
  feel: '타구감',
};

/**
 * 설문 조사 데이터를 기반으로 맞춤형 메시지 생성
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { surveyId, messageType = 'sms' } = req.body;

    if (!surveyId) {
      return res.status(400).json({
        success: false,
        message: '설문 ID가 필요합니다.',
      });
    }

    // 설문 데이터 조회
    const { data: survey, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single();

    if (error || !survey) {
      console.error('설문 조회 오류:', error);
      return res.status(404).json({
        success: false,
        message: '설문 데이터를 찾을 수 없습니다.',
      });
    }

    // 맞춤형 메시지 생성
    const message = generateCustomMessage(survey, messageType);

    return res.status(200).json({
      success: true,
      data: {
        surveyId: survey.id,
        name: survey.name,
        phone: survey.phone,
        message,
        customerNeeds: {
          primaryFactors: (survey.important_factors || []).map(
            (f: string) => FACTOR_NAMES[f] || f
          ),
          selectedModel: MODEL_NAMES[survey.selected_model] || survey.selected_model,
          ageGroup: survey.age_group || '',
        },
      },
    });
  } catch (error: any) {
    console.error('메시지 생성 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}

/**
 * 맞춤형 메시지 생성
 */
function generateCustomMessage(survey: any, messageType: string): string {
  const name = survey.name || '고객';
  const importantFactors = (survey.important_factors || []) as string[];
  const selectedModel = MODEL_NAMES[survey.selected_model] || survey.selected_model || '';
  const ageGroup = survey.age_group || '';
  const additionalFeedback = survey.additional_feedback || '';

  // 고객이 원하는 점 파악
  const needs: string[] = [];
  if (importantFactors.includes('distance')) {
    needs.push('비거리 개선');
  }
  if (importantFactors.includes('direction')) {
    needs.push('방향성 개선');
  }
  if (importantFactors.includes('feel')) {
    needs.push('타구감 개선');
  }

  // 전화 유도 포인트 생성
  const ctaPoints: string[] = [];

  // 중요 요소 기반 CTA
  if (importantFactors.includes('distance')) {
    ctaPoints.push('한 번의 시타로 25m 비거리 증가를 직접 체험');
  }
  if (importantFactors.includes('direction')) {
    ctaPoints.push('정확한 샷을 위한 맞춤 피팅 상담');
  }
  if (importantFactors.includes('feel')) {
    ctaPoints.push('프리미엄 타구감 체험');
  }

  // 모델 기반 CTA
  if (selectedModel.includes('베릴')) {
    ctaPoints.push('가벼운 무게로 더 빠른 스윙 체험');
  }
  if (selectedModel.includes('사파이어')) {
    ctaPoints.push('최적의 플렉스로 비거리 극대화');
  }

  // 연령대 기반 CTA
  if (ageGroup.includes('60') || ageGroup.includes('70') || ageGroup.includes('80')) {
    ctaPoints.push('시니어 골퍼 맞춤 솔루션 - 힘 빼고 휘둘러도 충분한 비거리');
  }

  // 메시지 생성
  let message = `[마쓰구골프] ${name}님, 안녕하세요!\n\n`;

  // 고객이 원하는 점 언급
  if (needs.length > 0) {
    message += `설문 조사에서 ${needs.join(', ')}을(를) 중요하게 생각하신다고 답변해주셨네요.\n\n`;
  }

  // 선택한 모델 언급
  if (selectedModel) {
    message += `${selectedModel}에 관심을 보여주셔서 감사합니다.\n\n`;
  }

  // 전화 유도 포인트
  if (ctaPoints.length > 0) {
    message += `고객님을 위해 특별히 준비한 솔루션:\n`;
    ctaPoints.forEach((point, index) => {
      message += `• ${point}\n`;
    });
    message += `\n`;
  }

  // 기본 CTA
  message += `무료 시타 체험으로 직접 확인해보세요!\n`;
  message += `전문 상담을 통해 최적의 솔루션을 제안해드리겠습니다.\n\n`;

  // 전화 유도
  message += `📞 지금 바로 전화주세요!\n`;
  message += `☎ 031-215-0013\n\n`;

  // 추가 정보
  message += `📍 장소: 마쓰구골프 수원 본점\n`;
  message += `🌐 자세한 정보: https://www.masgolf.co.kr/\n`;

  // 추가 의견이 있으면 언급
  if (additionalFeedback) {
    message += `\n※ 고객님의 추가 의견도 반영하여 맞춤 상담을 준비하겠습니다.`;
  }

  // SMS 길이 제한 (90바이트 기준, 한글은 3바이트)
  if (messageType === 'sms') {
    const maxLength = 90 * 3; // 약 270자
    if (message.length > maxLength) {
      message = message.substring(0, maxLength - 10) + '...\n\n☎ 031-215-0013';
    }
  }

  return message;
}



