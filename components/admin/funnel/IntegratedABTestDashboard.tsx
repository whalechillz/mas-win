import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface ABTestResult {
  testName: string;
  version: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
  pageViews: number;
  exposures?: number;
  uniqueUsers?: number;
}

interface ABTestComparison {
  testName: string;
  dateRange: { startDate: string; endDate: string };
  results: ABTestResult[];
  significance: {
    conversionRate: boolean;
    sessionDuration: boolean;
    bounceRate: boolean;
  };
  winner: string | null;
  confidence: number;
  totalVersions: number;
  versionDistribution: Record<string, number>;
}

interface AdvancedAnalytics {
  dateRange: { startDate: string; endDate: string };
  version: string;
  sessionMetrics: {
    totalSessions: number;
    averageSessionDuration: number;
    bounceRate: number;
    pagesPerSession: number;
    activeUsers: number;
  };
  userBehavior: {
    scrollDepth: { '25%': number; '50%': number; '75%': number; '100%': number };
    timeOnPage: { '0-30s': number; '30s-2m': number; '2m-5m': number; '5m+': number };
  };
  performanceMetrics: {
    pageLoadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
}

export default function IntegratedABTestDashboard() {
  const [comparisonData, setComparisonData] = useState<ABTestComparison | null>(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('week');
  const [testName, setTestName] = useState('funnel-2025-08');
  const [selectedVersion, setSelectedVersion] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    fetchAllData();
    
    // 5분마다 자동 업데이트
    const interval = setInterval(fetchAllData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [dateRange, testName, selectedVersion]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // A/B 테스트 데이터
      const abTestResponse = await fetch(`/api/analytics/ab-test-results?dateRange=${dateRange}&testName=${testName}`);
      const abTestData = await abTestResponse.json();
      
      // 고급 분석 데이터 (버전별)
      const advancedResponse = await fetch(`/api/analytics/advanced-metrics?dateRange=${dateRange}&version=${selectedVersion}`);
      const advancedData = await advancedResponse.json();
      
      if (abTestData.success) {
        setComparisonData(abTestData.data);
      }
      
      setAdvancedAnalytics(advancedData);
      setLastUpdate(new Date().toLocaleTimeString('ko-KR'));
    } catch (err) {
      setError('데이터 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getWinnerBadge = (winner: string | null) => {
    if (!winner) return null;
    
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        🏆 승자: 버전 {winner}
      </div>
    );
  };

  const getVersionColor = (version: string) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    const index = version.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* A/B 테스트 성능 비교 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">실시간 A/B 테스트 성능 비교</h2>
            <p className="text-sm text-gray-600 mt-1">
              {comparisonData && `${formatDate(comparisonData.dateRange.startDate)} ~ ${formatDate(comparisonData.dateRange.endDate)}`}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="today">오늘</option>
              <option value="week">이번 주</option>
              <option value="month">이번 달</option>
            </select>
            <select
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="funnel-2025-08">8월 퍼널</option>
            </select>
            <button
              onClick={fetchAllData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              새로고침
            </button>
          </div>
        </div>

        {comparisonData && (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  총 {comparisonData.totalVersions}개 버전 테스트 중
                </div>
                <div className="text-sm text-gray-600">
                  마지막 업데이트: {lastUpdate}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                실시간 업데이트: 5분마다 자동
              </div>
            </div>

            {/* 승자 정보 */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  {getWinnerBadge(comparisonData.winner)}
                  <div className="mt-2 text-sm text-gray-600">
                    신뢰도: {comparisonData.confidence}% | 버전 수: {comparisonData.totalVersions}개
                  </div>
                </div>
              </div>
            </div>

            {/* 버전 비교 테이블 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">버전</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">노출 수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고유 사용자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">세션</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전환</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전환율</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 세션</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">바운스율</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparisonData.results.map((result, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: getVersionColor(result.version) }}
                          ></div>
                          <span className="text-sm font-medium text-gray-900">
                            버전 {result.version}
                          </span>
                          {result.version === comparisonData.winner && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              승자
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.exposures || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.uniqueUsers || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.sessions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.conversions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium">{result.conversionRate.toFixed(1)}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.floor(result.avgSessionDuration / 60)}분 {result.avgSessionDuration % 60}초
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.bounceRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 전환율 비교 차트 */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">전환율 비교</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData.results}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="version" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="conversionRate" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 고급 사용자 행동 분석 */}
      {advancedAnalytics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">고급 사용자 행동 분석</h2>
            <div className="flex items-center space-x-4">
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">전체 버전</option>
                <option value="live-a">Live-A</option>
                <option value="live-b">Live-B</option>
              </select>
              <button
                onClick={fetchAllData}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                새로고침
              </button>
            </div>
          </div>

          {/* 세션 메트릭스 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{advancedAnalytics.sessionMetrics.totalSessions}</div>
              <div className="text-sm text-gray-600">총 세션</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {Math.floor(advancedAnalytics.sessionMetrics.averageSessionDuration / 60)}분{advancedAnalytics.sessionMetrics.averageSessionDuration % 60}초
              </div>
              <div className="text-sm text-gray-600">평균 세션 시간</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{advancedAnalytics.sessionMetrics.bounceRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">바운스율</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{advancedAnalytics.sessionMetrics.pagesPerSession.toFixed(1)}</div>
              <div className="text-sm text-gray-600">페이지/세션</div>
            </div>
          </div>

          {/* 스크롤 깊이 분석 */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">스크롤 깊이 분석</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { depth: '25%', value: advancedAnalytics.userBehavior.scrollDepth['25%'] },
                  { depth: '50%', value: advancedAnalytics.userBehavior.scrollDepth['50%'] },
                  { depth: '75%', value: advancedAnalytics.userBehavior.scrollDepth['75%'] },
                  { depth: '100%', value: advancedAnalytics.userBehavior.scrollDepth['100%'] }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="depth" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 페이지 성능 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">페이지 성능</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {advancedAnalytics.performanceMetrics.pageLoadTime.toFixed(1)}s
                </div>
                <div className="text-sm text-gray-600">페이지 로드 시간</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {advancedAnalytics.performanceMetrics.firstContentfulPaint.toFixed(1)}s
                </div>
                <div className="text-sm text-gray-600">첫 번째 콘텐츠풀 페인트</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {advancedAnalytics.performanceMetrics.largestContentfulPaint.toFixed(1)}s
                </div>
                <div className="text-sm text-gray-600">최대 콘텐츠풀 페인트</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { IntegratedABTestDashboard };
