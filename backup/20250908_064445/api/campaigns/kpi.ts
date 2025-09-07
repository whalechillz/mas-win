import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { campaign_id } = req.query;

  try {
    if (campaign_id && campaign_id !== 'all') {
      // 특정 캠페인 데이터
      const { data: metrics, error } = await supabase
        .from('campaign_metrics')
        .select('*')
        .eq('campaign_id', campaign_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // 고유 방문자 수 계산
      const { count: uniqueVisitors } = await supabase
        .from('page_views')
        .select('ip_address', { count: 'exact', head: true })
        .eq('campaign_id', campaign_id);

      return res.status(200).json({
        ...metrics,
        unique_visitors: uniqueVisitors || 0
      });

    } else {
      // 모든 캠페인 데이터
      const { data: allMetrics, error } = await supabase
        .from('campaign_metrics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 각 캠페인별 고유 방문자 수 추가
      const enrichedMetrics = await Promise.all(
        allMetrics.map(async (metric) => {
          const { count } = await supabase
            .from('page_views')
            .select('ip_address', { count: 'exact', head: true })
            .eq('campaign_id', metric.campaign_id);

          return {
            ...metric,
            unique_visitors: count || 0
          };
        })
      );

      return res.status(200).json(enrichedMetrics);
    }
  } catch (error) {
    console.error('KPI API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch KPI data' });
  }
}
