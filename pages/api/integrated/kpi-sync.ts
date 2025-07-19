import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '../../../lib/supabase';

// 채널별 성과 데이터 수집 함수
async function collectChannelPerformance(
  supabase: any,
  year: number,
  month: number
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // 채널별 콘텐츠 성과 집계
  const { data: contents } = await supabase
    .from('generated_contents')
    .select(`
      channel,
      performance_data,
      status,
      monthly_funnel_plans!inner (
        year,
        month
      )
    `)
    .eq('monthly_funnel_plans.year', year)
    .eq('monthly_funnel_plans.month', month)
    .eq('status', 'published');

  const channelStats = {};

  if (contents) {
    contents.forEach(content => {
      const channel = content.channel;
      if (!channelStats[channel]) {
        channelStats[channel] = {
          posts: 0,
          views: 0,
          clicks: 0,
          conversions: 0,
          engagement: 0
        };
      }

      channelStats[channel].posts += 1;
      
      if (content.performance_data) {
        channelStats[channel].views += content.performance_data.views || 0;
        channelStats[channel].clicks += content.performance_data.clicks || 0;
        channelStats[channel].conversions += content.performance_data.conversions || 0;
        channelStats[channel].engagement += content.performance_data.engagement || 0;
      }
    });
  }

  return channelStats;
}

// 직원별 성과 데이터 수집 함수
async function collectEmployeePerformance(
  supabase: any,
  year: number,
  month: number
) {
  // blog_schedule 테이블에서 직원별 블로그 작성 현황 조회
  const { data: blogPosts } = await supabase
    .from('blog_schedule')
    .select('*')
    .gte('publish_date', `${year}-${String(month).padStart(2, '0')}-01`)
    .lt('publish_date', `${year}-${String(month + 1).padStart(2, '0')}-01`);

  const employeeStats = {};

  if (blogPosts) {
    blogPosts.forEach(post => {
      const author = post.author;
      if (!employeeStats[author]) {
        employeeStats[author] = {
          id: author,
          name: author,
          blogQuota: 4, // 기본 할당량
          blogCompleted: 0,
          performance: 0
        };
      }

      if (post.status === 'published') {
        employeeStats[author].blogCompleted += 1;
      }
    });

    // 성과 계산
    Object.values(employeeStats).forEach((employee: any) => {
      employee.performance = Math.round((employee.blogCompleted / employee.blogQuota) * 100);
    });
  }

  return Object.values(employeeStats);
}

// 전체 ROI 계산 함수
async function calculateOverallROI(
  supabase: any,
  year: number,
  month: number
) {
  // 캠페인 데이터에서 수익과 비용 조회
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .gte('start_date', `${year}-${String(month).padStart(2, '0')}-01`)
    .lt('start_date', `${year}-${String(month + 1).padStart(2, '0')}-01`);

  let totalRevenue = 0;
  let totalCost = 0;
  let totalReach = 0;
  let totalConversions = 0;

  if (campaigns) {
    campaigns.forEach(campaign => {
      totalRevenue += parseFloat(campaign.roi || 0) * parseFloat(campaign.budget || 0) / 100;
      totalCost += parseFloat(campaign.budget || 0);
      totalReach += campaign.views || 0;
      totalConversions += campaign.bookings || 0;
    });
  }

  const roi = totalCost > 0 ? (totalRevenue / totalCost) : 0;
  const efficiency = totalReach > 0 ? (totalConversions / totalReach) * 100 : 0;

  return {
    totalRevenue,
    totalCost,
    totalReach,
    totalConversions,
    roi,
    efficiency
  };
}

// AI 추천사항 생성 함수
function generateRecommendations(
  channelStats: any,
  employeeStats: any[],
  overallMetrics: any
): string[] {
  const recommendations = [];

  // ROI 기반 추천
  if (overallMetrics.roi < 1) {
    recommendations.push('ROI가 1 미만입니다. 광고 타겟팅을 재검토하고 전환율을 개선해주세요.');
  } else if (overallMetrics.roi > 3) {
    recommendations.push('우수한 ROI를 보이고 있습니다. 예산을 증액하여 성과를 확대하는 것을 고려해보세요.');
  }

  // 채널별 추천
  Object.entries(channelStats).forEach(([channel, stats]: [string, any]) => {
    if (stats.posts === 0) {
      recommendations.push(`${channel} 채널에 콘텐츠가 게시되지 않았습니다. 콘텐츠 생성이 필요합니다.`);
    } else if (stats.conversions / stats.posts < 0.5) {
      recommendations.push(`${channel} 채널의 전환율이 낮습니다. 콘텐츠 품질을 개선해주세요.`);
    }
  });

  // 직원별 추천
  const underperformers = employeeStats.filter(emp => emp.performance < 75);
  if (underperformers.length > 0) {
    recommendations.push(`${underperformers.length}명의 직원이 블로그 할당량을 충족하지 못했습니다. 지원이 필요합니다.`);
  }

  // 효율성 기반 추천
  if (overallMetrics.efficiency < 1) {
    recommendations.push('전체 전환율이 1% 미만입니다. 랜딩페이지와 CTA를 개선해주세요.');
  }

  return recommendations;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabase(req, res);

  // 인증 확인
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method, body } = req;

  try {
    if (method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }

    const { year, month } = body;

    if (!year || !month) {
      return res.status(400).json({ error: 'year와 month는 필수입니다.' });
    }

    // 1. 채널별 성과 수집
    const channelStats = await collectChannelPerformance(supabase, year, month);

    // 2. 직원별 성과 수집
    const employeeStats = await collectEmployeePerformance(supabase, year, month);

    // 3. 전체 ROI 계산
    const overallMetrics = await calculateOverallROI(supabase, year, month);

    // 4. AI 추천사항 생성
    const recommendations = generateRecommendations(
      channelStats,
      employeeStats,
      overallMetrics
    );

    // 5. KPI 데이터 구성
    const kpiData = {
      channels: channelStats,
      employees: employeeStats,
      overall: {
        roi: overallMetrics.roi,
        efficiency: overallMetrics.efficiency,
        recommendations
      }
    };

    // 6. 채널별 목표 설정 (기본값)
    const channelTargets = {
      blog: { reach: 5000, conversions: 50, posts: 10 },
      kakao: { reach: 3000, conversions: 30, posts: 8 },
      sms: { reach: 1000, conversions: 20, posts: 4 },
      email: { reach: 2000, conversions: 25, posts: 4 },
      instagram: { reach: 4000, conversions: 20, posts: 12 }
    };

    // 7. KPI 업데이트 또는 생성
    const { data: existing } = await supabase
      .from('monthly_kpis')
      .select('id')
      .eq('year', year)
      .eq('month', month)
      .single();

    const kpiRecord = {
      year,
      month,
      kpi_data: kpiData,
      channel_targets: channelTargets,
      channel_actuals: channelStats,
      employee_quotas: employeeStats,
      total_reach: overallMetrics.totalReach,
      total_conversions: overallMetrics.totalConversions,
      total_revenue: overallMetrics.totalRevenue,
      total_cost: overallMetrics.totalCost,
      analysis_notes: `${year}년 ${month}월 KPI 자동 동기화 완료`,
      recommendations
    };

    let result;
    if (existing) {
      // 업데이트
      const { data, error } = await supabase
        .from('monthly_kpis')
        .update(kpiRecord)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // 생성
      const { data, error } = await supabase
        .from('monthly_kpis')
        .insert(kpiRecord)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return res.status(200).json({ 
      data: result,
      message: 'KPI 동기화가 완료되었습니다.'
    });

  } catch (error: any) {
    console.error('KPI Sync API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: error 
    });
  }
}
