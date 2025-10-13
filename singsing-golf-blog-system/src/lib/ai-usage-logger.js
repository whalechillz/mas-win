import { createClient } from '@supabase/supabase-js';

// 서비스 롤 키로 서버 사이드에서 기록
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 대시보드 및 통계가 기대하는 스키마에 맞춰 기록합니다.
// pages/api/admin/create-ai-usage-table.js 참고:
// columns: api_endpoint, model, input_tokens, output_tokens, total_tokens, cost, improvement_type, content_type, user_agent, ip_address, created_at

export async function logAIUsage(source, action, model, tokensUsed = 0, cost = 0, metadata = {}) {
  try {
    const record = {
      api_endpoint: source,
      model,
      input_tokens: metadata.prompt_tokens ?? 0,
      output_tokens: metadata.completion_tokens ?? 0,
      total_tokens: tokensUsed,
      cost,
      improvement_type: action,
      content_type: metadata.content_type || null,
      user_agent: metadata.user_agent || null,
      ip_address: metadata.ip_address || null,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('ai_usage_logs').insert([record]);
    if (error) {
      console.error('AI 사용량 로깅 오류:', error, record);
    }
  } catch (e) {
    console.error('AI 사용량 로깅 중 예외:', e);
  }
}

export async function logOpenAIUsage(source, action, response, metadata = {}) {
  const model = response.model || 'GPT-4o-mini';
  const promptTokens = response.usage?.prompt_tokens || 0;
  const completionTokens = response.usage?.completion_tokens || 0;
  const totalTokens = response.usage?.total_tokens || promptTokens + completionTokens || 0;

  // 가격: 1M 입력 $0.15, 1M 출력 $0.60 (gpt-4o-mini 기준)
  const inputCostPerMillion = 0.15;
  const outputCostPerMillion = 0.60;
  const cost = (promptTokens / 1_000_000) * inputCostPerMillion + (completionTokens / 1_000_000) * outputCostPerMillion;

  return logAIUsage(source, action, model, totalTokens, cost, {
    ...metadata,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    openai_response_id: response.id
  });
}

export async function logFALAIUsage(source, action, metadata = {}) {
  // 추정 단가: 이미지 1장 $0.01
  const costPerImage = 0.01;
  const imageCount = metadata.imageCount || 1;
  const totalCost = costPerImage * imageCount;

  return logAIUsage(source, action, 'FAL AI hidream-i1-dev', 0, totalCost, metadata);
}
