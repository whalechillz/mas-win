import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. 환경 변수 확인
    const envCheck = {
      GA4_PROPERTY_ID: !!process.env.GA4_PROPERTY_ID,
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_SERVICE_ACCOUNT_KEY: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    };

    console.log('환경 변수 상태:', envCheck);

    if (!envCheck.GA4_PROPERTY_ID || !envCheck.GOOGLE_SERVICE_ACCOUNT_EMAIL || !envCheck.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return res.status(400).json({
        success: false,
        error: '환경 변수 누락',
        envCheck
      });
    }

    // 2. GA4 클라이언트 초기화
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
    });

    // 3. A/B 테스트 이벤트 확인
    const [abTestResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: '2025-08-01', endDate: '2025-08-15' }],
      metrics: [{ name: 'eventCount' }],
      dimensions: [
        { name: 'eventName' },
        { name: 'customEvent:version' },
        { name: 'customEvent:test_name' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            value: 'ab_test_assignment'
          }
        }
      }
    });

    // 4. 전환 이벤트 확인
    const [conversionResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: '2025-08-01', endDate: '2025-08-15' }],
      metrics: [{ name: 'eventCount' }],
      dimensions: [
        { name: 'eventName' },
        { name: 'customEvent:version' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: ['phone_click', 'booking_submit', 'inquiry_submit', 'quiz_complete']
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      envCheck,
      abTestEvents: {
        totalRows: abTestResponse.rows?.length || 0,
        events: abTestResponse.rows?.slice(0, 10) || []
      },
      conversionEvents: {
        totalRows: conversionResponse.rows?.length || 0,
        events: conversionResponse.rows?.slice(0, 10) || []
      }
    });

  } catch (error) {
    console.error('A/B 테스트 디버깅 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
