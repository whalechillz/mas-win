import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MonthData {
  year: number;
  month: number;
  theme: string;
  status: {
    funnelPlan: boolean;
    funnelPage: boolean;
    googleAds: boolean;
    contentGenerated: boolean;
    contentValidated: boolean;
    kpiSet: boolean;
  };
  scores: {
    contentQuality: number;
    kpiAchievement: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { year } = req.query;

  if (!year) {
    return res.status(400).json({ error: 'Year is required' });
  }

  try {
    const yearNum = parseInt(year as string);
    const monthlyData: MonthData[] = [];

    // 12개월 데이터 가져오기
    for (let month = 1; month <= 12; month++) {
      // 월별 테마 가져오기
      const { data: theme } = await supabase
        .from('monthly_themes')
        .select('theme')
        .eq('year', yearNum)
        .eq('month', month)
        .single();

      // 퍼널 계획 확인
      const { data: funnelPlan } = await supabase
        .from('monthly_funnel_plans')
        .select('id')
        .eq('year', yearNum)
        .eq('month', month)
        .single();

      const status = {
        funnelPlan: false,
        funnelPage: false,
        googleAds: false,
        contentGenerated: false,
        contentValidated: false,
        kpiSet: false
      };

      const scores = {
        contentQuality: 0,
        kpiAchievement: 0
      };

      if (funnelPlan) {
        status.funnelPlan = true;

        // 퍼널 페이지 확인
        const { data: funnelPage } = await supabase
          .from('funnel_pages')
          .select('id')
          .eq('funnel_plan_id', funnelPlan.id)
          .single();

        status.funnelPage = !!funnelPage;
        status.googleAds = !!funnelPage; // 임시

        // 콘텐츠 생성 확인
        const { data: contents } = await supabase
          .from('generated_contents')
          .select('id, validation_score')
          .eq('funnel_plan_id', funnelPlan.id);

        if (contents && contents.length > 0) {
          status.contentGenerated = true;
          
          // 검증된 콘텐츠 확인
          const validatedContents = contents.filter(c => c.validation_score);
          if (validatedContents.length > 0) {
            status.contentValidated = true;
            
            // 평균 콘텐츠 품질 점수 계산
            const totalScore = validatedContents.reduce((sum, c) => {
              const score = c.validation_score?.overallScore || 0;
              return sum + score;
            }, 0);
            scores.contentQuality = Math.round(totalScore / validatedContents.length);
          }
        }
      }

      // KPI 확인
      const { data: kpi } = await supabase
        .from('monthly_kpis')
        .select('kpi_data')
        .eq('year', yearNum)
        .eq('month', month)
        .single();

      if (kpi) {
        status.kpiSet = true;
        // KPI 달성률 계산 (실제 vs 목표)
        const kpiData = kpi.kpi_data as any;
        if (kpiData?.overall?.efficiency) {
          scores.kpiAchievement = Math.round(kpiData.overall.efficiency);
        }
      }

      monthlyData.push({
        year: yearNum,
        month,
        theme: theme?.theme || '',
        status,
        scores
      });
    }

    return res.status(200).json(monthlyData);
  } catch (error) {
    console.error('Error fetching yearly overview:', error);
    return res.status(500).json({ error: 'Failed to fetch yearly overview' });
  }
}