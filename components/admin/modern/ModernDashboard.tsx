import React, { useState, useEffect } from 'react';
import { 
  TrendingUpIcon, 
  UsersIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  EyeIcon,
  CursorClickIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ModernDashboardProps {
  theme: string;
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  setLoading: (loading: boolean) => void;
}

const ModernDashboard: React.FC<ModernDashboardProps> = ({
  theme,
  notifications,
  setNotifications,
  setLoading
}) => {
  const [dashboardData, setDashboardData] = useState({
    realtime: {
      activeUsers: 0,
      pageViews: 0,
      conversions: 0,
      revenue: 0
    },
    today: {
      visitors: 0,
      pageViews: 0,
      bounceRate: 0,
      avgSessionDuration: 0
    },
    campaigns: [],
    topPages: [],
    recentActivity: []
  });

  const [timeRange, setTimeRange] = useState('today');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 실시간 데이터 가져오기
  const fetchRealtimeData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/realtime');
      const data = await response.json();
      
      setDashboardData(prev => ({
        ...prev,
        realtime: data.realtime || prev.realtime
      }));
    } catch (error) {
      console.error('실시간 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 일일 데이터 가져오기
  const fetchDailyData = async () => {
    try {
      const response = await fetch(`/api/analytics/daily?range=${timeRange}`);
      const data = await response.json();
      
      setDashboardData(prev => ({
        ...prev,
        today: data.today || prev.today,
        campaigns: data.campaigns || prev.campaigns,
        topPages: data.topPages || prev.topPages,
        recentActivity: data.recentActivity || prev.recentActivity
      }));
    } catch (error) {
      console.error('일일 데이터 로드 실패:', error);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchRealtimeData();
    fetchDailyData();
  }, [timeRange]);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchRealtimeData();
    }, 30000); // 30초마다

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // KPI 카드 컴포넌트
  const KPICard = ({ title, value, change, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUpIcon className={`w-4 h-4 mr-1 ${
                change > 0 ? 'rotate-0' : 'rotate-180'
              }`} />
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  // 차트 컴포넌트
  const ChartCard = ({ title, children }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 헤더 컨트롤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            실시간 대시보드
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                autoRefresh 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {autoRefresh ? '🔄 자동' : '⏸️ 수동'}
            </button>
            <button
              onClick={fetchRealtimeData}
              className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              새로고침
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="today">오늘</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
          </select>
        </div>
      </div>

      {/* 실시간 KPI 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="실시간 사용자"
          value={dashboardData.realtime.activeUsers}
          change={12.5}
          icon={UsersIcon}
          color="bg-blue-500"
        />
        <KPICard
          title="페이지뷰"
          value={dashboardData.realtime.pageViews}
          change={-2.3}
          icon={EyeIcon}
          color="bg-green-500"
        />
        <KPICard
          title="전환율"
          value={`${dashboardData.realtime.conversions}%`}
          change={8.7}
          icon={CursorClickIcon}
          color="bg-purple-500"
        />
        <KPICard
          title="수익"
          value={`₩${dashboardData.realtime.revenue.toLocaleString()}`}
          change={15.2}
          icon={CurrencyDollarIcon}
          color="bg-yellow-500"
        />
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 실시간 방문자 차트 */}
        <div className="lg:col-span-2">
          <ChartCard title="실시간 방문자 추이">
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {dashboardData.realtime.activeUsers}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  현재 활성 사용자
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>페이지뷰</span>
                    <span className="font-medium">{dashboardData.realtime.pageViews}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>평균 세션 시간</span>
                    <span className="font-medium">{dashboardData.today.avgSessionDuration}분</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>바운스율</span>
                    <span className="font-medium">{dashboardData.today.bounceRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* 최근 활동 */}
        <div>
          <ChartCard title="최근 활동">
            <div className="space-y-4">
              {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* 하단 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 인기 페이지 */}
        <ChartCard title="인기 페이지">
          <div className="space-y-3">
            {dashboardData.topPages.slice(0, 5).map((page, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white truncate">
                    {page.path}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {page.views}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* 캠페인 성과 */}
        <ChartCard title="캠페인 성과">
          <div className="space-y-3">
            {dashboardData.campaigns.slice(0, 5).map((campaign, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    campaign.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm text-gray-900 dark:text-white truncate">
                    {campaign.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {campaign.conversions}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {campaign.ctr}% CTR
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* 알림 섹션 */}
      {notifications.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">알림</h3>
          </div>
          <div className="space-y-1">
            {notifications.slice(0, 3).map((notification, index) => (
              <p key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                {notification.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernDashboard;
