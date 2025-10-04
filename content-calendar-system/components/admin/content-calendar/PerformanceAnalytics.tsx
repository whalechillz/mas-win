// Performance Analytics Component
// /components/admin/content-calendar/PerformanceAnalytics.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ContentCalendarItem,
  PerformanceMetrics,
  ContentType 
} from '@/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceAnalyticsProps {
  contents: ContentCalendarItem[];
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  contents
}) => {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedContentType, setSelectedContentType] = useState<ContentType | 'all'>('all');
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // =====================================================
  // Data Fetching
  // =====================================================
  useEffect(() => {
    fetchPerformanceData();
  }, [dateRange, selectedContentType]);

  const fetchPerformanceData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/content-calendar/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRange,
          contentType: selectedContentType
        })
      });

      const data = await response.json();
      if (data.success) {
        setPerformanceData(data.data);
      }
    } catch (error) {
      console.error('성과 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // Data Processing
  // =====================================================
  const stats = useMemo(() => {
    const publishedContents = contents.filter(c => c.status === 'published');
    
    const totalViews = publishedContents.reduce((sum, c) => 
      sum + (c.performanceMetrics?.views || 0), 0
    );
    
    const avgEngagement = publishedContents.length > 0
      ? publishedContents.reduce((sum, c) => 
          sum + (c.performanceMetrics?.engagementRate || 0), 0
        ) / publishedContents.length
      : 0;
    
    const totalRevenue = publishedContents.reduce((sum, c) => 
      sum + (c.performanceMetrics?.revenue || 0), 0
    );
    
    const avgConversion = publishedContents.length > 0
      ? publishedContents.reduce((sum, c) => 
          sum + (c.performanceMetrics?.conversionRate || 0), 0
        ) / publishedContents.length
      : 0;

    return {
      totalContents: contents.length,
      publishedContents: publishedContents.length,
      totalViews,
      avgEngagement: avgEngagement.toFixed(2),
      totalRevenue,
      avgConversion: avgConversion.toFixed(2)
    };
  }, [contents]);

  const contentByType = useMemo(() => {
    const grouped: { [key in ContentType]: number } = {
      blog: 0,
      social: 0,
      email: 0,
      funnel: 0,
      video: 0
    };

    contents.forEach(content => {
      grouped[content.contentType]++;
    });

    return grouped;
  }, [contents]);

  const topPerformingContents = useMemo(() => {
    return contents
      .filter(c => c.status === 'published' && c.performanceMetrics?.views)
      .sort((a, b) => (b.performanceMetrics?.views || 0) - (a.performanceMetrics?.views || 0))
      .slice(0, 5);
  }, [contents]);

  // =====================================================
  // Chart Data
  // =====================================================
  const viewsChartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return format(date, 'MM/dd');
    });

    const viewsByDate = last30Days.map(date => {
      // 실제 구현에서는 날짜별 조회수 데이터를 집계
      return Math.floor(Math.random() * 1000) + 500; // 샘플 데이터
    });

    return {
      labels: last30Days,
      datasets: [
        {
          label: '조회수',
          data: viewsByDate,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3
        }
      ]
    };
  }, [performanceData]);

  const contentTypeChartData = useMemo(() => {
    return {
      labels: ['블로그', '소셜', '이메일', '퍼널', '비디오'],
      datasets: [
        {
          data: [
            contentByType.blog,
            contentByType.social,
            contentByType.email,
            contentByType.funnel,
            contentByType.video
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(147, 51, 234, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderWidth: 0
        }
      ]
    };
  }, [contentByType]);

  const engagementChartData = useMemo(() => {
    const types = ['blog', 'social', 'email', 'funnel', 'video'];
    const avgEngagementByType = types.map(type => {
      const typeContents = contents.filter(c => 
        c.contentType === type && c.status === 'published'
      );
      
      if (typeContents.length === 0) return 0;
      
      return (
        typeContents.reduce((sum, c) => 
          sum + (c.performanceMetrics?.engagementRate || 0), 0
        ) / typeContents.length
      ).toFixed(2);
    });

    return {
      labels: ['블로그', '소셜', '이메일', '퍼널', '비디오'],
      datasets: [
        {
          label: '평균 참여율 (%)',
          data: avgEngagementByType,
          backgroundColor: 'rgba(147, 51, 234, 0.8)',
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 1
        }
      ]
    };
  }, [contents]);

  const chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    }
  };

  // =====================================================
  // Render
  // =====================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">성과 분석</h2>
          <div className="flex items-center gap-4">
            <select
              value={selectedContentType}
              onChange={(e) => setSelectedContentType(e.target.value as ContentType | 'all')}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">모든 타입</option>
              <option value="blog">블로그</option>
              <option value="social">소셜</option>
              <option value="email">이메일</option>
              <option value="funnel">퍼널</option>
              <option value="video">비디오</option>
            </select>
            <div className="flex border rounded-lg">
              {(['week', 'month', 'quarter', 'year'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 ${
                    dateRange === range 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {range === 'week' && '주간'}
                  {range === 'month' && '월간'}
                  {range === 'quarter' && '분기'}
                  {range === 'year' && '연간'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-6 gap-4">
          <StatCard
            label="총 콘텐츠"
            value={stats.totalContents}
            icon="📝"
            color="blue"
          />
          <StatCard
            label="발행된 콘텐츠"
            value={stats.publishedContents}
            icon="🚀"
            color="green"
          />
          <StatCard
            label="총 조회수"
            value={stats.totalViews.toLocaleString()}
            icon="👁️"
            color="purple"
          />
          <StatCard
            label="평균 참여율"
            value={`${stats.avgEngagement}%`}
            icon="💬"
            color="yellow"
          />
          <StatCard
            label="평균 전환율"
            value={`${stats.avgConversion}%`}
            icon="🎯"
            color="orange"
          />
          <StatCard
            label="총 매출"
            value={`₩${stats.totalRevenue.toLocaleString()}`}
            icon="💰"
            color="green"
          />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-6">
        {/* Views Trend */}
        <div className="col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">조회수 추이</h3>
          <div className="h-64">
            <Line data={viewsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Content Type Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">콘텐츠 타입 분포</h3>
          <div className="h-64">
            <Doughnut data={contentTypeChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Engagement by Type */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">타입별 평균 참여율</h3>
          <div className="h-64">
            <Bar data={engagementChartData} options={chartOptions} />
          </div>
        </div>

        {/* Top Performing Contents */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">최고 성과 콘텐츠</h3>
          <div className="space-y-3">
            {topPerformingContents.map((content, index) => (
              <div key={content.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">
                    #{index + 1}
                  </span>
                  <div>
                    <div className="font-medium">{content.title}</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(content.contentDate), 'yyyy-MM-dd')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {content.performanceMetrics?.views?.toLocaleString()} views
                  </div>
                  <div className="text-sm text-gray-500">
                    {content.performanceMetrics?.engagementRate}% engagement
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">상세 성과 데이터</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  콘텐츠
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  타입
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  조회수
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  참여율
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  전환율
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  매출
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contents
                .filter(c => c.status === 'published' && c.performanceMetrics)
                .map(content => (
                  <tr key={content.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">{content.title}</div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(content.contentDate), 'yyyy-MM-dd')}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {content.contentType}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900">
                      {content.performanceMetrics?.views?.toLocaleString() || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900">
                      {content.performanceMetrics?.engagementRate 
                        ? `${content.performanceMetrics.engagementRate}%` 
                        : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900">
                      {content.performanceMetrics?.conversionRate 
                        ? `${content.performanceMetrics.conversionRate}%` 
                        : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-right text-gray-900">
                      {content.performanceMetrics?.revenue 
                        ? `₩${content.performanceMetrics.revenue.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-right">
                      {content.performanceMetrics?.roi ? (
                        <span className={`
                          font-medium
                          ${content.performanceMetrics.roi > 0 ? 'text-green-600' : 'text-red-600'}
                        `}>
                          {content.performanceMetrics.roi > 0 ? '+' : ''}
                          {content.performanceMetrics.roi}%
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            // Export functionality
            alert('성과 데이터 내보내기 기능은 준비 중입니다.');
          }}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          📊 Excel 내보내기
        </button>
      </div>
    </div>
  );
};

// =====================================================
// Sub Components
// =====================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    orange: 'bg-orange-50 border-orange-200',
    gray: 'bg-gray-50 border-gray-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

export default PerformanceAnalytics;
