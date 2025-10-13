import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { dateRange = 'month', campaignId } = req.query;

  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
    });

    // 날짜 범위 설정
    const getDateRange = () => {
      const today = new Date();
      switch (dateRange) {
        case 'today':
          return {
            startDate: today.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
          };
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          return {
            startDate: weekStart.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
          };
        case 'month':
        default:
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          return {
            startDate: monthStart.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
          };
      }
    };

    const { startDate, endDate } = getDateRange();

    // 스크롤 깊이 이벤트 조회 (수정된 버전)
    const [scrollResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'eventCount' }
      ],
      dimensions: [
        { name: 'eventName' },
        { name: 'eventParameter:scroll_percentage' }  // GA4 이벤트 파라미터로 수정
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            value: 'scroll_depth'
          }
        }
      }
    });

    // 데이터 가공
    const scrollData = scrollResponse.rows || [];
    
    console.log('GA4 스크롤 데이터 원본:', scrollData);
    
    // 스크롤 깊이별 사용자 수 계산
    const scrollDepthData = {
      '25%': 0,
      '50%': 0,
      '75%': 0,
      '100%': 0
    };

    scrollData.forEach(row => {
      const depth = row.dimensionValues?.[1]?.value; // eventParameter:scroll_percentage
      const count = parseInt(row.metricValues?.[0]?.value || '0');
      
      console.log('스크롤 깊이 데이터:', { depth, count });
      
      if (depth === '25') scrollDepthData['25%'] = count;
      else if (depth === '50') scrollDepthData['50%'] = count;
      else if (depth === '75') scrollDepthData['75%'] = count;
      else if (depth === '100') scrollDepthData['100%'] = count;
    });

    // 체류 시간 분석
    const [timeResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'eventCount' }
      ],
      dimensions: [
        { name: 'eventName' },
        { name: 'customEvent:time_on_page' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            value: 'time_on_page'
          }
        }
      }
    });

    const timeData = timeResponse.rows || [];
    const timeOnPageData = {
      '0-30s': 0,
      '30s-2m': 0,
      '2m-5m': 0,
      '5m+': 0
    };

    timeData.forEach(row => {
      const timeRange = row.dimensionValues?.[1]?.value;
      const count = parseInt(row.metricValues?.[0]?.value || '0');
      
      if (timeRange === '0-30s') timeOnPageData['0-30s'] = count;
      else if (timeRange === '30s-2m') timeOnPageData['30s-2m'] = count;
      else if (timeRange === '2m-5m') timeOnPageData['2m-5m'] = count;
      else if (timeRange === '5m+') timeOnPageData['5m+'] = count;
    });

    const scrollMetrics = {
      dateRange: { startDate, endDate },
      scrollDepth: scrollDepthData,
      timeOnPage: timeOnPageData,
      totalUsers: Object.values(scrollDepthData).reduce((sum, count) => sum + count, 0)
    };

    res.status(200).json(scrollMetrics);

  } catch (error) {
    console.error('스크롤 메트릭 조회 실패:', error);
    
    // 오류 시 모의 데이터 반환
    const fallbackData = {
      dateRange: { startDate: '2025-08-01', endDate: '2025-08-31' },
      scrollDepth: { '25%': 0, '50%': 0, '75%': 0, '100%': 0 },
      timeOnPage: { '0-30s': 0, '30s-2m': 0, '2m-5m': 0, '5m+': 0 },
      totalUsers: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    res.status(200).json(fallbackData);
  }
}
