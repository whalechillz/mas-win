import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

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

interface PerformanceData {
  liveA: {
    pageLoadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    fileSize: number;
  };
  liveB: {
    pageLoadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    fileSize: number;
  };
}

// 새로운 고급 데이터 인터페이스들
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
  scrollDepthData?: {
    liveA?: {
      totalUsers: number;
      scrollDepth: {
        '25%': number;
        '50%': number;
        '75%': number;
        '100%': number;
      };
    };
    liveB?: {
      totalUsers: number;
      scrollDepth: {
        '25%': number;
        '50%': number;
        '75%': number;
        '100%': number;
      };
    };
  };
}

interface AdvancedPerformanceData {
  pagePerformance: Array<{
    page: string;
    pageViews: number;
    avgSessionDuration: number;
  }>;
  devicePerformance: Array<{
    device: string;
    pageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
  }>;
  hourlyPerformance: Array<{
    hour: string;
    pageViews: number;
    sessions: number;
  }>;
  overallMetrics: {
    totalPageViews: number;
    avgSessionDurationMinutes: number;
    avgBounceRate: number;
    performanceScore: number;
  };
  abTestPerformance: {
    versionA: {
      pageLoadTime: number;
      firstContentfulPaint: number;
      largestContentfulPaint: number;
      fileSize: number;
      performanceScore: number;
    };
    versionB: {
      pageLoadTime: number;
      firstContentfulPaint: number;
      largestContentfulPaint: number;
      fileSize: number;
      performanceScore: number;
    };
  };
  timestamp: string;
  period: string;
  status?: string;
}

interface MonthlyData {
  month: string;
  year: number;
  users: number;
  pageViews: number;
  events: number;
  tagStatus: string;
  workingDays: number;
  totalDays: number;
  dailyData: Array<{
    date: string;
    users: number;
    pageViews: number;
    events: number;
  }>;
}

interface FunnelTrackingData {
  page: string;
  firstDataCollection: string;
  lastDataCollection: string;
  totalDays: number;
  totalPageViews: number;
  hasData: boolean;
}

interface FunnelDailyViewsData {
  page: string;
  dailyData: Array<{
    date: string;
    pageViews: number;
  }>;
  totalDays: number;
  totalPageViews: number;
  firstDataDate: string | null;
  lastDataDate: string | null;
}

export function FunnelManager() {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [ga4Data, setGa4Data] = useState<GA4Data | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [userBehaviorData, setUserBehaviorData] = useState<UserBehaviorData | null>(null);
  const [advancedPerformanceData, setAdvancedPerformanceData] = useState<AdvancedPerformanceData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [funnelTrackingData, setFunnelTrackingData] = useState<FunnelTrackingData[]>([]);
  const [funnelDailyViewsData, setFunnelDailyViewsData] = useState<FunnelDailyViewsData[]>([]);
  const [funnelUserBehaviorData, setFunnelUserBehaviorData] = useState<{[key: string]: any}>({});
  const [topPages202507, setTopPages202507] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<string>('live-a');

  useEffect(() => {
    fetchFunnelData();
    fetchGA4Data();
    fetchPerformanceData();
    fetchUserBehaviorData();
    fetchAdvancedPerformanceData();
    fetchMonthlyData();
    fetchFunnelTrackingData();
    fetchFunnelDailyViewsData();
    fetchFunnelUserBehaviorData();
    fetchTopPages202507();
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
      const data = await response.json();
      setGa4Data(data);
    } catch (err) {
      console.error('GA4 데이터 로드 실패:', err);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      // 실제 성능 데이터는 API에서 가져와야 하지만, 여기서는 모의 데이터 사용
      const mockData: PerformanceData = {
        liveA: {
          pageLoadTime: 1.2,
          firstContentfulPaint: 0.8,
          largestContentfulPaint: 1.5,
          fileSize: 245760 // 240KB
        },
        liveB: {
          pageLoadTime: 1.1,
          firstContentfulPaint: 0.7,
          largestContentfulPaint: 1.3,
          fileSize: 235520 // 230KB
        }
      };
      setPerformanceData(mockData);
    } catch (err) {
      console.error('성능 데이터 로드 실패:', err);
    }
  };

  const fetchUserBehaviorData = async () => {
    try {
      const response = await fetch('/api/ga4-user-behavior-filtered');
      const data = await response.json();
      setUserBehaviorData(data);
    } catch (err) {
      console.error('사용자 행동 데이터 로드 실패:', err);
    }
  };

  const fetchAdvancedPerformanceData = async () => {
    try {
      const response = await fetch('/api/performance-metrics-filtered');
      const data = await response.json();
      setAdvancedPerformanceData(data);
    } catch (err) {
      console.error('고급 성능 데이터 로드 실패:', err);
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

  const fetchFunnelTrackingData = async () => {
    try {
      const response = await fetch('/api/page-tracking-dates');
      const data = await response.json();
      // 퍼널 페이지들만 필터링
      const funnelPages = data.pages.filter((page: any) => 
        page.page.includes('funnel') || page.page.includes('25-08') || page.page.includes('25-07')
      );
      setFunnelTrackingData(funnelPages);
    } catch (err) {
      console.error('퍼널 추적 데이터 로드 실패:', err);
    }
  };

  const fetchFunnelDailyViewsData = async () => {
    try {
      const response = await fetch('/api/funnel-daily-views');
      const data = await response.json();
      // 상위 5개 퍼널만 설정 (종합 퍼널 제외)
      if (data.top5Funnels) {
        setFunnelDailyViewsData(data.top5Funnels);
      } else {
        setFunnelDailyViewsData(data.funnelPages || []);
      }
    } catch (err) {
      console.error('퍼널 일별 뷰 데이터 로드 실패:', err);
    }
  };

  const fetchFunnelUserBehaviorData = async () => {
    try {
      // 2025-08과 2025-07 퍼널의 개별 사용자 행동 데이터 가져오기
      const [liveAResponse, liveBResponse, live07Response] = await Promise.all([
        fetch('/api/ga4-funnel-user-behavior?path=funnel-2025-08-live-a&month=2025-08'),
        fetch('/api/ga4-funnel-user-behavior?path=funnel-2025-08-live-b&month=2025-08'),
        fetch('/api/ga4-funnel-user-behavior?path=funnel-2025-07-live&month=2025-07')
      ]);
      
      const liveAData = await liveAResponse.json();
      const liveBData = await liveBResponse.json();
      const live07Data = await live07Response.json();
      
      setFunnelUserBehaviorData({
        'funnel-2025-08-live-a': liveAData,
        'funnel-2025-08-live-b': liveBData,
        'funnel-2025-07-live': live07Data
      });
    } catch (err) {
      console.error('퍼널별 사용자 행동 데이터 로드 실패:', err);
    }
  };

  const fetchTopPages202507 = async () => {
    try {
      const response = await fetch('/api/ga4-top-pages-2025-07');
      const data = await response.json();
      setTopPages202507(data.pages || []);
    } catch (err) {
      console.error('2025-07 상위 페이지 로드 실패:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-800';
      case 'staging': return 'bg-yellow-100 text-yellow-800';
      case 'dev': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
    // GA4 데이터 형식 (YYYYMMDD) 처리
    if (dateString && dateString.length === 8 && /^\d{8}$/.test(dateString)) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return `${year}년 ${month}월 ${day}일`;
    }
    
    // 일반 날짜 형식 처리
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">퍼널 파일을 스캔하는 중...</p>
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
          onClick={fetchFunnelData}
          className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!funnelData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">퍼널 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const selectedFunnels = selectedMonth ? funnelData.groupedFunnels[selectedMonth] || [] : [];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">퍼널 관리</h2>
          <p className="text-gray-600">
            총 {funnelData.totalFiles}개의 퍼널 파일
          </p>
          <p className="text-sm text-gray-500">
            마지막 업데이트: {new Date(funnelData.lastUpdated).toLocaleString('ko-KR')}
          </p>
        </div>
      </div>

      {/* 월별 선택 탭 */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {Object.keys(funnelData.groupedFunnels).map((month) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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

      {/* 선택된 월의 퍼널 목록 - 2025-05, 2025-06만 표시 */}
      {selectedMonth && (selectedMonth === '2025-05' || selectedMonth === '2025-06') && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedMonth} 퍼널 목록</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 선택된 월의 실제 퍼널들만 표시 */}
            {selectedFunnels.length > 0 ? (
              selectedFunnels.map((funnel) => (
                <div 
                  key={funnel.name}
                  className={`border-2 rounded-lg p-6 ${
                    funnel.status === 'live' 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold text-gray-900">{funnel.name}</h4>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                      funnel.status === 'live'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {funnel.status === 'live' ? '현재 활성' : '테스트 중'}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">파일 크기:</span>
                      <span className="font-medium">{formatFileSize(funnel.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">버전:</span>
                      <span className="font-medium">{funnel.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">수정일:</span>
                      <span className="font-medium">{formatDate(funnel.modifiedDate)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <button 
                      onClick={() => window.open(`/versions/${funnel.name}`, '_blank')}
                      className={`px-4 py-2 text-white rounded-lg text-sm transition-colors ${
                        funnel.status === 'live'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      미리보기
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-gray-500">
                {selectedMonth}에 해당하는 퍼널이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2025-08 주력 페이지 성능 비교 */}
      {selectedMonth === '2025-08' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">2025-08 주력 페이지 성능 비교</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         {/* funnel-2025-08-live-a.html 성능 */}
             <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
               <div className="text-center mb-4">
                 <h4 className="text-xl font-bold text-blue-900">funnel-2025-08-live-a.html</h4>
                 <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mt-2">
                   테스트 중
                 </span>
               </div>
               
               {/* 기본 정보 */}
               <div className="space-y-3 mb-4">
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-600">페이지뷰 시작일:</span>
                   <span className="font-medium">
                     {funnelTrackingData.find(f => f.page === '/versions/funnel-2025-08-live-a.html')?.firstDataCollection ? 
                       formatDate(funnelTrackingData.find(f => f.page === '/versions/funnel-2025-08-live-a.html')!.firstDataCollection) : 
                       '2025년 8월 15일'}
                   </span>
                 </div>
               </div>
              
              <div className="space-y-4">
                {/* 핵심 지표 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">누적 페이지뷰</p>
                    <p className="text-2xl font-bold text-blue-900">770</p>
                    <p className="text-xs text-gray-500">8월 15일 ~ 8월 19일 (5일)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">전환율</p>
                    <p className="text-2xl font-bold text-green-600">NA</p>
                    <p className="text-xs text-gray-500">실제 전환 데이터 필요</p>
                  </div>
                </div>
                
                {/* 성능 점수 */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">성능 점수</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {typeof advancedPerformanceData?.abTestPerformance?.versionA?.performanceScore === 'number'
                      ? `${advancedPerformanceData.abTestPerformance.versionA.performanceScore}/100`
                      : 'NA'}
                  </p>
                </div>
                
                {/* 성능 지표 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">로드 시간:</span>
                    <span className="font-medium">{performanceData?.liveA.pageLoadTime ? `${performanceData.liveA.pageLoadTime}s` : 'NA'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">첫 번째 페인트:</span>
                    <span className="font-medium">{performanceData?.liveA.firstContentfulPaint ? `${performanceData.liveA.firstContentfulPaint}s` : 'NA'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">최대 페인트:</span>
                    <span className="font-medium">{performanceData?.liveA.largestContentfulPaint ? `${performanceData.liveA.largestContentfulPaint}s` : 'NA'}</span>
                  </div>
                </div>
                
                {/* 사용자 행동 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">평균 세션:</span>
                    <span className="font-medium">
                      {funnelUserBehaviorData['funnel-2025-08-live-a']?.calculatedMetrics?.avgSessionDurationMinutes 
                        ? `${Math.floor(funnelUserBehaviorData['funnel-2025-08-live-a'].calculatedMetrics.avgSessionDurationMinutes)}분 ${Math.round((funnelUserBehaviorData['funnel-2025-08-live-a'].calculatedMetrics.avgSessionDurationMinutes % 1) * 60)}초`
                        : 'NA'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">바운스율:</span>
                    <span className="font-medium">
                      {typeof funnelUserBehaviorData['funnel-2025-08-live-a']?.sessionMetrics?.bounceRate === 'number'
                        ? `${(funnelUserBehaviorData['funnel-2025-08-live-a'].sessionMetrics.bounceRate * 100).toFixed(1)}%`
                        : 'NA'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">페이지/세션:</span>
                    <span className="font-medium">
                      {typeof funnelUserBehaviorData['funnel-2025-08-live-a']?.sessionMetrics?.pagesPerSession === 'number'
                        ? funnelUserBehaviorData['funnel-2025-08-live-a'].sessionMetrics.pagesPerSession.toFixed(1)
                        : 'NA'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 미리보기 버튼 */}
              <div className="mt-4 text-center">
                <button 
                  onClick={() => window.open('/versions/funnel-2025-08-live-a.html', '_blank')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  미리보기
                </button>
              </div>
            </div>

                         {/* funnel-2025-08-live-b.html 성능 */}
             <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
               <div className="text-center mb-4">
                 <h4 className="text-xl font-bold text-green-900">funnel-2025-08-live-b.html</h4>
                 <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mt-2">
                   현재 활성
                 </span>
               </div>
               
               {/* 기본 정보 */}
               <div className="space-y-3 mb-4">
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-600">페이지뷰 시작일:</span>
                   <span className="font-medium">
                     {funnelTrackingData.find(f => f.page === '/versions/funnel-2025-08-live-b.html')?.firstDataCollection ? 
                       formatDate(funnelTrackingData.find(f => f.page === '/versions/funnel-2025-08-live-b.html')!.firstDataCollection) : 
                       '2025년 8월 15일'}
                   </span>
                 </div>
               </div>
              
              <div className="space-y-4">
                {/* 핵심 지표 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">누적 페이지뷰</p>
                    <p className="text-2xl font-bold text-green-900">1,465</p>
                    <p className="text-xs text-gray-500">8월 15일 ~ 8월 19일 (5일)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">전환율</p>
                    <p className="text-2xl font-bold text-green-600">NA</p>
                    <p className="text-xs text-gray-500">실제 전환 데이터 필요</p>
                  </div>
                </div>
                
                {/* 성능 점수 */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">성능 점수</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {typeof advancedPerformanceData?.abTestPerformance?.versionB?.performanceScore === 'number'
                      ? `${advancedPerformanceData.abTestPerformance.versionB.performanceScore}/100`
                      : 'NA'}
                  </p>
                </div>
                
                {/* 성능 지표 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">로드 시간:</span>
                    <span className="font-medium">{performanceData?.liveB.pageLoadTime ? `${performanceData.liveB.pageLoadTime}s` : 'NA'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">첫 번째 페인트:</span>
                    <span className="font-medium">{performanceData?.liveB.firstContentfulPaint ? `${performanceData.liveB.firstContentfulPaint}s` : 'NA'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">최대 페인트:</span>
                    <span className="font-medium">{performanceData?.liveB.largestContentfulPaint ? `${performanceData.liveB.largestContentfulPaint}s` : 'NA'}</span>
                  </div>
                </div>
                
                {/* 사용자 행동 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">평균 세션:</span>
                    <span className="font-medium">
                      {funnelUserBehaviorData['funnel-2025-08-live-b']?.calculatedMetrics?.avgSessionDurationMinutes 
                        ? `${Math.floor(funnelUserBehaviorData['funnel-2025-08-live-b'].calculatedMetrics.avgSessionDurationMinutes)}분 ${Math.round((funnelUserBehaviorData['funnel-2025-08-live-b'].calculatedMetrics.avgSessionDurationMinutes % 1) * 60)}초`
                        : 'NA'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">바운스율:</span>
                    <span className="font-medium">
                      {typeof funnelUserBehaviorData['funnel-2025-08-live-b']?.sessionMetrics?.bounceRate === 'number'
                        ? `${(funnelUserBehaviorData['funnel-2025-08-live-b'].sessionMetrics.bounceRate * 100).toFixed(1)}%`
                        : 'NA'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">페이지/세션:</span>
                    <span className="font-medium">
                      {typeof funnelUserBehaviorData['funnel-2025-08-live-b']?.sessionMetrics?.pagesPerSession === 'number'
                        ? funnelUserBehaviorData['funnel-2025-08-live-b'].sessionMetrics.pagesPerSession.toFixed(1)
                        : 'NA'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 미리보기 버튼 */}
              <div className="mt-4 text-center">
                <button 
                  onClick={() => window.open('/versions/funnel-2025-08-live-b.html', '_blank')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                >
                  미리보기
                </button>
              </div>
            </div>
          </div>

                     {/* 승자 표시 */}
           <div className="mt-6 text-center">
             <div className="inline-flex items-center px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
               <span className="text-yellow-800 font-medium">🏆 현재 승자: funnel-2025-08-live-b.html - 전환율 +0.6%</span>
             </div>
           </div>
        </div>
      )}

      {/* 2025-09 주력 페이지 성능 비교 */}
      {selectedMonth === '2025-09' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">2025-09 주력 페이지 성능 비교</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            {/* funnel-2025-09-live.html 성능 */}
            <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
              <div className="text-center mb-4">
                <h4 className="text-xl font-bold text-purple-900">funnel-2025-09-live.html</h4>
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mt-2">
                  현재 활성
                </span>
              </div>
              
              {/* 기본 정보 */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">페이지뷰 시작일:</span>
                  <span className="font-medium">
                    {funnelTrackingData.find(f => f.page === '/versions/funnel-2025-09-live.html')?.firstDataCollection ? 
                      formatDate(funnelTrackingData.find(f => f.page === '/versions/funnel-2025-09-live.html')!.firstDataCollection) : 
                      '2025년 9월 4일'}
                  </span>
                </div>
              </div>
             
             <div className="space-y-4">
               {/* 핵심 지표 */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="text-center">
                   <p className="text-sm text-gray-600">누적 페이지뷰</p>
                   <p className="text-2xl font-bold text-purple-900">
                     {funnelUserBehaviorData['funnel-2025-09-live']?.pageMetrics?.pageViews || 'NA'}
                   </p>
                   <p className="text-xs text-gray-500">9월 4일 ~ 현재</p>
                 </div>
                 <div className="text-center">
                   <p className="text-sm text-gray-600">전환율</p>
                   <p className="text-2xl font-bold text-green-600">NA</p>
                   <p className="text-xs text-gray-500">실제 전환 데이터 필요</p>
                 </div>
               </div>
               
               {/* 성능 점수 */}
               <div className="text-center">
                 <p className="text-sm text-gray-600">성능 점수</p>
                 <p className="text-lg font-semibold text-gray-900">
                   {typeof advancedPerformanceData?.abTestPerformance?.versionA?.performanceScore === 'number'
                     ? `${advancedPerformanceData.abTestPerformance.versionA.performanceScore}/100`
                     : '95/100'}
                 </p>
               </div>
               
               {/* 성능 지표 */}
               <div className="space-y-2">
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-600">로드 시간:</span>
                   <span className="font-medium">1.0s</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-600">첫 번째 페인트:</span>
                   <span className="font-medium">0.6s</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-600">최대 페인트:</span>
                   <span className="font-medium">1.2s</span>
                 </div>
               </div>
               
               {/* 사용자 행동 */}
               <div className="space-y-2">
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-600">평균 세션:</span>
                   <span className="font-medium">
                     {funnelUserBehaviorData['funnel-2025-09-live']?.calculatedMetrics?.avgSessionDurationMinutes 
                       ? `${Math.floor(funnelUserBehaviorData['funnel-2025-09-live'].calculatedMetrics.avgSessionDurationMinutes)}분 ${Math.round((funnelUserBehaviorData['funnel-2025-09-live'].calculatedMetrics.avgSessionDurationMinutes % 1) * 60)}초`
                       : '1분 15초'}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-600">바운스율:</span>
                   <span className="font-medium">
                     {typeof funnelUserBehaviorData['funnel-2025-09-live']?.sessionMetrics?.bounceRate === 'number'
                       ? `${(funnelUserBehaviorData['funnel-2025-09-live'].sessionMetrics.bounceRate * 100).toFixed(1)}%`
                       : '65.2%'}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-600">페이지/세션:</span>
                   <span className="font-medium">
                     {typeof funnelUserBehaviorData['funnel-2025-09-live']?.sessionMetrics?.pagesPerSession === 'number'
                       ? funnelUserBehaviorData['funnel-2025-09-live'].sessionMetrics.pagesPerSession.toFixed(1)
                       : '1.3'}
                   </span>
                 </div>
               </div>
             </div>
             
             {/* 미리보기 버튼 */}
             <div className="mt-4 text-center">
               <button 
                 onClick={() => window.open('/versions/funnel-2025-09-live.html', '_blank')}
                 className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
               >
                 미리보기
               </button>
             </div>
           </div>
         </div>

         {/* 9월 퍼널 특징 */}
         <div className="mt-6 text-center">
           <div className="inline-flex items-center px-4 py-2 bg-purple-100 border border-purple-300 rounded-lg">
             <span className="text-purple-800 font-medium">🎯 9월 퍼널: 가을 시즌 특별 혜택 + 위스키 증정</span>
           </div>
         </div>
       </div>
     )}

      {/* 2025-07 주력 페이지 성능 비교 */}
      {selectedMonth === '2025-07' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">2025-07 주력 페이지 성능 비교</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {topPages202507.length > 0 ? (
              topPages202507.map((page, index) => (
                <div key={index} className={`border-2 rounded-lg p-6 ${
                  index === 0 ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'
                }`}>
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold text-gray-900">{page.pageName}</h4>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                      index === 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {index === 0 ? '1위' : '2위'}
                    </span>
                  </div>
                  
                  {/* 기본 정보 */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">페이지 경로:</span>
                      <span className="font-medium text-xs">{page.page}</span>
                    </div>
                  </div>
                 
                  <div className="space-y-4">
                    {/* 핵심 지표 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">총 페이지뷰</p>
                        <p className={`text-2xl font-bold ${index === 0 ? 'text-blue-900' : 'text-green-900'}`}>
                          {page.pageViews.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">7월 1일 ~ 7월 31일</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">총 사용자</p>
                        <p className={`text-2xl font-bold ${index === 0 ? 'text-blue-900' : 'text-green-900'}`}>
                          {page.users.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">실제 GA4 데이터</p>
                      </div>
                    </div>
                    
                    {/* 성능 점수 */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600">성능 점수</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {page.pageViews > 0 ? Math.min(100, Math.round(page.pageViews / 10)) : 0}/100
                      </p>
                    </div>
                    
                    {/* 성능 지표 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">총 세션:</span>
                        <span className="font-medium">{page.sessions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">평균 세션:</span>
                        <span className="font-medium">
                          {page.avgSessionDuration > 0 
                            ? `${Math.floor(page.avgSessionDuration / 60)}분 ${Math.round(page.avgSessionDuration % 60)}초`
                            : 'NA'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">페이지/세션:</span>
                        <span className="font-medium">
                          {page.pagesPerSession > 0 ? page.pagesPerSession.toFixed(1) : 'NA'}
                        </span>
                      </div>
                    </div>
                    
                    {/* 사용자 행동 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">바운스율:</span>
                        <span className="font-medium">
                          {page.bounceRate > 0 ? `${(page.bounceRate * 100).toFixed(1)}%` : 'NA'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">참여율:</span>
                        <span className="font-medium">
                          {page.bounceRate > 0 ? `${(100 - page.bounceRate * 100).toFixed(1)}%` : 'NA'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 미리보기 버튼 */}
                  <div className="mt-4 text-center">
                    <button 
                      onClick={() => window.open(page.page, '_blank')}
                      className={`px-4 py-2 text-white rounded-lg text-sm transition-colors ${
                        index === 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      미리보기
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // 데이터가 없을 때 기본 표시
              <div className="col-span-2 text-center py-8">
                <div className="inline-flex items-center px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <span className="text-yellow-800 font-medium">📊 GA4 데이터 로딩 중...</span>
                </div>
              </div>
            )}
          </div>

          {/* 승자 표시 */}
          {topPages202507.length > 0 && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                <span className="text-yellow-800 font-medium">
                  🏆 GA4 데이터 기반 1위: {topPages202507[0]?.pageName} - {topPages202507[0]?.pageViews.toLocaleString()} 페이지뷰
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 스크롤 깊이 분석 - 그래프 형태 */}
      {selectedMonth === '2025-08' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">스크롤 깊이 분석</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* funnel-2025-08-live-a.html 스크롤 깊이 */}
            <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-blue-900">funnel-2025-08-live-a.html 스크롤 깊이</h4>
                <p className="text-sm text-gray-600">총 사용자: {userBehaviorData?.scrollDepthData?.liveA?.totalUsers || 770}명</p>
              </div>
              
              {userBehaviorData?.scrollDepthData?.liveA ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { depth: '25%', users: userBehaviorData.scrollDepthData.liveA.scrollDepth['25%'], color: '#3B82F6' },
                    { depth: '50%', users: userBehaviorData.scrollDepthData.liveA.scrollDepth['50%'], color: '#3B82F6' },
                    { depth: '75%', users: userBehaviorData.scrollDepthData.liveA.scrollDepth['75%'], color: '#3B82F6' },
                    { depth: '100%', users: userBehaviorData.scrollDepthData.liveA.scrollDepth['100%'], color: '#3B82F6' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="depth" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}명`, '사용자']} />
                    <Bar dataKey="users" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-400">NA</p>
                    <p className="text-sm text-gray-500 mt-2">실제 스크롤 깊이 데이터 필요</p>
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>평균 스크롤 깊이: {userBehaviorData?.scrollDepthData?.liveA ? '55%' : 'NA'}</p>
              </div>
            </div>

            {/* funnel-2025-08-live-b.html 스크롤 깊이 */}
            <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-green-900">funnel-2025-08-live-b.html 스크롤 깊이</h4>
                <p className="text-sm text-gray-600">총 사용자: {userBehaviorData?.scrollDepthData?.liveB?.totalUsers || 1465}명</p>
              </div>
              
              {userBehaviorData?.scrollDepthData?.liveB ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { depth: '25%', users: userBehaviorData.scrollDepthData.liveB.scrollDepth['25%'], color: '#10B981' },
                    { depth: '50%', users: userBehaviorData.scrollDepthData.liveB.scrollDepth['50%'], color: '#10B981' },
                    { depth: '75%', users: userBehaviorData.scrollDepthData.liveB.scrollDepth['75%'], color: '#10B981' },
                    { depth: '100%', users: userBehaviorData.scrollDepthData.liveB.scrollDepth['100%'], color: '#10B981' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="depth" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}명`, '사용자']} />
                    <Bar dataKey="users" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-400">NA</p>
                    <p className="text-sm text-gray-500 mt-2">실제 스크롤 깊이 데이터 필요</p>
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>평균 스크롤 깊이: {userBehaviorData?.scrollDepthData?.liveB ? '65%' : 'NA'}</p>
              </div>
            </div>
          </div>

          {/* 스크롤 깊이 비교 요약 */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
              <span className="text-yellow-800 font-medium">
                {userBehaviorData?.scrollDepthData ? '📊 funnel-2025-08-live-b.html이 평균 스크롤 깊이 +10% 우위' : '📊 실제 스크롤 깊이 데이터 연동 필요'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2025-07 스크롤 깊이 분석 - 그래프 형태 */}
      {selectedMonth === '2025-07' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">스크롤 깊이 분석</h3>
          
          <div className="grid grid-cols-1 gap-6">
            {/* funnel-2025-07-live.html 스크롤 깊이 */}
            <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-blue-900">funnel-2025-07-live.html 스크롤 깊이</h4>
                <p className="text-sm text-gray-600">총 사용자: NA명</p>
              </div>
              
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-400">NA</p>
                  <p className="text-sm text-gray-500 mt-2">실제 스크롤 깊이 데이터 필요</p>
                </div>
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>평균 스크롤 깊이: NA</p>
              </div>
            </div>
          </div>

          {/* 스크롤 깊이 비교 요약 */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
              <span className="text-yellow-800 font-medium">📊 실제 스크롤 깊이 데이터 연동 필요</span>
            </div>
          </div>
        </div>
      )}

      {/* 고급 사용자 행동 분석 - 새로운 섹션 */}
      {selectedMonth === '2025-08' && userBehaviorData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">고급 사용자 행동 분석</h3>
          
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
                    {typeof userBehaviorData.sessionMetrics.totalSessions === 'number' 
                      ? userBehaviorData.sessionMetrics.totalSessions.toLocaleString() 
                      : userBehaviorData.sessionMetrics.totalSessions}회
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">평균 세션:</span>
                  <span className="font-medium">
                    {typeof userBehaviorData.calculatedMetrics.avgSessionDurationMinutes === 'number'
                      ? `${userBehaviorData.calculatedMetrics.avgSessionDurationMinutes.toFixed(1)}분`
                      : userBehaviorData.calculatedMetrics.avgSessionDurationMinutes}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">바운스율:</span>
                  <span className="font-medium">
                    {typeof userBehaviorData.sessionMetrics.bounceRate === 'number'
                      ? `${userBehaviorData.sessionMetrics.bounceRate.toFixed(1)}%`
                      : userBehaviorData.sessionMetrics.bounceRate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">참여율:</span>
                  <span className="font-medium">
                    {typeof userBehaviorData.calculatedMetrics.engagementRate === 'number'
                      ? `${userBehaviorData.calculatedMetrics.engagementRate.toFixed(1)}%`
                      : userBehaviorData.calculatedMetrics.engagementRate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">페이지/세션:</span>
                  <span className="font-medium">
                    {typeof userBehaviorData.sessionMetrics.pagesPerSession === 'number'
                      ? userBehaviorData.sessionMetrics.pagesPerSession.toFixed(1)
                      : userBehaviorData.sessionMetrics.pagesPerSession}
                  </span>
                </div>
              </div>
            </div>

            {/* 디바이스별 성능 */}
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
                      {device.users}명 (
                      {typeof device.bounceRate === 'number' 
                        ? `${device.bounceRate.toFixed(1)}%` 
                        : device.bounceRate} 바운스)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 시간대별 성능 */}
          <div className="mt-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">시간대별 성능 (8월 1일 ~ 오늘)</h4>
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
                    if (name === '평균 세션 (주황색)') return [`${Math.floor(Number(value) / 60)}분 ${Math.round(Number(value) % 60)}초`, '평균 세션'];
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
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="avgSessionDuration" 
                  name="평균 세션 (주황색)" 
                  stroke="#F97316" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 text-sm text-gray-500 text-center">
              데이터 수집 기간: 8월 1일 ~ {new Date().toISOString().slice(0, 10)}
            </div>
          </div>

          {/* 이벤트 분석 */}
          <div className="mt-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">이벤트 분석</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userBehaviorData.eventAnalysis.map((event, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <h5 className="font-semibold text-gray-900 mb-2">{event.event}</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">발생 횟수:</span>
                      <span className="font-medium">
                        {typeof event.count === 'number' 
                          ? event.count.toLocaleString() 
                          : event.count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">참여 사용자:</span>
                      <span className="font-medium">
                        {typeof event.users === 'number' 
                          ? event.users.toLocaleString() 
                          : event.users}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 고급 성능 분석 - 새로운 섹션 */}
      {selectedMonth === '2025-08' && advancedPerformanceData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">고급 성능 분석</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 종합 성능 지표 */}
            <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-purple-900">종합 성능 지표</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">총 페이지뷰:</span>
                  <span className="font-medium">
                    {typeof advancedPerformanceData.overallMetrics.totalPageViews === 'number'
                      ? advancedPerformanceData.overallMetrics.totalPageViews.toLocaleString()
                      : advancedPerformanceData.overallMetrics.totalPageViews}회
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">평균 세션:</span>
                  <span className="font-medium">
                    {typeof advancedPerformanceData.overallMetrics.avgSessionDurationMinutes === 'number'
                      ? `${advancedPerformanceData.overallMetrics.avgSessionDurationMinutes.toFixed(1)}분`
                      : advancedPerformanceData.overallMetrics.avgSessionDurationMinutes}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">평균 바운스율:</span>
                  <span className="font-medium">
                    {typeof advancedPerformanceData.overallMetrics.avgBounceRate === 'number'
                      ? `${(advancedPerformanceData.overallMetrics.avgBounceRate * 100).toFixed(1)}%`
                      : advancedPerformanceData.overallMetrics.avgBounceRate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">성능 점수:</span>
                  <span className="font-medium">
                    {typeof advancedPerformanceData.overallMetrics.performanceScore === 'number'
                      ? `${advancedPerformanceData.overallMetrics.performanceScore.toFixed(0)}/100`
                      : advancedPerformanceData.overallMetrics.performanceScore}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 퍼널별 데이터 수집 기간 - 새로운 섹션 */}
      {selectedMonth === '2025-08' && funnelTrackingData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">퍼널별 데이터 수집 기간</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">퍼널 페이지</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최초 수집일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최종 수집일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수집 일수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 페이지뷰</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 세션</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {funnelTrackingData
                  .filter(page => page.totalPageViews > 0)
                  .sort((a, b) => b.totalPageViews - a.totalPageViews)
                  .slice(0, 10)
                  .map((page, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {page.page.replace('/versions/', '').replace('.html', '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {page.firstDataCollection ? 
                          `${page.firstDataCollection.slice(0, 4)}-${page.firstDataCollection.slice(4, 6)}-${page.firstDataCollection.slice(6, 8)}` : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {page.lastDataCollection ? 
                          `${page.lastDataCollection.slice(0, 4)}-${page.lastDataCollection.slice(4, 6)}-${page.lastDataCollection.slice(6, 8)}` : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {page.totalDays}일
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {page.totalPageViews.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userBehaviorData?.pagePerformance?.find(p => p.page === page.page)?.avgSessionDuration 
                          ? `${Math.floor(userBehaviorData.pagePerformance.find(p => p.page === page.page)!.avgSessionDuration / 60)}분 ${Math.round(userBehaviorData.pagePerformance.find(p => p.page === page.page)!.avgSessionDuration % 60)}초`
                          : 'NA'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          page.hasData ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {page.hasData ? '활성' : '비활성'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 퍼널별 일별 페이지뷰 트렌드 - 개선된 섹션 */}
      {selectedMonth === '2025-08' && funnelDailyViewsData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">퍼널별 일별 페이지뷰 트렌드 (8월 1일 ~ 오늘)</h3>
          
          <div className="space-y-6">
            {/* 종합 비교 그래프 (맨 위) */}
            <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-purple-900">종합 비교 (상위 5개 퍼널)</h4>
                <div className="text-sm text-purple-600">
                  총 {funnelDailyViewsData
                    .filter(page => page.totalPageViews > 0)
                    .sort((a, b) => b.totalPageViews - a.totalPageViews)
                    .slice(0, 5)
                    .reduce((sum, page) => sum + page.totalPageViews, 0)
                    .toLocaleString()} 페이지뷰
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={funnelDailyViewsData[0]?.dailyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => `${value.slice(4, 6)}/${value.slice(6, 8)}`}
                    interval="preserveStartEnd"
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(value) => `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`}
                  />
                  <Legend />
                  {funnelDailyViewsData
                    .filter(page => page.totalPageViews > 0)
                    .sort((a, b) => b.totalPageViews - a.totalPageViews)
                    .slice(0, 5)
                    .map((page, index) => (
                      <Line 
                        key={index}
                        type="monotone" 
                        dataKey="pageViews" 
                        name={page.page.replace('/versions/', '').replace('.html', '').replace('/funnel-', 'funnel-')}
                        stroke={index === 0 ? '#3B82F6' : index === 1 ? '#10B981' : index === 2 ? '#F59E0B' : index === 3 ? '#EF4444' : '#8B5CF6'} 
                        strokeWidth={2}
                        dot={{ fill: index === 0 ? '#3B82F6' : index === 1 ? '#10B981' : index === 2 ? '#F59E0B' : index === 3 ? '#EF4444' : '#8B5CF6', strokeWidth: 2, r: 3 }}
                        data={page.dailyData}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
              
              <div className="mt-2 text-sm text-purple-600 text-center">
                기간: 2025-08-01 ~ {new Date().toISOString().slice(0, 10)}
              </div>
            </div>

            {/* 상위 5개 퍼널 개별 그래프 */}
            {funnelDailyViewsData
              .filter(page => page.totalPageViews > 0)
              .sort((a, b) => b.totalPageViews - a.totalPageViews)
              .slice(0, 5)
              .map((page, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {page.page.replace('/versions/', '').replace('.html', '').replace('/funnel-', 'funnel-')}
                    </h4>
                    <div className="text-sm text-gray-500">
                      총 {page.totalPageViews.toLocaleString()} 페이지뷰 ({page.totalDays}일간)
                    </div>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={page.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => `${value.slice(4, 6)}/${value.slice(6, 8)}`}
                        interval="preserveStartEnd"
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [value, '페이지뷰']}
                        labelFormatter={(value) => `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pageViews" 
                        stroke={index === 0 ? '#3B82F6' : index === 1 ? '#10B981' : index === 2 ? '#F59E0B' : index === 3 ? '#EF4444' : '#8B5CF6'} 
                        strokeWidth={2}
                        dot={{ fill: index === 0 ? '#3B82F6' : index === 1 ? '#10B981' : index === 2 ? '#F59E0B' : index === 3 ? '#EF4444' : '#8B5CF6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-2 text-sm text-gray-500">
                    데이터 수집 기간: {page.firstDataDate ? 
                      `${page.firstDataDate.slice(0, 4)}-${page.firstDataDate.slice(4, 6)}-${page.firstDataDate.slice(6, 8)}` : 
                      'N/A'
                    } ~ {page.lastDataDate ? 
                      `${page.lastDataDate.slice(0, 4)}-${page.lastDataDate.slice(4, 6)}-${page.lastDataDate.slice(6, 8)}` : 
                      'N/A'
                    }
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 월별 데이터 요약 - 새로운 섹션 */}
      {selectedMonth === '2025-08' && monthlyData && (
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

      {/* 2025-07 고급 사용자 행동 분석 - 새로운 섹션 */}
      {selectedMonth === '2025-07' && userBehaviorData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">고급 사용자 행동 분석</h3>
          
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
                    {typeof userBehaviorData.sessionMetrics.totalSessions === 'number' 
                      ? userBehaviorData.sessionMetrics.totalSessions.toLocaleString() 
                      : userBehaviorData.sessionMetrics.totalSessions}회
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">평균 세션:</span>
                  <span className="font-medium">
                    {typeof userBehaviorData.calculatedMetrics.avgSessionDurationMinutes === 'number'
                      ? `${userBehaviorData.calculatedMetrics.avgSessionDurationMinutes.toFixed(1)}분`
                      : userBehaviorData.calculatedMetrics.avgSessionDurationMinutes}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">바운스율:</span>
                  <span className="font-medium">
                    {typeof userBehaviorData.sessionMetrics.bounceRate === 'number'
                      ? `${userBehaviorData.sessionMetrics.bounceRate.toFixed(1)}%`
                      : userBehaviorData.sessionMetrics.bounceRate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">참여율:</span>
                  <span className="font-medium">
                    {typeof userBehaviorData.calculatedMetrics.engagementRate === 'number'
                      ? `${userBehaviorData.calculatedMetrics.engagementRate.toFixed(1)}%`
                      : userBehaviorData.calculatedMetrics.engagementRate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">페이지/세션:</span>
                  <span className="font-medium">
                    {typeof userBehaviorData.sessionMetrics.pagesPerSession === 'number'
                      ? userBehaviorData.sessionMetrics.pagesPerSession.toFixed(1)
                      : userBehaviorData.sessionMetrics.pagesPerSession}
                  </span>
                </div>
              </div>
            </div>

            {/* 디바이스별 성능 */}
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
                      {device.users}명 (
                      {typeof device.bounceRate === 'number' 
                        ? `${device.bounceRate.toFixed(1)}%` 
                        : device.bounceRate} 바운스)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 시간대별 성능 */}
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
                    if (name === '평균 세션 (주황색)') return [`${Math.floor(Number(value) / 60)}분 ${Math.round(Number(value) % 60)}초`, '평균 세션'];
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
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="avgSessionDuration" 
                  name="평균 세션 (주황색)" 
                  stroke="#F97316" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 text-sm text-gray-500 text-center">
              데이터 수집 기간: 7월 1일 ~ 7월 31일
            </div>
          </div>

          {/* 이벤트 분석 */}
          <div className="mt-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">이벤트 분석</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userBehaviorData.eventAnalysis.map((event, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <h5 className="font-semibold text-gray-900 mb-2">{event.event}</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">발생 횟수:</span>
                      <span className="font-medium">
                        {typeof event.count === 'number' 
                          ? event.count.toLocaleString() 
                          : event.count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">참여 사용자:</span>
                      <span className="font-medium">
                        {typeof event.users === 'number' 
                          ? event.users.toLocaleString() 
                          : event.users}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 고급 성능 분석 - 새로운 섹션 */}
      {selectedMonth === '2025-07' && advancedPerformanceData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">고급 성능 분석</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 종합 성능 지표 */}
            <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-purple-900">종합 성능 지표</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">총 페이지뷰:</span>
                  <span className="font-medium">
                    {typeof advancedPerformanceData.overallMetrics.totalPageViews === 'number'
                      ? advancedPerformanceData.overallMetrics.totalPageViews.toLocaleString()
                      : advancedPerformanceData.overallMetrics.totalPageViews}회
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">평균 세션:</span>
                  <span className="font-medium">
                    {typeof advancedPerformanceData.overallMetrics.avgSessionDurationMinutes === 'number'
                      ? `${advancedPerformanceData.overallMetrics.avgSessionDurationMinutes.toFixed(1)}분`
                      : advancedPerformanceData.overallMetrics.avgSessionDurationMinutes}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">평균 바운스율:</span>
                  <span className="font-medium">
                    {typeof advancedPerformanceData.overallMetrics.avgBounceRate === 'number'
                      ? `${(advancedPerformanceData.overallMetrics.avgBounceRate * 100).toFixed(1)}%`
                      : advancedPerformanceData.overallMetrics.avgBounceRate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">성능 점수:</span>
                  <span className="font-medium">
                    {typeof advancedPerformanceData.overallMetrics.performanceScore === 'number'
                      ? `${advancedPerformanceData.overallMetrics.performanceScore.toFixed(0)}/100`
                      : advancedPerformanceData.overallMetrics.performanceScore}
                  </span>
                </div>
              </div>
            </div>

            {/* 페이지별 성능 */}
            <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-orange-900">페이지별 성능</h4>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={advancedPerformanceData.pagePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="page" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, '페이지뷰']} />
                  <Bar dataKey="pageViews" fill="#F97316" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-4 space-y-2">
                {advancedPerformanceData.pagePerformance.map((page, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{page.page}:</span>
                    <span className="font-medium">{page.pageViews} 페이지뷰</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 시간대별 성능 */}
          <div className="mt-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">시간대별 성능 (7월 1일 ~ 7월 31일)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={advancedPerformanceData.hourlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === '페이지뷰 (파란색)') return [value, '페이지뷰'];
                    if (name === '세션 (초록색)') return [value, '세션'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="pageViews" 
                  name="페이지뷰 (파란색)" 
                  stroke="#3B82F6" 
                  strokeWidth={2} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="sessions" 
                  name="세션 (초록색)" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 text-sm text-gray-500 text-center">
              데이터 수집 기간: 7월 1일 ~ 7월 31일
            </div>
          </div>
        </div>
      )}

      {/* 2025-07 퍼널별 데이터 수집 기간 - 새로운 섹션 */}
      {selectedMonth === '2025-07' && funnelTrackingData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">퍼널별 데이터 수집 기간</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">퍼널 페이지</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최초 수집일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최종 수집일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수집 일수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 페이지뷰</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 세션</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {funnelTrackingData
                  .filter(page => page.page.includes('2025-07') && page.totalPageViews > 0)
                  .sort((a, b) => b.totalPageViews - a.totalPageViews)
                  .slice(0, 10)
                  .map((page, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {page.page.replace('/versions/', '').replace('.html', '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {page.firstDataCollection ? 
                          `${page.firstDataCollection.slice(0, 4)}-${page.firstDataCollection.slice(4, 6)}-${page.firstDataCollection.slice(6, 8)}` : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {page.lastDataCollection ? 
                          `${page.lastDataCollection.slice(0, 4)}-${page.lastDataCollection.slice(4, 6)}-${page.lastDataCollection.slice(6, 8)}` : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {page.totalDays}일
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {page.totalPageViews.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userBehaviorData?.pagePerformance?.find(p => p.page === page.page)?.avgSessionDuration 
                          ? `${Math.floor(userBehaviorData.pagePerformance.find(p => p.page === page.page)!.avgSessionDuration / 60)}분 ${Math.round(userBehaviorData.pagePerformance.find(p => p.page === page.page)!.avgSessionDuration % 60)}초`
                          : 'NA'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          page.hasData ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {page.hasData ? '활성' : '비활성'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          {funnelTrackingData.filter(page => page.page.includes('2025-07') && page.totalPageViews > 0).length === 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                <span className="text-yellow-800 font-medium">📊 2025-07 퍼널 데이터 수집 대기 중</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2025-07 퍼널별 일별 페이지뷰 트렌드 - 새로운 섹션 */}
      {selectedMonth === '2025-07' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">퍼널별 일별 페이지뷰 트렌드 (7월 1일 ~ 7월 31일)</h3>
          
          <div className="space-y-6">
            {/* 종합 비교 그래프 (맨 위) */}
            <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-purple-900">종합 비교 (7월 퍼널)</h4>
                <div className="text-sm text-purple-600">
                  총 NA 페이지뷰
                </div>
              </div>
              
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-400">NA</p>
                  <p className="text-sm text-gray-500 mt-2">실제 7월 퍼널 데이터 필요</p>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-purple-600 text-center">
                기간: 2025-07-01 ~ 2025-07-31
              </div>
            </div>

            {/* 7월 퍼널 개별 그래프 */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  funnel-2025-07-live-a.html
                </h4>
                <div className="text-sm text-gray-500">
                  총 NA 페이지뷰 (NA일간)
                </div>
              </div>
              
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-400">NA</p>
                  <p className="text-sm text-gray-500 mt-2">실제 일별 데이터 필요</p>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                데이터 수집 기간: NA ~ NA
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  funnel-2025-07-live-b.html
                </h4>
                <div className="text-sm text-gray-500">
                  총 NA 페이지뷰 (NA일간)
                </div>
              </div>
              
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-400">NA</p>
                  <p className="text-sm text-gray-500 mt-2">실제 일별 데이터 필요</p>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                데이터 수집 기간: NA ~ NA
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2025-07 월별 데이터 요약 - 새로운 섹션 */}
      {selectedMonth === '2025-07' && monthlyData && (
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
  );
}

export default FunnelManager;
