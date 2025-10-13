import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { dateRange = 'month', campaignId } = req.query;

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
          weekStart.setDate(today.getDate() - today.getDay());
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

    // 퍼널 단계별 이벤트 조회
    const [funnelResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
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
            values: [
              'page_view',           // 히어로 섹션 도달
              'quiz_start',          // 퀴즈 시작
              'quiz_complete',       // 퀴즈 완료
              'booking_form_view',   // 예약 폼 보기
              'inquiry_form_view',   // 문의 폼 보기
              'phone_click',         // 전화 클릭
              'booking_submit',      // 예약 제출
              'inquiry_submit'       // 문의 제출
            ]
          }
        }
      }
    });

    // 데이터 가공
    const funnelData = funnelResponse.rows || [];
    
    // 각 단계별 이벤트 수 계산
    const eventCounts = {
      pageView: funnelData.find(d => d.dimensionValues?.[0]?.value === 'page_view')?.metricValues?.[0]?.value || '0',
      quizStart: funnelData.find(d => d.dimensionValues?.[0]?.value === 'quiz_start')?.metricValues?.[0]?.value || '0',
      quizComplete: funnelData.find(d => d.dimensionValues?.[0]?.value === 'quiz_complete')?.metricValues?.[0]?.value || '0',
      bookingFormView: funnelData.find(d => d.dimensionValues?.[0]?.value === 'booking_form_view')?.metricValues?.[0]?.value || '0',
      inquiryFormView: funnelData.find(d => d.dimensionValues?.[0]?.value === 'inquiry_form_view')?.metricValues?.[0]?.value || '0',
      phoneClick: funnelData.find(d => d.dimensionValues?.[0]?.value === 'phone_click')?.metricValues?.[0]?.value || '0',
      bookingSubmit: funnelData.find(d => d.dimensionValues?.[0]?.value === 'booking_submit')?.metricValues?.[0]?.value || '0',
      inquirySubmit: funnelData.find(d => d.dimensionValues?.[0]?.value === 'inquiry_submit')?.metricValues?.[0]?.value || '0'
    };

    // 전환율 계산
    const calculateConversionRate = (numerator: number, denominator: number) => {
      return denominator > 0 ? (numerator / denominator * 100) : 0;
    };

    const funnelMetrics = {
      dateRange: { startDate, endDate },
      eventCounts: {
        pageViews: parseInt(eventCounts.pageView),
        quizStarts: parseInt(eventCounts.quizStart),
        quizCompletes: parseInt(eventCounts.quizComplete),
        bookingFormViews: parseInt(eventCounts.bookingFormView),
        inquiryFormViews: parseInt(eventCounts.inquiryFormView),
        phoneClicks: parseInt(eventCounts.phoneClick),
        bookingSubmits: parseInt(eventCounts.bookingSubmit),
        inquirySubmits: parseInt(eventCounts.inquirySubmit)
      },
      conversionRates: {
        heroToQuiz: calculateConversionRate(parseInt(eventCounts.quizStart), parseInt(eventCounts.pageView)),
        quizStartToComplete: calculateConversionRate(parseInt(eventCounts.quizComplete), parseInt(eventCounts.quizStart)),
        quizToBooking: calculateConversionRate(parseInt(eventCounts.bookingFormView), parseInt(eventCounts.quizComplete)),
        quizToInquiry: calculateConversionRate(parseInt(eventCounts.inquiryFormView), parseInt(eventCounts.quizComplete)),
        overallConversion: calculateConversionRate(
          parseInt(eventCounts.bookingSubmit) + parseInt(eventCounts.inquirySubmit) + parseInt(eventCounts.phoneClick),
          parseInt(eventCounts.pageView)
        )
      }
    };

    res.status(200).json(funnelMetrics);

  } catch (error) {
    console.error('퍼널 메트릭 조회 실패:', error);
    
    // 오류 시 모의 데이터 반환
    const fallbackData = {
      dateRange: { startDate: '2025-08-01', endDate: '2025-08-31' },
      eventCounts: {
        pageViews: 0,
        quizStarts: 0,
        quizCompletes: 0,
        bookingFormViews: 0,
        inquiryFormViews: 0,
        phoneClicks: 0,
        bookingSubmits: 0,
        inquirySubmits: 0
      },
      conversionRates: {
        heroToQuiz: 0,
        quizStartToComplete: 0,
        quizToBooking: 0,
        quizToInquiry: 0,
        overallConversion: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    res.status(200).json(fallbackData);
  }
}
