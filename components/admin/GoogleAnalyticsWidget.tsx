import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
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
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface GoogleAnalyticsData {
  realtime: {
    activeUsers: string;
    pageViews: string;
  };
  report: {
    totalSessions: number;
    totalPageViews: number;
    averageBounceRate: number;
    averageSessionDuration: number;
    newUsers: number;
    topPages: Array<{
      page: string;
      views: number;
      source: string;
      medium: string;
    }>;
  };
  dailyTrends: Array<{
    date: string;
    sessions: number;
    pageViews: number;
    users: number;
  }>;
  lastUpdated: string;
}

interface GoogleAnalyticsWidgetProps {
  period?: string;
}

export default function GoogleAnalyticsWidget({ period = '7d' }: GoogleAnalyticsWidgetProps) {
  const [data, setData] = useState<GoogleAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/google-analytics?period=${period}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
        setError(null);
      } else {
        setError(result.error || '데이터를 불러올 수 없습니다.');
        setData(result); // 더미 데이터라도 표시
      }
    } catch (err) {
      setError('Google Analytics 연결에 실패했습니다.');
      console.error('Analytics 데이터 가져오기 실패:', err);
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

  if (error && !data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">⚠️ Google Analytics 연결 실패</p>
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

  if (!data) return null;

  // 차트 데이터 준비
  const trendChartData = {
    labels: data.dailyTrends.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: '세션',
        data: data.dailyTrends.map(d => d.sessions),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: '페이지뷰',
        data: data.dailyTrends.map(d => d.pageViews),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const topPagesData = {
    labels: data.report.topPages.slice(0, 5).map(p => p.page),
    datasets: [
      {
        label: '페이지뷰',
        data: data.report.topPages.slice(0, 5).map(p => p.views),
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
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* 연결 상태 및 새로고침 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className="text-sm text-gray-600">
              {error ? '연결 실패' : 'Google Analytics 연결됨'}
            </span>
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

      {/* 실시간 데이터 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{data.realtime.activeUsers}</div>
          <div className="text-sm text-gray-600">실시간 방문자</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{data.report.totalSessions.toLocaleString()}</div>
          <div className="text-sm text-gray-600">총 세션</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{data.report.totalPageViews.toLocaleString()}</div>
          <div className="text-sm text-gray-600">페이지뷰</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{(data.report.averageBounceRate * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-600">이탈률</div>
        </div>
      </div>

      {/* 추가 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-lg font-bold text-gray-900">{Math.round(data.report.averageSessionDuration / 60)}분</div>
          <div className="text-sm text-gray-600">평균 세션 시간</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-lg font-bold text-gray-900">{data.report.newUsers.toLocaleString()}</div>
          <div className="text-sm text-gray-600">신규 사용자</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-lg font-bold text-gray-900">
            {data.report.totalSessions > 0 ? (data.report.totalPageViews / data.report.totalSessions).toFixed(1) : '0'}
          </div>
          <div className="text-sm text-gray-600">페이지/세션</div>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 일별 트렌드 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">일별 트렌드</h3>
          <div className="h-64">
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </div>

        {/* 인기 페이지 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">인기 페이지</h3>
          <div className="h-64">
            <Bar data={topPagesData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* 상세 페이지 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">페이지별 상세 통계</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">페이지</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">페이지뷰</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">소스</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">미디엄</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.report.topPages.map((page, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.page}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.views.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.source}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.medium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-yellow-400 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Google Analytics API 연결 실패</h3>
              <p className="text-sm text-yellow-700 mt-1">
                현재 더미 데이터를 표시하고 있습니다. 실제 데이터를 보려면 Google Analytics API 설정을 확인해주세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
