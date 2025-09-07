// 간단한 GA4 데이터 테스트 API
import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 환경변수 체크
    const hasEmail = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const hasKey = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const propertyId = process.env.GA4_PROPERTY_ID || '497433231';

    if (!hasEmail || !hasKey) {
      return res.status(200).json({
        status: 'GA4 설정 미완료',
        serviceAccountEmail: hasEmail ? '✅ 설정됨' : '❌ 없음',
        serviceAccountKey: hasKey ? '✅ 설정됨' : '❌ 없음',
        propertyId: propertyId,
        message: '서비스 계정 설정이 필요합니다',
        availableData: null
      });
    }

    // 서비스 계정으로 인증
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const analyticsData = google.analyticsdata('v1beta');

    // 간단한 테스트 쿼리 - 오늘 데이터만
    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      auth,
      requestBody: {
        dateRanges: [{ startDate: 'today', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'activeUsers' }
        ],
        limit: 5
      },
    });

    // 사용 가능한 커스텀 이벤트 확인
    const eventsResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      auth,
      requestBody: {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              matchType: 'CONTAINS',
              value: 'phone'
            }
          }
        },
        limit: 10
      },
    });

    const pageData = (response.data.rows || []).map(row => ({
      page: row.dimensionValues?.[0]?.value,
      views: row.metricValues?.[0]?.value,
      users: row.metricValues?.[1]?.value
    }));

    const eventData = (eventsResponse.data.rows || []).map(row => ({
      event: row.dimensionValues?.[0]?.value,
      count: row.metricValues?.[0]?.value
    }));

    return res.status(200).json({
      status: '✅ GA4 연결 성공',
      serviceAccountEmail: '✅ 설정됨',
      serviceAccountKey: '✅ 설정됨',
      propertyId: propertyId,
      timestamp: new Date().toISOString(),
      availableData: {
        todayPageViews: pageData,
        customEvents: eventData,
        totalPageViewsToday: response.data.totals?.[0]?.metricValues?.[0]?.value || '0',
        activeUsersToday: response.data.totals?.[0]?.metricValues?.[1]?.value || '0'
      }
    });

  } catch (error) {
    console.error('GA4 Test Error:', error);
    
    return res.status(200).json({
      status: '❌ GA4 연결 실패',
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ 설정됨' : '❌ 없음',
      serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? '✅ 설정됨' : '❌ 없음',
      propertyId: process.env.GA4_PROPERTY_ID || '497433231',
      error: error.message,
      hint: error.message.includes('API has not been used') 
        ? 'Google Cloud Console에서 Google Analytics Data API를 활성화하세요'
        : 'GA4 속성에 서비스 계정 권한을 부여했는지 확인하세요'
    });
  }
}