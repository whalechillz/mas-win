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
          // 특정 년월의 KPI 조회
          const { year, month } = query;
          const { data, error } = await supabase
            .from('monthly_kpis')
            .select('*')
            .eq('year', year)
            .eq('month', month)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          // KPI가 없으면 빈 데이터 반환
          if (!data) {
            return res.status(200).json({ 
              data: {
                year: parseInt(year as string),
                month: parseInt(month as string),
                kpi_data: {
                  channels: {},
                  employees: [],
                  overall: {
                    roi: 0,
                    efficiency: 0,
                    recommendations: []
                  }
                },
                channel_targets: {},
                channel_actuals: {},
                employee_quotas: [],
                total_reach: 0,
                total_conversions: 0,
                total_revenue: 0,
                total_cost: 0
              }
            });
          }

          return res.status(200).json({ data });
        } else {
          // 전체 KPI 목록 조회
          const { data, error } = await supabase
            .from('monthly_kpis')
            .select('*')
            .order('year', { ascending: false })
            .order('month', { ascending: false });

          if (error) throw error;

          return res.status(200).json({ data });
        }

      case 'POST':
        // 새 KPI 생성 또는 업데이트
        const { year, month } = body;

        if (!year || !month) {
          return res.status(400).json({ error: 'year와 month는 필수입니다.' });
        }

        // 기존 KPI 확인
        const { data: existing } = await supabase
          .from('monthly_kpis')
          .select('id')
          .eq('year', year)
          .eq('month', month)
          .single();

        if (existing) {
          // 업데이트
          const { data: updated, error: updateError } = await supabase
            .from('monthly_kpis')
            .update(body)
            .eq('id', existing.id)
            .select()
            .single();

          if (updateError) throw updateError;

          return res.status(200).json({ data: updated });
        } else {
          // 생성
          const { data: created, error: createError } = await supabase
            .from('monthly_kpis')
            .insert(body)
            .select()
            .single();

          if (createError) throw createError;

          return res.status(201).json({ data: created });
        }

      case 'PUT':
        // KPI 업데이트
        if (query.id) {
          // ID로 업데이트
          const { data: updated, error: updateError } = await supabase
            .from('monthly_kpis')
            .update(body)
            .eq('id', query.id)
            .select()
            .single();

          if (updateError) throw updateError;

          return res.status(200).json({ data: updated });
        } else if (query.year && query.month) {
          // 년월로 업데이트
          const { data: updated, error: updateError } = await supabase
            .from('monthly_kpis')
            .update(body)
            .eq('year', query.year)
            .eq('month', query.month)
            .select()
            .single();

          if (updateError) throw updateError;

          return res.status(200).json({ data: updated });
        } else {
          return res.status(400).json({ error: 'ID 또는 year/month가 필요합니다.' });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('KPI API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: error 
    });
  }
}
