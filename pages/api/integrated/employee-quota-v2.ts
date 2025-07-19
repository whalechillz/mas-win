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
        // 직원 목록 및 할당량 조회
        const { year, month } = query;

        if (!year || !month) {
          return res.status(400).json({ error: 'year와 month가 필요합니다.' });
        }

        // 팀 멤버 조회
        const { data: teamMembers, error: teamError } = await supabase
          .from('team_members')
          .select('*')
          .eq('status', 'active')
          .order('name');

        if (teamError) throw teamError;

        // 해당 월의 KPI 데이터 조회
        const { data: kpiData, error: kpiError } = await supabase
          .from('monthly_kpis')
          .select('kpi_data')
          .eq('year', year)
          .eq('month', month)
          .single();

        if (kpiError && kpiError.code !== 'PGRST116') {
          throw kpiError;
        }

        // 직원별 블로그 게시 현황 조회
        const { data: blogPosts, error: blogError } = await supabase
          .from('blog_contents')
          .select('author_id')
          .gte('published_at', `${year}-${String(month).padStart(2, '0')}-01`)
          .lt('published_at', `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`)
          .eq('status', 'published');

        if (blogError) throw blogError;

        // 직원별 게시물 수 계산
        const postCounts = blogPosts?.reduce((acc, post) => {
          acc[post.author_id] = (acc[post.author_id] || 0) + 1;
          return acc;
        }, {}) || {};

        // 직원 할당량 정보 생성
        const employeeQuotas = teamMembers.map(member => {
          const existingData = kpiData?.kpi_data?.employees?.find(
            emp => emp.id === member.id
          );

          return {
            id: member.id,
            name: member.name,
            department: member.department,
            blogQuota: existingData?.blogQuota || 4, // 기본 할당량 4개
            blogCompleted: postCounts[member.id] || 0,
            performance: postCounts[member.id] 
              ? Math.round((postCounts[member.id] / (existingData?.blogQuota || 4)) * 100)
              : 0
          };
        });

        return res.status(200).json({ 
          data: {
            year: parseInt(year as string),
            month: parseInt(month as string),
            employees: employeeQuotas,
            summary: {
              totalQuota: employeeQuotas.reduce((sum, emp) => sum + emp.blogQuota, 0),
              totalCompleted: employeeQuotas.reduce((sum, emp) => sum + emp.blogCompleted, 0),
              averagePerformance: Math.round(
                employeeQuotas.reduce((sum, emp) => sum + emp.performance, 0) / employeeQuotas.length
              )
            }
          }
        });

      case 'PUT':
        // 직원별 할당량 업데이트
        const { 
          year: updateYear, 
          month: updateMonth, 
          employees: updatedEmployees 
        } = body;

        if (!updateYear || !updateMonth || !updatedEmployees) {
          return res.status(400).json({ 
            error: 'year, month, employees 정보가 필요합니다.' 
          });
        }

        // 현재 KPI 데이터 조회
        const { data: currentKPI, error: fetchError } = await supabase
          .from('monthly_kpis')
          .select('*')
          .eq('year', updateYear)
          .eq('month', updateMonth)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        // KPI 데이터 업데이트 또는 생성
        const updatedKpiData = currentKPI ? {
          ...currentKPI.kpi_data,
          employees: updatedEmployees
        } : {
          channels: {
            blog: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 },
            kakao: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 },
            sms: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 },
            email: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 },
            instagram: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 }
          },
          employees: updatedEmployees,
          overall: {
            roi: 0,
            efficiency: 0,
            recommendations: []
          }
        };

        if (currentKPI) {
          // 업데이트
          const { data: updated, error: updateError } = await supabase
            .from('monthly_kpis')
            .update({
              kpi_data: updatedKpiData,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentKPI.id)
            .select()
            .single();

          if (updateError) throw updateError;

          return res.status(200).json({ data: updated });
        } else {
          // 생성
          const { data: created, error: createError } = await supabase
            .from('monthly_kpis')
            .insert({
              year: updateYear,
              month: updateMonth,
              kpi_data: updatedKpiData
            })
            .select()
            .single();

          if (createError) throw createError;

          return res.status(201).json({ data: created });
        }

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('Employee Quota API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: error 
    });
  }
}
