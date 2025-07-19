import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabase(req, res);

  // 인증 확인
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method, body } = req;

  try {
    if (method !== 'PUT') {
      res.setHeader('Allow', ['PUT']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }

    const { year, month, employeeQuotas } = body;

    if (!year || !month || !employeeQuotas) {
      return res.status(400).json({ 
        error: 'year, month, employeeQuotas는 필수입니다.' 
      });
    }

    // 기존 KPI 데이터 조회
    const { data: existing, error: fetchError } = await supabase
      .from('monthly_kpis')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!existing) {
      // KPI가 없으면 생성
      const { data: created, error: createError } = await supabase
        .from('monthly_kpis')
        .insert({
          year,
          month,
          employee_quotas: employeeQuotas,
          kpi_data: {
            channels: {},
            employees: employeeQuotas,
            overall: {
              roi: 0,
              efficiency: 0,
              recommendations: []
            }
          }
        })
        .select()
        .single();

      if (createError) throw createError;

      return res.status(201).json({ 
        data: created,
        message: '직원별 할당량이 설정되었습니다.'
      });
    } else {
      // 기존 KPI 업데이트
      const updatedKpiData = {
        ...existing.kpi_data,
        employees: employeeQuotas
      };

      const { data: updated, error: updateError } = await supabase
        .from('monthly_kpis')
        .update({
          employee_quotas: employeeQuotas,
          kpi_data: updatedKpiData
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({ 
        data: updated,
        message: '직원별 할당량이 업데이트되었습니다.'
      });
    }

  } catch (error: any) {
    console.error('Employee Quota API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: error 
    });
  }
}
