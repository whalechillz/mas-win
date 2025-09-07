import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// GA4 클라이언트 초기화
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
    const { campaign_id, today, monthStart, monthEnd } = req.query;
    const propertyId = process.env.GA4_PROPERTY_ID;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!propertyId) {
      throw new Error('GA4_PROPERTY_ID가 설정되지 않았습니다.');
    }

    // 서비스 계정 키가 없으면 오류 반환
    if (!serviceAccountKey || serviceAccountKey.includes('YOUR_PRIVATE_KEY_HERE')) {
      throw new Error('GA4 서비스 계정 키가 설정되지 않았습니다.');
    }

    // 실시간 데이터 요청 (변경 없음)
    const [realtimeResponse] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [
        { name: 'activeUsers' },
        { name: 'eventCount' },
        { name: 'screenPageViews' },
      ],
    });

    // 오늘 데이터 요청 (고정 날짜)
    const todayDate = today as string || new Date().toISOString().split('T')[0];
    const [todayResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: todayDate, endDate: todayDate }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'eventCount' },
      ],
    });

    // 이번달 데이터 요청 (고정 기간)
    const monthStartDate = monthStart as string || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
    const monthEndDate = monthEnd as string || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}`;
    
    const [monthlyResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: monthStartDate, endDate: monthEndDate }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'eventCount' },
      ],
    });

    // 데이터 추출
    const realtimeData = realtimeResponse.rows?.[0] || {};
    const todayData = todayResponse.rows?.[0] || {};
    const monthlyData = monthlyResponse.rows?.[0] || {};

    const ga4Data = {
      // 실시간 데이터
      activeUsers: realtimeData.metricValues?.[0]?.value || '0',
      pageViews: realtimeData.metricValues?.[2]?.value || '0',
      events: realtimeData.metricValues?.[1]?.value || '0',
      
      // 오늘 데이터 (고정 날짜)
      todayUsers: todayData.metricValues?.[0]?.value || '0',
      todayPageViews: todayData.metricValues?.[1]?.value || '0',
      todayEvents: todayData.metricValues?.[2]?.value || '0',
      
      // 이번달 데이터 (고정 기간)
      monthlyUsers: monthlyData.metricValues?.[0]?.value || '0',
      monthlyPageViews: monthlyData.metricValues?.[1]?.value || '0',
      monthlyEvents: monthlyData.metricValues?.[2]?.value || '0',
      
      timestamp: new Date().toISOString(),
      campaign_id: campaign_id || 'all',
      status: 'real_data',
      propertyId: propertyId,
      period: {
        today: todayDate,
        monthStart: monthStartDate,
        monthEnd: monthEndDate
      }
    };

    res.status(200).json(ga4Data);
  } catch (error) {
    console.error('GA4 API Error:', error);
    
    res.status(503).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'GA4 서비스 계정 키가 설정되지 않았거나 API 호출에 실패했습니다.',
      status: 'no_data',
      timestamp: new Date().toISOString(),
      campaign_id: req.query.campaign_id || 'all'
    });
  }
}
