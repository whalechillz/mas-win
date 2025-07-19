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
            .select(`
              *,
              monthly_funnel_plans (
                theme,
                status,
                funnel_data
              )
            `)
            .eq('year', year)
            .eq('month', month)
            .single();

          if (error && error.code !== 'PGRST116') {
            // KPI가 없으면 빈 데이터 반환
            return res.status(200).json({ 
              data: {
                year: parseInt(year as string),
                month: parseInt(month as string),
                kpi_data: {
                  channels: {
                    blog: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 },
                    kakao: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 },
                    sms: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 },
                    email: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 },
                    instagram: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 }
                  },
                  employees: [],
                  overall: {
                    roi: 0,
                    efficiency: 0,
                    recommendations: []
                  }
                }
              }
            });
          }

          // 콘텐츠 통계 추가 조회
          const { data: contentStats } = await supabase
            .from('generated_contents')
            .select('channel, status')
            .eq('funnel_plan_id', data?.monthly_funnel_plans?.id);

          if (data && contentStats) {
            // 채널별 실제 게시물 수 계산
            const channelCounts = contentStats.reduce((acc, item) => {
              if (!acc[item.channel]) {
                acc[item.channel] = { total: 0, published: 0 };
              }
              acc[item.channel].total++;
              if (item.status === 'published') {
                acc[item.channel].published++;
              }
              return acc;
            }, {});

            // KPI 데이터에 실제 값 병합
            Object.keys(channelCounts).forEach(channel => {
              if (data.kpi_data.channels[channel]) {
                data.kpi_data.channels[channel].posts = channelCounts[channel].published;
              }
            });
          }

          return res.status(200).json({ data });
        } else {
          // 전체 KPI 목록 조회
          const { data, error } = await supabase
            .from('monthly_kpis')
            .select(`
              *,
              monthly_funnel_plans (
                theme,
                status
              )
            `)
            .order('year', { ascending: false })
            .order('month', { ascending: false });

          if (error) throw error;

          return res.status(200).json({ data });
        }

      case 'POST':
        // 새 KPI 생성 또는 업데이트
        const { year, month, kpi_data } = body;

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

        const kpiPayload = {
          year,
          month,
          kpi_data: kpi_data || {
            channels: {
              blog: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 },
              kakao: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 },
              sms: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 },
              email: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 },
              instagram: { target: 0, actual: 0, posts: 0, engagement: 0, conversion: 0 }
            },
            employees: [],
            overall: {
              roi: 0,
              efficiency: 0,
              recommendations: []
            }
          }
        };

        if (existing) {
          // 업데이트
          const { data: updated, error: updateError } = await supabase
            .from('monthly_kpis')
            .update(kpiPayload)
            .eq('id', existing.id)
            .select()
            .single();

          if (updateError) throw updateError;

          return res.status(200).json({ data: updated });
        } else {
          // 생성
          const { data: created, error: createError } = await supabase
            .from('monthly_kpis')
            .insert(kpiPayload)
            .select()
            .single();

          if (createError) throw createError;

          return res.status(201).json({ data: created });
        }

      case 'PUT':
        // KPI 업데이트
        if (!query.year || !query.month) {
          return res.status(400).json({ error: 'year와 month가 필요합니다.' });
        }

        // 기존 데이터 조회
        const { data: currentKPI, error: fetchError } = await supabase
          .from('monthly_kpis')
          .select('*')
          .eq('year', query.year)
          .eq('month', query.month)
          .single();

        if (fetchError) throw fetchError;

        // 부분 업데이트 (기존 데이터와 병합)
        const updatedKpiData = {
          ...currentKPI.kpi_data,
          ...body.kpi_data
        };

        const { data: updated, error: updateError } = await supabase
          .from('monthly_kpis')
          .update({
            kpi_data: updatedKpiData,
            updated_at: new Date().toISOString()
          })
          .eq('year', query.year)
          .eq('month', query.month)
          .select()
          .single();

        if (updateError) throw updateError;

        return res.status(200).json({ data: updated });

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
