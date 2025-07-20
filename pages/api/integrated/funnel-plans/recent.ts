import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 최근 6개월의 퍼널 계획 가져오기
    const { data: plans, error } = await supabase
      .from('monthly_funnel_plans')
      .select(`
        *,
        funnel_data
      `)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      throw error;
    }

    // 퍼널 데이터 파싱
    const formattedPlans = plans?.map(plan => ({
      id: plan.id,
      year: plan.year,
      month: plan.month,
      theme: plan.theme,
      funnelStages: plan.funnel_data?.funnelStages || {
        awareness: { goal: '', channels: [], expectedReach: 0 },
        interest: { goal: '', channels: [], expectedCTR: 0 },
        consideration: { goal: '', landingPageUrl: '', expectedConversion: 0 },
        purchase: { goal: '', promotions: [], expectedRevenue: 0 }
      },
      status: plan.status,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at
    })) || [];

    return res.status(200).json(formattedPlans);
  } catch (error) {
    console.error('Error fetching recent funnel plans:', error);
    return res.status(500).json({ error: 'Failed to fetch recent funnel plans' });
  }
}