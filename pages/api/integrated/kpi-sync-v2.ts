import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '../../../lib/supabase';

// 외부 데이터 소스에서 채널별 실적 데이터 가져오기 (실제 구현시 각 플랫폼 API 연동)
async function fetchChannelMetrics(year: number, month: number, channel: string) {
  // TODO: 실제 외부 API 연동
  // Google Analytics, Instagram API, Email Service Provider API 등
  
  // 임시 데이터
  const mockData = {
    blog: {
      views: Math.floor(Math.random() * 10000) + 5000,
      engagement: Math.floor(Math.random() * 500) + 100,
      conversion: Math.floor(Math.random() * 50) + 10
    },
    instagram: {
      reach: Math.floor(Math.random() * 20000) + 10000,
      engagement: Math.floor(Math.random() * 2000) + 500,
      conversion: Math.floor(Math.random() * 100) + 20
    },
    kakao: {
      sent: Math.floor(Math.random() * 5000) + 1000,
      opened: Math.floor(Math.random() * 3000) + 500,
      clicked: Math.floor(Math.random() * 500) + 50
    },
    email: {
      sent: Math.floor(Math.random() * 10000) + 5000,
      opened: Math.floor(Math.random() * 3000) + 1000,
      clicked: Math.floor(Math.random() * 500) + 100
    },
    sms: {
      sent: Math.floor(Math.random() * 3000) + 1000,
      delivered: Math.floor(Math.random() * 2800) + 950,
      clicked: Math.floor(Math.random() * 200) + 50
    }
  };

  return mockData[channel] || {};
}

// ROI 계산 함수
function calculateROI(revenue: number, cost: number): number {
  if (cost === 0) return 0;
  return Math.round(((revenue - cost) / cost) * 100);
}

// 효율성 점수 계산 함수
function calculateEfficiency(channels: any): number {
  let totalScore = 0;
  let channelCount = 0;

  Object.keys(channels).forEach(channel => {
    const data = channels[channel];
    if (data.target > 0) {
      const achievementRate = (data.actual / data.target) * 100;
      totalScore += Math.min(achievementRate, 100);
      channelCount++;
    }
  });

  return channelCount > 0 ? Math.round(totalScore / channelCount) : 0;
}

// AI 추천사항 생성 함수
function generateRecommendations(kpiData: any): string[] {
  const recommendations = [];
  const efficiency = kpiData.overall.efficiency;

  if (efficiency < 70) {
    recommendations.push('전반적인 목표 달성률이 낮습니다. 채널별 전략 재검토가 필요합니다.');
  }

  // 채널별 분석
  Object.entries(kpiData.channels).forEach(([channel, data]: [string, any]) => {
    if (data.target > 0) {
      const achievementRate = (data.actual / data.target) * 100;
      
      if (achievementRate < 50) {
        recommendations.push(`${channel} 채널의 성과가 목표 대비 50% 미만입니다. 콘텐츠 품질 개선이 필요합니다.`);
      } else if (achievementRate > 120) {
        recommendations.push(`${channel} 채널이 목표를 초과 달성했습니다. 목표 상향 조정을 고려하세요.`);
      }
      
      if (data.conversion > 0 && data.engagement > 0) {
        const conversionRate = (data.conversion / data.engagement) * 100;
        if (conversionRate < 2) {
          recommendations.push(`${channel} 채널의 전환율이 낮습니다. CTA 메시지 강화가 필요합니다.`);
        }
      }
    }
  });

  // 직원 성과 분석
  if (kpiData.employees && kpiData.employees.length > 0) {
    const avgPerformance = kpiData.employees.reduce((sum, emp) => sum + emp.performance, 0) / kpiData.employees.length;
    if (avgPerformance < 80) {
      recommendations.push('직원들의 블로그 작성 목표 달성률이 낮습니다. 교육 및 지원이 필요할 수 있습니다.');
    }
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
    switch (method) {
      case 'POST':
        const { year, month, channels = ['blog', 'instagram', 'kakao', 'email', 'sms'] } = body;

        if (!year || !month) {
          return res.status(400).json({ error: 'year와 month는 필수입니다.' });
        }

        // 현재 KPI 데이터 조회
        const { data: currentKPI, error: fetchError } = await supabase
          .from('monthly_kpis')
          .select('*')
          .eq('year', year)
          .eq('month', month)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        // 각 채널별로 외부 데이터 동기화
        const syncedChannels = {};
        let totalRevenue = 0;
        let totalCost = 0;

        for (const channel of channels) {
          const metrics = await fetchChannelMetrics(year, month, channel);
          
          const channelData = currentKPI?.kpi_data?.channels?.[channel] || {
            target: 0,
            actual: 0,
            posts: 0,
            engagement: 0,
            conversion: 0
          };

          // 실제 값 업데이트
          syncedChannels[channel] = {
            ...channelData,
            actual: metrics.views || metrics.reach || metrics.sent || channelData.actual,
            engagement: metrics.engagement || metrics.opened || channelData.engagement,
            conversion: metrics.conversion || metrics.clicked || channelData.conversion
          };

          // 임시 수익/비용 계산 (실제로는 각 플랫폼에서 가져와야 함)
          totalRevenue += (metrics.conversion || 0) * 50000; // 전환당 5만원 가정
          totalCost += channelData.posts * 100000; // 게시물당 10만원 비용 가정
        }

        // 생성된 콘텐츠 수 조회
        const { data: contentCounts } = await supabase
          .from('generated_contents')
          .select('channel, status')
          .eq('funnel_plan_id', currentKPI?.id)
          .in('status', ['published', 'validated']);

        if (contentCounts) {
          contentCounts.forEach(content => {
            if (syncedChannels[content.channel]) {
              syncedChannels[content.channel].posts = 
                (syncedChannels[content.channel].posts || 0) + 
                (content.status === 'published' ? 1 : 0);
            }
          });
        }

        // KPI 데이터 업데이트
        const updatedKpiData = {
          ...currentKPI?.kpi_data,
          channels: syncedChannels,
          overall: {
            roi: calculateROI(totalRevenue, totalCost),
            efficiency: calculateEfficiency(syncedChannels),
            recommendations: [],
            lastSyncedAt: new Date().toISOString()
          }
        };

        // 추천사항 생성
        updatedKpiData.overall.recommendations = generateRecommendations(updatedKpiData);

        // KPI 업데이트 또는 생성
        if (currentKPI) {
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

          return res.status(200).json({ 
            data: updated,
            summary: {
              synced: channels.length,
              totalRevenue,
              totalCost,
              roi: updatedKpiData.overall.roi,
              efficiency: updatedKpiData.overall.efficiency
            }
          });
        } else {
          const { data: created, error: createError } = await supabase
            .from('monthly_kpis')
            .insert({
              year,
              month,
              kpi_data: updatedKpiData
            })
            .select()
            .single();

          if (createError) throw createError;

          return res.status(201).json({ 
            data: created,
            summary: {
              synced: channels.length,
              totalRevenue,
              totalCost,
              roi: updatedKpiData.overall.roi,
              efficiency: updatedKpiData.overall.efficiency
            }
          });
        }

      default:
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('KPI Sync API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: error 
    });
  }
}
