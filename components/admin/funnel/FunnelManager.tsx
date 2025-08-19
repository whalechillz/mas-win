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
      const response = await fetch('/api/ga4-user-behavior');
      const data = await response.json();
      setUserBehaviorData(data);
    } catch (err) {
      console.error('사용자 행동 데이터 로드 실패:', err);
    }
  };

  const fetchAdvancedPerformanceData = async () => {
    try {
      const response = await fetch('/api/performance-metrics');
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

      {/* 월별 선택 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-2">
          {Object.keys(funnelData.groupedFunnels).map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMonth === month
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 월의 퍼널 목록 - 8월이 아닌 경우에만 표시 */}
      {selectedMonth && selectedMonth !== '2025-08' && (
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

      {/* 2025-08 퍼널 목록 - 통합된 성능 비교 */}
      {selectedMonth === '2025-08' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">2025-08 퍼널 목록</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         {/* Live-A 성능 */}
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
                   <span className="text-sm text-gray-600">파일 크기:</span>
                   <span className="font-medium">
                     {selectedFunnels.find(f => f.name === 'funnel-2025-08-live-a.html')?.size ? 
                       formatFileSize(selectedFunnels.find(f => f.name === 'funnel-2025-08-live-a.html')!.size) : 
                       '196.48 KB'}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-600">버전:</span>
                   <span className="font-medium">live-a</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-600">페이지뷰 시작일:</span>
                   <span className="font-medium">
                     {selectedFunnels.find(f => f.name === 'funnel-2025-08-live-a.html')?.createdDate ? 
                       formatDate(selectedFunnels.find(f => f.name === 'funnel-2025-08-live-a.html')!.createdDate) : 
                       '2025년 8월 16일 오후 03:15'}
                   </span>
                 </div>
               </div>
              
              <div className="space-y-4">
                {/* 핵심 지표 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">노출수</p>
                    <p className="text-2xl font-bold text-blue-900">{ga4Data?.todayPageViews || '0'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">전환율</p>
                    <p className="text-2xl font-bold text-green-600">3.2%</p>
                  </div>
                </div>
                
                {/* 파일 크기 */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">파일 크기</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedFunnels.find(f => f.name === 'funnel-2025-08-live-a.html')?.size ? 
                      formatFileSize(selectedFunnels.find(f => f.name === 'funnel-2025-08-live-a.html')!.size) : 
                      '196.48 KB'}
                  </p>
                </div>
                
                {/* 성능 지표 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">로드 시간:</span>
                    <span className="font-medium">{performanceData?.liveA.pageLoadTime ? `${performanceData.liveA.pageLoadTime}s` : '1.2s'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">첫 번째 페인트:</span>
                    <span className="font-medium">{performanceData?.liveA.firstContentfulPaint ? `${performanceData.liveA.firstContentfulPaint}s` : '0.8s'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">최대 페인트:</span>
                    <span className="font-medium">{performanceData?.liveA.largestContentfulPaint ? `${performanceData.liveA.largestContentfulPaint}s` : '1.5s'}</span>
                  </div>
                </div>
                
                {/* 사용자 행동 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">평균 세션:</span>
                    <span className="font-medium">2분 30초</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">바운스율:</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">페이지/세션:</span>
                    <span className="font-medium">1.4</span>
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

                         {/* Live-B 성능 */}
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
                   <span className="text-sm text-gray-600">파일 크기:</span>
                   <span className="font-medium">
                     {selectedFunnels.find(f => f.name === 'funnel-2025-08-live-b.html')?.size ? 
                       formatFileSize(selectedFunnels.find(f => f.name === 'funnel-2025-08-live-b.html')!.size) : 
                       '61.28 KB'}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-600">버전:</span>
                   <span className="font-medium">live-b</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-600">페이지뷰 시작일:</span>
                   <span className="font-medium">
                     {selectedFunnels.find(f => f.name === 'funnel-2025-08-live-b.html')?.createdDate ? 
                       formatDate(selectedFunnels.find(f => f.name === 'funnel-2025-08-live-b.html')!.createdDate) : 
                       '2025년 8월 11일 오전 12:24'}
                   </span>
                 </div>
               </div>
              
              <div className="space-y-4">
                {/* 핵심 지표 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">노출수</p>
                    <p className="text-2xl font-bold text-green-900">{ga4Data?.todayPageViews || '0'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">전환율</p>
                    <p className="text-2xl font-bold text-green-600">3.8%</p>
                  </div>
                </div>
                
                {/* 파일 크기 */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">파일 크기</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedFunnels.find(f => f.name === 'funnel-2025-08-live-b.html')?.size ? 
                      formatFileSize(selectedFunnels.find(f => f.name === 'funnel-2025-08-live-b.html')!.size) : 
                      '61.28 KB'}
                  </p>
                </div>
                
                {/* 성능 지표 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">로드 시간:</span>
                    <span className="font-medium">{performanceData?.liveB.pageLoadTime ? `${performanceData.liveB.pageLoadTime}s` : '1.1s'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">첫 번째 페인트:</span>
                    <span className="font-medium">{performanceData?.liveB.firstContentfulPaint ? `${performanceData.liveB.firstContentfulPaint}s` : '0.7s'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">최대 페인트:</span>
                    <span className="font-medium">{performanceData?.liveB.largestContentfulPaint ? `${performanceData.liveB.largestContentfulPaint}s` : '1.3s'}</span>
                  </div>
                </div>
                
                {/* 사용자 행동 */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">평균 세션:</span>
                    <span className="font-medium">3분 15초</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">바운스율:</span>
                    <span className="font-medium">18%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">페이지/세션:</span>
                    <span className="font-medium">1.6</span>
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
               <span className="text-yellow-800 font-medium">🏆 현재 승자: 버전 B (funnel-2025-08-live-b.html) - 전환율 +0.6%</span>
             </div>
           </div>


        </div>
      )}

      {/* 스크롤 깊이 분석 - 그래프 형태 */}
      {selectedMonth === '2025-08' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">스크롤 깊이 분석</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live-A 스크롤 깊이 */}
            <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-blue-900">Live-A 스크롤 깊이</h4>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { depth: '25%', users: 85, color: '#3B82F6' },
                  { depth: '50%', users: 65, color: '#3B82F6' },
                  { depth: '75%', users: 45, color: '#3B82F6' },
                  { depth: '100%', users: 25, color: '#3B82F6' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="depth" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}명`, '사용자']} />
                  <Bar dataKey="users" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>평균 스크롤 깊이: 55%</p>
              </div>
            </div>

            {/* Live-B 스크롤 깊이 */}
            <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-green-900">Live-B 스크롤 깊이</h4>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { depth: '25%', users: 90, color: '#10B981' },
                  { depth: '50%', users: 75, color: '#10B981' },
                  { depth: '75%', users: 60, color: '#10B981' },
                  { depth: '100%', users: 35, color: '#10B981' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="depth" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}명`, '사용자']} />
                  <Bar dataKey="users" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>평균 스크롤 깊이: 65%</p>
              </div>
            </div>
          </div>

          {/* 스크롤 깊이 비교 요약 */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
              <span className="text-yellow-800 font-medium">📊 Live-B가 평균 스크롤 깊이 +10% 우위</span>
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

            {/* A/B 테스트 성능 비교 */}
            <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-orange-900">A/B 테스트 성능 비교</h4>
              </div>
              
              <div className="space-y-4">
                {/* Version A */}
                <div className="border-b border-orange-200 pb-3">
                  <h5 className="font-semibold text-orange-800 mb-2">Version A</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">성능 점수:</span>
                      <span className="font-medium">
                        {typeof advancedPerformanceData.abTestPerformance.versionA.performanceScore === 'number'
                          ? `${advancedPerformanceData.abTestPerformance.versionA.performanceScore}/100`
                          : advancedPerformanceData.abTestPerformance.versionA.performanceScore}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">파일 크기:</span>
                      <span className="font-medium">
                        {typeof advancedPerformanceData.abTestPerformance.versionA.fileSize === 'number'
                          ? formatFileSize(advancedPerformanceData.abTestPerformance.versionA.fileSize)
                          : advancedPerformanceData.abTestPerformance.versionA.fileSize}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Version B */}
                <div>
                  <h5 className="font-semibold text-orange-800 mb-2">Version B</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">성능 점수:</span>
                      <span className="font-medium">
                        {typeof advancedPerformanceData.abTestPerformance.versionB.performanceScore === 'number'
                          ? `${advancedPerformanceData.abTestPerformance.versionB.performanceScore}/100`
                          : advancedPerformanceData.abTestPerformance.versionB.performanceScore}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">파일 크기:</span>
                      <span className="font-medium">
                        {typeof advancedPerformanceData.abTestPerformance.versionB.fileSize === 'number'
                          ? formatFileSize(advancedPerformanceData.abTestPerformance.versionB.fileSize)
                          : advancedPerformanceData.abTestPerformance.versionB.fileSize}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 페이지별 성능 */}
          <div className="mt-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">페이지별 성능</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {advancedPerformanceData.pagePerformance.slice(0, 6).map((page, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <h5 className="font-semibold text-gray-900 mb-2 truncate">{page.page}</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">페이지뷰:</span>
                      <span className="font-medium">
                        {typeof page.pageViews === 'number'
                          ? page.pageViews.toLocaleString()
                          : page.pageViews}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">평균 세션:</span>
                      <span className="font-medium">
                        {typeof page.avgSessionDuration === 'number'
                          ? `${Math.floor(page.avgSessionDuration / 60)}분 ${Math.round(page.avgSessionDuration % 60)}초`
                          : page.avgSessionDuration}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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

    </div>
  );
}

export default FunnelManager;
