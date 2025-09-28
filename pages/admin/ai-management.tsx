import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AIUsageLog {
  id: number;
  api_endpoint: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
  improvement_type: string;
  content_type: string;
  user_agent: string;
  ip_address: string;
  created_at: string;
}

interface AIUsageStats {
  totalUsage: number;
  todayUsage: number;
  totalCost: number;
  totalTokens: number;
  topModels: { model: string; count: number }[];
  topEndpoints: { endpoint: string; count: number }[];
  topImprovementTypes: { type: string; count: number }[];
}

export default function AIManagement() {
  const [logs, setLogs] = useState<AIUsageLog[]>([]);
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('today');

  useEffect(() => {
    fetchAIUsageLogs();
    fetchAIUsageStats();
  }, [selectedSource, selectedAction, dateRange]);

  const fetchAIUsageLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('ai_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // 필터 적용
      if (selectedSource !== 'all') {
        query = query.eq('api_endpoint', selectedSource);
      }
      
      if (selectedAction !== 'all') {
        query = query.eq('improvement_type', selectedAction);
      }

      // 날짜 범위 필터
      const now = new Date();
      if (dateRange === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query = query.gte('created_at', today.toISOString());
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('AI 사용량 로그 조회 오류:', error);
        return;
      }

      setLogs(data || []);
    } catch (error) {
      console.error('AI 사용량 로그 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIUsageStats = async () => {
    try {
      // 전체 사용량
      const { count: totalUsage } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true });

      // 오늘 사용량
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const { count: todayUsage } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      // 총 비용 계산
      const { data: costData } = await supabase
        .from('ai_usage_logs')
        .select('cost')
        .gte('created_at', todayStart.toISOString());

      const totalCost = costData?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0;

      // 총 토큰 수 계산
      const { data: tokenData } = await supabase
        .from('ai_usage_logs')
        .select('total_tokens')
        .gte('created_at', todayStart.toISOString());

      const totalTokens = tokenData?.reduce((sum, item) => sum + (item.total_tokens || 0), 0) || 0;

      // 상위 모델
      const { data: modelsData } = await supabase
        .from('ai_usage_logs')
        .select('model')
        .gte('created_at', todayStart.toISOString());

      const modelCounts = modelsData?.reduce((acc, item) => {
        acc[item.model] = (acc[item.model] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topModels = Object.entries(modelCounts)
        .map(([model, count]) => ({ model, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 상위 엔드포인트
      const { data: endpointsData } = await supabase
        .from('ai_usage_logs')
        .select('api_endpoint')
        .gte('created_at', todayStart.toISOString());

      const endpointCounts = endpointsData?.reduce((acc, item) => {
        acc[item.api_endpoint] = (acc[item.api_endpoint] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topEndpoints = Object.entries(endpointCounts)
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 상위 개선 유형
      const { data: typesData } = await supabase
        .from('ai_usage_logs')
        .select('improvement_type')
        .gte('created_at', todayStart.toISOString());

      const typeCounts = typesData?.reduce((acc, item) => {
        acc[item.improvement_type] = (acc[item.improvement_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topImprovementTypes = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalUsage: totalUsage || 0,
        todayUsage: todayUsage || 0,
        totalCost,
        totalTokens,
        topModels,
        topEndpoints,
        topImprovementTypes
      });
    } catch (error) {
      console.error('AI 사용량 통계 조회 실패:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('success')) return 'bg-green-100 text-green-800';
    if (action.includes('failed') || action.includes('error')) return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🤖 AI 사용량 관리</h1>
          <p className="text-gray-600 mt-2">AI API 사용량을 모니터링하고 관리합니다.</p>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  📊
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">전체 사용량</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsage.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  📈
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">오늘 사용량</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.todayUsage.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  💰
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 비용</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalCost.toFixed(4)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  🔥
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 토큰</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalTokens.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
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
                <option value="image-processor">이미지 처리기</option>
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
                <option value="image-generation">이미지 생성</option>
                <option value="text-improvement">텍스트 개선</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">기간</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">오늘</option>
                <option value="week">최근 7일</option>
                <option value="month">최근 30일</option>
                <option value="all">전체</option>
              </select>
            </div>
          </div>
        </div>

        {/* 로그 테이블 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">AI 사용량 로그</h2>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">로딩 중...</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      모델
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      엔드포인트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      토큰
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      비용
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      개선 유형
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {log.model}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.api_endpoint}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-xs">
                          <div>입력: {log.input_tokens?.toLocaleString() || 0}</div>
                          <div>출력: {log.output_tokens?.toLocaleString() || 0}</div>
                          <div className="font-semibold">총: {log.total_tokens?.toLocaleString() || 0}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold text-green-600">
                          ${log.cost?.toFixed(4) || '0.0000'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.improvement_type)}`}>
                          {log.improvement_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {logs.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-500">
              선택한 조건에 해당하는 로그가 없습니다.
            </div>
          )}
        </div>

        {/* 상위 소스 및 액션 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">상위 모델 (오늘)</h3>
              <div className="space-y-3">
                {stats.topModels.map((item, index) => (
                  <div key={item.model} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 w-4">#{index + 1}</span>
                      <span className="ml-3 text-sm text-gray-900">{item.model}</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">상위 엔드포인트 (오늘)</h3>
              <div className="space-y-3">
                {stats.topEndpoints.map((item, index) => (
                  <div key={item.endpoint} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 w-4">#{index + 1}</span>
                      <span className="ml-3 text-sm text-gray-900">{item.endpoint}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
