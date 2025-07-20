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

  try {
    // 퍼널 계획 ID 가져오기
    let funnelPlanId = null;
    if (year && month) {
      const { data: funnelPlan } = await supabase
        .from('monthly_funnel_plans')
        .select('id')
        .eq('year', parseInt(year as string))
        .eq('month', parseInt(month as string))
        .single();

      funnelPlanId = funnelPlan?.id;
    }

    // 검증된 콘텐츠 가져오기
    let query = supabase
      .from('generated_contents')
      .select('*')
      .not('validation_score', 'is', null)
      .order('created_at', { ascending: false });

    if (funnelPlanId) {
      query = query.eq('funnel_plan_id', funnelPlanId);
    }

    const { data: contents, error } = await query;

    if (error) {
      throw error;
    }

    // 검증 결과 형식 변환
    const formattedContents = contents?.map(content => {
      const validationScore = content.validation_score as any || {};
      
      return {
        contentId: content.id,
        channel: content.channel,
        title: validationScore.title || '제목 없음',
        content: content.content,
        blogUrl: validationScore.blogUrl,
        validations: {
          seoScore: validationScore.seoScore || 0,
          readability: validationScore.readability || 0,
          brandConsistency: validationScore.brandConsistency || 0,
          channelOptimization: validationScore.channelOptimization || 0,
          suggestions: validationScore.suggestions || []
        },
        details: validationScore.details || [],
        overallScore: validationScore.overallScore || 0,
        grade: validationScore.grade || 'D',
        status: validationScore.status || 'poor'
      };
    }) || [];

    return res.status(200).json(formattedContents);
  } catch (error) {
    console.error('Error fetching validated contents:', error);
    return res.status(500).json({ error: 'Failed to fetch validated contents' });
  }
}