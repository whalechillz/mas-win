import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: './google-ads-credentials.json',
});

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || '497433231';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { campaign_id } = req.query;

    // 실시간 데이터 가져오기
    const [response] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dimensions: [
        { name: 'pagePath' },
        { name: 'campaignName' }
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'eventCount' }
      ],
      dimensionFilter: campaign_id ? {
        filter: {
          fieldName: 'campaignName',
          stringFilter: {
            matchType: 'EXACT',
            value: campaign_id as string
          }
        }
      } : undefined
    });

    const data = {
      activeUsers: response.rows?.[0]?.metricValues?.[0]?.value || '0',
      pageViews: response.rows?.[0]?.metricValues?.[1]?.value || '0',
      events: response.rows?.[0]?.metricValues?.[2]?.value || '0',
      timestamp: new Date().toISOString(),
      campaign_id: campaign_id || 'all'
    };

    res.status(200).json(data);
  } catch (error) {
    console.error('GA4 API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch GA4 data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
