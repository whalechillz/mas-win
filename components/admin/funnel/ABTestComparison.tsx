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

export function ABTestComparison() {
  const [comparisonData, setComparisonData] = useState<ABTestComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('week');
  const [testName, setTestName] = useState('funnel-2025-08');
  const [detectedVersions, setDetectedVersions] = useState<string[]>([]);

  useEffect(() => {
    fetchABTestData();
  }, [dateRange, testName]);

  const fetchABTestData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/ab-test-results?dateRange=${dateRange}&testName=${testName}`);
      const data = await response.json();
      
      if (data.success) {
        setComparisonData(data.data);
        setDetectedVersions(data.detectedVersions || []);
      } else {
        setError(data.error || '데이터 로드 실패');
      }
    } catch (err) {
      setError('A/B 테스트 데이터 로드 중 오류가 발생했습니다.');
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

  const getSignificanceColor = (isSignificant: boolean) => {
    return isSignificant ? 'text-green-600' : 'text-gray-500';
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
    const index = detectedVersions.indexOf(version.toLowerCase()) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">A/B 테스트 데이터를 로드하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong className="font-bold">오류:</strong>
        <span className="block sm:inline"> {error}</span>
        <button 
          onClick={fetchABTestData}
          className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!comparisonData || comparisonData.results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">A/B 테스트 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const { results, significance, winner, confidence, dateRange: testDateRange, totalVersions, versionDistribution } = comparisonData;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">A/B 테스트 성능 비교</h2>
          <p className="text-gray-600">
            {formatDate(testDateRange.startDate)} ~ {formatDate(testDateRange.endDate)}
          </p>
          <p className="text-sm text-gray-500">
            총 {totalVersions}개 버전 테스트 중
          </p>
        </div>
        
        <div className="flex space-x-4">
          {/* 날짜 범위 선택 */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="today">오늘</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
          </select>
          
          {/* 테스트 선택 */}
          <select
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="funnel-2025-08">8월 퍼널</option>
            <option value="funnel-2025-07">7월 퍼널</option>
            <option value="funnel-2025-06">6월 퍼널</option>
          </select>
        </div>
      </div>

      {/* 승자 및 신뢰도 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {getWinnerBadge(winner)}
            <div className="text-sm text-gray-600">
              신뢰도: <span className="font-medium text-blue-600">{confidence}%</span>
            </div>
            <div className="text-sm text-gray-600">
              버전 수: <span className="font-medium text-purple-600">{totalVersions}개</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
          </div>
        </div>
      </div>

      {/* 주요 지표 비교 (그리드 레이아웃 개선) */}
      <div className={`grid gap-4 ${
        totalVersions === 2 ? 'grid-cols-1 md:grid-cols-2' :
        totalVersions === 3 ? 'grid-cols-1 md:grid-cols-3' :
        totalVersions === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {results.map((result) => (
          <div key={result.version} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900">버전 {result.version}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                result.version === winner ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {result.version === winner ? '승자' : '도전자'}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>세션:</span>
                <span className="font-medium">{result.sessions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>전환:</span>
                <span className="font-medium">{result.conversions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>전환율:</span>
                <span className={`font-medium ${getSignificanceColor(significance.conversionRate)}`}>
                  {result.conversionRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>평균 세션:</span>
                <span className={`font-medium ${getSignificanceColor(significance.sessionDuration)}`}>
                  {Math.floor(result.avgSessionDuration / 60)}분 {result.avgSessionDuration % 60}초
                </span>
              </div>
              <div className="flex justify-between">
                <span>바운스율:</span>
                <span className={`font-medium ${getSignificanceColor(significance.bounceRate)}`}>
                  {result.bounceRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 전환율 비교 차트 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">전환율 비교</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={results}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="version" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, '전환율']} />
              <Bar 
                dataKey="conversionRate" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 세션 분포 파이 차트 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">세션 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={results.map(result => ({
                  name: `버전 ${result.version}`,
                  value: result.sessions,
                  color: getVersionColor(result.version)
                }))}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {results.map((result, index) => (
                  <Cell key={`cell-${index}`} fill={getVersionColor(result.version)} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 세션 지속시간 비교 차트 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">세션 지속시간 비교</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={results}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="version" />
              <YAxis />
              <Tooltip formatter={(value) => [`${Math.floor(value / 60)}분 ${value % 60}초`, '지속시간']} />
              <Bar 
                dataKey="avgSessionDuration" 
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 바운스율 비교 차트 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">바운스율 비교</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={results}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="version" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, '바운스율']} />
              <Bar 
                dataKey="bounceRate" 
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 통계적 유의성 표시 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">통계적 유의성</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getSignificanceColor(significance.conversionRate)}`}>
              {significance.conversionRate ? '✅' : '❌'}
            </div>
            <div className="text-sm text-gray-600">전환율</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getSignificanceColor(significance.sessionDuration)}`}>
              {significance.sessionDuration ? '✅' : '❌'}
            </div>
            <div className="text-sm text-gray-600">세션 지속시간</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getSignificanceColor(significance.bounceRate)}`}>
              {significance.bounceRate ? '✅' : '❌'}
            </div>
            <div className="text-sm text-gray-600">바운스율</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ABTestComparison;
