import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('📊 AI 사용량 통계 API 요청:', req.method, req.url);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
    return res.status(500).json({ error: '서버 설정 오류' });
  }

  try {
    const { period = '7d', endpoint, model } = req.query;
    
    // 기간 계산
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    console.log(`📅 사용량 통계 기간: ${startDate.toISOString()} ~ ${now.toISOString()}`);

    // 기본 쿼리 구성
    let query = supabase
      .from('ai_usage_logs')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // 필터 적용
    if (endpoint) {
      query = query.eq('api_endpoint', endpoint);
    }
    if (model) {
      query = query.eq('model', model);
    }

    const { data: usageLogs, error: usageError } = await query;

    if (usageError) {
      console.error('❌ AI 사용량 로그 조회 에러:', usageError);
      return res.status(500).json({ error: 'AI 사용량 로그 조회에 실패했습니다.' });
    }

    // 통계 계산
    const stats = {
      totalRequests: usageLogs?.length || 0,
      totalTokens: usageLogs?.reduce((sum, log) => sum + (log.total_tokens || 0), 0) || 0,
      totalCost: usageLogs?.reduce((sum, log) => sum + (log.cost || 0), 0) || 0,
      avgCostPerRequest: 0,
      endpointStats: {},
      modelStats: {},
      dailyStats: {},
      monthlyStats: {}
    };

    if (stats.totalRequests > 0) {
      stats.avgCostPerRequest = stats.totalCost / stats.totalRequests;
    }

    // 엔드포인트별 통계
    const endpointGroups = {};
    const modelGroups = {};
    const dailyGroups = {};
    const monthlyGroups = {};

    usageLogs?.forEach(log => {
      // 엔드포인트별
      if (!endpointGroups[log.api_endpoint]) {
        endpointGroups[log.api_endpoint] = {
          requests: 0,
          tokens: 0,
          cost: 0
        };
      }
      endpointGroups[log.api_endpoint].requests++;
      endpointGroups[log.api_endpoint].tokens += log.total_tokens || 0;
      endpointGroups[log.api_endpoint].cost += log.cost || 0;

      // 모델별
      if (!modelGroups[log.model]) {
        modelGroups[log.model] = {
          requests: 0,
          tokens: 0,
          cost: 0
        };
      }
      modelGroups[log.model].requests++;
      modelGroups[log.model].tokens += log.total_tokens || 0;
      modelGroups[log.model].cost += log.cost || 0;

      // 일별
      const day = new Date(log.created_at).toISOString().split('T')[0];
      if (!dailyGroups[day]) {
        dailyGroups[day] = {
          requests: 0,
          tokens: 0,
          cost: 0
        };
      }
      dailyGroups[day].requests++;
      dailyGroups[day].tokens += log.total_tokens || 0;
      dailyGroups[day].cost += log.cost || 0;

      // 월별
      const month = new Date(log.created_at).toISOString().substring(0, 7);
      if (!monthlyGroups[month]) {
        monthlyGroups[month] = {
          requests: 0,
          tokens: 0,
          cost: 0
        };
      }
      monthlyGroups[month].requests++;
      monthlyGroups[month].tokens += log.total_tokens || 0;
      monthlyGroups[month].cost += log.cost || 0;
    });

    stats.endpointStats = Object.entries(endpointGroups).map(([endpoint, data]) => ({
      endpoint,
      ...data,
      avgCostPerRequest: data.cost / data.requests
    })).sort((a, b) => b.cost - a.cost);

    stats.modelStats = Object.entries(modelGroups).map(([model, data]) => ({
      model,
      ...data,
      avgCostPerRequest: data.cost / data.requests
    })).sort((a, b) => b.cost - a.cost);

    stats.dailyStats = Object.entries(dailyGroups).map(([date, data]) => ({
      date,
      ...data,
      avgCostPerRequest: data.cost / data.requests
    })).sort((a, b) => new Date(b.date) - new Date(a.date));

    stats.monthlyStats = Object.entries(monthlyGroups).map(([month, data]) => ({
      month,
      ...data,
      avgCostPerRequest: data.cost / data.requests
    })).sort((a, b) => new Date(b.month) - new Date(a.month));

    const result = {
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      stats,
      recentLogs: usageLogs?.slice(0, 10) || [] // 최근 10개 로그
    };

    console.log('✅ AI 사용량 통계 반환:', result);
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ AI 사용량 통계 API 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.', details: error.message });
  }
}
