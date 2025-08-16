import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

interface VersionTrackingData {
  version: string;
  sessions: number;
  buttonClicks: number;
  scrollDepth: number;
  formInteractions: number;
  phoneClicks: number;
  performance: {
    avgLoadTime: number;
    avgFCP: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { dateRange = 'today', version = 'live-a' } = req.query;

  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
    });

    // 날짜 범위 설정
    const getDateRange = () => {
      const today = new Date();
      switch (dateRange) {
        case 'today':
          return {
            startDate: today.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
          };
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - 7);
          return {
            startDate: weekStart.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
          };
        case 'month':
        default:
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          return {
            startDate: monthStart.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
          };
      }
    };

    const { startDate, endDate } = getDateRange();

    // 버전별 이벤트 조회
    const [buttonClicksResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'eventName' }, { name: 'eventParameter:ab_test_version' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: { value: 'button_click' }
              }
            },
            {
              filter: {
                fieldName: 'eventParameter:ab_test_version',
                stringFilter: { value: version as string }
              }
            }
          ]
        }
      }
    });

    const [scrollResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'eventName' }, { name: 'eventParameter:ab_test_version' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: { value: 'scroll_depth' }
              }
            },
            {
              filter: {
                fieldName: 'eventParameter:ab_test_version',
                stringFilter: { value: version as string }
              }
            }
          ]
        }
      }
    });

    const [phoneClicksResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'eventName' }, { name: 'eventParameter:ab_test_version' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: { value: 'button_click' }
              }
            },
            {
              filter: {
                fieldName: 'eventParameter:button_type',
                stringFilter: { value: 'phone' }
              }
            },
            {
              filter: {
                fieldName: 'eventParameter:ab_test_version',
                stringFilter: { value: version as string }
              }
            }
          ]
        }
      }
    });

    // 데이터 처리
    const buttonClicks = buttonClicksResponse.rows?.[0]?.metricValues?.[0]?.value || '0';
    const scrollDepth = scrollResponse.rows?.[0]?.metricValues?.[0]?.value || '0';
    const phoneClicks = phoneClicksResponse.rows?.[0]?.metricValues?.[0]?.value || '0';

    const trackingData: VersionTrackingData = {
      version: version as string,
      sessions: parseInt(buttonClicks) + parseInt(scrollDepth), // 추정값
      buttonClicks: parseInt(buttonClicks),
      scrollDepth: parseInt(scrollDepth),
      formInteractions: 0, // 별도 조회 필요
      phoneClicks: parseInt(phoneClicks),
      performance: {
        avgLoadTime: 0,
        avgFCP: 0
      }
    };

    res.status(200).json({
      success: true,
      data: trackingData,
      dateRange: { startDate, endDate },
      note: `버전 ${version} 개별 추적 데이터`
    });

  } catch (error) {
    console.error('버전별 추적 데이터 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
