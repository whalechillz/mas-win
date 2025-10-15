import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import Link from 'next/link';

interface ConversionFunnel {
  awareness: { name: string; count: number; goal: string };
  consideration: { name: string; count: number; goal: string };
  decision: { name: string; count: number; goal: string };
  funnel: { name: string; count: number; goal: string };
}

interface ChannelMetrics {
  [key: string]: {
    views: number;
    clicks: number;
    conversions: number;
    conversionRate: string;
    clickThroughRate: string;
    totalValue: number;
  };
}

interface TopContent {
  contentId: string;
  views: number;
  clicks: number;
  conversions: number;
  conversionRate: string;
  clickThroughRate: string;
  channels: string[];
}

export default function MultichannelDashboard() {
  const [funnel, setFunnel] = useState<ConversionFunnel | null>(null);
  const [channels, setChannels] = useState<ChannelMetrics>({});
  const [topContent, setTopContent] = useState<TopContent[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/conversion/analytics?metric=all&startDate=${getStartDate()}&endDate=${getEndDate()}`);
      const data = await response.json();
      
      if (data.success) {
        setFunnel(data.data.funnel);
        setChannels(data.data.channels);
        setTopContent(data.data.topContent);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const date = new Date();
    switch (dateRange) {
      case '7d': date.setDate(date.getDate() - 7); break;
      case '30d': date.setDate(date.getDate() - 30); break;
      case '90d': date.setDate(date.getDate() - 90); break;
      default: date.setDate(date.getDate() - 7);
    }
    return date.toISOString().split('T')[0];
  };

  const getEndDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>멀티채널 전환 대시보드 - MASGOLF</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">멀티채널 전환 대시보드</h1>
                <p className="text-gray-600 mt-2">모든 채널의 성과를 한눈에 확인하세요</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <select 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7d">최근 7일</option>
                  <option value="30d">최근 30일</option>
                  <option value="90d">최근 90일</option>
                </select>
                
                <Link
                  href="/admin/blog"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  블로그 관리
                </Link>
       <Link
         href="/admin/sms"
         className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
       >
         SMS 관리
       </Link>
       <Link
         href="/admin/kakao"
         className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
       >
         카카오 채널 관리
       </Link>
       <Link
         href="/admin/naver-blog"
         className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
       >
         네이버 블로그 관리
       </Link>
              </div>
            </div>
          </div>

          {/* 요약 메트릭 */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 노출</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.totalViews.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 클릭</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.totalClicks.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 전환</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.totalConversions.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">전환율</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.conversionRate}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 전환 퍼널 */}
          {funnel && (
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">전환 퍼널</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-blue-600">{funnel.awareness.count}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{funnel.awareness.name}</p>
                    <p className="text-xs text-gray-500">{funnel.awareness.goal}</p>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-gray-200 relative">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-green-600">{funnel.consideration.count}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{funnel.consideration.name}</p>
                    <p className="text-xs text-gray-500">{funnel.consideration.goal}</p>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-gray-200 relative">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-purple-600">{funnel.decision.count}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{funnel.decision.name}</p>
                    <p className="text-xs text-gray-500">{funnel.decision.goal}</p>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-gray-200 relative">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-orange-600">{funnel.funnel.count}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{funnel.funnel.name}</p>
                    <p className="text-xs text-gray-500">{funnel.funnel.goal}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 채널별 성과 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">채널별 전환율</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Object.entries(channels).map(([channel, metrics]) => (
                    <div key={channel} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{channel}</p>
                        <p className="text-sm text-gray-500">
                          {metrics.views} 노출 • {metrics.clicks} 클릭 • {metrics.conversions} 전환
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">{metrics.conversionRate}%</p>
                        <p className="text-sm text-gray-500">전환율</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">최고 성과 콘텐츠 TOP 5</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topContent.slice(0, 5).map((content, index) => (
                    <div key={content.contentId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{content.contentId}</p>
                          <p className="text-sm text-gray-500">
                            {content.channels.join(', ')} • {content.conversions} 전환
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">{content.conversionRate}%</p>
                        <p className="text-sm text-gray-500">전환율</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 콘텐츠 캘린더 뷰 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">콘텐츠 캘린더</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setView('list')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      view === 'list' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    리스트
                  </button>
                  <button
                    onClick={() => setView('calendar')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      view === 'calendar' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    달력
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {view === 'list' ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">콘텐츠 리스트</h3>
                  <p className="mt-1 text-sm text-gray-500">콘텐츠 캘린더 시스템과 연동됩니다.</p>
                  <div className="mt-6">
                    <Link
                      href="/admin/blog"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      블로그 관리로 이동
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">달력 뷰</h3>
                  <p className="mt-1 text-sm text-gray-500">콘텐츠 캘린더 시스템과 연동됩니다.</p>
                  <div className="mt-6">
                    <Link
                      href="/admin/blog"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      블로그 관리로 이동
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
