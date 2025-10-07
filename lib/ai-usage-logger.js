import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * AI 사용량을 Supabase에 기록하는 함수
 * @param {Object} params - 로깅 파라미터
 * @param {string} params.apiName - API 이름 (예: 'generate-paragraph-images')
 * @param {string} params.model - 모델 이름 (예: 'GPT-4o-mini', 'FAL AI hidream-i1-dev')
 * @param {string} params.action - 액션 (예: 'image-generation', 'prompt-improvement')
 * @param {number} params.tokens - 사용된 토큰 수
 * @param {number} params.cost - 비용 (USD)
 * @param {Object} params.metadata - 추가 메타데이터
 */
export async function logAIUsage({ apiName, model, action, tokens = 0, cost = 0, metadata = {} }) {
  try {
    const { data, error } = await supabase
      .from('ai_usage_logs')
      .insert([
        {
          api_name: apiName,
          model: model,
          action: action,
          tokens: tokens,
          cost: cost,
          metadata: metadata,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('AI 사용량 로깅 오류:', error);
    } else {
      console.log(`AI 사용량 기록됨: ${apiName} - ${model} - ${action} - ${tokens} tokens - $${cost}`);
    }
  } catch (error) {
    console.error('AI 사용량 로깅 중 오류:', error);
  }
}

/**
 * OpenAI 사용량을 기록하는 헬퍼 함수
 */
export async function logOpenAIUsage(apiName, action, response, metadata = {}) {
  const tokens = response.usage?.total_tokens || 0;
  const cost = calculateOpenAICost(response.usage);
  
  await logAIUsage({
    apiName,
    model: response.model || 'GPT-4o-mini',
    action,
    tokens,
    cost,
    metadata
  });
}

/**
 * FAL AI 사용량을 기록하는 헬퍼 함수
 */
export async function logFALAIUsage(apiName, action, metadata = {}) {
  // FAL AI는 토큰 기반이 아니므로 고정 비용으로 계산
  const cost = 0.01; // FAL AI hidream-i1-dev 대략적 비용
  
  await logAIUsage({
    apiName,
    model: 'FAL AI hidream-i1-dev',
    action,
    tokens: 0,
    cost,
    metadata
  });
}

/**
 * OpenAI 비용 계산 (대략적)
 */
function calculateOpenAICost(usage) {
  if (!usage) return 0;
  
  // GPT-4o-mini 비용 (2024년 기준)
  const inputCostPer1K = 0.00015; // $0.15 per 1M input tokens
  const outputCostPer1K = 0.0006;  // $0.60 per 1M output tokens
  
  const inputCost = (usage.prompt_tokens / 1000) * inputCostPer1K;
  const outputCost = (usage.completion_tokens / 1000) * outputCostPer1K;
  
  return inputCost + outputCost;
}
