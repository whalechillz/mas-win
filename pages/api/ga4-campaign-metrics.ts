import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: './google-ads-credentials.json',
});

const GA4_PROPERTY_ID = '497433231';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { campaign_id, days = '30' } = req.query;

    // 캠페인별 메트릭 데이터 가져오기
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'campaignName' },
        { name: 'date' }
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'eventCount' },
        { name: 'conversions' }
      ],
      dimensionFilter: campaign_id ? {
        filter: {
          fieldName: 'campaignName',
          stringFilter: {
            matchType: 'EXACT',
            value: campaign_id as string
          }
        }
      } : undefined,
      orderBys: [
        {
          dimension: {
            dimensionName: 'date'
          }
        }
      ]
    });

    // 데이터 정리
    const metrics = response.rows?.map(row => ({
      campaign: row.dimensionValues?.[0]?.value || 'Unknown',
      date: row.dimensionValues?.[1]?.value || '',
      pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      users: parseInt(row.metricValues?.[2]?.value || '0'),
      events: parseInt(row.metricValues?.[3]?.value || '0'),
      conversions: parseInt(row.metricValues?.[4]?.value || '0')
    })) || [];

    res.status(200).json({
      success: true,
      data: metrics,
      totalRows: response.rowCount || 0
    });

  } catch (error) {
    console.error('GA4 Campaign Metrics Error:', error);
    res.status(500).json({ error: 'Failed to fetch GA4 campaign metrics' });
  }
}
