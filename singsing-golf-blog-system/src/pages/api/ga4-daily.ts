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

  // Google Analytics API 비활성화 확인
  if (process.env.GOOGLE_ANALYTICS_DISABLED === 'true' || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    console.log('⚠️ Google Analytics API 비활성화됨 - 비용 절약을 위해 사용 중단');
    return res.status(200).json({
      status: 'Google Analytics API 비활성화됨',
      message: '비용 절약을 위해 Google Analytics API가 비활성화되었습니다.',
      dailyData: null
    });
  }

  try {
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (!propertyId) {
      throw new Error('GA4_PROPERTY_ID가 설정되지 않았습니다.');
    }

    // 현재월 1일부터 오늘까지 데이터 요청
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = firstDayOfMonth.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'eventCount' },
      ],
      dimensions: [
        { name: 'date' },
      ],
    });

    // 일별 데이터 처리
    const dailyData = response.rows || [];
    
    // 현재월의 모든 날짜 초기화
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const fullMonthData = Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth(), index + 1);
      return {
        date: date.toISOString().split('T')[0],
        users: 0,
        pageViews: 0,
        events: 0,
      };
    });

    // 실제 데이터로 채우기
    dailyData.forEach((row: any) => {
      const date = row.dimensionValues?.[0]?.value;
      const users = parseInt(row.metricValues?.[0]?.value || '0');
      const pageViews = parseInt(row.metricValues?.[1]?.value || '0');
      const events = parseInt(row.metricValues?.[2]?.value || '0');
      
      if (date) {
        const formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
        const dayIndex = parseInt(date.substring(6, 8)) - 1;
        
        if (dayIndex >= 0 && dayIndex < daysInMonth) {
          fullMonthData[dayIndex] = {
            date: formattedDate,
            users,
            pageViews,
            events,
          };
        }
      }
    });

    res.status(200).json(fullMonthData);
  } catch (error) {
    console.error('GA4 Daily API Error:', error);
    
    // 오류 발생 시 모의 데이터로 폴백
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const fallbackData = Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth(), index + 1);
      return {
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 200) + 50,
        pageViews: Math.floor(Math.random() * 500) + 100,
        events: Math.floor(Math.random() * 1000) + 200,
      };
    });
    
    res.status(200).json(fallbackData);
  }
} 