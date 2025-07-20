import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { year, month } = req.body;

  if (!year || !month) {
    return res.status(400).json({ error: 'Year and month are required' });
  }

  try {
    // 기존 KPI 데이터 조회
    const { data: existingKPI, error: fetchError } = await supabase
      .from('monthly_kpis')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .single();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // 채널별 실적 데이터 수집
    const channels: any = {
      blog: { target: 20, actual: 0, posts: 0, engagement: 0, conversion: 0 },
      kakao: { target: 100, actual: 0, posts: 0, engagement: 0, conversion: 0 },
      sms: { target: 50, actual: 0, posts: 0, engagement: 0, conversion: 0 },
      email: { target: 200, actual: 0, posts: 0, engagement: 0, conversion: 0 },
      instagram: { target: 30, actual: 0, posts: 0, engagement: 0, conversion: 0 },
      googleAds: { target: 1000, actual: 0, posts: 0, engagement: 0, conversion: 0 }
    };

    // 기존 목표값이 있으면 유지
    if (existingKPI?.kpi_data?.channels) {
      Object.keys(channels).forEach(ch => {
        if (existingKPI.kpi_data.channels[ch]?.target) {
          channels[ch].target = existingKPI.kpi_data.channels[ch].target;
        }
      });
    }

    // 각 채널별 실적 계산
    for (const channel of Object.keys(channels)) {
      if (channel === 'blog') {
        // 블로그는 simple_blog_posts 테이블에서
        const { count } = await supabase
          .from('simple_blog_posts')
          .select('id, created_at', { count: 'exact' })
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        channels[channel].posts = count || 0;
        channels[channel].actual = count || 0;
      } else {
        // 다른 채널들은 channel_contents 테이블에서
        const { count } = await supabase
          .from('channel_contents')
          .select('id, created_at', { count: 'exact' })
          .eq('channel', channel)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        channels[channel].posts = count || 0;
        channels[channel].actual = count || 0;
      }

      // 실제 API 연동 시뮬레이션 (실제로는 각 플랫폼 API 호출)
      if (channel === 'blog') {
        // 네이버 블로그 API 호출 시뮬레이션
        channels[channel].engagement = 3.5 + Math.random() * 2;
        channels[channel].conversion = 1.5 + Math.random() * 1;
      } else if (channel === 'kakao') {
        // 카카오톡 API 호출 시뮬레이션
        channels[channel].engagement = 5 + Math.random() * 5;
        channels[channel].conversion = 2 + Math.random() * 2;
      } else if (channel === 'instagram') {
        // Instagram API 호출 시뮬레이션
        channels[channel].engagement = 4 + Math.random() * 6;
        channels[channel].conversion = 1 + Math.random() * 2;
      } else if (channel === 'googleAds') {
        // Google Ads API 호출 시뮬레이션
        channels[channel].engagement = 2 + Math.random() * 3;
        channels[channel].conversion = 3 + Math.random() * 2;
      } else {
        channels[channel].engagement = Math.random() * 10;
        channels[channel].conversion = Math.random() * 5;
      }
    }

    // 직원별 실적 수집
    const { data: employees } = await supabase
      .from('team_members')
      .select('id, name')
      .eq('role', 'admin')
      .order('name');

    const employeeData = [];
    if (employees) {
      for (const emp of employees) {
        const { count } = await supabase
          .from('simple_blog_posts')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', emp.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        // 기존 할당량 유지 또는 기본값 설정
        let quota = 5;
        if (existingKPI?.kpi_data?.employees) {
          const existingEmp = existingKPI.kpi_data.employees.find((e: any) => e.id === emp.id);
          if (existingEmp?.blogQuota) {
            quota = existingEmp.blogQuota;
          }
        }

        const completed = count || 0;
        const performance = quota > 0 ? Math.min((completed / quota) * 5, 5) : 0;

        employeeData.push({
          id: emp.id,
          name: emp.name || 'Unknown',
          blogQuota: quota,
          blogCompleted: completed,
          performance: Math.round(performance * 10) / 10
        });
      }
    }

    // 전체 성과 계산
    const totalTarget = Object.values(channels).reduce((sum: number, ch: any) => sum + ch.target, 0);
    const totalActual = Object.values(channels).reduce((sum: number, ch: any) => sum + ch.actual, 0);
    const efficiency = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    const avgEngagement = Object.values(channels).reduce((sum: number, ch: any) => sum + ch.engagement, 0) / Object.keys(channels).length;
    const avgConversion = Object.values(channels).reduce((sum: number, ch: any) => sum + ch.conversion, 0) / Object.keys(channels).length;
    const roi = efficiency * (avgConversion / 2); // 단순화된 ROI 계산

    // AI 기반 추천사항 생성
    const recommendations = [];
    
    if (efficiency < 80) {
      recommendations.push('전체 목표 달성률이 80% 미만입니다. 마케팅 전략 전반적인 재검토가 필요합니다.');
    }

    const underperformingChannels = Object.entries(channels)
      .filter(([_, data]: any) => data.target > 0 && (data.actual / data.target) < 0.8)
      .map(([channel]) => channel);

    if (underperformingChannels.length > 0) {
      recommendations.push(
        `${underperformingChannels.join(', ')} 채널의 성과가 목표 대비 80% 미만입니다. 해당 채널의 콘텐츠 품질과 타겟팅 전략을 개선하세요.`
      );
    }

    const highPerformingChannels = Object.entries(channels)
      .filter(([_, data]: any) => data.target > 0 && (data.actual / data.target) >= 1.2)
      .map(([channel]) => channel);

    if (highPerformingChannels.length > 0) {
      recommendations.push(
        `${highPerformingChannels.join(', ')} 채널이 목표를 20% 이상 초과 달성했습니다. 해당 채널에 대한 투자를 늘리는 것을 고려하세요.`
      );
    }

    const lowEngagementChannels = Object.entries(channels)
      .filter(([_, data]: any) => data.engagement < 3)
      .map(([channel]) => channel);

    if (lowEngagementChannels.length > 0) {
      recommendations.push(
        `${lowEngagementChannels.join(', ')} 채널의 참여율이 낮습니다. 콘텐츠 품질 개선과 타겟 오디언스 재설정이 필요합니다.`
      );
    }

    // KPI 데이터 구성
    const kpiData = {
      year,
      month,
      channels,
      employees: employeeData,
      overall: {
        roi: Math.round(roi * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100,
        recommendations
      }
    };

    // 데이터베이스 업데이트
    if (existingKPI) {
      const { error: updateError } = await supabase
        .from('monthly_kpis')
        .update({ kpi_data: kpiData, updated_at: new Date().toISOString() })
        .eq('id', existingKPI.id);

      if (updateError) throw updateError;
    } else {
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
      message: 'KPI 데이터가 성공적으로 동기화되었습니다.',
      data: kpiData 
    });
  } catch (error) {
    console.error('Error syncing KPI data:', error);
    return res.status(500).json({ error: 'Failed to sync KPI data' });
  }
}