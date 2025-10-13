import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('GA4 API 테스트 시작');
    console.log('GA4_PROPERTY_ID:', process.env.GA4_PROPERTY_ID);
    console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
    });

    // 오늘 날짜로 가장 기본적인 쿼리 실행
    const today = new Date().toISOString().split('T')[0];
    
    console.log('날짜 범위:', today);
    console.log('Property ID:', `properties/${process.env.GA4_PROPERTY_ID}`);
    
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: today, endDate: today }],
      metrics: [
        { name: 'eventCount' }
      ],
      dimensions: [
        { name: 'eventName' }
      ],
      limit: 5
    });

    console.log('GA4 API 응답 성공');
    console.log('응답 데이터:', response.rows);

    res.status(200).json({
      success: true,
      data: {
        rows: response.rows || [],
        rowCount: response.rows?.length || 0,
        propertyId: process.env.GA4_PROPERTY_ID,
        dateRange: today
      },
      note: 'GA4 API 연결 성공'
    });

  } catch (error) {
    console.error('GA4 API 테스트 실패:', error);
    
    // 상세한 오류 정보 제공
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      ga4PropertyId: process.env.GA4_PROPERTY_ID,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasServiceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    };
    
    res.status(500).json({
      success: false,
      error: errorDetails,
      note: 'GA4 API 연결 실패'
    });
  }
}
