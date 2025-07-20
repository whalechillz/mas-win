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

  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ error: 'Year and month are required' });
  }

  try {
    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);

    // 각 단계의 완료 상태 확인
    const status = {
      step1: false, // 퍼널 계획
      step2: false, // 퍼널 페이지
      step3: false, // 구글 애드
      step4: false, // 콘텐츠 생성
      step5: false, // 콘텐츠 검증
      step6: false  // KPI 설정
    };

    // 1. 퍼널 계획 확인
    const { data: funnelPlan } = await supabase
      .from('monthly_funnel_plans')
      .select('id')
      .eq('year', yearNum)
      .eq('month', monthNum)
      .single();

    status.step1 = !!funnelPlan;

    // 2. 퍼널 페이지 확인
    if (funnelPlan) {
      const { data: funnelPage } = await supabase
        .from('funnel_pages')
        .select('id')
        .eq('funnel_plan_id', funnelPlan.id)
        .single();

      status.step2 = !!funnelPage;
    }

    // 3. 구글 애드 확인 (파일 시스템에서 CSV 파일 존재 여부로 확인)
    // 실제로는 파일 시스템을 확인하거나 별도 테이블에서 확인
    status.step3 = status.step2; // 임시로 퍼널 페이지가 있으면 구글 애드도 있다고 가정

    // 4. 콘텐츠 생성 확인
    if (funnelPlan) {
      const { data: contents } = await supabase
        .from('generated_contents')
        .select('id')
        .eq('funnel_plan_id', funnelPlan.id)
        .limit(1);

      status.step4 = !!contents && contents.length > 0;
    }

    // 5. 콘텐츠 검증 확인
    if (funnelPlan) {
      const { data: validatedContents } = await supabase
        .from('generated_contents')
        .select('validation_score')
        .eq('funnel_plan_id', funnelPlan.id)
        .not('validation_score', 'is', null)
        .limit(1);

      status.step5 = !!validatedContents && validatedContents.length > 0;
    }

    // 6. KPI 설정 확인
    const { data: kpi } = await supabase
      .from('monthly_kpis')
      .select('id')
      .eq('year', yearNum)
      .eq('month', monthNum)
      .single();

    status.step6 = !!kpi;

    return res.status(200).json(status);
  } catch (error) {
    console.error('Error checking workflow status:', error);
    return res.status(500).json({ error: 'Failed to check workflow status' });
  }
}