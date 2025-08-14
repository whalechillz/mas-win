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
    const { month } = req.query;
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (!propertyId) {
      throw new Error('GA4_PROPERTY_ID가 설정되지 않았습니다.');
    }

    if (!month || typeof month !== 'string') {
      throw new Error('월 파라미터가 필요합니다.');
    }

    const [year, monthNum] = month.split('-');
    const startDate = `${month}-01`;
    const endDate = `${month}-${new Date(parseInt(year), parseInt(monthNum), 0).getDate()}`;

    // 월별 데이터 요청
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

    // 일별 데이터 분석
    const dailyData = response.rows || [];
    const totalDays = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    const workingDays = dailyData.length;
    
    // 태그 상태 판단
    let tagStatus: 'working' | 'not_installed' | 'partial' | 'unknown';
    if (workingDays === 0) {
      tagStatus = 'not_installed';
    } else if (workingDays === totalDays) {
      tagStatus = 'working';
    } else if (workingDays > 0) {
      tagStatus = 'partial';
    } else {
      tagStatus = 'unknown';
    }

    // 월별 합계 계산
    const monthlyTotals = dailyData.reduce((acc, row) => {
      const users = parseInt(row.metricValues?.[0]?.value || '0');
      const pageViews = parseInt(row.metricValues?.[1]?.value || '0');
      const events = parseInt(row.metricValues?.[2]?.value || '0');
      
      return {
        users: acc.users + users,
        pageViews: acc.pageViews + pageViews,
        events: acc.events + events,
      };
    }, { users: 0, pageViews: 0, events: 0 });

    const monthlyData = {
      month,
      year: parseInt(year),
      users: monthlyTotals.users,
      pageViews: monthlyTotals.pageViews,
      events: monthlyTotals.events,
      tagStatus,
      workingDays,
      totalDays,
      dailyData: dailyData.map(row => ({
        date: row.dimensionValues?.[0]?.value,
        users: parseInt(row.metricValues?.[0]?.value || '0'),
        pageViews: parseInt(row.metricValues?.[1]?.value || '0'),
        events: parseInt(row.metricValues?.[2]?.value || '0'),
      })),
    };

    res.status(200).json(monthlyData);
  } catch (error) {
    console.error('GA4 Monthly API Error:', error);
    
    // 오류 발생 시 빈 데이터 반환
    const { month } = req.query;
    if (month && typeof month === 'string') {
      const [year, monthNum] = month.split('-');
      const totalDays = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      
      res.status(200).json({
        month,
        year: parseInt(year),
        users: 0,
        pageViews: 0,
        events: 0,
        tagStatus: 'not_installed',
        workingDays: 0,
        totalDays,
        dailyData: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } else {
      res.status(400).json({ error: 'Invalid month parameter' });
    }
  }
} 