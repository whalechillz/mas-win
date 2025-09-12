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

interface ABTestData {
  versionA: {
    performance: number;
    fileSize: number;
    users: number;
  };
  versionB: {
    performance: number;
    fileSize: number;
    users: number;
  };
  winner: 'A' | 'B';
  confidence: number;
}

export default function FunnelManagerSimplified() {
  const [activeTab, setActiveTab] = useState('2025-09');
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [ga4Data, setGa4Data] = useState<GA4Data | null>(null);
  const [abTestData, setAbTestData] = useState<ABTestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'user-behavior': false,
    'ab-test': false,
    'performance': false
  });

  useEffect(() => {
    loadFunnelData();
    loadGA4Data();
    loadABTestData();
  }, [activeTab]);

  const loadFunnelData = async () => {
    try {
      const response = await fetch('/api/funnel-management');
      const data = await response.json();
      
      if (data.success) {
        setFunnelData(data.data);
      } else {
        console.error('퍼널 데이터 로드 실패:', data.error);
      }
    } catch (error) {
      console.error('퍼널 데이터 로드 오류:', error);
    }
  };

  const loadGA4Data = async () => {
    try {
      const response = await fetch('/api/ga4-funnel/');
      const data = await response.json();
      setGa4Data(data);
    } catch (error) {
      console.error('GA4 데이터 로드 오류:', error);
    }
  };

  const loadABTestData = async () => {
    try {
      const response = await fetch('/api/analytics/ab-test-results');
      const data = await response.json();
      setAbTestData(data);
    } catch (error) {
      console.error('A/B 테스트 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatNumber = (num: string | number) => {
    const number = typeof num === 'string' ? parseInt(num) : num;
    return number.toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds}초`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">퍼널 관리</h1>
            <p className="text-gray-600 mt-1">랜딩페이지 성과 및 A/B 테스트</p>
          </div>
          <div className="text-sm text-gray-500">
            마지막 업데이트: {new Date().toLocaleString('ko-KR')}
          </div>
        </div>
      </div>

      {/* 퍼널 선택 탭 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {['2025-05', '2025-06', '2025-07', '2025-08', '2025-09'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 월별 퍼널 파일 목록 */}
      {funnelData && funnelData.groupedFunnels[activeTab] && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {activeTab} 퍼널 목록 ({funnelData.groupedFunnels[activeTab].length}개)
          </h2>
          <div className="space-y-4">
            {funnelData.groupedFunnels[activeTab].map((funnel, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{funnel.name}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        funnel.status === 'live' 
                          ? 'bg-green-100 text-green-800' 
                          : funnel.status === 'staging'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {funnel.status}
                      </span>
                      <span>파일 크기: {formatFileSize(funnel.size)}</span>
                      <span>수정일: {new Date(funnel.modifiedDate).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                      미리보기
                    </button>
                    <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors">
                      편집
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 퍼널 데이터가 없는 경우 */}
      {funnelData && (!funnelData.groupedFunnels[activeTab] || funnelData.groupedFunnels[activeTab].length === 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{activeTab} 퍼널이 없습니다</h3>
            <p className="text-gray-600 mb-4">이 월에는 생성된 퍼널 파일이 없습니다.</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              새 퍼널 생성
            </button>
          </div>
        </div>
      )}

      {/* 핵심 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 세션</p>
              <p className="text-2xl font-bold text-gray-900">18,330</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">평균 세션 시간</p>
              <p className="text-2xl font-bold text-gray-900">1분</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">바운스율</p>
              <p className="text-2xl font-bold text-gray-900">8.3%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">페이지/세션</p>
              <p className="text-2xl font-bold text-gray-900">1.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* A/B 테스트 결과 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">A/B 테스트 결과</h2>
          <button
            onClick={() => toggleSection('ab-test')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {expandedSections['ab-test'] ? '접기' : '자세히 보기'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Version A (기존)</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-700">성능 점수:</span>
                <span className="font-semibold text-blue-900">85.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">파일 크기:</span>
                <span className="font-semibold text-blue-900">196.48 KB</span>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Version B (개선) ⭐</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-700">성능 점수:</span>
                <span className="font-semibold text-green-900">92.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">파일 크기:</span>
                <span className="font-semibold text-green-900">61.28 KB</span>
              </div>
            </div>
          </div>
        </div>

        {expandedSections['ab-test'] && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-4">스크롤 깊이 분석</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Version A</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>25% 스크롤:</span>
                    <span>654명</span>
                  </div>
                  <div className="flex justify-between">
                    <span>50% 스크롤:</span>
                    <span>500명</span>
                  </div>
                  <div className="flex justify-between">
                    <span>100% 스크롤:</span>
                    <span>192명</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Version B</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>25% 스크롤:</span>
                    <span>1,318명</span>
                  </div>
                  <div className="flex justify-between">
                    <span>50% 스크롤:</span>
                    <span>1,098명</span>
                  </div>
                  <div className="flex justify-between">
                    <span>100% 스크롤:</span>
                    <span>512명</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 사용자 행동 분석 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">사용자 행동 분석</h2>
          <button
            onClick={() => toggleSection('user-behavior')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {expandedSections['user-behavior'] ? '접기' : '자세히 보기'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">14,549</div>
            <div className="text-sm text-gray-600">모바일 사용자</div>
            <div className="text-xs text-red-600">24.5% 바운스</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">1,908</div>
            <div className="text-sm text-gray-600">데스크톱 사용자</div>
            <div className="text-xs text-green-600">4.8% 바운스</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">67</div>
            <div className="text-sm text-gray-600">태블릿 사용자</div>
            <div className="text-xs text-yellow-600">7.3% 바운스</div>
          </div>
        </div>

        {expandedSections['user-behavior'] && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-4">이벤트 분석</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">page_view</span>
                <span className="text-sm text-gray-600">19,913회 (14,517명)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">ab_test_assignment</span>
                <span className="text-sm text-gray-600">3,711회 (3,012명)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">scroll</span>
                <span className="text-sm text-gray-600">6,192회 (4,159명)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">view_popup</span>
                <span className="text-sm text-gray-600">3,088회 (2,534명)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 성능 분석 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">성능 분석</h2>
          <button
            onClick={() => toggleSection('performance')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {expandedSections['performance'] ? '접기' : '자세히 보기'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">18,575</div>
            <div className="text-sm text-gray-600">총 페이지뷰</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">1.7분</div>
            <div className="text-sm text-gray-600">평균 세션 시간</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">12.2%</div>
            <div className="text-sm text-gray-600">평균 바운스율</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">100.0</div>
            <div className="text-sm text-gray-600">성능 점수</div>
          </div>
        </div>

        {expandedSections['performance'] && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-4">퍼널별 추적 데이터</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">/versions/funnel-2025-09-live.html</span>
                <span className="text-sm text-gray-600">5,150 페이지뷰 (9일)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">/versions/funnel-2025-08-live-b.html</span>
                <span className="text-sm text-gray-600">4,362 페이지뷰 (24일)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">/versions/funnel-2025-07-complete.html</span>
                <span className="text-sm text-gray-600">5,970 페이지뷰 (20일)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            미리보기
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Version B 적용
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            상세 분석
          </button>
        </div>
      </div>
    </div>
  );
}
