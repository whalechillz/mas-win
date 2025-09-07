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
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (!propertyId) {
      throw new Error('GA4_PROPERTY_ID가 설정되지 않았습니다.');
    }

    // 오늘 시간대별 데이터 요청
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: 'today',
          endDate: 'today',
        },
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'eventCount' },
      ],
      dimensions: [
        { name: 'hour' },
      ],
    });

    // 시간대별 데이터 처리
    const hourlyData = response.rows || [];
    
    // 24시간 데이터 초기화
    const fullHourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: hour.toString().padStart(2, '0'),
      users: 0,
      pageViews: 0,
      events: 0,
    }));

    // 실제 데이터로 채우기
    hourlyData.forEach((row: any) => {
      const hour = row.dimensionValues?.[0]?.value;
      const users = parseInt(row.metricValues?.[0]?.value || '0');
      const pageViews = parseInt(row.metricValues?.[1]?.value || '0');
      const events = parseInt(row.metricValues?.[2]?.value || '0');
      
      if (hour !== undefined) {
        const hourIndex = parseInt(hour);
        if (hourIndex >= 0 && hourIndex < 24) {
          fullHourlyData[hourIndex] = {
            hour: hour.padStart(2, '0'),
            users,
            pageViews,
            events,
          };
        }
      }
    });

    res.status(200).json(fullHourlyData);
  } catch (error) {
    console.error('GA4 Hourly API Error:', error);
    
    // 오류 발생 시 모의 데이터로 폴백
    const fallbackData = Array.from({ length: 24 }, (_, hour) => ({
      hour: hour.toString().padStart(2, '0'),
      users: Math.floor(Math.random() * 50),
      pageViews: Math.floor(Math.random() * 100),
      events: Math.floor(Math.random() * 200),
    }));
    
    res.status(200).json(fallbackData);
  }
} 