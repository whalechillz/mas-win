import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
    });

    // 실시간 데이터 확인 (최근 1시간)
    const [realtimeResponse] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' }
      ],
      dimensions: [
        { name: 'pagePath' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            value: '/25-08'
          }
        }
      }
    });

    // 최근 이벤트 확인 (오늘)
    const today = new Date().toISOString().split('T')[0];
    const [todayResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: today, endDate: today }],
      metrics: [
        { name: 'eventCount' }
      ],
      dimensions: [
        { name: 'eventName' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            value: 'ab_test_assignment'
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      realtime: {
        activeUsers: realtimeResponse.rows?.[0]?.metricValues?.[0]?.value || '0',
        pageViews: realtimeResponse.rows?.[0]?.metricValues?.[1]?.value || '0'
      },
      todayEvents: {
        abTestEvents: todayResponse.rows?.[0]?.metricValues?.[0]?.value || '0'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('GA4 실시간 데이터 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
