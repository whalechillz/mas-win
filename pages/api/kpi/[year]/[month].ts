import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 동적 라우팅을 위한 파일명 변경 필요
// /api/kpi/[year]/[month].ts로 이동 예정

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ error: 'Year and month are required' });
  }

  try {
    // 월별 KPI 데이터 조회
    const { data: kpiData, error: kpiError } = await supabase
      .from('monthly_kpis')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .single();

    if (kpiError && kpiError.code !== 'PGRST116') {
      throw kpiError;
    }

    // 데이터가 없으면 기본값 생성
    if (!kpiData || !kpiData.kpi_data) {
      const defaultKPI = {
        year: parseInt(year as string),
        month: parseInt(month as string),
        channels: {
          blog: { target: 20, actual: 0, posts: 0, engagement: 0, conversion: 0 },
          kakao: { target: 100, actual: 0, posts: 0, engagement: 0, conversion: 0 },
          sms: { target: 50, actual: 0, posts: 0, engagement: 0, conversion: 0 },
          email: { target: 200, actual: 0, posts: 0, engagement: 0, conversion: 0 },
          instagram: { target: 30, actual: 0, posts: 0, engagement: 0, conversion: 0 },
          googleAds: { target: 1000, actual: 0, posts: 0, engagement: 0, conversion: 0 }
        },
        employees: [],
        overall: {
          roi: 0,
          efficiency: 0,
          recommendations: []
        }
      };

      // 직원 정보 가져오기
      const { data: employees } = await supabase
        .from('team_members')
        .select('id, name')
        .eq('role', 'admin')
        .order('name');

      if (employees) {
        defaultKPI.employees = employees.map(emp => ({
          id: emp.id,
          name: emp.name || 'Unknown',
          blogQuota: 5, // 기본 할당량
          blogCompleted: 0,
          performance: 0
        }));
      }

      // 블로그 실적 계산
      if (defaultKPI.employees.length > 0) {
        const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
        const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
        
        for (const employee of defaultKPI.employees) {
          // simple_blog_posts 테이블에서 블로그 작성 수 계산
          const { count } = await supabase
            .from('simple_blog_posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', employee.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
            
          employee.blogCompleted = count || 0;
          employee.performance = employee.blogQuota > 0 
            ? Math.min((employee.blogCompleted / employee.blogQuota) * 5, 5) 
            : 0;
        }
      }

      // 채널별 실적 계산
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
      
      for (const channel of Object.keys(defaultKPI.channels)) {
        if (channel === 'blog') {
          // 블로그는 simple_blog_posts 테이블에서
          const { count } = await supabase
            .from('simple_blog_posts')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
          
          defaultKPI.channels[channel].posts = count || 0;
          defaultKPI.channels[channel].actual = count || 0;
        } else {
          // 다른 채널들은 channel_contents 테이블에서
          const { count } = await supabase
            .from('channel_contents')
            .select('*', { count: 'exact', head: true })
            .eq('channel', channel)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
          
          defaultKPI.channels[channel].posts = count || 0;
          defaultKPI.channels[channel].actual = count || 0;
        }
        
        // 참여율과 전환율은 실제 데이터가 있을 때 계산
        // 여기서는 임시값 사용
        defaultKPI.channels[channel].engagement = Math.random() * 10;
        defaultKPI.channels[channel].conversion = Math.random() * 5;
      }

      // 전체 ROI 및 효율성 계산
      const totalTarget = Object.values(defaultKPI.channels).reduce((sum, ch: any) => sum + ch.target, 0);
      const totalActual = Object.values(defaultKPI.channels).reduce((sum, ch: any) => sum + ch.actual, 0);
      defaultKPI.overall.efficiency = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
      defaultKPI.overall.roi = defaultKPI.overall.efficiency * 1.2; // 임시 ROI 계산

      // AI 추천사항 생성
      if (defaultKPI.overall.efficiency < 80) {
        defaultKPI.overall.recommendations.push('전체 목표 달성률이 80% 미만입니다. 각 채널별 전략 재검토가 필요합니다.');
      }
      
      const underperformingChannels = Object.entries(defaultKPI.channels)
        .filter(([_, data]: any) => data.target > 0 && (data.actual / data.target) < 0.8)
        .map(([channel]) => channel);
        
      if (underperformingChannels.length > 0) {
        defaultKPI.overall.recommendations.push(
          `${underperformingChannels.join(', ')} 채널의 성과가 목표 대비 부진합니다. 집중 개선이 필요합니다.`
        );
      }

      return res.status(200).json(defaultKPI);
    }

    return res.status(200).json(kpiData.kpi_data);
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    return res.status(500).json({ error: 'Failed to fetch KPI data' });
  }
}