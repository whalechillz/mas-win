import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeId, quota, year, month } = req.body;

  if (!employeeId || quota === undefined || !year || !month) {
    return res.status(400).json({ error: 'Employee ID, quota, year, and month are required' });
  }

  try {
    // 기존 KPI 데이터 조회
    const { data: existingKPI, error: fetchError } = await supabase
      .from('monthly_kpis')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let kpiData;
    
    if (existingKPI?.kpi_data) {
      // 기존 데이터가 있는 경우 업데이트
      kpiData = existingKPI.kpi_data;
      
      // 해당 직원 찾기
      const employeeIndex = kpiData.employees.findIndex((emp: any) => emp.id === employeeId);
      
      if (employeeIndex !== -1) {
        // 할당량 업데이트
        kpiData.employees[employeeIndex].blogQuota = quota;
        
        // 성과 재계산
        const completed = kpiData.employees[employeeIndex].blogCompleted;
        kpiData.employees[employeeIndex].performance = quota > 0 
          ? Math.min((completed / quota) * 5, 5) 
          : 0;
        kpiData.employees[employeeIndex].performance = Math.round(kpiData.employees[employeeIndex].performance * 10) / 10;
      } else {
        // 직원이 없으면 추가
        const { data: employee } = await supabase
          .from('team_members')
          .select('id, name')
          .eq('id', employeeId)
          .single();
          
        if (employee) {
          kpiData.employees.push({
            id: employee.id,
            name: employee.name || 'Unknown',
            blogQuota: quota,
            blogCompleted: 0,
            performance: 0
          });
        }
      }
      
      // 데이터베이스 업데이트
      const { error: updateError } = await supabase
        .from('monthly_kpis')
        .update({ 
          kpi_data: kpiData, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', existingKPI.id);
        
      if (updateError) throw updateError;
    } else {
      // 새로운 KPI 데이터 생성
      const { data: employee } = await supabase
        .from('team_members')
        .select('id, name')
        .eq('id', employeeId)
        .single();
        
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      kpiData = {
        year,
        month,
        channels: {
          blog: { target: 20, actual: 0, posts: 0, engagement: 0, conversion: 0 },
          kakao: { target: 100, actual: 0, posts: 0, engagement: 0, conversion: 0 },
          sms: { target: 50, actual: 0, posts: 0, engagement: 0, conversion: 0 },
          email: { target: 200, actual: 0, posts: 0, engagement: 0, conversion: 0 },
          instagram: { target: 30, actual: 0, posts: 0, engagement: 0, conversion: 0 },
          googleAds: { target: 1000, actual: 0, posts: 0, engagement: 0, conversion: 0 }
        },
        employees: [{
          id: employee.id,
          name: employee.name || 'Unknown',
          blogQuota: quota,
          blogCompleted: 0,
          performance: 0
        }],
        overall: {
          roi: 0,
          efficiency: 0,
          recommendations: []
        }
      };
      
      // 데이터베이스에 삽입
      const { error: insertError } = await supabase
        .from('monthly_kpis')
        .insert({
          year,
          month,
          kpi_data: kpiData
        });
        
      if (insertError) throw insertError;
    }

    return res.status(200).json({ 
      success: true, 
      message: '직원 할당량이 성공적으로 업데이트되었습니다.',
      data: kpiData 
    });
  } catch (error) {
    console.error('Error updating employee quota:', error);
    return res.status(500).json({ error: 'Failed to update employee quota' });
  }
}