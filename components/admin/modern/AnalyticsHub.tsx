import React, { useState, useEffect } from 'react';

interface AnalyticsHubProps {
  theme: string;
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  setLoading: (loading: boolean) => void;
}

const AnalyticsHub: React.FC<AnalyticsHubProps> = ({
  theme,
  notifications,
  setNotifications,
  setLoading
}) => {
  const [analyticsData, setAnalyticsData] = useState({
    pageViews: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    conversionRate: 0,
    topPages: [],
    trafficSources: []
  });
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // 실제 API 호출로 대체
      const mockData = {
        pageViews: 15420,
        uniqueVisitors: 8920,
        bounceRate: 45.2,
        avgSessionDuration: 180,
        conversionRate: 3.8,
        topPages: [
          { path: '/25-08', views: 5420, conversions: 45 },
          { path: '/main', views: 3200, conversions: 23 },
          { path: '/about', views: 1800, conversions: 12 }
        ],
        trafficSources: [
          { source: 'Google', visitors: 4500, percentage: 50.4 },
          { source: 'Direct', visitors: 2200, percentage: 24.7 },
          { source: 'Social', visitors: 1200, percentage: 13.5 }
        ]
      };
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('분석 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            분석 허브
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            고급 데이터 분석 및 인사이트
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="1d">오늘</option>
            <option value="7d">이번 주</option>
            <option value="30d">이번 달</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {analyticsData.pageViews.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">페이지뷰</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {analyticsData.uniqueVisitors.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">고유 방문자</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {analyticsData.bounceRate}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">바운스율</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {Math.floor(analyticsData.avgSessionDuration / 60)}분
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">평균 세션</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {analyticsData.conversionRate}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">전환율</div>
        </div>
      </div>

      {/* 상세 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 인기 페이지 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            인기 페이지
          </h3>
          <div className="space-y-3">
            {analyticsData.topPages.map((page: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {page.path}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    전환: {page.conversions}회
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {page.views.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 트래픽 소스 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            트래픽 소스
          </h3>
          <div className="space-y-3">
            {analyticsData.trafficSources.map((source: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {source.source}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {source.percentage}%
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {source.visitors.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 추가 분석 도구 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          추가 분석 도구
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
            <h4 className="font-medium text-gray-900 dark:text-white">사용자 행동 분석</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">스크롤 깊이, 클릭 패턴</p>
          </button>
          <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
            <h4 className="font-medium text-gray-900 dark:text-white">퍼널 분석</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">전환 경로 최적화</p>
          </button>
          <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
            <h4 className="font-medium text-gray-900 dark:text-white">A/B 테스트</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">성과 비교 분석</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHub;
