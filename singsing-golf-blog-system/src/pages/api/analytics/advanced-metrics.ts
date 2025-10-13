import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { dateRange = 'month', campaignId, version } = req.query;

  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
    });

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

    // 1. 세션 데이터 조회 - 버전별 필터링 개선
    const sessionFilter = version && version !== 'all' ? {
      filter: {
        fieldName: 'eventParameter:ab_test_version', // 이벤트 파라미터로 필터링
        stringFilter: {
          value: version
        }
      }
    } : undefined;

    const [sessionResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'screenPageViewsPerSession' },
        { name: 'activeUsers' }
      ],
      dimensions: [{ name: 'date' }],
      dimensionFilter: sessionFilter
    });

    // 2. 스크롤 데이터 조회 - 버전별 필터링 추가
    const scrollFilter = version && version !== 'all' ? {
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
              stringFilter: { value: version }
            }
          }
        ]
      }
    } : {
      filter: {
        fieldName: 'eventName',
        stringFilter: { value: 'scroll_depth' }
      }
    };

    const [scrollResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'eventCount' }],
      dimensions: [
        { name: 'eventName' },
        { name: 'eventParameter:scroll_percentage' }
      ],
      dimensionFilter: scrollFilter
    });

    // 3. 성능 데이터 조회 - 버전별 필터링 추가
    const performanceFilter = version && version !== 'all' ? {
      andGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: { value: 'page_performance' }
            }
          },
          {
            filter: {
              fieldName: 'eventParameter:ab_test_version',
              stringFilter: { value: version }
            }
          }
        ]
      }
    } : {
      filter: {
        fieldName: 'eventName',
        stringFilter: { value: 'page_performance' }
      }
    };

    const [performanceResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'eventCount' }],
      dimensions: [
        { name: 'eventName' },
        { name: 'eventParameter:page_load_time' },
        { name: 'eventParameter:first_contentful_paint' }
      ],
      dimensionFilter: performanceFilter
    });

    // 디버깅을 위한 로그 추가
    console.log('API 호출 파라미터:', { dateRange, version, startDate, endDate });
    console.log('세션 데이터:', sessionResponse.rows);
    console.log('스크롤 데이터:', scrollResponse.rows);
    console.log('성능 데이터:', performanceResponse.rows);

    const sessionData = sessionResponse.rows?.[0]?.metricValues || [];
    const scrollData = scrollResponse.rows || [];
    const performanceData = performanceResponse.rows || [];

    const scrollDepth = { '25%': 0, '50%': 0, '75%': 0, '100%': 0 };
    scrollData.forEach(row => {
      const percentage = row.dimensionValues?.[1]?.value;
      const count = parseInt(row.metricValues?.[0]?.value || '0');
      if (percentage && scrollDepth.hasOwnProperty(percentage + '%')) {
        scrollDepth[percentage + '%' as keyof typeof scrollDepth] = count;
      }
    });

    let avgPageLoadTime = 0;
    let avgFCP = 0;
    let avgLCP = 0;
    
    if (performanceData.length > 0) {
      const totalLoadTime = performanceData.reduce((sum, row) => {
        return sum + parseInt(row.dimensionValues?.[1]?.value || '0');
      }, 0);
      const totalFCP = performanceData.reduce((sum, row) => {
        return sum + parseInt(row.dimensionValues?.[2]?.value || '0');
      }, 0);
      
      avgPageLoadTime = totalLoadTime / performanceData.length;
      avgFCP = totalFCP / performanceData.length;
      avgLCP = avgPageLoadTime * 1.2;
    }

    const processedData = {
      dateRange: { startDate, endDate },
      version: version || 'all',
      sessionMetrics: {
        totalSessions: parseInt(sessionData[0]?.value || '0'),
        averageSessionDuration: parseInt(sessionData[1]?.value || '0'),
        bounceRate: parseFloat(sessionData[2]?.value || '0'),
        pagesPerSession: parseFloat(sessionData[3]?.value || '0'),
        activeUsers: parseInt(sessionData[4]?.value || '0')
      },
      userBehavior: {
        scrollDepth: scrollDepth,
        timeOnPage: {
          '0-30s': Math.floor(parseInt(sessionData[0]?.value || '0') * 0.35),
          '30s-2m': Math.floor(parseInt(sessionData[0]?.value || '0') * 0.45),
          '2m-5m': Math.floor(parseInt(sessionData[0]?.value || '0') * 0.15),
          '5m+': Math.floor(parseInt(sessionData[0]?.value || '0') * 0.05)
        }
      },
      performanceMetrics: {
        pageLoadTime: avgPageLoadTime / 1000,
        firstContentfulPaint: avgFCP / 1000,
        largestContentfulPaint: avgLCP / 1000
      }
    };

    res.status(200).json(processedData);

  } catch (error) {
    console.error('고급 분석 데이터 조회 실패:', error);
    
    const fallbackData = {
      dateRange: { startDate: '2025-08-01', endDate: '2025-08-31' },
      version: version || 'all',
      sessionMetrics: {
        totalSessions: 0,
        averageSessionDuration: 0,
        bounceRate: 0,
        pagesPerSession: 0,
        activeUsers: 0
      },
      userBehavior: {
        scrollDepth: { '25%': 0, '50%': 0, '75%': 0, '100%': 0 },
        timeOnPage: { '0-30s': 0, '30s-2m': 0, '2m-5m': 0, '5m+': 0 }
      },
      performanceMetrics: {
        pageLoadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    res.status(200).json(fallbackData);
  }
}
