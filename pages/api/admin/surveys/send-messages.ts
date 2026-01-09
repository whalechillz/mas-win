import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// 거리 기준 (내부적으로만 사용, 메시지에는 표현하지 않음)
const DISTANCE_THRESHOLD_WINNER = 50; // 당첨 메시지: 50km
const DISTANCE_THRESHOLD_THANK_YOU = 100; // 감사 메시지: 100km

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
 * 개인화된 감사 메시지 생성 (기존 맞춤형 메시지 로직 활용)
 */
function generateThankYouMessage(
  name: string,
  isPurchased: boolean,
  distanceKm: number | null,
  survey: any
): string {
  const importantFactors = (survey?.important_factors || []) as string[];
  const selectedModel = MODEL_NAMES[survey?.selected_model] || survey?.selected_model || '';
  const ageGroup = survey?.age_group || '';

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

  // 고객님의 특별한 요구사항 반영 (솔루션 리스트에 포함)
  const additionalFeedback = survey?.additional_feedback || '';
  if (additionalFeedback && additionalFeedback.trim()) {
    const feedbackPreview = additionalFeedback.length > 30 
      ? `${additionalFeedback.substring(0, 30)}...` 
      : additionalFeedback;
    ctaPoints.push(`고객님의 특별한 요구사항 반영 - "${feedbackPreview}"`);
  }

  // 메시지 생성
  let message = `[마쓰구골프] ${name}님, 안녕하세요!\n\n`;
  // ⭐ 수정: "설문 참여해 주셔서 감사합니다." 제거

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

  // 구매고객 + 원거리 (100km 이상) 특별 혜택
  if (isPurchased && distanceKm !== null && distanceKm >= DISTANCE_THRESHOLD_THANK_YOU) {
    message += `멀리서 찾아주신 구매 고객님께는\n`;
    message += `110만원 상당의 특별한 리샤프팅 혜택을 드립니다.\n\n`;
  }

  // 전화 유도 포인트
  if (ctaPoints.length > 0) {
    message += `고객님을 위해 특별히 준비한 솔루션:\n`;
    ctaPoints.forEach((point) => {
      message += `• ${point}\n`;
    });
    message += `\n`;
  }

  // 기본 CTA
  message += `무료 시타 체험으로 직접 확인해보세요!\n`;
  message += `전문 상담을 통해 최적의 솔루션을 제안해드리겠습니다.\n\n`;

  // 매장 정보 추가 (거리 기반 개인화)
  message += generateStoreInfo(distanceKm);

  return message;
}

/**
 * 개인화된 당첨 메시지 생성 (기존 맞춤형 메시지 로직 활용)
 */
function generateWinnerMessage(
  name: string,
  distanceKm: number | null,
  survey: any
): string {
  const importantFactors = (survey?.important_factors || []) as string[];
  const selectedModel = MODEL_NAMES[survey?.selected_model] || survey?.selected_model || '';
  const ageGroup = survey?.age_group || '';

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

  // 고객님의 특별한 요구사항 반영 (솔루션 리스트에 포함)
  const additionalFeedback = survey?.additional_feedback || '';
  if (additionalFeedback && additionalFeedback.trim()) {
    const feedbackPreview = additionalFeedback.length > 30 
      ? `${additionalFeedback.substring(0, 30)}...` 
      : additionalFeedback;
    ctaPoints.push(`고객님의 특별한 요구사항 반영 - "${feedbackPreview}"`);
  }

  const isFarDistance = distanceKm !== null && distanceKm >= DISTANCE_THRESHOLD_WINNER;

  // 메시지 생성
  let message = `[마쓰구골프] 축하합니다, ${name}님! 🎉\n\n`;
  message += `경품 당첨을 축하드립니다!\n`;
  message += `선물을 받으시고 기존 클럽 점검을 받으신 후\n`;
  message += `110만원 상당의 특별한 리샤프팅 혜택을 드립니다.\n\n`;

  // 거리별 상담 안내
  if (isFarDistance) {
    message += `원거리에 계신 고객님께는\n전문 피터 전화 상담을 제공해드립니다.\n\n`;
  } else {
    message += `방문이 편리하신 고객님께는\n전문 피터 시타 상담을 제공해드립니다.\n\n`;
  }

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
    ctaPoints.forEach((point) => {
      message += `• ${point}\n`;
    });
    message += `\n`;
  }

  // 기본 CTA
  message += `무료 시타 체험으로 직접 확인해보세요!\n`;
  message += `전문 상담을 통해 최적의 솔루션을 제안해드리겠습니다.\n\n`;

  // 매장 정보 추가 (거리 기반 개인화)
  message += generateStoreInfo(distanceKm);

  return message;
}

// GET: 메시지 미리보기 (발송하지 않고 내용만 반환)
// POST: 메시지 발송

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: 메시지 미리보기
  if (req.method === 'GET') {
    try {
      const { surveyId, messageType } = req.query as Record<string, string>;

      if (!surveyId || !messageType || !['thank_you', 'winner'].includes(messageType)) {
        return res.status(400).json({
          success: false,
          message: 'surveyId와 messageType(thank_you 또는 winner)이 필요합니다.',
        });
      }

      // 설문 정보 조회 (개인화를 위한 필드 포함)
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .select('id, name, phone, important_factors, selected_model, age_group, customer_id')
        .eq('id', surveyId)
        .single();

      if (surveyError || !survey) {
        return res.status(404).json({
          success: false,
          message: '설문을 찾을 수 없습니다.',
        });
      }

      // 당첨 여부 확인
      const { data: prizeSelection } = await supabase
        .from('prize_selections')
        .select('survey_id')
        .eq('survey_id', surveyId)
        .eq('selection_status', 'selected')
        .maybeSingle();

      const isWinner = !!prizeSelection;

      if (messageType === 'winner' && !isWinner) {
        return res.status(400).json({
          success: false,
          message: '당첨자가 아닌 고객입니다.',
        });
      }

      // 거리 및 구매여부 정보 확인
      let distanceKm: number | null = null;
      let isPurchased = false;
      
      const { data: prizeRecommendation } = await supabase
        .from('prize_recommendations')
        .select('distance_km, is_purchased, days_since_last_purchase')
        .eq('survey_id', surveyId)
        .order('recommendation_date', { ascending: false })
        .order('recommendation_datetime', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prizeRecommendation) {
        distanceKm = prizeRecommendation.distance_km;
        isPurchased = prizeRecommendation.is_purchased || false;
      }
      
      // prize_recommendations에 거리 정보가 없으면 customer_address_cache에서 조회
      if (distanceKm === null && survey) {
        try {
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
          } else if (survey.customer_id) {
            // customer_id로도 시도
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
        } catch (cacheError) {
          console.error('거리 정보 캐시 조회 오류:', cacheError);
          // 캐시 조회 실패해도 계속 진행
        }
      }

      // 메시지 생성 (개인화된 메시지)
      let message = '';
      if (messageType === 'thank_you') {
        message = generateThankYouMessage(survey.name || '고객', isPurchased, distanceKm, survey);
      } else {
        message = generateWinnerMessage(survey.name || '고객', distanceKm, survey);
      }

      return res.status(200).json({
        success: true,
        data: {
          surveyId: survey.id,
          name: survey.name,
          phone: survey.phone,
          messageType,
          message,
          isWinner,
          distanceKm,
          isPurchased,
        },
      });
    } catch (error: any) {
      console.error('메시지 미리보기 오류:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '메시지 미리보기 중 오류가 발생했습니다.',
      });
    }
  }

  // POST: 메시지 발송
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { surveyIds, messageType, sendToAll } = req.body;

    if (!messageType || !['thank_you', 'winner', 'both'].includes(messageType)) {
      return res.status(400).json({
        success: false,
        message: 'messageType은 thank_you, winner, both 중 하나여야 합니다.',
      });
    }

    // 발송할 설문 목록 결정
    let surveysToProcess: any[] = [];

    if (sendToAll) {
      // 전체 설문 조회 (개인화를 위한 필드 포함)
      const { data: allSurveys, error: fetchError } = await supabase
        .from('surveys')
        .select('id, name, phone, important_factors, selected_model, age_group, customer_id');

      if (fetchError) {
        console.error('전체 설문 조회 오류:', fetchError);
        return res.status(500).json({
          success: false,
          message: '전체 설문 조회에 실패했습니다.',
        });
      }

      surveysToProcess = allSurveys || [];
    } else if (surveyIds && Array.isArray(surveyIds) && surveyIds.length > 0) {
      // 선택된 설문 조회 (개인화를 위한 필드 포함)
      const { data: selectedSurveys, error: fetchError } = await supabase
        .from('surveys')
        .select('id, name, phone, important_factors, selected_model, age_group, customer_id')
        .in('id', surveyIds);

      if (fetchError) {
        console.error('선택된 설문 조회 오류:', fetchError);
        return res.status(500).json({
          success: false,
          message: '선택된 설문 조회에 실패했습니다.',
        });
      }

      surveysToProcess = selectedSurveys || [];
    } else {
      return res.status(400).json({
        success: false,
        message: 'surveyIds 또는 sendToAll이 필요합니다.',
      });
    }

    if (surveysToProcess.length === 0) {
      return res.status(200).json({
        success: true,
        message: '발송할 설문이 없습니다.',
        data: { sent: 0, failed: 0 },
      });
    }

    // 각 설문의 당첨 여부 및 거리 정보 조회
    const surveyIdsList = surveysToProcess.map(s => s.id);

    // 당첨 여부 확인
    const { data: prizeSelections } = await supabase
      .from('prize_selections')
      .select('survey_id')
      .in('survey_id', surveyIdsList)
      .eq('selection_status', 'selected');

    const winnerSurveyIds = new Set<string>();
    if (prizeSelections) {
      prizeSelections.forEach((ps: any) => {
        if (ps.survey_id) {
          winnerSurveyIds.add(ps.survey_id);
        }
      });
    }

    // 거리 및 구매여부 정보 확인
    const { data: prizeRecommendations } = await supabase
      .from('prize_recommendations')
      .select('survey_id, distance_km, is_purchased, days_since_last_purchase')
      .in('survey_id', surveyIdsList)
      .order('recommendation_date', { ascending: false })
      .order('recommendation_datetime', { ascending: false });

    const recommendationMap = new Map<string, any>();
    if (prizeRecommendations) {
      prizeRecommendations.forEach((pr: any) => {
        if (pr.survey_id && !recommendationMap.has(pr.survey_id)) {
          recommendationMap.set(pr.survey_id, {
            distance_km: pr.distance_km,
            is_purchased: pr.is_purchased,
            days_since_last_purchase: pr.days_since_last_purchase,
          });
        }
      });
    }
    
    // prize_recommendations에 거리 정보가 없는 설문들을 customer_address_cache에서 조회
    const surveysWithoutDistance = surveysToProcess.filter(s => {
      const rec = recommendationMap.get(s.id);
      return !rec || rec.distance_km === null;
    });
    
    if (surveysWithoutDistance.length > 0) {
      const surveyIdsWithoutDistance = surveysWithoutDistance.map(s => s.id);
      
      // survey_id로 조회
      const { data: addressCaches } = await supabase
        .from('customer_address_cache')
        .select('survey_id, distance_km')
        .in('survey_id', surveyIdsWithoutDistance)
        .eq('geocoding_status', 'success')
        .not('distance_km', 'is', null);
      
      if (addressCaches) {
        addressCaches.forEach((cache: any) => {
          if (cache.survey_id && !recommendationMap.has(cache.survey_id)) {
            recommendationMap.set(cache.survey_id, {
              distance_km: cache.distance_km,
              is_purchased: false, // customer_address_cache에는 구매 정보가 없음
              days_since_last_purchase: null,
            });
          } else if (cache.survey_id && recommendationMap.has(cache.survey_id)) {
            // 이미 있는 경우 거리 정보만 업데이트
            const existing = recommendationMap.get(cache.survey_id);
            if (existing && existing.distance_km === null) {
              existing.distance_km = cache.distance_km;
            }
          }
        });
      }
      
      // customer_id로도 조회 (survey_id로 못 찾은 경우)
      const surveysStillWithoutDistance = surveysWithoutDistance.filter(s => {
        const rec = recommendationMap.get(s.id);
        return !rec || rec.distance_km === null;
      });
      
      if (surveysStillWithoutDistance.length > 0) {
        // customer_id 목록 수집
        const customerIds = surveysStillWithoutDistance
          .map(s => s.customer_id)
          .filter((id): id is number => id !== null && id !== undefined);
        
        if (customerIds.length > 0) {
          const { data: customerCaches } = await supabase
            .from('customer_address_cache')
            .select('customer_id, distance_km')
            .in('customer_id', customerIds)
            .eq('geocoding_status', 'success')
            .not('distance_km', 'is', null);
          
          if (customerCaches) {
            // customer_id를 survey_id로 매핑
            const customerToSurveyMap = new Map<number, string>();
            surveysStillWithoutDistance.forEach(s => {
              if (s.customer_id) {
                customerToSurveyMap.set(s.customer_id, s.id);
              }
            });
            
            customerCaches.forEach((cache: any) => {
              if (cache.customer_id) {
                const surveyId = customerToSurveyMap.get(cache.customer_id);
                if (surveyId) {
                  if (!recommendationMap.has(surveyId)) {
                    recommendationMap.set(surveyId, {
                      distance_km: cache.distance_km,
                      is_purchased: false,
                      days_since_last_purchase: null,
                    });
                  } else {
                    const existing = recommendationMap.get(surveyId);
                    if (existing && existing.distance_km === null) {
                      existing.distance_km = cache.distance_km;
                    }
                  }
                }
              }
            });
          }
        }
      }
    }

    // 메시지 생성 및 발송
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const survey of surveysToProcess) {
      const isWinner = winnerSurveyIds.has(survey.id);
      const recommendation = recommendationMap.get(survey.id);
      const distanceKm = recommendation?.distance_km || null;
      const isPurchased = recommendation?.is_purchased || false;

      try {
        // 당첨 메시지 발송
        if (messageType === 'winner' || messageType === 'both') {
          if (!isWinner) {
            // 당첨자가 아닌 경우 건너뛰기
            if (messageType === 'winner') {
              continue; // winner만 발송하는 경우 건너뛰기
            }
            // both인 경우 감사 메시지만 발송
          } else {
            // 당첨 메시지 생성 및 발송 (개인화된 메시지)
            const winnerMessage = generateWinnerMessage(survey.name || '고객', distanceKm, survey);
            
            // ⭐ 수정: UUID 대신 먼저 메시지를 저장하여 integer ID 획득 (고객 관리와 동일한 방식)
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                            (req.headers.origin || 'http://localhost:3000');
            const saveApiUrl = `${baseUrl}/api/channels/sms/save`;
            
            // 1단계: 메시지를 DB에 먼저 저장
            // 전화번호 정규화 (하이픈, 공백 제거)
            const normalizedPhone = survey.phone ? survey.phone.replace(/[^0-9]/g, '') : null;
            if (!normalizedPhone || normalizedPhone.length < 10) {
              console.error('[send-messages] 당첨 메시지: 정규화된 전화번호가 유효하지 않습니다:', {
                surveyId: survey.id,
                surveyName: survey.name,
                originalPhone: survey.phone,
                normalizedPhone: normalizedPhone,
              });
              throw new Error('정규화된 전화번호가 유효하지 않습니다.');
            }

            const saveResponse = await fetch(saveApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messageType: 'MMS',
                messageText: winnerMessage,
                recipientNumbers: [normalizedPhone],
                status: 'draft',
                messageCategory: 'prize',
                messageSubcategory: 'prize_winner',
              }),
            });

            if (!saveResponse.ok) {
              const errorText = await saveResponse.text();
              let errorData;
              try {
                errorData = JSON.parse(errorText);
              } catch {
                errorData = { message: errorText };
              }
              console.error('[send-messages] 당첨 메시지 저장 API 오류:', {
                surveyId: survey.id,
                surveyName: survey.name,
                phone: survey.phone,
                status: saveResponse.status,
                statusText: saveResponse.statusText,
                error: errorData,
              });
              throw new Error(errorData.message || errorData.error || '메시지 저장 실패');
            }

            const saveResult = await saveResponse.json();
            if (!saveResult.success || !saveResult.channelPostId) {
              console.error('[send-messages] 당첨 메시지 저장 실패:', {
                surveyId: survey.id,
                surveyName: survey.name,
                phone: survey.phone,
                error: saveResult.message,
                errorCode: saveResult.errorCode,
                errorDetails: saveResult.errorDetails,
                errorHint: saveResult.errorHint,
                debugInfo: saveResult.debugInfo,
                fullResponse: saveResult,
              });
              throw new Error(saveResult.message || '메시지 저장 실패');
            }

            const winnerChannelPostId = saveResult.channelPostId; // ⭐ integer ID 사용
            
            // 2단계: 저장된 메시지를 발송
            const smsApiUrl = `${baseUrl}/api/channels/sms/send`;
            
            console.log('[send-messages] 당첨 메시지 발송 시작:', {
              surveyId: survey.id,
              surveyName: survey.name,
              phone: survey.phone,
              channelPostId: winnerChannelPostId,
              apiUrl: smsApiUrl,
            });
            
            const smsResponse = await fetch(smsApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                channelPostId: winnerChannelPostId,
                messageType: 'MMS',
                messageText: winnerMessage,
                recipientNumbers: [survey.phone],
                honorific: survey.name || '고객',
                messageCategory: 'prize',
                messageSubcategory: 'prize_winner',
              }),
            });

            if (!smsResponse.ok) {
              const errorData = await smsResponse.json().catch(() => ({ message: 'Unknown error' }));
              console.error('[send-messages] SMS 발송 API 오류:', {
                status: smsResponse.status,
                statusText: smsResponse.statusText,
                error: errorData,
                surveyId: survey.id,
              });
              throw new Error(errorData.message || 'SMS 발송 실패');
            }

            // 성공 응답 확인 및 로깅
            const smsResult = await smsResponse.json();
            console.log('[send-messages] SMS 발송 응답 (당첨 메시지):', {
              success: smsResult.success,
              groupIds: smsResult.result?.groupIds,
              sentCount: smsResult.result?.sentCount,
              successCount: smsResult.result?.successCount,
              failCount: smsResult.result?.failCount,
              surveyId: survey.id,
            });

            // ⭐ 수정: 그룹 ID가 있으면 발송 성공으로 간주 (솔라피에서 그룹 ID가 생성되면 발송된 것)
            // successCount가 0이어도 그룹 ID가 있으면 발송된 것으로 처리
            const hasGroupIds = smsResult.result?.groupIds && smsResult.result.groupIds.length > 0;
            const hasSuccessCount = (smsResult.result?.successCount || 0) > 0;
            const groupIds = smsResult.result?.groupIds || [];
            const successCount = smsResult.result?.successCount || 0;
            const failCount = smsResult.result?.failCount || 0;
            
            console.log('[send-messages] 당첨 메시지 발송 결과 분석:', {
              surveyId: survey.id,
              surveyName: survey.name,
              phone: survey.phone,
              messageType: 'winner',
              apiSuccess: smsResult.success,
              hasGroupIds,
              groupIds,
              hasSuccessCount,
              successCount,
              failCount,
              apiMessage: smsResult.message,
              fullResult: smsResult.result,
            });
            
            if (!hasGroupIds && (!smsResult.success || !hasSuccessCount)) {
              const errorMsg = smsResult.message || 'SMS 발송 실패';
              console.error('[send-messages] 당첨 메시지 발송 실패 (그룹 ID 없음):', {
                success: smsResult.success,
                hasGroupIds,
                hasSuccessCount,
                message: errorMsg,
                result: smsResult.result,
                surveyId: survey.id,
                surveyName: survey.name,
                phone: survey.phone,
              });
              throw new Error(errorMsg);
            }
            
            // 그룹 ID가 있으면 성공으로 처리 (successCount는 나중에 업데이트될 수 있음)
            if (hasGroupIds && !hasSuccessCount) {
              console.warn('[send-messages] 당첨 메시지: 그룹 ID는 있지만 successCount가 0입니다. 나중에 동기화될 수 있습니다:', {
                groupIds: smsResult.result.groupIds,
                surveyId: survey.id,
                surveyName: survey.name,
                phone: survey.phone,
              });
            }
            
            if (hasGroupIds) {
              console.log('[send-messages] ✅ 당첨 메시지 발송 성공 (그룹 ID 확인):', {
                groupIds,
                surveyId: survey.id,
                surveyName: survey.name,
              });
            }

            sentCount++;
          }
        }

        // 감사 메시지 발송
        if (messageType === 'thank_you' || messageType === 'both') {
          // both인 경우 당첨자에게는 당첨 메시지만 발송했으므로 감사 메시지는 건너뛰기
          if (messageType === 'both' && isWinner) {
            // 이미 당첨 메시지를 발송했으므로 감사 메시지는 건너뛰기
          } else {
            // 감사 메시지 생성 및 발송 (개인화된 메시지)
            const thankYouMessage = generateThankYouMessage(
              survey.name || '고객',
              isPurchased,
              distanceKm,
              survey
            );

            // ⭐ 수정: UUID 대신 먼저 메시지를 저장하여 integer ID 획득 (고객 관리와 동일한 방식)
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                            (req.headers.origin || 'http://localhost:3000');
            const saveApiUrl = `${baseUrl}/api/channels/sms/save`;
            
            // 1단계: 메시지를 DB에 먼저 저장
            // 전화번호 검증 및 정규화 (하이픈 제거)
            if (!survey.phone || typeof survey.phone !== 'string' || survey.phone.trim() === '') {
              console.error('[send-messages] 감사 메시지: 전화번호가 유효하지 않습니다:', {
                surveyId: survey.id,
                surveyName: survey.name,
                phone: survey.phone,
                phoneType: typeof survey.phone,
              });
              throw new Error('전화번호가 유효하지 않습니다.');
            }

            // 전화번호 정규화 (하이픈, 공백 제거)
            const normalizedPhone = survey.phone.replace(/[^0-9]/g, '');
            if (!normalizedPhone || normalizedPhone.length < 10) {
              console.error('[send-messages] 감사 메시지: 정규화된 전화번호가 유효하지 않습니다:', {
                surveyId: survey.id,
                surveyName: survey.name,
                originalPhone: survey.phone,
                normalizedPhone: normalizedPhone,
              });
              throw new Error('정규화된 전화번호가 유효하지 않습니다.');
            }

            const saveRequestBody = {
              messageType: 'MMS',
              messageText: thankYouMessage,
              recipientNumbers: [normalizedPhone],
              status: 'draft',
              messageCategory: 'prize',
              messageSubcategory: 'prize_thank_you',
            };

            console.log('[send-messages] 감사 메시지 저장 요청:', {
              surveyId: survey.id,
              surveyName: survey.name,
              originalPhone: survey.phone,
              normalizedPhone: normalizedPhone,
              messageType: saveRequestBody.messageType,
              messageTextLength: saveRequestBody.messageText.length,
              recipientNumbers: saveRequestBody.recipientNumbers,
              recipientNumbersType: typeof saveRequestBody.recipientNumbers,
              recipientNumbersIsArray: Array.isArray(saveRequestBody.recipientNumbers),
              recipientNumbersLength: saveRequestBody.recipientNumbers?.length,
            });

            const saveResponse = await fetch(saveApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(saveRequestBody),
            });

            if (!saveResponse.ok) {
              const errorText = await saveResponse.text();
              let errorData;
              try {
                errorData = JSON.parse(errorText);
              } catch {
                errorData = { message: errorText };
              }
              console.error('[send-messages] 감사 메시지 저장 API 오류:', {
                surveyId: survey.id,
                surveyName: survey.name,
                phone: survey.phone,
                status: saveResponse.status,
                statusText: saveResponse.statusText,
                error: errorData,
              });
              throw new Error(errorData.message || errorData.error || '메시지 저장 실패');
            }

            const saveResult = await saveResponse.json();
            if (!saveResult.success || !saveResult.channelPostId) {
              console.error('[send-messages] 감사 메시지 저장 실패:', {
                surveyId: survey.id,
                surveyName: survey.name,
                phone: survey.phone,
                error: saveResult.message,
                errorCode: saveResult.errorCode,
                errorDetails: saveResult.errorDetails,
                errorHint: saveResult.errorHint,
                debugInfo: saveResult.debugInfo,
                fullResponse: saveResult,
              });
              throw new Error(saveResult.message || '메시지 저장 실패');
            }

            const thankYouChannelPostId = saveResult.channelPostId; // ⭐ integer ID 사용
            
            // 2단계: 저장된 메시지를 발송
            const smsApiUrl = `${baseUrl}/api/channels/sms/send`;
            
            console.log('[send-messages] 감사 메시지 발송 시작:', {
              surveyId: survey.id,
              surveyName: survey.name,
              phone: survey.phone,
              channelPostId: thankYouChannelPostId,
              apiUrl: smsApiUrl,
            });
            
            const smsResponse = await fetch(smsApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                channelPostId: thankYouChannelPostId,
                messageType: 'MMS',
                messageText: thankYouMessage,
                recipientNumbers: [survey.phone],
                honorific: survey.name || '고객',
                messageCategory: 'prize',
                messageSubcategory: 'prize_thank_you',
              }),
            });

            if (!smsResponse.ok) {
              const errorData = await smsResponse.json().catch(() => ({ message: 'Unknown error' }));
              console.error('[send-messages] SMS 발송 API 오류:', {
                status: smsResponse.status,
                statusText: smsResponse.statusText,
                error: errorData,
                surveyId: survey.id,
              });
              throw new Error(errorData.message || 'SMS 발송 실패');
            }

            // 성공 응답 확인 및 로깅
            const smsResult = await smsResponse.json();
            console.log('[send-messages] SMS 발송 응답:', {
              success: smsResult.success,
              groupIds: smsResult.result?.groupIds,
              sentCount: smsResult.result?.sentCount,
              successCount: smsResult.result?.successCount,
              failCount: smsResult.result?.failCount,
              surveyId: survey.id,
            });

            // ⭐ 수정: 그룹 ID가 있으면 발송 성공으로 간주 (솔라피에서 그룹 ID가 생성되면 발송된 것)
            // successCount가 0이어도 그룹 ID가 있으면 발송된 것으로 처리
            const hasGroupIds = smsResult.result?.groupIds && smsResult.result.groupIds.length > 0;
            const hasSuccessCount = (smsResult.result?.successCount || 0) > 0;
            
            if (!hasGroupIds && (!smsResult.success || !hasSuccessCount)) {
              const errorMsg = smsResult.message || 'SMS 발송 실패';
              console.error('[send-messages] SMS 발송 실패:', {
                success: smsResult.success,
                hasGroupIds,
                hasSuccessCount,
                message: errorMsg,
                result: smsResult.result,
                surveyId: survey.id,
              });
              throw new Error(errorMsg);
            }
            
            // 그룹 ID가 있으면 성공으로 처리 (successCount는 나중에 업데이트될 수 있음)
            if (hasGroupIds && !hasSuccessCount) {
              console.warn('[send-messages] 그룹 ID는 있지만 successCount가 0입니다. 나중에 동기화될 수 있습니다:', {
                groupIds: smsResult.result.groupIds,
                surveyId: survey.id,
              });
            }

            sentCount++;
          }
        }
      } catch (error: any) {
        console.error(`[send-messages] 메시지 발송 오류 (설문 ${survey.id}):`, {
          surveyId: survey.id,
          surveyName: survey.name,
          phone: survey.phone,
          messageType: messageType,
          error: error.message,
          errorStack: error.stack,
        });
        failedCount++;
        const errorMessage = `설문 ${survey.id} (${survey.name}): ${error.message || '알 수 없는 오류'}`;
        errors.push(errorMessage);
      }
    }

    // ⭐ 최종 결과 로깅
    console.log('[send-messages] 최종 발송 결과:', {
      total: surveysToProcess.length,
      sent: sentCount,
      failed: failedCount,
      errors: errors.length,
      errorDetails: errors.slice(0, 5), // 처음 5개만 로그
    });

    return res.status(200).json({
      success: true,
      message: `메시지 발송 완료: ${sentCount}건 성공, ${failedCount}건 실패`,
      data: {
        sent: sentCount,
        failed: failedCount,
        total: surveysToProcess.length,
        errors: errors.length > 0 ? errors.slice(0, 20) : undefined, // 최대 20개 에러 반환
      },
    });
  } catch (error: any) {
    console.error('메시지 발송 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '메시지 발송 중 오류가 발생했습니다.',
    });
  }
}
