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

// 조사 처리 함수 (받침 유무로 "을/를" 자동 선택)
function getParticle(word: string): string {
  if (!word || word.length === 0) return '를';
  const lastChar = word[word.length - 1];
  const lastCharCode = lastChar.charCodeAt(0);
  // 한글 유니코드 범위 확인
  if (lastCharCode < 0xAC00 || lastCharCode > 0xD7A3) return '를';
  // 받침 여부 확인 (28로 나눈 나머지가 0이면 받침 없음)
  const hasBatchim = (lastCharCode - 0xAC00) % 28 !== 0;
  return hasBatchim ? '을' : '를';
}

// 매장 정보 생성 함수 (거리 기반 개인화)
function generateStoreInfo(distanceKm: number | null): string {
  const baseInfo = `\n\n☎ 마쓰구 수원본점
수원시 영통구 법조로149번길 200 마스골프
TEL 031-215-0013
무료 080-028-8888 (무료 상담)
OPEN 09:00~17:00(월~금)`;

  // 거리 정보가 없거나 50km 이상인 경우
  if (distanceKm === null || distanceKm >= 50) {
    return `▶ 약도 안내: https://www.masgolf.co.kr/contact
▶ 온라인 구매: https://smartstore.naver.com/mas9golf${baseInfo}`;
  }
  
  // 50km 이내인 경우
  return `▶ 약도 안내: https://www.masgolf.co.kr/contact
▶ 시타 예약: https://www.masgolf.co.kr/try-a-massgoo
▶ 온라인 구매: https://smartstore.naver.com/mas9golf${baseInfo}`;
}

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

    // 거리 정보 조회 (prize_recommendations 테이블 우선, 없으면 customer_address_cache에서 조회)
    let distanceKm: number | null = null;
    try {
      // 1. prize_recommendations 테이블에서 조회 (최신 추천 데이터)
      const { data: prizeRecommendation } = await supabase
        .from('prize_recommendations')
        .select('distance_km')
        .eq('survey_id', surveyId)
        .order('recommendation_date', { ascending: false })
        .order('recommendation_datetime', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prizeRecommendation && prizeRecommendation.distance_km !== null) {
        distanceKm = prizeRecommendation.distance_km;
      } else {
        // 2. prize_recommendations에 없으면 customer_address_cache에서 조회
        // survey_id로 먼저 조회
        const { data: addressCache } = await supabase
          .from('customer_address_cache')
          .select('distance_km')
          .eq('survey_id', surveyId)
          .eq('geocoding_status', 'success')
          .not('distance_km', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (addressCache && addressCache.distance_km !== null) {
          distanceKm = addressCache.distance_km;
        } else {
          // survey_id로 못 찾았으면 customer_id로도 시도
          if (survey.customer_id) {
            const { data: customerCache } = await supabase
              .from('customer_address_cache')
              .select('distance_km')
              .eq('customer_id', survey.customer_id)
              .eq('geocoding_status', 'success')
              .not('distance_km', 'is', null)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (customerCache && customerCache.distance_km !== null) {
              distanceKm = customerCache.distance_km;
            }
          }
        }
      }
    } catch (distanceError) {
      console.error('거리 정보 조회 오류:', distanceError);
      // 거리 정보 조회 실패해도 계속 진행
    }

    // 맞춤형 메시지 생성
    const message = generateCustomMessage(survey, messageType, distanceKm);

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
function generateCustomMessage(survey: any, messageType: string, distanceKm: number | null = null): string {
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

  // 연령대 기반 CTA (연령대별 표기)
  if (ageGroup) {
    const ageMatch = ageGroup.match(/(\d+)대/);
    if (ageMatch) {
      const ageDecade = ageMatch[1];
      ctaPoints.push(`${ageDecade}대 골퍼 맞춤 솔루션 - 힘 빼고 휘둘러도 충분한 비거리`);
    } else if (ageGroup.includes('60') || ageGroup.includes('70') || ageGroup.includes('80')) {
      // 연령대 형식이 다를 경우 대체 로직
      if (ageGroup.includes('60')) {
        ctaPoints.push('60대 골퍼 맞춤 솔루션 - 힘 빼고 휘둘러도 충분한 비거리');
      } else if (ageGroup.includes('70')) {
        ctaPoints.push('70대 골퍼 맞춤 솔루션 - 힘 빼고 휘둘러도 충분한 비거리');
      } else if (ageGroup.includes('80')) {
        ctaPoints.push('80대 골퍼 맞춤 솔루션 - 힘 빼고 휘둘러도 충분한 비거리');
      }
    }
  }

  // 추가 의견 기반 CTA (analyze.ts와 동일하게)
  if (additionalFeedback && additionalFeedback.trim()) {
    const feedbackPreview = additionalFeedback.length > 30 
      ? `${additionalFeedback.substring(0, 30)}...` 
      : additionalFeedback;
    ctaPoints.push(`고객님의 특별한 요구사항 반영 - "${feedbackPreview}"`);
  }

  // 메시지 생성
  let message = `[마쓰구골프] ${name}님, 안녕하세요!\n\n`;

  // 고객이 원하는 점 언급 (조사 처리 개선)
  if (needs.length > 0) {
    const needsText = needs.join(', ');
    const particle = getParticle(needsText);
    message += `설문 조사에서 ${needsText}${particle} 중요하게 생각하신다고 답변해주셨네요.\n\n`;
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

  // 매장 정보 추가 (거리 기반 개인화)
  message += generateStoreInfo(distanceKm);

  // SMS 길이 제한 (MMS는 제한 없음, 2000자까지 가능)
  if (messageType === 'sms') {
    const maxLength = 90 * 3; // 약 270자
    if (message.length > maxLength) {
      message = message.substring(0, maxLength - 10) + '...\n\n☎ 031-215-0013';
    }
  }
  // MMS는 길이 제한 없음 (2000자까지 가능하므로 STORE_INFO 전체 포함 가능)

  return message;
}



