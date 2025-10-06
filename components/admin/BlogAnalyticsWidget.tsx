import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface BlogAnalyticsData {
  stats: {
    totalPosts: number;
    totalViews: number;
    averageViews: number;
    publishedPosts: number;
    draftPosts: number;
  };
  growth: {
    postsGrowth: number;
    viewsGrowth: number;
  };
  categories: Record<string, {
    count: number;
    views: number;
    posts: Array<{
      title: string;
      views: number;
      published_at: string;
    }>;
  }>;
  popularPosts: Array<{
    title: string;
    views: number;
    published_at: string;
    category: string;
    slug: string;
  }>;
  dailyStats: Array<{
    date: string;
    posts: number;
    views: number;
  }>;
  lastUpdated: string;
}

interface BlogAnalyticsWidgetProps {
  period?: string;
}

export default function BlogAnalyticsWidget({ period = '7d' }: BlogAnalyticsWidgetProps) {
  const [data, setData] = useState<BlogAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/blog-analytics?period=${period}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
        setError(null);
      } else {
        setError(result.error || '데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('블로그 분석 데이터를 불러올 수 없습니다.');
      console.error('블로그 분석 데이터 가져오기 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">⚠️ 블로그 분석 데이터 로드 실패</p>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 차트 데이터 준비
  const dailyChartData = {
    labels: data.dailyStats.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: '발행 포스트',
        data: data.dailyStats.map(d => d.posts),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: '조회수',
        data: data.dailyStats.map(d => d.views),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        yAxisID: 'y1',
      },
    ],
  };

  const categoryData = {
    labels: Object.keys(data.categories),
    datasets: [
      {
        data: Object.values(data.categories).map(cat => cat.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const popularPostsData = {
    labels: data.popularPosts.slice(0, 5).map(p => p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title),
    datasets: [
      {
        label: '조회수',
        data: data.popularPosts.slice(0, 5).map(p => p.views),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* 연결 상태 및 새로고침 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">블로그 분석 연결됨</span>
          </div>
          <div className="text-sm text-gray-500">
            마지막 업데이트: {new Date(data.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
        
        <button
          onClick={fetchAnalyticsData}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          새로고침
        </button>
      </div>

      {/* 주요 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{data.stats.totalPosts}</div>
          <div className="text-sm text-gray-600">총 포스트</div>
          <div className={`text-xs ${data.growth.postsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.growth.postsGrowth >= 0 ? '↗' : '↘'} {Math.abs(data.growth.postsGrowth).toFixed(1)}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{data.stats.totalViews.toLocaleString()}</div>
          <div className="text-sm text-gray-600">총 조회수</div>
          <div className={`text-xs ${data.growth.viewsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.growth.viewsGrowth >= 0 ? '↗' : '↘'} {Math.abs(data.growth.viewsGrowth).toFixed(1)}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{data.stats.averageViews}</div>
          <div className="text-sm text-gray-600">평균 조회수</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{data.stats.publishedPosts}</div>
          <div className="text-sm text-gray-600">발행된 포스트</div>
        </div>
      </div>

      {/* 추가 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-lg font-bold text-gray-900">{data.stats.draftPosts}</div>
          <div className="text-sm text-gray-600">초안 포스트</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-lg font-bold text-gray-900">
            {data.stats.totalPosts > 0 ? (data.stats.publishedPosts / data.stats.totalPosts * 100).toFixed(1) : '0'}%
          </div>
          <div className="text-sm text-gray-600">발행률</div>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 일별 트렌드 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">일별 발행 & 조회수</h3>
          <div className="h-64">
            <Line data={dailyChartData} options={chartOptions} />
          </div>
        </div>

        {/* 카테고리 분포 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 포스트 수</h3>
          <div className="h-64">
            <Doughnut data={categoryData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* 인기 포스트 차트 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">인기 포스트 (조회수 기준)</h3>
        <div className="h-64">
          <Bar data={popularPostsData} options={chartOptions} />
        </div>
      </div>

      {/* 상세 포스트 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">인기 포스트 상세</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조회수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">발행일</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.popularPosts.map((post, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <a 
                      href={`/blog/${post.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {post.title}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{post.views.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{post.category || '미분류'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(post.published_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 카테고리별 상세 통계 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">카테고리별 상세 통계</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">포스트 수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 조회수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 조회수</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(data.categories).map(([category, stats]) => (
                <tr key={category}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stats.count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stats.views.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(stats.views / stats.count).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
