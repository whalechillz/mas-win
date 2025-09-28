import { useState, useEffect } from 'react';
import Head from 'next/head';

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

  // AI 사용량 로그 가져오기
  const fetchAILogs = async () => {
    try {
      const response = await fetch('/api/admin/ai-usage-logs');
      const data = await response.json();
      if (response.ok) {
        setAiLogs(data.logs || []);
      }
    } catch (error) {
      console.error('AI 로그 가져오기 실패:', error);
    }
  };

  // AI 통계 가져오기
  const fetchAIStats = async () => {
    try {
      const response = await fetch('/api/admin/ai-stats');
      const data = await response.json();
      if (response.ok) {
        setAiStats(data.stats);
      }
    } catch (error) {
      console.error('AI 통계 가져오기 실패:', error);
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
        fetchAILogs(),
        fetchAIStats(),
        fetchBlogStats()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

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
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">AI & 블로그 대시보드</h1>
            <p className="text-gray-600 mt-2">AI 사용량과 블로그 성과를 한눈에 확인하세요</p>
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
                onClick={() => setActiveTab('blog-analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'blog-analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📈 블로그 분석
              </button>
            </nav>
          </div>

          {/* 개요 탭 */}
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 카테고리별 분포</h3>
                  {blogStats?.topCategories.map((category, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="font-medium text-gray-900">{category.category}</div>
                      <div className="text-sm font-medium text-blue-600">{category.count}개</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI 사용량 탭 */}
          {activeTab === 'ai-usage' && (
            <div className="space-y-8">
              {/* 필터 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">필터</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">소스</label>
                    <select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">전체</option>
                      <option value="naver-blog-scraper">네이버 블로그 스크래퍼</option>
                      <option value="ai-content-extractor">AI 콘텐츠 추출기</option>
                      <option value="blog-generator">블로그 생성기</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">액션</label>
                    <select
                      value={selectedAction}
                      onChange={(e) => setSelectedAction(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">전체</option>
                      <option value="content-extraction">콘텐츠 추출</option>
                      <option value="content-extraction-success">콘텐츠 추출 성공</option>
                      <option value="content-extraction-failed">콘텐츠 추출 실패</option>
                      <option value="content-extraction-error">콘텐츠 추출 오류</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">기간</label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">최근 1일</option>
                      <option value="7">최근 7일</option>
                      <option value="30">최근 30일</option>
                      <option value="90">최근 90일</option>
                    </select>
                  </div>
                </div>
              </div>

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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">토큰</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비용</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLogs.slice(0, 50).map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.api_endpoint}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.improvement_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.total_tokens.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${log.cost.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 블로그 분석 탭 */}
          {activeTab === 'blog-analytics' && (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📈 블로그 분석</h2>
                <p className="text-gray-600">상세한 블로그 분석 기능은 추후 구현 예정입니다.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
