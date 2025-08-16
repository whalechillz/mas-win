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

    // 오늘 날짜로 모든 이벤트 조회
    const today = new Date().toISOString().split('T')[0];
    
    // 1. 모든 이벤트 조회 (최근 10개)
    const [allEventsResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: today, endDate: today }],
      metrics: [
        { name: 'eventCount' }
      ],
      dimensions: [
        { name: 'eventName' }
      ],
      limit: 10
    });

    // 2. A/B 테스트 관련 이벤트 조회
    const [abTestResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: today, endDate: today }],
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
            values: ['ab_test_assignment', 'ab_test_exposure', 'ab_test_session']
          }
        }
      }
    });

    // 3. 스크롤 관련 이벤트 조회
    const [scrollResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: today, endDate: today }],
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
            values: ['scroll_depth', 'scroll_pause', 'section_reached']
          }
        }
      }
    });

    // 4. 페이지뷰 이벤트 조회
    const [pageViewResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: today, endDate: today }],
      metrics: [
        { name: 'eventCount' }
      ],
      dimensions: [
        { name: 'eventName' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { value: 'page_view' }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        allEvents: allEventsResponse.rows || [],
        abTestEvents: abTestResponse.rows || [],
        scrollEvents: scrollResponse.rows || [],
        pageViewEvents: pageViewResponse.rows || [],
        summary: {
          totalEvents: allEventsResponse.rows?.length || 0,
          abTestEvents: abTestResponse.rows?.length || 0,
          scrollEvents: scrollResponse.rows?.length || 0,
          pageViewEvents: pageViewResponse.rows?.length || 0
        }
      },
      note: 'GA4 이벤트 수집 현황'
    });

  } catch (error) {
    console.error('GA4 이벤트 테스트 실패:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'GA4 이벤트 테스트 실패'
    });
  }
}
