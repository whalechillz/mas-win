// Analytics API
// /pages/api/content-calendar/analytics.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';
import ContentPerformanceAnalyzer from '@/lib/analytics/content-performance';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { dateRange, contentType, contentId } = req.body;

  try {
    // 성과 분석기 인스턴스
    const analyzer = new ContentPerformanceAnalyzer({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_KEY!,
      ga4MeasurementId: process.env.GA4_MEASUREMENT_ID!
    });

    // 특정 콘텐츠 분석
    if (contentId) {
      const analysis = await analyzer.analyzeContent(contentId);
      
      return res.status(200).json({
        success: true,
        data: analysis
      });
    }

    // 날짜 범위 계산
    const { startDate, endDate } = calculateDateRange(dateRange);

    // 쿼리 빌드
    let query = supabase
      .from('content_performance')
      .select(`
        *,
        content_calendar!inner(
          id,
          title,
          content_type,
          content_date
        )
      `)
      .gte('measurement_date', startDate.toISOString())
      .lte('measurement_date', endDate.toISOString());

    // 콘텐츠 타입 필터
    if (contentType && contentType !== 'all') {
      query = query.eq('content_calendar.content_type', contentType);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 데이터 집계
    const aggregatedData = aggregatePerformanceData(data || []);

    // 추가 분석
    const insights = await generateInsights(aggregatedData);

    return res.status(200).json({
      success: true,
      data: {
        raw: data,
        aggregated: aggregatedData,
        insights,
        dateRange: { startDate, endDate }
      }
    });

  } catch (error: any) {
    console.error('Analytics error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analytics'
    });
  }
}

function calculateDateRange(range: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();

  switch (range) {
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(endDate.getMonth() - 1);
  }

  return { startDate, endDate };
}

function aggregatePerformanceData(data: any[]): any {
  const aggregated = {
    totalViews: 0,
    totalEngagement: 0,
    totalConversions: 0,
    totalRevenue: 0,
    avgEngagementRate: 0,
    avgConversionRate: 0,
    byContentType: {} as any,
    byDate: {} as any,
    topPerformers: [] as any[]
  };

  // 총계 계산
  data.forEach(item => {
    aggregated.totalViews += item.views || 0;
    aggregated.totalEngagement += item.engagement_count || 0;
    aggregated.totalConversions += item.conversions || 0;
    aggregated.totalRevenue += item.revenue_impact || 0;

    // 콘텐츠 타입별 집계
    const contentType = item.content_calendar?.content_type;
    if (contentType) {
      if (!aggregated.byContentType[contentType]) {
        aggregated.byContentType[contentType] = {
          views: 0,
          engagement: 0,
          conversions: 0,
          revenue: 0,
          count: 0
        };
      }
      aggregated.byContentType[contentType].views += item.views || 0;
      aggregated.byContentType[contentType].engagement += item.engagement_count || 0;
      aggregated.byContentType[contentType].conversions += item.conversions || 0;
      aggregated.byContentType[contentType].revenue += item.revenue_impact || 0;
      aggregated.byContentType[contentType].count++;
    }

    // 날짜별 집계
    const date = item.measurement_date;
    if (date) {
      const dateKey = date.split('T')[0];
      if (!aggregated.byDate[dateKey]) {
        aggregated.byDate[dateKey] = {
          views: 0,
          engagement: 0,
          conversions: 0
        };
      }
      aggregated.byDate[dateKey].views += item.views || 0;
      aggregated.byDate[dateKey].engagement += item.engagement_count || 0;
      aggregated.byDate[dateKey].conversions += item.conversions || 0;
    }
  });

  // 평균 계산
  if (data.length > 0) {
    const totalEngagementRate = data.reduce((sum, item) => sum + (item.engagement_rate || 0), 0);
    const totalConversionRate = data.reduce((sum, item) => sum + (item.conversion_rate || 0), 0);
    aggregated.avgEngagementRate = totalEngagementRate / data.length;
    aggregated.avgConversionRate = totalConversionRate / data.length;
  }

  // 상위 성과 콘텐츠
  aggregated.topPerformers = data
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 10)
    .map(item => ({
      contentId: item.content_id,
      title: item.content_calendar?.title,
      views: item.views,
      engagementRate: item.engagement_rate,
      conversionRate: item.conversion_rate,
      revenue: item.revenue_impact
    }));

  return aggregated;
}

async function generateInsights(data: any): Promise<any[]> {
  const insights = [];

  // 조회수 인사이트
  if (data.totalViews > 100000) {
    insights.push({
      type: 'success',
      message: '높은 조회수를 기록했습니다. 콘텐츠 도달률이 우수합니다.',
      metric: 'views',
      value: data.totalViews
    });
  }

  // 참여율 인사이트
  if (data.avgEngagementRate > 5) {
    insights.push({
      type: 'success',
      message: '평균 참여율이 업계 평균을 상회합니다.',
      metric: 'engagement',
      value: data.avgEngagementRate
    });
  } else if (data.avgEngagementRate < 2) {
    insights.push({
      type: 'warning',
      message: '참여율 개선이 필요합니다. 콘텐츠 품질을 점검하세요.',
      metric: 'engagement',
      value: data.avgEngagementRate
    });
  }

  // 전환율 인사이트
  if (data.avgConversionRate > 3) {
    insights.push({
      type: 'success',
      message: '전환율이 우수합니다. CTA 전략이 효과적입니다.',
      metric: 'conversion',
      value: data.avgConversionRate
    });
  }

  // 콘텐츠 타입별 인사이트
  const bestPerformingType = Object.keys(data.byContentType).reduce((best, type) => {
    if (!best || data.byContentType[type].views > data.byContentType[best].views) {
      return type;
    }
    return best;
  }, '');

  if (bestPerformingType) {
    insights.push({
      type: 'info',
      message: `${bestPerformingType} 타입 콘텐츠가 가장 높은 성과를 보이고 있습니다.`,
      metric: 'contentType',
      value: bestPerformingType
    });
  }

  return insights;
}
