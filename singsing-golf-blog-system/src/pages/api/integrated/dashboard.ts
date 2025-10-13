import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceSupabase, getDateRange } from '../../../lib/marketing';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { period = '30d' } = req.query;
    const { start, end } = getDateRange(period);
    const supabase = createServiceSupabase();

    // 1) 블로그 KPI 집계
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('id, title, views, category, created_at, published_at')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const blog = {
      totalPosts: posts?.length || 0,
      totalViews: posts?.reduce((s: number, p: any) => s + (p.views || 0), 0) || 0,
      published: posts?.filter(p => p.published_at).length || 0,
    };

    // 2) AI 사용량 집계
    const { data: aiLogs } = await supabase
      .from('ai_usage_logs')
      .select('total_tokens, cost, api_endpoint, model, created_at')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const ai = {
      totalCalls: aiLogs?.length || 0,
      totalTokens: aiLogs?.reduce((s: number, l: any) => s + (l.total_tokens || 0), 0) || 0,
      totalCost: aiLogs?.reduce((s: number, l: any) => s + (Number(l.cost) || 0), 0) || 0,
    };

    // 3) 캠페인 요약 (있을 경우)
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name, start_date, end_date, is_active')
      .gte('start_date', start.toISOString().slice(0,10))
      .lte('end_date', end.toISOString().slice(0,10));

    const campaignSummary = {
      active: campaigns?.filter(c => c.is_active).length || 0,
      total: campaigns?.length || 0,
    };

    return res.status(200).json({
      success: true,
      period,
      blog,
      ai,
      campaigns: campaignSummary,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('통합 대시보드 집계 오류:', error);
    return res.status(500).json({ error: '집계 실패', details: error.message });
  }
}


