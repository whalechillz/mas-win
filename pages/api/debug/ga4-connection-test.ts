import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. 환경변수 확인
    const envCheck = {
      GA4_PROPERTY_ID: !!process.env.GA4_PROPERTY_ID,
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_SERVICE_ACCOUNT_KEY: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    };
    
    console.log('환경변수 확인:', envCheck);
    
    // 2. GA4 클라이언트 초기화 테스트
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
    });
    
    // 3. 기본 데이터 조회 테스트
    const today = new Date().toISOString().split('T')[0];
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: today, endDate: today }],
      metrics: [{ name: 'sessions' }],
      dimensions: [{ name: 'date' }]
    });
    
    // 4. A/B 테스트 이벤트 조회 테스트
    const [abTestResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: today, endDate: today }],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'eventName' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { value: 'ab_test_assignment' }
        }
      }
    });
    
    // 5. 스크롤 이벤트 조회 테스트
    const [scrollResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: today, endDate: today }],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'eventName' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { value: 'scroll_depth' }
        }
      }
    });
    
    // 6. 버튼 클릭 이벤트 조회 테스트
    const [buttonClickResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: today, endDate: today }],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'eventName' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { value: 'button_click' }
        }
      }
    });
    
    res.status(200).json({
      success: true,
      connection: 'OK',
      environment: envCheck,
      data: {
        totalSessions: response.rows?.[0]?.metricValues?.[0]?.value || '0',
        abTestEvents: abTestResponse.rows?.[0]?.metricValues?.[0]?.value || '0',
        scrollEvents: scrollResponse.rows?.[0]?.metricValues?.[0]?.value || '0',
        buttonClickEvents: buttonClickResponse.rows?.[0]?.metricValues?.[0]?.value || '0'
      },
      note: 'GA4 연결 및 데이터 수집 상태 확인'
    });
    
  } catch (error) {
    console.error('GA4 연결 테스트 실패:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'GA4 연결에 문제가 있습니다.'
    });
  }
}
