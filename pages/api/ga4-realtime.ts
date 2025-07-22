// GA4 실시간 데이터 API
import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 환경변수 확인
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return res.status(500).json({ 
        error: 'Google 서비스 계정이 설정되지 않았습니다',
        setup: {
          step1: '.env.local에 GOOGLE_SERVICE_ACCOUNT_EMAIL 추가',
          step2: '.env.local에 GOOGLE_SERVICE_ACCOUNT_KEY 추가',
          step3: 'GA4 속성에 서비스 계정 권한 부여'
        }
      });
    }

    // 서비스 계정 인증
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const analyticsData = google.analyticsdata('v1beta');
    const propertyId = process.env.GA4_PROPERTY_ID || '497433231';

    // 실시간 데이터 요청
    const response = await analyticsData.properties.runRealtimeReport({
      property: `properties/${propertyId}`,
      auth,
      requestBody: {
        dimensions: [
          { name: 'eventName' },
          { name: 'country' },
          { name: 'deviceCategory' },
          { name: 'unifiedScreenName' }
        ],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'eventCount' }
        ],
        limit: 20,
      },
    });

    // 활성 사용자 수
    const minutesAgoResponse = await analyticsData.properties.runRealtimeReport({
      property: `properties/${propertyId}`,
      auth,
      requestBody: {
        dimensions: [{ name: 'minutesAgo' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [
          {
            dimension: { dimensionName: 'minutesAgo' },
            desc: false
          }
        ],
      },
    });

    // 데이터 정리
    const eventSummary = {};
    const pageViews = {};
    
    (response.data.rows || []).forEach(row => {
      const eventName = row.dimensionValues?.[0]?.value || 'unknown';
      const pagePath = row.dimensionValues?.[3]?.value || '/';
      const activeUsers = parseInt(row.metricValues?.[0]?.value || '0');
      const views = parseInt(row.metricValues?.[1]?.value || '0');
      const events = parseInt(row.metricValues?.[2]?.value || '0');

      // 이벤트별 집계
      if (!eventSummary[eventName]) {
        eventSummary[eventName] = { count: 0, users: 0 };
      }
      eventSummary[eventName].count += events;
      eventSummary[eventName].users += activeUsers;

      // 페이지별 집계
      if (!pageViews[pagePath]) {
        pageViews[pagePath] = 0;
      }
      pageViews[pagePath] += views;
    });

    // 시간대별 활성 사용자
    const activeUsersByMinute = {};
    (minutesAgoResponse.data.rows || []).forEach(row => {
      const minutesAgo = row.dimensionValues?.[0]?.value || '0';
      const users = parseInt(row.metricValues?.[0]?.value || '0');
      activeUsersByMinute[`${minutesAgo}분 전`] = users;
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalActiveUsers: response.data.totals?.[0]?.metricValues?.[0]?.value || '0',
        totalPageViews: response.data.totals?.[0]?.metricValues?.[1]?.value || '0',
        totalEvents: response.data.totals?.[0]?.metricValues?.[2]?.value || '0',
      },
      eventSummary,
      pageViews,
      activeUsersByMinute,
      rawData: {
        rowCount: response.data.rowCount || 0,
        rows: response.data.rows?.slice(0, 10) // 처음 10개만
      }
    });
  } catch (error) {
    console.error('GA4 Realtime API Error:', error);
    
    // 상세한 오류 정보 반환
    if (error.response) {
      return res.status(error.response.status).json({ 
        error: 'GA4 API 오류',
        details: error.response.data,
        message: error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'GA4 실시간 데이터 가져오기 실패',
      message: error.message,
      hint: 'Google Cloud Console에서 Google Analytics Data API가 활성화되어 있는지 확인하세요'
    });
  }
}