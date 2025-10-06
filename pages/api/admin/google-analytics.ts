import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

// Google Analytics 4 API 설정
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Google Analytics 4 API 인증
    const auth = new google.auth.GoogleAuth({
      keyFile: GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

    const { period = '7d', metric = 'all' } = req.query;

    // 기간 계산
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    const dateRange = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };

    // 실시간 데이터 조회
    const realtimeResponse = await analyticsData.properties.runRealtimeReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      requestBody: {
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
        ],
        dimensions: [
          { name: 'country' },
          { name: 'deviceCategory' },
        ],
      },
    });

    // 일반 리포트 데이터 조회
    const reportResponse = await analyticsData.properties.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [dateRange],
        metrics: [
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'newUsers' },
          { name: 'activeUsers' },
        ],
        dimensions: [
          { name: 'date' },
          { name: 'pagePath' },
          { name: 'source' },
          { name: 'medium' },
        ],
        orderBys: [
          { metric: { metricName: 'screenPageViews' }, desc: true },
        ],
        limit: 100,
      },
    });

    // 데이터 처리
    const realtimeData = {
      activeUsers: realtimeResponse.data.rows?.[0]?.metricValues?.[0]?.value || '0',
      pageViews: realtimeResponse.data.rows?.[0]?.metricValues?.[1]?.value || '0',
    };

    const reportData = {
      totalSessions: reportResponse.data.rows?.reduce((sum, row) => 
        sum + parseInt(row.metricValues?.[0]?.value || '0'), 0) || 0,
      totalPageViews: reportResponse.data.rows?.reduce((sum, row) => 
        sum + parseInt(row.metricValues?.[1]?.value || '0'), 0) || 0,
      averageBounceRate: reportResponse.data.rows?.reduce((sum, row) => 
        sum + parseFloat(row.metricValues?.[2]?.value || '0'), 0) / (reportResponse.data.rows?.length || 1) || 0,
      averageSessionDuration: reportResponse.data.rows?.reduce((sum, row) => 
        sum + parseFloat(row.metricValues?.[3]?.value || '0'), 0) / (reportResponse.data.rows?.length || 1) || 0,
      newUsers: reportResponse.data.rows?.reduce((sum, row) => 
        sum + parseInt(row.metricValues?.[4]?.value || '0'), 0) || 0,
      topPages: reportResponse.data.rows?.slice(0, 10).map(row => ({
        page: row.dimensionValues?.[1]?.value || '',
        views: parseInt(row.metricValues?.[1]?.value || '0'),
        source: row.dimensionValues?.[2]?.value || '',
        medium: row.dimensionValues?.[3]?.value || '',
      })) || [],
    };

    // 일별 트렌드 데이터
    const dailyTrends = reportResponse.data.rows?.reduce((acc, row) => {
      const date = row.dimensionValues?.[0]?.value || '';
      if (!acc[date]) {
        acc[date] = {
          date,
          sessions: 0,
          pageViews: 0,
          users: 0,
        };
      }
      acc[date].sessions += parseInt(row.metricValues?.[0]?.value || '0');
      acc[date].pageViews += parseInt(row.metricValues?.[1]?.value || '0');
      acc[date].users += parseInt(row.metricValues?.[5]?.value || '0');
      return acc;
    }, {} as any) || {};

    const dailyTrendsArray = Object.values(dailyTrends).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.status(200).json({
      success: true,
      period,
      realtime: realtimeData,
      report: reportData,
      dailyTrends: dailyTrendsArray,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Google Analytics API 오류:', error);
    
    // API 오류 시 더미 데이터 반환 (개발/테스트용)
    const dummyData = {
      success: false,
      error: 'Google Analytics API 연결 실패',
      period: req.query.period || '7d',
      realtime: {
        activeUsers: '12',
        pageViews: '45',
      },
      report: {
        totalSessions: 1250,
        totalPageViews: 3450,
        averageBounceRate: 0.65,
        averageSessionDuration: 180,
        newUsers: 890,
        topPages: [
          { page: '/', views: 1200, source: 'google', medium: 'organic' },
          { page: '/blog', views: 800, source: 'direct', medium: 'none' },
          { page: '/about', views: 450, source: 'google', medium: 'cpc' },
        ],
      },
      dailyTrends: [
        { date: '2024-01-01', sessions: 150, pageViews: 400, users: 120 },
        { date: '2024-01-02', sessions: 180, pageViews: 450, users: 140 },
        { date: '2024-01-03', sessions: 200, pageViews: 520, users: 160 },
      ],
      lastUpdated: new Date().toISOString(),
    };

    res.status(200).json(dummyData);
  }
}
