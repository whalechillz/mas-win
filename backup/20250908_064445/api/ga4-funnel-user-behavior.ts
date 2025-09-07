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
    const { path, month = '2025-09' } = req.query;
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (!propertyId) {
      throw new Error('GA4_PROPERTY_ID가 설정되지 않았습니다.');
    }

    if (!path || typeof path !== 'string') {
      throw new Error('퍼널 경로가 필요합니다.');
    }

    const [year, monthNum] = month.toString().split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = `${year}-${monthNum}-${new Date(parseInt(year), parseInt(monthNum), 0).getDate()}`;

    // 1. 퍼널별 세션 메트릭
    const [sessionMetrics] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'screenPageViewsPerSession' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'CONTAINS',
            value: path
          }
        }
      }
    });

    // 2. 퍼널별 디바이스 성능
    const [deviceMetrics] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }, { name: 'pagePath' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'CONTAINS',
            value: path
          }
        }
      }
    });

    // 3. 퍼널별 시간대별 성능
    const [hourlyMetrics] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'hour' }, { name: 'pagePath' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'averageSessionDuration' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'CONTAINS',
            value: path
          }
        }
      }
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
    })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour)) || [];

    // 세션 데이터 집계
    const totalSessions = parseInt(sessionData.metricValues?.[0]?.value || '0');
    const avgSessionDuration = parseFloat(sessionData.metricValues?.[1]?.value || '0');
    const bounceRate = parseFloat(sessionData.metricValues?.[2]?.value || '0');
    const pagesPerSession = parseFloat(sessionData.metricValues?.[3]?.value || '0');

    const funnelUserBehaviorData = {
      // 퍼널 정보
      funnelPath: path,
      month: month,
      
      // 세션 메트릭
      sessionMetrics: {
        totalSessions,
        avgSessionDuration,
        bounceRate,
        pagesPerSession
      },
      
      // 디바이스별 성능
      devicePerformance: deviceData,
      
      // 시간대별 성능
      hourlyPerformance: hourlyData,
      
      // 계산된 지표
      calculatedMetrics: {
        avgSessionDurationMinutes: avgSessionDuration / 60,
        engagementRate: 100 - bounceRate,
        conversionRate: 0 // 전환율은 별도 계산 필요
      },
      
      timestamp: new Date().toISOString(),
      period: `${startDate} to ${endDate}`
    };

    res.status(200).json(funnelUserBehaviorData);
  } catch (error) {
    console.error('GA4 Funnel User Behavior API Error:', error);
    
    // 오류 발생 시 NA 데이터 반환
    const naData = {
      funnelPath: req.query.path,
      month: req.query.month,
      sessionMetrics: {
        totalSessions: 'NA',
        avgSessionDuration: 'NA',
        bounceRate: 'NA',
        pagesPerSession: 'NA'
      },
      devicePerformance: [
        { device: 'desktop', users: 'NA', pageViews: 'NA', avgSessionDuration: 'NA', bounceRate: 'NA' },
        { device: 'mobile', users: 'NA', pageViews: 'NA', avgSessionDuration: 'NA', bounceRate: 'NA' },
        { device: 'tablet', users: 'NA', pageViews: 'NA', avgSessionDuration: 'NA', bounceRate: 'NA' }
      ],
      hourlyPerformance: Array.from({ length: 24 }, (_, i) => ({
        hour: String(i).padStart(2, '0'),
        users: 'NA',
        pageViews: 'NA',
        sessions: 'NA',
        avgSessionDuration: 'NA'
      })),
      calculatedMetrics: {
        avgSessionDurationMinutes: 'NA',
        engagementRate: 'NA',
        conversionRate: 'NA'
      },
      timestamp: new Date().toISOString(),
      period: 'NA',
      status: 'error',
      note: 'GA4 API 연결 실패 - NA로 표시'
    };
    
    res.status(200).json(naData);
  }
}
