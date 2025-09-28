import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // AI 사용량 통계 계산
    const { data: logs, error: logsError } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('AI 로그 조회 오류:', logsError);
      return res.status(500).json({ error: 'AI 로그 조회 실패' });
    }

    // 통계 계산
    const totalCalls = logs.length;
    const totalTokens = logs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
    
    // 성공률 계산 (성공한 호출 / 전체 호출)
    const successCalls = logs.filter(log => 
      log.improvement_type.includes('success') || 
      !log.improvement_type.includes('failed') && 
      !log.improvement_type.includes('error')
    ).length;
    const successRate = totalCalls > 0 ? (successCalls / totalCalls) * 100 : 0;
    
    const avgTokensPerCall = totalCalls > 0 ? totalTokens / totalCalls : 0;

    const stats = {
      totalCalls,
      totalTokens,
      totalCost,
      successRate,
      avgTokensPerCall
    };

    res.status(200).json({ 
      stats,
      logs: logs.slice(0, 50) // 최근 50개 로그만 반환
    });
  } catch (error) {
    console.error('AI 통계 조회 오류:', error);
    res.status(500).json({ error: 'AI 통계 조회 실패' });
  }
}
