import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { days = '30' } = req.query;
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (!propertyId) {
      throw new Error('GA4_PROPERTY_ID가 설정되지 않았습니다.');
    }

    // 1. 세션 지속 시간 및 바운스율
    const [sessionMetrics] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      metrics: [
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'screenPageViewsPerSession' }
      ]
    });

    // 2. 디바이스별 성능
    const [deviceMetrics] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ]
    });

    // 3. 시간대별 성능 (평균 세션 지속 시간 추가)
    const [hourlyMetrics] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'hour' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'averageSessionDuration' }
      ]
    });

    // 4. 페이지별 성능
    const [pageMetrics] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'exitRate' }
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10
    });

    // 5. 사용자 행동 흐름 (이벤트 기반)
    const [eventMetrics] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'eventName' }],
      metrics: [
        { name: 'eventCount' },
        { name: 'totalUsers' }
      ],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 10
    });

    // 데이터 정리
    const sessionData = sessionMetrics.rows?.[0] || {};
    const deviceData = deviceMetrics.rows?.map(row => ({
      device: row.dimensionValues?.[0]?.value || 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      pageViews: parseInt(row.metricValues?.[1]?.value || '0'),
      avgSessionDuration: parseFloat(row.metricValues?.[2]?.value || '0'),
      bounceRate: parseFloat(row.metricValues?.[3]?.value || '0')
    })) || [];

    const hourlyData = hourlyMetrics.rows?.map(row => ({
      hour: row.dimensionValues?.[0]?.value || '00',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      pageViews: parseInt(row.metricValues?.[1]?.value || '0'),
      sessions: parseInt(row.metricValues?.[2]?.value || '0'),
      avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || '0')
    })) || [];

    const pageData = pageMetrics.rows?.map(row => ({
      page: row.dimensionValues?.[0]?.value || 'Unknown',
      pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
      avgSessionDuration: parseFloat(row.metricValues?.[1]?.value || '0'),
      bounceRate: parseFloat(row.metricValues?.[2]?.value || '0'),
      exitRate: parseFloat(row.metricValues?.[3]?.value || '0')
    })) || [];

    const eventData = eventMetrics.rows?.map(row => ({
      event: row.dimensionValues?.[0]?.value || 'Unknown',
      count: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0')
    })) || [];

    const userBehaviorData = {
      // 세션 메트릭
      sessionMetrics: {
        totalSessions: parseInt(sessionData.metricValues?.[0]?.value || '0'),
        avgSessionDuration: parseFloat(sessionData.metricValues?.[1]?.value || '0'),
        bounceRate: parseFloat(sessionData.metricValues?.[2]?.value || '0'),
        pagesPerSession: parseFloat(sessionData.metricValues?.[3]?.value || '0')
      },
      
      // 디바이스별 성능
      devicePerformance: deviceData,
      
      // 시간대별 성능
      hourlyPerformance: hourlyData,
      
      // 페이지별 성능
      pagePerformance: pageData,
      
      // 이벤트 분석
      eventAnalysis: eventData,
      
      // 계산된 지표
      calculatedMetrics: {
        avgSessionDurationMinutes: parseFloat(sessionData.metricValues?.[1]?.value || '0') / 60,
        engagementRate: 100 - parseFloat(sessionData.metricValues?.[2]?.value || '0'),
        conversionRate: eventData.find(e => e.event === 'conversion')?.count || 0
      },
      
      timestamp: new Date().toISOString(),
      period: `${days}daysAgo to today`
    };

    res.status(200).json(userBehaviorData);
  } catch (error) {
    console.error('GA4 User Behavior API Error:', error);
    
    // 오류 발생 시 모의 데이터 반환
    const mockData = {
      sessionMetrics: {
        totalSessions: 1250,
        avgSessionDuration: 180,
        bounceRate: 35.5,
        pagesPerSession: 2.8
      },
      devicePerformance: [
        { device: 'desktop', users: 450, pageViews: 1200, avgSessionDuration: 240, bounceRate: 28.5 },
        { device: 'mobile', users: 380, pageViews: 980, avgSessionDuration: 120, bounceRate: 42.3 },
        { device: 'tablet', users: 70, pageViews: 180, avgSessionDuration: 200, bounceRate: 31.2 }
      ],
      hourlyPerformance: Array.from({ length: 24 }, (_, i) => ({
        hour: String(i).padStart(2, '0'),
        users: Math.floor(Math.random() * 50) + 10,
        pageViews: Math.floor(Math.random() * 150) + 30,
        sessions: Math.floor(Math.random() * 80) + 20,
        avgSessionDuration: Math.floor(Math.random() * 300) + 60 // 1-6분 범위
      })),
      pagePerformance: [
        { page: '/', pageViews: 850, avgSessionDuration: 180, bounceRate: 25.5, exitRate: 15.2 },
        { page: '/quiz', pageViews: 420, avgSessionDuration: 300, bounceRate: 18.3, exitRate: 22.1 },
        { page: '/booking', pageViews: 180, avgSessionDuration: 240, bounceRate: 12.5, exitRate: 8.7 }
      ],
      eventAnalysis: [
        { event: 'page_view', count: 2500, users: 900 },
        { event: 'quiz_start', count: 450, users: 420 },
        { event: 'quiz_complete', count: 180, users: 175 },
        { event: 'phone_click', count: 85, users: 82 },
        { event: 'booking_form_view', count: 120, users: 115 }
      ],
      calculatedMetrics: {
        avgSessionDurationMinutes: 3.0,
        engagementRate: 64.5,
        conversionRate: 180
      },
      timestamp: new Date().toISOString(),
      period: `${req.query.days || '30'}daysAgo to today`,
      status: 'mock_data',
      note: '실제 데이터 수집 중 - 모의 데이터 표시 (그래프 렌더링용)'
    };
    
    res.status(200).json(mockData);
  }
}
