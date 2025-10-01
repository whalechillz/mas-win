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
            
            {/* AI 서비스 크레딧 알림 */}
            <div className="mt-6 space-y-4">
              {/* OpenAI 크레딧 알림 */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      ⚠️ OpenAI 크레딧 부족
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>슬러그 생성, 이미지 프롬프트 생성, DALL-E 3 이미지 생성에 필요합니다.</p>
                      <div className="mt-3">
                        <a
                          href="https://platform.openai.com/account/billing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          💳 OpenAI 충전하기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAL AI 크레딧 알림 */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">
                      ⚠️ FAL AI 크레딧 부족
                    </h3>
                    <div className="mt-2 text-sm text-orange-700">
                      <p>고품질 실사 이미지 생성에 필요합니다.</p>
                      <div className="mt-3">
                        <a
                          href="https://fal.ai/dashboard"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          💳 FAL AI 충전하기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kie AI 크레딧 알림 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      ⚠️ Kie AI 크레딧 부족
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>GPT-4O, Flux Kontext, Midjourney 이미지 생성에 필요합니다.</p>
                      <div className="mt-3">
                        <a
                          href="https://kie.ai/dashboard"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          💳 Kie AI 충전하기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API / 모델</th>
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
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{log.api_endpoint}</span>
                              {log.api_endpoint === 'google-vision-api' && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Google Vision</span>
                              )}
                              {log.api_endpoint === 'ai-content-extractor' && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">GPT-4o-mini</span>
                              )}
                              {log.api_endpoint === 'naver-blog-scraper' && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">AI Parser</span>
                              )}
                            </div>
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
