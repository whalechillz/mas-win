import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdvancedUserAnalyticsProps {
  campaignId?: string;
}

export function AdvancedUserAnalytics({ campaignId }: AdvancedUserAnalyticsProps) {
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    dateRange: { startDate: '', endDate: '' },
    sessionMetrics: {
      totalSessions: 0,
      averageSessionDuration: 0,
      bounceRate: 0,
      pagesPerSession: 0,
      activeUsers: 0
    },
    funnelMetrics: {
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
      }
    },
    scrollMetrics: {
      scrollDepth: { '25%': 0, '50%': 0, '75%': 0, '100%': 0 },
      timeOnPage: { '0-30s': 0, '30s-2m': 0, '2m-5m': 0, '5m+': 0 },
      totalUsers: 0
    },
    performanceMetrics: {
      overall: {
        pageLoadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0
      },
      byDevice: {
        mobile: { avgLoadTime: 0, avgFCP: 0, avgLCP: 0 },
        desktop: { avgLoadTime: 0, avgFCP: 0, avgLCP: 0 },
        tablet: { avgLoadTime: 0, avgFCP: 0, avgLCP: 0 }
      },
      totalSessions: 0
    }
  });

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      setLoading(true);
      try {
        // 모든 API 호출을 병렬로 실행
        const [basicResponse, funnelResponse, scrollResponse, performanceResponse] = await Promise.all([
          fetch(`/api/analytics/advanced-metrics?dateRange=${dateRange}&campaignId=${campaignId}`),
          fetch(`/api/analytics/funnel-metrics?dateRange=${dateRange}&campaignId=${campaignId}`),
          fetch(`/api/analytics/scroll-metrics?dateRange=${dateRange}&campaignId=${campaignId}`),
          fetch(`/api/analytics/performance-metrics?dateRange=${dateRange}&campaignId=${campaignId}`)
        ]);

        const [basicData, funnelData, scrollData, performanceData] = await Promise.all([
          basicResponse.json(),
          funnelResponse.json(),
          scrollResponse.json(),
          performanceResponse.json()
        ]);

        setAnalyticsData({
          dateRange: basicData.dateRange,
          sessionMetrics: basicData.sessionMetrics,
          funnelMetrics: funnelData,
          scrollMetrics: scrollData,
          performanceMetrics: performanceData
        });

      } catch (error) {
        console.error('고급 분석 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAnalytics();
  }, [dateRange, campaignId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">고급 사용자 행동 분석</h2>
        
        {/* 날짜 범위 버튼 - 개선된 스타일 */}
        <div className="flex space-x-2">
          <button
            onClick={() => setDateRange('today')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateRange === 'today' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            오늘
          </button>
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateRange === 'week' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            이번 주
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateRange === 'month' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            이번 달
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        분석 기간: {analyticsData.dateRange.startDate} ~ {analyticsData.dateRange.endDate}
      </div>

      {loading ? (
        <div className="text-center py-8">데이터 로딩 중...</div>
      ) : (
        <>
          {/* 세션 메트릭 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">총 세션</h3>
              <p className="text-2xl font-bold text-blue-600">
                {analyticsData.sessionMetrics.totalSessions.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">평균 세션 시간</h3>
              <p className="text-2xl font-bold text-green-600">
                {Math.floor(analyticsData.sessionMetrics.averageSessionDuration / 60)}분 
                {analyticsData.sessionMetrics.averageSessionDuration % 60}초
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">바운스율</h3>
              <p className="text-2xl font-bold text-red-600">
                {analyticsData.sessionMetrics.bounceRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">페이지/세션</h3>
              <p className="text-2xl font-bold text-purple-600">
                {analyticsData.sessionMetrics.pagesPerSession.toFixed(1)}
              </p>
            </div>
          </div>

          {/* 퍼널 전환율 (실제 데이터) */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">퍼널 전환율 (실제 데이터)</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData.funnelMetrics.conversionRates.heroToQuiz.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">히어로 → 퀴즈</div>
                <div className="text-xs text-gray-400">
                  {analyticsData.funnelMetrics.eventCounts.quizStarts} / {analyticsData.funnelMetrics.eventCounts.pageViews}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData.funnelMetrics.conversionRates.quizStartToComplete.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">퀴즈 시작 → 완료</div>
                <div className="text-xs text-gray-400">
                  {analyticsData.funnelMetrics.eventCounts.quizCompletes} / {analyticsData.funnelMetrics.eventCounts.quizStarts}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analyticsData.funnelMetrics.conversionRates.quizToBooking.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">퀴즈 → 예약</div>
                <div className="text-xs text-gray-400">
                  {analyticsData.funnelMetrics.eventCounts.bookingFormViews} / {analyticsData.funnelMetrics.eventCounts.quizCompletes}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData.funnelMetrics.conversionRates.quizToInquiry.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">퀴즈 → 문의</div>
                <div className="text-xs text-gray-400">
                  {analyticsData.funnelMetrics.eventCounts.inquiryFormViews} / {analyticsData.funnelMetrics.eventCounts.quizCompletes}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {analyticsData.funnelMetrics.conversionRates.overallConversion.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">전체 전환율</div>
                <div className="text-xs text-gray-400">
                  {analyticsData.funnelMetrics.eventCounts.bookingSubmits + analyticsData.funnelMetrics.eventCounts.inquirySubmits + analyticsData.funnelMetrics.eventCounts.phoneClicks} / {analyticsData.funnelMetrics.eventCounts.pageViews}
                </div>
              </div>
            </div>
          </div>

          {/* 스크롤 깊이 분석 (실제 데이터) */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">스크롤 깊이 분석 (실제 데이터)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(analyticsData.scrollMetrics.scrollDepth).map(([key, value]) => ({
                depth: key,
                users: value
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="depth" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 성능 메트릭 (실제 데이터) */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">페이지 성능 (실제 데이터)</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">페이지 로드 시간</span>
                  <span className="text-sm font-medium">{analyticsData.performanceMetrics.overall.pageLoadTime.toFixed(1)}s</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(analyticsData.performanceMetrics.overall.pageLoadTime * 20, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">First Contentful Paint</span>
                  <span className="text-sm font-medium">{analyticsData.performanceMetrics.overall.firstContentfulPaint.toFixed(1)}s</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(analyticsData.performanceMetrics.overall.firstContentfulPaint * 30, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Largest Contentful Paint</span>
                  <span className="text-sm font-medium">{analyticsData.performanceMetrics.overall.largestContentfulPaint.toFixed(1)}s</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-orange-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(analyticsData.performanceMetrics.overall.largestContentfulPaint * 25, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
