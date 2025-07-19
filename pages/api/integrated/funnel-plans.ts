import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabase(req, res);

  // 인증 확인
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        if (query.year && query.month) {
          // 특정 년월의 퍼널 계획 조회
          const { year, month } = query;
          const { data, error } = await supabase
            .from('monthly_funnel_plans')
            .select(`
              *,
              monthly_themes (
                id,
                theme,
                description,
                target_audience,
                promotion_details,
                focus_keywords
              )
            `)
            .eq('year', year)
            .eq('month', month)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          return res.status(200).json({ data });
        } else {
          // 전체 퍼널 계획 목록 조회
          const { data, error } = await supabase
            .from('monthly_funnel_plans')
            .select(`
              *,
              monthly_themes (
                id,
                theme,
                description
              )
            `)
            .order('year', { ascending: false })
            .order('month', { ascending: false });

          if (error) throw error;

          return res.status(200).json({ data });
        }

      case 'POST':
        // 새 퍼널 계획 생성
        const { year, month, theme, funnel_data, monthly_theme_id } = body;

        // 이미 존재하는지 확인
        const { data: existing } = await supabase
          .from('monthly_funnel_plans')
          .select('id')
          .eq('year', year)
          .eq('month', month)
          .single();

        if (existing) {
          return res.status(409).json({ error: '해당 년월의 퍼널 계획이 이미 존재합니다.' });
        }

        // 퍼널 계획 생성
        const { data: newPlan, error: createError } = await supabase
          .from('monthly_funnel_plans')
          .insert({
            year,
            month,
            theme,
            funnel_data: funnel_data || {
              awareness: {
                goal: '',
                channels: [],
                expectedReach: 0
              },
              interest: {
                goal: '',
                channels: [],
                expectedCTR: 0
              },
              consideration: {
                goal: '',
                landingPageUrl: '',
                expectedConversion: 0
              },
              purchase: {
                goal: '',
                promotions: [],
                expectedRevenue: 0
              }
            },
            monthly_theme_id,
            status: 'planning'
          })
          .select()
          .single();

        if (createError) throw createError;

        // 기본 퍼널 페이지 생성
        const { error: pageError } = await supabase
          .from('funnel_pages')
          .insert({
            funnel_plan_id: newPlan.id
          });

        if (pageError) throw pageError;

        // 기본 KPI 생성
        const { error: kpiError } = await supabase
          .from('monthly_kpis')
          .insert({
            year,
            month
          });

        // KPI가 이미 존재할 수 있으므로 에러 무시

        return res.status(201).json({ data: newPlan });

      case 'PUT':
        // 퍼널 계획 수정
        const { id } = query;
        if (!id) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const { data: updatedPlan, error: updateError } = await supabase
          .from('monthly_funnel_plans')
          .update(body)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        return res.status(200).json({ data: updatedPlan });

      case 'DELETE':
        // 퍼널 계획 삭제
        const { id: deleteId } = query;
        if (!deleteId) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const { error: deleteError } = await supabase
          .from('monthly_funnel_plans')
          .delete()
          .eq('id', deleteId);

        if (deleteError) throw deleteError;

        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('Funnel Plans API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: error 
    });
  }
}
