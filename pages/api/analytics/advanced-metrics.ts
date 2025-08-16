import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { dateRange = 'month', campaignId } = req.query;

  try {
    // GA4 클라이언트 초기화
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

    // 1. 기본 세션 메트릭 조회
    const [sessionResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'screenPageViewsPerSession' },
        { name: 'activeUsers' }
      ],
      dimensions: [{ name: 'date' }]
    });

    // 2. 디바이스 분포 조회
    const [deviceResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'sessions' }],
      dimensions: [{ name: 'deviceCategory' }]
    });

    // 데이터 가공
    const sessionData = sessionResponse.rows?.[0]?.metricValues || [];
    const deviceData = deviceResponse.rows || [];

    const processedData = {
      dateRange: { startDate, endDate },
      sessionMetrics: {
        totalSessions: parseInt(sessionData[0]?.value || '0'),
        averageSessionDuration: parseInt(sessionData[1]?.value || '0'),
        bounceRate: parseFloat(sessionData[2]?.value || '0'),
        pagesPerSession: parseFloat(sessionData[3]?.value || '0'),
        activeUsers: parseInt(sessionData[4]?.value || '0')
      },
      funnelMetrics: {
        // 현재는 모의 데이터 (나중에 커스텀 이벤트로 구현)
        heroToQuiz: 67.3,
        quizStartToComplete: 89.2,
        quizToBooking: 34.7,
        overallConversion: 21.8
      },
      userBehavior: {
        scrollDepth: {
          '25%': 78,
          '50%': 65,
          '75%': 42,
          '100%': 28
        },
        timeOnPage: {
          '0-30s': 35,
          '30s-2m': 45,
          '2m-5m': 15,
          '5m+': 5
        },
        deviceBreakdown: {
          mobile: deviceData.find(d => d.dimensionValues?.[0]?.value === 'mobile')?.metricValues?.[0]?.value || '0',
          desktop: deviceData.find(d => d.dimensionValues?.[0]?.value === 'desktop')?.metricValues?.[0]?.value || '0',
          tablet: deviceData.find(d => d.dimensionValues?.[0]?.value === 'tablet')?.metricValues?.[0]?.value || '0'
        }
      },
      performanceMetrics: {
        pageLoadTime: 2.3,
        firstContentfulPaint: 1.2,
        largestContentfulPaint: 2.8
      }
    };

    res.status(200).json(processedData);

  } catch (error) {
    console.error('고급 분석 데이터 조회 실패:', error);
    
    // 오류 시 모의 데이터 반환
    const fallbackData = {
      dateRange: { startDate: '2025-08-01', endDate: '2025-08-31' },
      sessionMetrics: {
        totalSessions: 0,
        averageSessionDuration: 0,
        bounceRate: 0,
        pagesPerSession: 0,
        activeUsers: 0
      },
      funnelMetrics: {
        heroToQuiz: 0,
        quizStartToComplete: 0,
        quizToBooking: 0,
        overallConversion: 0
      },
      userBehavior: {
        scrollDepth: { '25%': 0, '50%': 0, '75%': 0, '100%': 0 },
        timeOnPage: { '0-30s': 0, '30s-2m': 0, '2m-5m': 0, '5m+': 0 },
        deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 }
      },
      performanceMetrics: {
        pageLoadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    res.status(200).json(fallbackData);
  }
}
