import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import dynamic from 'next/dynamic';

// 실시간 모니터링 컴포넌트를 동적으로 로드 (Chart.js 의존성)
const RealtimeAIMonitor = dynamic(() => import('../../components/admin/RealtimeAIMonitor'), { 
  ssr: false,
  loading: () => <div className="text-center py-8">실시간 모니터링 로딩 중...</div>
});

// Google Analytics 위젯을 동적으로 로드
const GoogleAnalyticsWidget = dynamic(() => import('../../components/admin/GoogleAnalyticsWidget'), { 
  ssr: false,
  loading: () => <div className="text-center py-8">Google Analytics 로딩 중...</div>
});

// 블로그 분석 위젯을 동적으로 로드
const BlogAnalyticsWidget = dynamic(() => import('../../components/admin/BlogAnalyticsWidget'), { 
  ssr: false,
  loading: () => <div className="text-center py-8">블로그 분석 로딩 중...</div>
});

interface AIUsageLog {
  id: string;
  api_endpoint: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
  improvement_type: string;
  content_type: string;
  user_agent: string;
  ip_address: string | null;
  created_at: string;
}

interface AIStats {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  successRate: number;
  avgTokensPerCall: number;
}

interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  avgViewsPerPost: number;
  topCategories: Array<{ category: string; count: number }>;
  recentPosts: Array<{ title: string; views: number; published_at: string }>;
}

export default function AIDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [aiLogs, setAiLogs] = useState<AIUsageLog[]>([]);
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [blogStats, setBlogStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [dateRange, setDateRange] = useState('7');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usageToday, setUsageToday] = useState<any | null>(null);
  const [usage7d, setUsage7d] = useState<any | null>(null);

  // AI 사용량 로그 및 통계 가져오기
  const fetchAIData = async () => {
    try {
      const response = await fetch('/api/admin/ai-stats');
      const data = await response.json();
      if (response.ok) {
        setAiStats(data.stats);
        setAiLogs(data.logs || []);
        console.log('AI 데이터 로드 완료:', { stats: data.stats, logsCount: data.logs?.length });
      } else {
        console.error('AI 데이터 로드 실패:', data);
      }
    } catch (error) {
      console.error('AI 데이터 가져오기 실패:', error);
    }
  };

  // AI 비용/사용량 집계 API (일/주)
  const fetchUsageStats = async () => {
    try {
      const [r1, r7] = await Promise.all([
        fetch('/api/admin/ai-usage-stats?period=1d'),
        fetch('/api/admin/ai-usage-stats?period=7d')
      ]);
      const [d1, d7] = await Promise.all([r1.json(), r7.json()]);
      if (r1.ok) setUsageToday(d1);
      if (r7.ok) setUsage7d(d7);
    } catch (e) {
      console.error('AI 사용량 집계 로드 실패:', e);
    }
  };

  // 블로그 통계 가져오기
  const fetchBlogStats = async () => {
    try {
      const response = await fetch('/api/admin/blog-stats');
      const data = await response.json();
      if (response.ok) {
        setBlogStats(data.stats);
      }
    } catch (error) {
      console.error('블로그 통계 가져오기 실패:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAIData(),
        fetchBlogStats(),
        fetchUsageStats()
      ]);
      setLoading(false);
      setLastUpdated(new Date());
    };
    loadData();

    // 자동 업데이트 비활성화 (수동 새로고침으로 변경)
    // const interval = setInterval(() => {
    //   loadData();
    // }, 30000);

    // return () => clearInterval(interval);
  }, []);

  // 수동 새로고침 함수
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchAIData(),
        fetchBlogStats(),
        fetchUsageStats()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('새로고침 실패:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 필터링된 AI 로그
  const filteredLogs = aiLogs.filter(log => {
    if (selectedSource !== 'all' && log.api_endpoint !== selectedSource) return false;
    if (selectedAction !== 'all' && log.improvement_type !== selectedAction) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>AI & 블로그 대시보드 - MAS Golf</title>
      </Head>
      
      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">AI & 블로그 대시보드</h1>
            <p className="text-gray-600 mt-2">AI 사용량과 블로그 성과를 한눈에 확인하세요</p>
            
            {/* 경고 배너 제거 요청 반영: 상단 경고 제거 */}

            {/* 공급자 카드는 "설정" 탭에서만 노출됩니다. */}
          </div>

          {/* 수동 새로고침 상태 */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">수동 새로고침 모드</span>
              </div>
              <div className="flex items-center space-x-3">
                {/* 오늘 비용 배지 */}
                {usageToday?.stats && (
                  <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-yellow-200">
                    <span>오늘 비용</span>
                    <span className="text-yellow-900">${(usageToday.stats.totalCost || 0).toFixed(4)}</span>
                    <span className="opacity-70">/ {usageToday.stats.totalRequests || 0}회</span>
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  마지막 업데이트: {lastUpdated.toLocaleTimeString()}
                </div>
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRefreshing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      새로고침 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      새로고침
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mb-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 개요
              </button>
              <button
                onClick={() => setActiveTab('ai-usage')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ai-usage'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🤖 AI 사용량
              </button>
              <button
                onClick={() => setActiveTab('realtime')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'realtime'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 실시간 모니터링
              </button>
              <button
                onClick={() => setActiveTab('providers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'providers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⚙️ 설정
              </button>
              <button
                onClick={() => setActiveTab('blog-analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'blog-analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📈 블로그 분석
              </button>
              <button
                onClick={() => setActiveTab('google-services')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'google-services'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔍 Google 서비스
              </button>
            </nav>
          </div>

          {/* 개요 탭: 최상단에 KPI 고정 */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* AI 사용량 요약 */}
              {aiStats && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">🤖 AI 사용량 요약</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{aiStats.totalCalls.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">총 API 호출</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{aiStats.totalTokens.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">총 토큰 사용</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">${aiStats.totalCost.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">총 비용</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{aiStats.successRate.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">성공률</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 블로그 성과 요약 */}
              {blogStats && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">📈 블로그 성과 요약</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{blogStats.totalPosts}</div>
                      <div className="text-sm text-gray-600">총 게시물</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{blogStats.publishedPosts}</div>
                      <div className="text-sm text-gray-600">발행된 게시물</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{blogStats.totalViews.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">총 조회수</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{blogStats.avgViewsPerPost.toFixed(0)}</div>
                      <div className="text-sm text-gray-600">평균 조회수</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 최근 활동 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 인기 게시물</h3>
                  {blogStats?.recentPosts.slice(0, 5).map((post, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 truncate">{post.title}</div>
                        <div className="text-sm text-gray-500">{new Date(post.published_at).toLocaleDateString()}</div>
                      </div>
                      <div className="text-sm font-medium text-blue-600">{post.views.toLocaleString()} 조회</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 카테고리별 분포</h3>
                  <div className="space-y-4">
                    {blogStats?.topCategories.map((category, index) => {
                      const maxCount = blogStats.topCategories[0]?.count || 1;
                      const percentage = (category.count / maxCount) * 100;
                      
                      return (
                        <div key={index} className="group">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900 text-sm">{category.category}</span>
                            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              {category.count}개
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out group-hover:from-blue-600 group-hover:to-blue-700"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 총계 표시 */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">총 게시물</span>
                      <span className="text-lg font-bold text-gray-900">
                        {blogStats?.topCategories.reduce((sum, cat) => sum + cat.count, 0)}개
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI 사용량 탭 */}
          {activeTab === 'ai-usage' && (
            <div className="space-y-8">
              {/* 요약 배지 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">요약</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">오늘 비용</div>
                    <div className="text-2xl font-bold text-yellow-700">${(usageToday?.stats?.totalCost || 0).toFixed(4)}</div>
                    <div className="text-xs text-gray-500">{usageToday?.stats?.totalRequests || 0}회</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">7일 비용</div>
                    <div className="text-2xl font-bold text-blue-700">${(usage7d?.stats?.totalCost || 0).toFixed(4)}</div>
                    <div className="text-xs text-gray-500">{usage7d?.stats?.totalRequests || 0}회</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">7일 토큰</div>
                    <div className="text-2xl font-bold text-green-700">{(usage7d?.stats?.totalTokens || 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">요청당 평균비용(7일)</div>
                    <div className="text-2xl font-bold text-purple-700">${((usage7d?.stats?.avgCostPerRequest) || 0).toFixed(4)}</div>
                  </div>
                </div>
              </div>

              {/* 필터 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">필터</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">소스</label>
                    <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="all">전체</option>
                      <option value="naver-blog-scraper">네이버 블로그 스크래퍼</option>
                      <option value="ai-content-extractor">AI 콘텐츠 추출기</option>
                      <option value="blog-generator">블로그 생성기</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">액션</label>
                    <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="all">전체</option>
                      <option value="content-extraction">콘텐츠 추출</option>
                      <option value="content-extraction-success">콘텐츠 추출 성공</option>
                      <option value="content-extraction-failed">콘텐츠 추출 실패</option>
                      <option value="content-extraction-error">콘텐츠 추출 오류</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">기간</label>
                    <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="1">최근 1일</option>
                      <option value="7">최근 7일</option>
                      <option value="30">최근 30일</option>
                      <option value="90">최근 90일</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 일별 비용 (7일) */}
              {usage7d?.stats?.dailyStats && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">일별 비용 (최근 7일)</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">토큰</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비용</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {usage7d.stats.dailyStats.map((d: any) => (
                          <tr key={d.date}>
                            <td className="px-6 py-3 text-sm">{d.date}</td>
                            <td className="px-6 py-3 text-sm">{d.requests}</td>
                            <td className="px-6 py-3 text-sm">{(d.tokens || 0).toLocaleString()}</td>
                            <td className="px-6 py-3 text-sm">${(d.cost || 0).toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 모델별 비용 (7일) */}
              {usage7d?.stats?.modelStats && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">모델별 비용 (최근 7일)</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">모델</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">토큰</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비용</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {usage7d.stats.modelStats.map((m: any) => (
                          <tr key={m.model}>
                            <td className="px-6 py-3 text-sm">{m.model}</td>
                            <td className="px-6 py-3 text-sm">{m.requests}</td>
                            <td className="px-6 py-3 text-sm">{(m.tokens || 0).toLocaleString()}</td>
                            <td className="px-6 py-3 text-sm">${(m.cost || 0).toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* AI 사용량 로그 테이블 */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">AI 사용량 로그</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API / 모델</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">토큰</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비용</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLogs.slice(0, 50).map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{log.api_endpoint}</span>
                              {log.api_endpoint === 'google-vision-api' && (<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Google Vision</span>)}
                              {log.api_endpoint === 'ai-content-extractor' && (<span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">GPT-4o-mini</span>)}
                              {log.api_endpoint === 'naver-blog-scraper' && (<span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">AI Parser</span>)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.improvement_type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.total_tokens.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${log.cost.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 실시간 모니터링 탭 */}
          {activeTab === 'realtime' && (
            <div className="space-y-8">
              <RealtimeAIMonitor refreshInterval={30000} />
            </div>
          )}

          {/* 설정 탭: 공급자 카드 이동 */}
          {activeTab === 'providers' && (
            <div className="space-y-8">
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 기존 상단 카드 블럭을 구성 요소 그대로 이동 */}
                {/* OpenAI 상태 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">O</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900">✅ OpenAI</h3>
                          <p className="text-xs text-gray-500 mt-1">슬러그, DALL-E 3</p>
                        </div>
                      </div>
                      <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700">💳 관리</a>
                    </div>
                  </div>
                </div>
                {/* FAL AI 상태 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center"><span className="text-white text-sm font-bold">F</span></div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900">✅ FAL AI</h3>
                          <p className="text-xs text-gray-500 mt-1">고품질 이미지 생성</p>
                        </div>
                      </div>
                      <a href="https://fal.ai/dashboard" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700">💳 관리</a>
                    </div>
                  </div>
                </div>
                {/* Replicate, Stability, Google Cloud, Google AI Studio ... 기존 카드 반복 */}
              {/* Kie AI 상태 */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center"><span className="text-white text-sm font-bold">K</span></div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">✅ Kie AI</h3>
                        <p className="text-xs text-gray-500 mt-1">GPT-4O, Flux, Midjourney</p>
                      </div>
                    </div>
                    <a href="https://kie.ai/dashboard" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700">💳 관리</a>
                  </div>
                </div>
              </div>
                {/* Replicate Flux */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center"><span className="text-white text-sm font-bold">R</span></div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900">🎨 Replicate Flux</h3>
                          <p className="text-xs text-gray-500 mt-1">고품질 이미지 변형</p>
                        </div>
                      </div>
                      <a href="https://replicate.com/account" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700">💳 충전하기</a>
                    </div>
                  </div>
                </div>
                {/* Stability AI */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center"><span className="text-white text-sm font-bold">S</span></div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900">🎨 Stability AI</h3>
                          <p className="text-xs text-gray-500 mt-1">안정적 이미지 변형</p>
                        </div>
                      </div>
                      <a href="https://platform.stability.ai/account" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700">💳 충전하기</a>
                    </div>
                  </div>
                </div>
                {/* Google Cloud */}
                <div className="bg-white overflow-hidden shadow rounded-lg border-2 border-red-200">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center"><span className="text-white text-sm font-bold">G</span></div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900">🚫 Google Cloud</h3>
                          <p className="text-xs text-gray-500 mt-1">Vision API, Gemini (비활성화)</p>
                        </div>
                      </div>
                      <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700">💳 관리</a>
                    </div>
                  </div>
                </div>
                {/* Google AI Studio */}
                <div className="bg-white overflow-hidden shadow rounded-lg border-2 border-blue-200">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center"><span className="text-white text-sm font-bold">AI</span></div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900">🤖 Google AI Studio</h3>
                          <p className="text-xs text-gray-500 mt-1">Gemini, Imagen (비활성화)</p>
                        </div>
                      </div>
                      <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700">🔗 확인</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 블로그 분석 탭 */}
          {activeTab === 'blog-analytics' && (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📈 블로그 분석</h2>
                <BlogAnalyticsWidget period="7d" />
              </div>
            </div>
          )}

          {/* Google 서비스 탭 */}
          {activeTab === 'google-services' && (
            <div className="space-y-8">
              {/* Google Analytics 4 - 실제 위젯 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Google Analytics 4</h2>
                <GoogleAnalyticsWidget period="7d" />
              </div>

              {/* Google Search Console */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🔍 Google Search Console</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">-</div>
                    <div className="text-sm text-gray-600">검색 노출수</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">-</div>
                    <div className="text-sm text-gray-600">클릭수</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">-</div>
                    <div className="text-sm text-gray-600">평균 CTR</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">-</div>
                    <div className="text-sm text-gray-600">평균 순위</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    💡 Google Search Console API 연동을 통해 SEO 성과를 모니터링할 예정입니다.
                  </p>
                </div>
              </div>

              {/* Google Ads */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📢 Google Ads</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">-</div>
                    <div className="text-sm text-gray-600">일일 지출</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">-</div>
                    <div className="text-sm text-gray-600">클릭수</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">-</div>
                    <div className="text-sm text-gray-600">전환수</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">-</div>
                    <div className="text-sm text-gray-600">ROAS</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    💡 Google Ads API 연동을 통해 광고 성과를 실시간으로 추적할 예정입니다.
                  </p>
                </div>
              </div>

              {/* Google Cloud 상태 */}
              <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">☁️ Google Cloud</h2>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-red-500 text-xl mr-3">🚫</span>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">비활성화됨</h3>
                      <p className="text-red-700">
                        ₩1,664,818 과금 방지를 위해 안전하게 차단되었습니다.
                        <br />
                        <span className="font-semibold">비용 절약 모드</span>가 활성화되어 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
