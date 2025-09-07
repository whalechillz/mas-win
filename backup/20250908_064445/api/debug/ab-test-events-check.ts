import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
    });

    // 최근 24시간 A/B 테스트 이벤트 확인 (GA4 호환)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 1);

    // 기본 A/B 테스트 이벤트 확인 (차원 없이)
    const [abTestResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ 
        startDate: startDate.toISOString().split('T')[0], 
        endDate: endDate.toISOString().split('T')[0] 
      }],
      metrics: [
        { name: 'eventCount' }
      ],
      dimensions: [
        { name: 'eventName' }
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

    // 전환 이벤트 확인 (차원 없이)
    const [conversionResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ 
        startDate: startDate.toISOString().split('T')[0], 
        endDate: endDate.toISOString().split('T')[0] 
      }],
      metrics: [
        { name: 'eventCount' }
      ],
      dimensions: [
        { name: 'eventName' }
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

    // 페이지별 데이터 확인
    const [pageResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ 
        startDate: startDate.toISOString().split('T')[0], 
        endDate: endDate.toISOString().split('T')[0] 
      }],
      metrics: [
        { name: 'sessions' },
        { name: 'screenPageViews' }
      ],
      dimensions: [
        { name: 'pagePath' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            value: '/25-08'
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      abTestEvents: {
        totalRows: abTestResponse.rows?.length || 0,
        events: abTestResponse.rows || []
      },
      conversionEvents: {
        totalRows: conversionResponse.rows?.length || 0,
        events: conversionResponse.rows || []
      },
      pageData: {
        totalRows: pageResponse.rows?.length || 0,
        pages: pageResponse.rows || []
      },
      summary: {
        hasABTestEvents: (abTestResponse.rows?.length || 0) > 0,
        hasConversions: (conversionResponse.rows?.length || 0) > 0,
        hasPageData: (pageResponse.rows?.length || 0) > 0
      }
    });

  } catch (error) {
    console.error('A/B 테스트 이벤트 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
