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
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (!propertyId) {
      throw new Error('GA4_PROPERTY_ID가 설정되지 않았습니다.');
    }

    // 2025-07 기간 설정
    const startDate = '2025-07-01';
    const endDate = '2025-07-31';

    // 2025-07 기간의 상위 페이지들 가져오기
    const [topPagesMetrics] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'screenPageViewsPerSession' }
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10
    });

    // 관리자 페이지 제외하고 퍼널 관련 페이지만 필터링
    const filteredPages = topPagesMetrics.rows?.filter(row => {
      const pagePath = row.dimensionValues?.[0]?.value || '';
      return !pagePath.includes('/admin') && 
             (pagePath.includes('funnel') || 
              pagePath.includes('25-07') || 
              pagePath.includes('versions'));
    }) || [];

    // 상위 2개 페이지만 선택
    const top2Pages = filteredPages.slice(0, 2).map((row, index) => {
      const pagePath = row.dimensionValues?.[0]?.value || '';
      const pageViews = parseInt(row.metricValues?.[0]?.value || '0');
      const users = parseInt(row.metricValues?.[1]?.value || '0');
      const sessions = parseInt(row.metricValues?.[2]?.value || '0');
      const avgSessionDuration = parseFloat(row.metricValues?.[3]?.value || '0');
      const bounceRate = parseFloat(row.metricValues?.[4]?.value || '0');
      const pagesPerSession = parseFloat(row.metricValues?.[5]?.value || '0');

      return {
        page: pagePath,
        pageViews,
        users,
        sessions,
        avgSessionDuration,
        bounceRate,
        pagesPerSession,
        rank: index + 1,
        // 페이지 이름 추출 (파일명만)
        pageName: pagePath.split('/').pop()?.replace('.html', '') || pagePath
      };
    });

    // 데이터가 없을 경우 기본 데이터 제공
    if (top2Pages.length === 0) {
      const defaultPages = [
        {
          page: '/versions/funnel-2025-07-live.html',
          pageName: 'funnel-2025-07-live',
          pageViews: 0,
          users: 0,
          sessions: 0,
          avgSessionDuration: 0,
          bounceRate: 0,
          pagesPerSession: 0,
          rank: 1
        },
        {
          page: '/versions/funnel-2025-07-staging.html',
          pageName: 'funnel-2025-07-staging',
          pageViews: 0,
          users: 0,
          sessions: 0,
          avgSessionDuration: 0,
          bounceRate: 0,
          pagesPerSession: 0,
          rank: 2
        }
      ];
      
      return res.status(200).json({
        pages: defaultPages,
        period: '2025-07-01 to 2025-07-31',
        totalPages: 0,
        message: 'GA4 데이터가 없어 기본 데이터를 제공합니다.'
      });
    }

    res.status(200).json({
      pages: top2Pages,
      period: '2025-07-01 to 2025-07-31',
      totalPages: top2Pages.length,
      message: 'GA4 데이터 기반 상위 페이지입니다.'
    });

  } catch (error) {
    console.error('GA4 Top Pages 2025-07 API Error:', error);
    
    // 에러 시 기본 데이터 반환
    const defaultPages = [
      {
        page: '/versions/funnel-2025-07-live.html',
        pageName: 'funnel-2025-07-live',
        pageViews: 0,
        users: 0,
        sessions: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
        pagesPerSession: 0,
        rank: 1
      },
      {
        page: '/versions/funnel-2025-07-staging.html',
        pageName: 'funnel-2025-07-staging',
        pageViews: 0,
        users: 0,
        sessions: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
        pagesPerSession: 0,
        rank: 2
      }
    ];
    
    res.status(200).json({
      pages: defaultPages,
      period: '2025-07-01 to 2025-07-31',
      totalPages: 0,
      message: 'API 오류로 기본 데이터를 제공합니다.'
    });
  }
}
