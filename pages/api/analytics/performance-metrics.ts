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

    // 성능 메트릭 조회
    const [performanceResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'averageSessionDuration' },
        { name: 'screenPageViewsPerSession' }
      ],
      dimensions: [
        { name: 'deviceCategory' }
      ]
    });

    // 커스텀 성능 이벤트 조회 (실제 수집되는 이벤트)
    const [customPerformanceResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'eventCount' }
      ],
      dimensions: [
        { name: 'eventName' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: [
              'page_performance',
              'largest_contentful_paint'
            ]
          }
        }
      }
    });

    // 데이터 가공
    const performanceData = performanceResponse.rows || [];
    const customPerformanceData = customPerformanceResponse.rows || [];

    console.log('성능 데이터:', {
      performanceData: performanceData.length,
      customPerformanceData: customPerformanceData.length
    });

    // 실제 성능 데이터 계산
    const pagePerformanceEvents = customPerformanceData.find(row => 
      row.dimensionValues?.[0]?.value === 'page_performance'
    );
    const lcpEvents = customPerformanceData.find(row => 
      row.dimensionValues?.[0]?.value === 'largest_contentful_paint'
    );

    const pageLoadTime = pagePerformanceEvents ? 
      parseInt(pagePerformanceEvents.metricValues?.[0]?.value || '0') : 0;
    const firstContentfulPaint = pagePerformanceEvents ? 
      parseInt(pagePerformanceEvents.metricValues?.[0]?.value || '0') : 0;
    const largestContentfulPaint = lcpEvents ? 
      parseInt(lcpEvents.metricValues?.[0]?.value || '0') : 0;

    // 디바이스별 성능 계산
    const devicePerformance = {
      mobile: {
        avgLoadTime: 0,
        avgFCP: 0,
        avgLCP: 0
      },
      desktop: {
        avgLoadTime: 0,
        avgFCP: 0,
        avgLCP: 0
      },
      tablet: {
        avgLoadTime: 0,
        avgFCP: 0,
        avgLCP: 0
      }
    };

    // 커스텀 성능 메트릭 처리
    customPerformanceData.forEach(row => {
      const eventName = row.dimensionValues?.[0]?.value;
      const value = parseFloat(row.dimensionValues?.[1]?.value || '0');
      const count = parseInt(row.metricValues?.[0]?.value || '0');
      
      if (eventName === 'page_load_time') {
        devicePerformance.mobile.avgLoadTime = value;
        devicePerformance.desktop.avgLoadTime = value;
        devicePerformance.tablet.avgLoadTime = value;
      } else if (eventName === 'first_contentful_paint') {
        devicePerformance.mobile.avgFCP = value;
        devicePerformance.desktop.avgFCP = value;
        devicePerformance.tablet.avgFCP = value;
      } else if (eventName === 'largest_contentful_paint') {
        devicePerformance.mobile.avgLCP = value;
        devicePerformance.desktop.avgLCP = value;
        devicePerformance.tablet.avgLCP = value;
      }
    });

    res.status(200).json({
      success: true,
      overall: {
        pageLoadTime: pageLoadTime / 1000, // ms를 초로 변환
        firstContentfulPaint: firstContentfulPaint / 1000,
        largestContentfulPaint: largestContentfulPaint / 1000
      },
      byDevice: devicePerformance,
      totalSessions: performanceData.reduce((sum, row) => {
        return sum + parseInt(row.metricValues?.[0]?.value || '0');
      }, 0),
      note: '실제 GA4 성능 데이터'
    });

  } catch (error) {
    console.error('성능 메트릭 조회 실패:', error);
    
    // 오류 시 모의 데이터 반환
    const fallbackData = {
      dateRange: { startDate: '2025-08-01', endDate: '2025-08-31' },
      overall: {
        pageLoadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0
      },
      byDevice: {
        mobile: { avgLoadTime: 0, avgFCP: 0, avgLCP: 0 },
        desktop: { avgLoadTime: 0, avgFCP: 0, avgLCP: 0 },
        tablet: { avgLoadTime: 0, avgFCP: 0, avgLCP: 0 }
      },
      totalSessions: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    res.status(200).json(fallbackData);
  }
}
