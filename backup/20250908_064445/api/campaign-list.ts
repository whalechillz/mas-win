// pages/api/campaign-list.ts
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

  try {
    // 기본 캠페인 정보 (하드코딩 - campaigns 테이블이 없는 경우)
    const campaignInfo = {
      '2025-06': { name: '초여름 프로모션', status: 'completed', period: '2025.06.01 - 2025.06.30' },
      '2025-07': { name: '여름 특별 캠페인', status: 'active', period: '2025.07.01 - 2025.07.31' },
      '2025-08': { name: '가을 시즌 캠페인', status: 'planned', period: '2025.08.01 - 2025.08.31' }
    };

    // campaign_metrics에서 모든 데이터 조회
    const { data: metrics, error } = await supabase
      .from('campaign_metrics')
      .select('*')
      .order('campaign_id');

    if (error) throw error;

    // 데이터 병합
    const campaigns = Object.entries(campaignInfo).map(([id, info]) => {
      const metric = metrics?.find(m => m.campaign_id === id) || {};
      return {
        id,
        ...info,
        metrics: {
          views: metric.views || 0,
          unique_visitors: metric.unique_visitors || 0,
          phone_clicks: metric.phone_clicks || 0,
          form_submissions: metric.form_submissions || 0,
          conversion_rate: metric.views > 0 
            ? ((metric.form_submissions || 0) / metric.views * 100).toFixed(2)
            : '0.00'
        }
      };
    });

    return res.status(200).json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
}