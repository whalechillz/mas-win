// components/admin/dashboard/RealtimeMetrics.tsx
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const useRealCampaignMetrics = (campaignId = '2025-07') => {
  const [metrics, setMetrics] = useState({
    views: 0,
    phoneClicks: 0,
    formSubmissions: 0,
    conversionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      // campaign_metrics 테이블에서 데이터 가져오기
      const { data: metricsData, error: metricsError } = await supabase
        .from('campaign_metrics')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (metricsData) {
        setMetrics({
          views: metricsData.views || 0,
          phoneClicks: metricsData.phone_clicks || 0,
          formSubmissions: metricsData.form_submissions || 0,
          conversionRate: metricsData.conversion_rate || 0
        });
      } else {
        // 데이터가 없으면 page_views 테이블에서 카운트
        const { count } = await supabase
          .from('page_views')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId);

        setMetrics(prev => ({ ...prev, views: count || 0 }));
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 초기 로드
    fetchMetrics();

    // 5초마다 업데이트
    const interval = setInterval(fetchMetrics, 5000);

    // 실시간 구독 설정
    const subscription = supabase
      .channel('campaign-metrics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campaign_metrics',
        filter: `campaign_id=eq.${campaignId}`
      }, () => {
        fetchMetrics();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'page_views',
        filter: `campaign_id=eq.${campaignId}`
      }, () => {
        fetchMetrics();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [campaignId]);

  return { metrics, isLoading };
};
