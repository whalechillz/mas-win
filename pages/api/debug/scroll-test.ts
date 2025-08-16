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

    // 오늘 날짜로 스크롤 이벤트 조회
    const today = new Date().toISOString().split('T')[0];
    
    // 1. scroll_depth 이벤트 조회
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
          stringFilter: { value: 'scroll_depth' }
        }
      }
    });

    // 2. scroll_depth 이벤트의 파라미터 조회
    const [scrollParamsResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: today, endDate: today }],
      metrics: [
        { name: 'eventCount' }
      ],
      dimensions: [
        { name: 'eventName' },
        { name: 'eventParameter:scroll_percentage' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { value: 'scroll_depth' }
        }
      }
    });

    // 3. 모든 engagement 이벤트 조회 (스크롤 관련 확인)
    const [engagementResponse] = await analyticsDataClient.runReport({
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

    res.status(200).json({
      success: true,
      data: {
        scrollEvents: scrollResponse.rows || [],
        scrollParams: scrollParamsResponse.rows || [],
        engagementEvents: engagementResponse.rows || [],
        summary: {
          totalScrollEvents: scrollResponse.rows?.length || 0,
          totalScrollParams: scrollParamsResponse.rows?.length || 0,
          totalEngagementEvents: engagementResponse.rows?.length || 0
        }
      },
      note: '스크롤 깊이 추적 테스트 결과'
    });

  } catch (error) {
    console.error('스크롤 테스트 실패:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      note: '스크롤 깊이 추적 테스트 실패'
    });
  }
}
