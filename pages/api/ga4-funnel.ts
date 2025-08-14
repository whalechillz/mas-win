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
    const { path, month } = req.query;
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (!propertyId) {
      throw new Error('GA4_PROPERTY_ID가 설정되지 않았습니다.');
    }

    if (!path || typeof path !== 'string') {
      throw new Error('퍼널 경로가 필요합니다.');
    }

    const [year, monthNum] = (month as string || '2025-08').split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = `${year}-${monthNum}-${new Date(parseInt(year), parseInt(monthNum), 0).getDate()}`;

    // 퍼널별 데이터 요청
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'eventCount' },
      ],
      dimensions: [
        { name: 'pagePath' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'CONTAINS',
            value: path as string,
          },
        },
      },
    });

    // 데이터 집계
    const funnelData = response.rows || [];
    const totalVisitors = funnelData.reduce((sum, row) => sum + parseInt(row.metricValues?.[0]?.value || '0'), 0);
    const totalPageViews = funnelData.reduce((sum, row) => sum + parseInt(row.metricValues?.[1]?.value || '0'), 0);
    const totalEvents = funnelData.reduce((sum, row) => sum + parseInt(row.metricValues?.[2]?.value || '0'), 0);

    // 전환율 계산 (예: 이벤트 발생률)
    const conversionRate = totalVisitors > 0 ? (totalEvents / totalVisitors) * 100 : 0;

    res.status(200).json({
      path: path as string,
      month: `${year}-${monthNum}`,
      visitors: totalVisitors,
      pageViews: totalPageViews,
      events: totalEvents,
      conversionRate,
      startDate,
      endDate
    });
  } catch (error) {
    console.error('GA4 Funnel API Error:', error);
    res.status(503).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '퍼널 데이터를 가져올 수 없습니다.',
    });
  }
}
