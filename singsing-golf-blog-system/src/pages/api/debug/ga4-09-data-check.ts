import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID;
    
    if (!propertyId) {
      return res.status(500).json({ error: 'GA4_PROPERTY_ID not configured' });
    }

    // 9월 퍼널 관련 경로들 확인
    const pathsToCheck = [
      '/25-09',
      '/versions/funnel-2025-09-live.html',
      '/funnel-2025-09',
      '/campaigns/2025-09'
    ];

    const results: any = {};

    for (const path of pathsToCheck) {
      try {
        // 9월 1일부터 오늘까지 데이터 조회
        const [response] = await analyticsDataClient.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: '2025-09-01', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'totalUsers' },
            { name: 'sessions' }
          ],
          dimensionFilter: {
            filter: {
              fieldName: 'pagePath',
              stringFilter: {
                matchType: 'EXACT',
                value: path
              }
            }
          }
        });

        const row = response.rows?.[0];
        results[path] = {
          pageViews: row?.metricValues?.[0]?.value || '0',
          users: row?.metricValues?.[1]?.value || '0',
          sessions: row?.metricValues?.[2]?.value || '0',
          found: !!row
        };
      } catch (error) {
        results[path] = {
          error: error.message,
          found: false
        };
      }
    }

    // 전체 9월 데이터도 확인
    try {
      const [totalResponse] = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '2025-09-01', endDate: 'today' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'totalUsers' },
          { name: 'sessions' }
        ]
      });

      const totalRow = totalResponse.rows?.[0];
      results['total_september'] = {
        pageViews: totalRow?.metricValues?.[0]?.value || '0',
        users: totalRow?.metricValues?.[1]?.value || '0',
        sessions: totalRow?.metricValues?.[2]?.value || '0'
      };
    } catch (error) {
      results['total_september'] = {
        error: error.message
      };
    }

    res.status(200).json({
      success: true,
      propertyId,
      dateRange: '2025-09-01 to today',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('GA4 9월 데이터 확인 오류:', error);
    res.status(500).json({
      error: 'GA4 API 오류',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
