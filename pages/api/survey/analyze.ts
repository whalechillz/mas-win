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
 * 설문 조사 데이터를 분석하여 고객 니즈와 전화 유도 포인트 추출
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { surveyIds } = req.body;

    if (!surveyIds || !Array.isArray(surveyIds) || surveyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '설문 ID 배열이 필요합니다.',
      });
    }

    // 설문 데이터 조회
    const { data: surveys, error } = await supabase
      .from('surveys')
      .select('*')
      .in('id', surveyIds);

    if (error) {
      console.error('설문 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '설문 데이터를 불러오는데 실패했습니다.',
        error: error.message,
      });
    }

    if (!surveys || surveys.length === 0) {
      return res.status(404).json({
        success: false,
        message: '설문 데이터를 찾을 수 없습니다.',
      });
    }

    // 개별 설문 분석
    const analyses = surveys.map((survey) => {
      const importantFactors = (survey.important_factors || []) as string[];
      const selectedModel = survey.selected_model || '';
      const ageGroup = survey.age_group || '';
      const additionalFeedback = survey.additional_feedback || '';

      // 고객이 원하는 점 분석
      const customerNeeds = {
        primaryFactors: importantFactors.map((f) => FACTOR_NAMES[f] || f),
        selectedModel: MODEL_NAMES[selectedModel] || selectedModel,
        ageGroup,
        additionalFeedback,
      };

      // 전화 유도 포인트 생성
      const callToActionPoints = generateCallToActionPoints(
        importantFactors,
        selectedModel,
        ageGroup,
        additionalFeedback
      );

      return {
        surveyId: survey.id,
        name: survey.name,
        phone: survey.phone,
        customerNeeds,
        callToActionPoints,
      };
    });

    // 전체 통계 분석
    const overallStats = {
      totalCount: surveys.length,
      factorDistribution: calculateFactorDistribution(surveys),
      modelDistribution: calculateModelDistribution(surveys),
      ageGroupDistribution: calculateAgeGroupDistribution(surveys),
    };

    return res.status(200).json({
      success: true,
      data: {
        analyses,
        overallStats,
      },
    });
  } catch (error: any) {
    console.error('설문 분석 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}

/**
 * 전화 유도 포인트 생성
 */
function generateCallToActionPoints(
  importantFactors: string[],
  selectedModel: string,
  ageGroup: string,
  additionalFeedback: string
): string[] {
  const points: string[] = [];

  // 중요 요소 기반 포인트
  if (importantFactors.includes('distance')) {
    points.push('비거리 개선 솔루션 제공 - 한 번의 시타로 25m 비거리 증가 체험 가능');
  }
  if (importantFactors.includes('direction')) {
    points.push('방향성 개선 맞춤 피팅 - 정확한 샷을 위한 전문 상담');
  }
  if (importantFactors.includes('feel')) {
    points.push('프리미엄 타구감 체험 - 가벼운 스윙으로도 강력한 임팩트');
  }

  // 모델 기반 포인트
  if (selectedModel.includes('beryl')) {
    points.push('풀티타늄 베릴 모델 특별 혜택 - 가벼운 무게로 더 빠른 스윙');
  }
  if (selectedModel.includes('sapphire')) {
    points.push('원플렉스 사파이어 모델 체험 - 최적의 플렉스로 비거리 극대화');
  }

  // 연령대 기반 포인트
  if (ageGroup.includes('60') || ageGroup.includes('70') || ageGroup.includes('80')) {
    points.push('시니어 골퍼 맞춤 솔루션 - 힘 빼고 휘둘러도 충분한 비거리');
  }

  // 추가 의견 기반 포인트
  if (additionalFeedback) {
    points.push(`고객님의 특별한 요구사항 반영 - "${additionalFeedback.substring(0, 30)}..."`);
  }

  // 기본 포인트 (항상 포함)
  if (points.length === 0) {
    points.push('무료 시타 체험 예약 - 직접 체험해보시고 결정하세요');
  }

  return points;
}

/**
 * 중요 요소 분포 계산
 */
function calculateFactorDistribution(surveys: any[]): Record<string, number> {
  const distribution: Record<string, number> = {
    distance: 0,
    direction: 0,
    feel: 0,
  };

  surveys.forEach((survey) => {
    const factors = (survey.important_factors || []) as string[];
    factors.forEach((factor) => {
      if (distribution[factor] !== undefined) {
        distribution[factor]++;
      }
    });
  });

  return distribution;
}

/**
 * 모델 분포 계산
 */
function calculateModelDistribution(surveys: any[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  surveys.forEach((survey) => {
    const model = survey.selected_model || '미선택';
    distribution[model] = (distribution[model] || 0) + 1;
  });

  return distribution;
}

/**
 * 연령대 분포 계산
 */
function calculateAgeGroupDistribution(surveys: any[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  surveys.forEach((survey) => {
    const ageGroup = survey.age_group || '미입력';
    distribution[ageGroup] = (distribution[ageGroup] || 0) + 1;
  });

  return distribution;
}



