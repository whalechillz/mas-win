import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface FunnelFile {
  name: string;
  path: string;
  size: number;
  createdDate: string;
  modifiedDate: string;
  version: string;
  status: 'live' | 'staging' | 'dev';
  url: string;
}

interface FunnelData {
  totalFiles: number;
  groupedFunnels: Record<string, FunnelFile[]>;
  lastUpdated: string;
}

interface GA4Data {
  activeUsers: string;
  pageViews: string;
  events: string;
  todayUsers: string;
  todayPageViews: string;
  todayEvents: string;
  monthlyUsers: string;
  monthlyPageViews: string;
  monthlyEvents: string;
  timestamp: string;
  campaign_id: string;
  status: string;
  propertyId: string;
  period: {
    today: string;
    monthStart: string;
    monthEnd: string;
  };
}

interface UserBehaviorData {
  sessionMetrics: {
    totalSessions: number;
    avgSessionDuration: number;
    bounceRate: number;
    pagesPerSession: number;
  };
  devicePerformance: Array<{
    device: string;
    users: number;
    pageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
  }>;
  hourlyPerformance: Array<{
    hour: string;
    users: number;
    pageViews: number;
    sessions: number;
  }>;
  pagePerformance: Array<{
    page: string;
    pageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
    exitRate: number;
  }>;
  eventAnalysis: Array<{
    event: string;
    count: number;
    users: number;
  }>;
  calculatedMetrics: {
    avgSessionDurationMinutes: number;
    engagementRate: number;
    conversionRate: number;
  };
  timestamp: string;
  period: string;
  status?: string;
}

interface MonthlyData {
  users: number;
  pageViews: number;
  events: number;
  workingDays: number;
  totalDays: number;
  tagStatus: 'working' | 'partial' | 'not_working';
  timestamp: string;
  period: string;
}

export default function FunnelManager() {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [ga4Data, setGa4Data] = useState<GA4Data | null>(null);
  const [userBehaviorData, setUserBehaviorData] = useState<UserBehaviorData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('2025-09');

  useEffect(() => {
    // 기본 퍼널 데이터만 먼저 로드
    fetchFunnelData();
    
    // 나머지 데이터는 선택적으로 로드 (에러가 발생해도 전체 페이지가 깨지지 않도록)
    try {
      fetchGA4Data();
    } catch (err) {
      console.log('GA4 데이터 로드 실패:', err);
    }
    
    try {
      fetchUserBehaviorData();
    } catch (err) {
      console.log('사용자 행동 데이터 로드 실패:', err);
    }
    
    try {
      fetchMonthlyData();
    } catch (err) {
      console.log('월별 데이터 로드 실패:', err);
    }
  }, []);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/funnel-management');
      const data = await response.json();
      
      if (data.success) {
        setFunnelData(data.data);
        // 가장 최근 월을 기본 선택
        const months = Object.keys(data.data.groupedFunnels);
        if (months.length > 0) {
          setSelectedMonth(months[months.length - 1]);
        }
      } else {
        setError(data.error || '데이터 로드 실패');
      }
    } catch (err) {
      setError('퍼널 데이터 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGA4Data = async () => {
    try {
      const response = await fetch('/api/ga4-realtime');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setGa4Data(data);
    } catch (err) {
      console.error('GA4 데이터 로드 실패:', err);
      // 기본값 설정
      setGa4Data({
        activeUsers: '0',
        pageViews: '0',
        events: '0',
        todayUsers: '0',
        todayPageViews: '0',
        todayEvents: '0',
        monthlyUsers: '0',
        monthlyPageViews: '0',
        monthlyEvents: '0',
        timestamp: new Date().toISOString(),
        campaign_id: '',
        status: 'error',
        propertyId: '',
        period: {
          today: '',
          monthStart: '',
          monthEnd: ''
        }
      });
    }
  };

  const fetchUserBehaviorData = async () => {
    try {
      const response = await fetch('/api/ga4-user-behavior-filtered');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUserBehaviorData(data);
    } catch (err) {
      console.error('사용자 행동 데이터 로드 실패:', err);
      setUserBehaviorData(null);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      const response = await fetch('/api/ga4-monthly');
      const data = await response.json();
      setMonthlyData(data);
    } catch (err) {
      console.error('월별 데이터 로드 실패:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const selectedFunnels = funnelData?.groupedFunnels[selectedMonth] || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">퍼널 관리</h1>
          <p className="text-gray-600">총 {funnelData?.totalFiles || 0}개의 퍼널 파일</p>
        </div>

        {/* 월별 탭 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {funnelData && Object.keys(funnelData.groupedFunnels).map((month) => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedMonth === month
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {month}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 선택된 월의 퍼널 목록 */}
        {selectedFunnels.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{selectedMonth} 퍼널 목록</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedFunnels.map((funnel, index) => (
                  <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{funnel.name}</h3>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          funnel.status === 'live' ? 'bg-green-100 text-green-800' :
                          funnel.status === 'staging' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {funnel.status}
                        </span>
                      </div>
                      <button
                        onClick={() => window.open(funnel.url, '_blank')}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        미리보기
                      </button>
                    </div>

                    {/* 상세 분석 데이터 표시 */}
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">파일 크기</p>
                          <p className="text-lg font-bold text-blue-600">{formatFileSize(funnel.size)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">수정일</p>
                          <p className="text-sm font-medium text-gray-800">{formatDate(funnel.modifiedDate)}</p>
                        </div>
                      </div>
                      
                      {/* GA4 데이터가 있을 때 표시 */}
                      {ga4Data && (
                        <div className="mt-4 p-3 bg-gray-50 rounded">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">실시간 데이터</h5>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <p className="text-gray-600">현재 접속자</p>
                              <p className="font-medium text-blue-600">{ga4Data.activeUsers}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-600">오늘 페이지뷰</p>
                              <p className="font-medium text-green-600">{ga4Data.todayPageViews}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-600">이번달 사용자</p>
                              <p className="font-medium text-purple-600">{ga4Data.monthlyUsers}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 사용자 행동 데이터가 있을 때 표시 */}
                      {userBehaviorData && (
                        <div className="mt-4 p-3 bg-blue-50 rounded">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">사용자 행동 분석</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-center">
                              <p className="text-gray-600">평균 세션 시간</p>
                              <p className="font-medium text-blue-600">
                                {userBehaviorData?.sessionMetrics?.avgSessionDuration ? 
                                  `${Math.floor(userBehaviorData.sessionMetrics.avgSessionDuration / 60)}분 ${Math.round(userBehaviorData.sessionMetrics.avgSessionDuration % 60)}초` : 
                                  'N/A'}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-600">바운스율</p>
                              <p className="font-medium text-red-600">
                                {userBehaviorData?.sessionMetrics?.bounceRate ? 
                                  `${(userBehaviorData.sessionMetrics.bounceRate * 100).toFixed(1)}%` : 
                                  'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GA4 실시간 데이터 요약 */}
        {ga4Data && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">실시간 GA4 데이터</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h4 className="text-2xl font-bold text-blue-900">{ga4Data.activeUsers}</h4>
                <p className="text-sm text-gray-600">현재 접속자</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h4 className="text-2xl font-bold text-green-900">{ga4Data.todayPageViews}</h4>
                <p className="text-sm text-gray-600">오늘 페이지뷰</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h4 className="text-2xl font-bold text-purple-900">{ga4Data.monthlyUsers}</h4>
                <p className="text-sm text-gray-600">이번달 사용자</p>
              </div>
            </div>
          </div>
        )}

        {/* 사용자 행동 분석 상세 */}
        {userBehaviorData && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">사용자 행동 분석</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h4 className="text-2xl font-bold text-blue-900">
                  {userBehaviorData?.sessionMetrics?.totalSessions?.toLocaleString() || '0'}
                </h4>
                <p className="text-sm text-gray-600">총 세션</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h4 className="text-2xl font-bold text-green-900">
                  {userBehaviorData?.sessionMetrics?.avgSessionDuration ? 
                    `${Math.floor(userBehaviorData.sessionMetrics.avgSessionDuration / 60)}분 ${Math.round(userBehaviorData.sessionMetrics.avgSessionDuration % 60)}초` : 
                    'N/A'}
                </h4>
                <p className="text-sm text-gray-600">평균 세션 시간</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <h4 className="text-2xl font-bold text-red-900">
                  {userBehaviorData?.sessionMetrics?.bounceRate ? 
                    `${(userBehaviorData.sessionMetrics.bounceRate * 100).toFixed(1)}%` : 
                    'N/A'}
                </h4>
                <p className="text-sm text-gray-600">바운스율</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h4 className="text-2xl font-bold text-purple-900">
                  {userBehaviorData?.sessionMetrics?.pagesPerSession?.toFixed(1) || 'N/A'}
                </h4>
                <p className="text-sm text-gray-600">페이지/세션</p>
              </div>
            </div>
          </div>
        )}

        {/* 월별 상세 분석 - 2025-08 */}
        {selectedMonth === '2025-08' && userBehaviorData && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">2025-08 상세 분석</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 세션 메트릭 */}
              <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-bold text-blue-900">세션 분석</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">총 세션:</span>
                    <span className="font-medium">
                      {userBehaviorData?.sessionMetrics?.totalSessions?.toLocaleString() || '0'}회
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">평균 세션:</span>
                    <span className="font-medium">
                      {userBehaviorData?.calculatedMetrics?.avgSessionDurationMinutes ? 
                        `${userBehaviorData.calculatedMetrics.avgSessionDurationMinutes.toFixed(1)}분` : 
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">바운스율:</span>
                    <span className="font-medium">
                      {userBehaviorData?.sessionMetrics?.bounceRate ? 
                        `${(userBehaviorData.sessionMetrics.bounceRate * 100).toFixed(1)}%` : 
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">참여율:</span>
                    <span className="font-medium">
                      {userBehaviorData?.calculatedMetrics?.engagementRate ? 
                        `${(userBehaviorData.calculatedMetrics.engagementRate * 100).toFixed(1)}%` : 
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">페이지/세션:</span>
                    <span className="font-medium">
                      {userBehaviorData?.sessionMetrics?.pagesPerSession?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 디바이스별 성능 */}
              {userBehaviorData?.devicePerformance && userBehaviorData.devicePerformance.length > 0 && (
                <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-bold text-green-900">디바이스별 성능</h4>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={userBehaviorData.devicePerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="device" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, '사용자']} />
                      <Bar dataKey="users" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 space-y-2">
                    {userBehaviorData.devicePerformance.map((device, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{device.device}:</span>
                        <span className="font-medium">
                          {device.users}명 ({device.bounceRate ? `${(device.bounceRate * 100).toFixed(1)}%` : 'N/A'} 바운스)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 시간대별 성능 */}
            {userBehaviorData?.hourlyPerformance && userBehaviorData.hourlyPerformance.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">시간대별 성능</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userBehaviorData.hourlyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === '사용자 (파란색)') return [value, '사용자'];
                        if (name === '페이지뷰 (초록색)') return [value, '페이지뷰'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="pageViews" 
                      name="페이지뷰 (초록색)" 
                      stroke="#10B981" 
                      strokeWidth={2} 
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="users" 
                      name="사용자 (파란색)" 
                      stroke="#3B82F6" 
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 이벤트 분석 */}
            {userBehaviorData?.eventAnalysis && userBehaviorData.eventAnalysis.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">이벤트 분석</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userBehaviorData.eventAnalysis.map((event, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <h5 className="font-semibold text-gray-900 mb-2">{event.event}</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">발생 횟수:</span>
                          <span className="font-medium">{event.count?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">참여 사용자:</span>
                          <span className="font-medium">{event.users?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 월별 상세 분석 - 2025-09 */}
        {selectedMonth === '2025-09' && userBehaviorData && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">2025-09 상세 분석</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 세션 메트릭 */}
              <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-bold text-blue-900">세션 분석</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">총 세션:</span>
                    <span className="font-medium">
                      {userBehaviorData?.sessionMetrics?.totalSessions?.toLocaleString() || '0'}회
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">평균 세션:</span>
                    <span className="font-medium">
                      {userBehaviorData?.calculatedMetrics?.avgSessionDurationMinutes ? 
                        `${userBehaviorData.calculatedMetrics.avgSessionDurationMinutes.toFixed(1)}분` : 
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">바운스율:</span>
                    <span className="font-medium">
                      {userBehaviorData?.sessionMetrics?.bounceRate ? 
                        `${(userBehaviorData.sessionMetrics.bounceRate * 100).toFixed(1)}%` : 
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">참여율:</span>
                    <span className="font-medium">
                      {userBehaviorData?.calculatedMetrics?.engagementRate ? 
                        `${(userBehaviorData.calculatedMetrics.engagementRate * 100).toFixed(1)}%` : 
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">페이지/세션:</span>
                    <span className="font-medium">
                      {userBehaviorData?.sessionMetrics?.pagesPerSession?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 디바이스별 성능 */}
              {userBehaviorData?.devicePerformance && userBehaviorData.devicePerformance.length > 0 && (
                <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-bold text-green-900">디바이스별 성능</h4>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={userBehaviorData.devicePerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="device" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, '사용자']} />
                      <Bar dataKey="users" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 space-y-2">
                    {userBehaviorData.devicePerformance.map((device, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{device.device}:</span>
                        <span className="font-medium">
                          {device.users}명 ({device.bounceRate ? `${(device.bounceRate * 100).toFixed(1)}%` : 'N/A'} 바운스)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 시간대별 성능 */}
            {userBehaviorData?.hourlyPerformance && userBehaviorData.hourlyPerformance.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">시간대별 성능 (9월 1일 ~ 9월 30일)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userBehaviorData.hourlyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === '사용자 (파란색)') return [value, '사용자'];
                        if (name === '페이지뷰 (초록색)') return [value, '페이지뷰'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="pageViews" 
                      name="페이지뷰 (초록색)" 
                      stroke="#10B981" 
                      strokeWidth={2} 
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="users" 
                      name="사용자 (파란색)" 
                      stroke="#3B82F6" 
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 text-sm text-gray-500 text-center">
                  데이터 수집 기간: 9월 1일 ~ 9월 30일
                </div>
              </div>
            )}

            {/* 이벤트 분석 */}
            {userBehaviorData?.eventAnalysis && userBehaviorData.eventAnalysis.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">이벤트 분석</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userBehaviorData.eventAnalysis.map((event, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <h5 className="font-semibold text-gray-900 mb-2">{event.event}</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">발생 횟수:</span>
                          <span className="font-medium">{event.count?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">참여 사용자:</span>
                          <span className="font-medium">{event.users?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 월별 상세 분석 - 2025-07 */}
        {selectedMonth === '2025-07' && userBehaviorData && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">2025-07 상세 분석</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 세션 메트릭 */}
              <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-bold text-blue-900">세션 분석</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">총 세션:</span>
                    <span className="font-medium">
                      {userBehaviorData?.sessionMetrics?.totalSessions?.toLocaleString() || '0'}회
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">평균 세션:</span>
                    <span className="font-medium">
                      {userBehaviorData?.calculatedMetrics?.avgSessionDurationMinutes ? 
                        `${userBehaviorData.calculatedMetrics.avgSessionDurationMinutes.toFixed(1)}분` : 
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">바운스율:</span>
                    <span className="font-medium">
                      {userBehaviorData?.sessionMetrics?.bounceRate ? 
                        `${(userBehaviorData.sessionMetrics.bounceRate * 100).toFixed(1)}%` : 
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">참여율:</span>
                    <span className="font-medium">
                      {userBehaviorData?.calculatedMetrics?.engagementRate ? 
                        `${(userBehaviorData.calculatedMetrics.engagementRate * 100).toFixed(1)}%` : 
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">페이지/세션:</span>
                    <span className="font-medium">
                      {userBehaviorData?.sessionMetrics?.pagesPerSession?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 디바이스별 성능 */}
              {userBehaviorData?.devicePerformance && userBehaviorData.devicePerformance.length > 0 && (
                <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-bold text-green-900">디바이스별 성능</h4>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={userBehaviorData.devicePerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="device" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, '사용자']} />
                      <Bar dataKey="users" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 space-y-2">
                    {userBehaviorData.devicePerformance.map((device, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{device.device}:</span>
                        <span className="font-medium">
                          {device.users}명 ({device.bounceRate ? `${(device.bounceRate * 100).toFixed(1)}%` : 'N/A'} 바운스)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 시간대별 성능 */}
            {userBehaviorData?.hourlyPerformance && userBehaviorData.hourlyPerformance.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">시간대별 성능 (7월 1일 ~ 7월 31일)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userBehaviorData.hourlyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === '사용자 (파란색)') return [value, '사용자'];
                        if (name === '페이지뷰 (초록색)') return [value, '페이지뷰'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="pageViews" 
                      name="페이지뷰 (초록색)" 
                      stroke="#10B981" 
                      strokeWidth={2} 
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="users" 
                      name="사용자 (파란색)" 
                      stroke="#3B82F6" 
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 text-sm text-gray-500 text-center">
                  데이터 수집 기간: 7월 1일 ~ 7월 31일
                </div>
              </div>
            )}

            {/* 이벤트 분석 */}
            {userBehaviorData?.eventAnalysis && userBehaviorData.eventAnalysis.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">이벤트 분석</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userBehaviorData.eventAnalysis.map((event, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <h5 className="font-semibold text-gray-900 mb-2">{event.event}</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">발생 횟수:</span>
                          <span className="font-medium">{event.count?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">참여 사용자:</span>
                          <span className="font-medium">{event.users?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 월별 데이터 요약 */}
        {monthlyData && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">월별 데이터 요약</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h4 className="text-lg font-bold text-blue-900">{monthlyData.users.toLocaleString()}</h4>
                <p className="text-sm text-gray-600">총 사용자</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h4 className="text-lg font-bold text-green-900">{monthlyData.pageViews.toLocaleString()}</h4>
                <p className="text-sm text-gray-600">총 페이지뷰</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h4 className="text-lg font-bold text-purple-900">{monthlyData.events.toLocaleString()}</h4>
                <p className="text-sm text-gray-600">총 이벤트</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <h4 className="text-lg font-bold text-orange-900">{monthlyData.workingDays}/{monthlyData.totalDays}</h4>
                <p className="text-sm text-gray-600">작동일/총일</p>
              </div>
            </div>
            
            {/* 태그 상태 */}
            <div className="mt-4 text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                monthlyData.tagStatus === 'working' ? 'bg-green-100 text-green-800' :
                monthlyData.tagStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                태그 상태: {monthlyData.tagStatus === 'working' ? '정상 작동' : 
                           monthlyData.tagStatus === 'partial' ? '부분 작동' : '작동 안함'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
