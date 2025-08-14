'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Users, Eye, TrendingUp, Calendar, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface GA4RealtimeDashboardProps {
  campaignId?: string;
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
}

interface HourlyData {
  hour: string;
  users: number;
  pageViews: number;
  events: number;
}

interface DailyData {
  date: string;
  users: number;
  pageViews: number;
  events: number;
}

export default function GA4RealtimeDashboard({ campaignId }: GA4RealtimeDashboardProps) {
  const [ga4Data, setGa4Data] = useState<GA4Data | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 데이터가 없을 때 표시할 함수
  const formatData = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '' || value === '0') {
      return '-';
    }
    return typeof value === 'number' ? value.toLocaleString() : value;
  };

  const fetchGA4Data = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 고정 기간으로 변경
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      // 오늘: 오늘 날짜 고정
      const today = `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      // 이번달: 1일 ~ 말일 고정
      const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
      const monthEnd = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
      
      const response = await fetch(`/api/ga4-realtime?today=${today}&monthStart=${monthStart}&monthEnd=${monthEnd}`);
      
      if (!response.ok) {
        throw new Error('GA4 데이터를 가져올 수 없습니다.');
      }
      
      const data = await response.json();
      
      if (data.error || data.status === 'fallback_data') {
        setError('실제 GA4 데이터를 가져올 수 없습니다.');
        return;
      }
      
      setGa4Data(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHourlyData = async () => {
    try {
      const response = await fetch('/api/ga4-hourly');
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setHourlyData(data);
        }
      }
    } catch (error) {
      console.error('Error fetching hourly data:', error);
    }
  };

  const fetchDailyData = async () => {
    try {
      const response = await fetch('/api/ga4-daily');
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          // 날짜 순서로 정렬 (오래된 날짜부터 최신 날짜까지)
          const sortedData = data.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA.getTime() - dateB.getTime();
          });
          setDailyData(sortedData);
        }
      }
    } catch (error) {
      console.error('Error fetching daily data:', error);
    }
  };

  useEffect(() => {
    fetchGA4Data();
    fetchHourlyData();
    fetchDailyData();
    
    // 30초마다 자동 새로고침
    const interval = setInterval(() => {
      fetchGA4Data();
      fetchHourlyData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [campaignId]);

  if (loading && !ga4Data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
          <span className="text-gray-600">GA4 실시간 데이터 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️ GA4 연결 오류</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button
            onClick={fetchGA4Data}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          GA4 실시간 데이터
          {campaignId && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (캠페인: {campaignId})
            </span>
          )}
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            ga4Data?.status === 'real_data' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {ga4Data?.status === 'real_data' ? '실시간 데이터' : '폴백 데이터'}
          </span>
          <button
            onClick={() => {
              fetchGA4Data();
              fetchHourlyData();
              fetchDailyData();
            }}
            className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors"
          >
            <div className="w-4 h-4">🔄</div>
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {/* 실시간 데이터 */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
          <Clock className="w-4 h-4 mr-2 text-blue-500" />
          실시간 (현재 접속자)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">현재 접속자</p>
                <p className="text-2xl font-bold">{formatData(ga4Data?.activeUsers)}</p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">실시간 페이지뷰</p>
                <p className="text-2xl font-bold">{formatData(ga4Data?.pageViews)}</p>
              </div>
              <Eye className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">실시간 이벤트</p>
                <p className="text-2xl font-bold">{formatData(ga4Data?.events)}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>
      </div>

      {/* 오늘 데이터 - 시간대별 그래프 */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-green-500" />
          오늘 시간대별 트렌드
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">오늘 방문자</p>
                <p className="text-2xl font-bold">{formatData(ga4Data?.todayUsers)}</p>
              </div>
              <Users className="w-8 h-8 text-emerald-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">오늘 페이지뷰</p>
                <p className="text-2xl font-bold">{formatData(ga4Data?.todayPageViews)}</p>
              </div>
              <Eye className="w-8 h-8 text-teal-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-sm">오늘 이벤트</p>
                <p className="text-2xl font-bold">{formatData(ga4Data?.todayEvents)}</p>
              </div>
              <Activity className="w-8 h-8 text-cyan-200" />
            </div>
          </div>
        </div>

        {/* 시간대별 그래프 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-700 mb-3">오늘 시간대별 방문자 (0-24시)</h5>
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}시`}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any) => [value, '방문자']}
                  labelFormatter={(label) => `${label}시`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              시간대별 데이터가 없습니다
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500 text-center">
            현재 시간: {new Date().getHours()}시 {new Date().getMinutes()}분
          </div>
        </div>
      </div>

      {/* 이번달 데이터 - 일별 그래프 */}
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2 text-purple-500" />
          이번달 일별 트렌드
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">이번달 방문자</p>
                <p className="text-2xl font-bold">{formatData(ga4Data?.monthlyUsers)}</p>
              </div>
              <Users className="w-8 h-8 text-indigo-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm">이번달 페이지뷰</p>
                <p className="text-2xl font-bold">{formatData(ga4Data?.monthlyPageViews)}</p>
              </div>
              <Eye className="w-8 h-8 text-violet-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-fuchsia-100 text-sm">이번달 이벤트</p>
                <p className="text-2xl font-bold">{formatData(ga4Data?.monthlyEvents)}</p>
              </div>
              <Activity className="w-8 h-8 text-fuchsia-200" />
            </div>
          </div>
        </div>

        {/* 일별 그래프 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-700 mb-3">현재월 일별 방문자 (1일-말일)</h5>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}일`;
                  }}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any) => [value, '방문자']}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
                  }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Bar 
                  dataKey="users" 
                  fill="#8b5cf6" 
                  radius={[2, 2, 0, 0]}
                  name="방문자"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              일별 데이터가 없습니다
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500 text-center">
            {dailyData.length > 0 ? (
              <>
                {new Date(dailyData[0].date).getMonth() + 1}월 {new Date(dailyData[0].date).getDate()}일 ~ {new Date(dailyData[dailyData.length - 1].date).getMonth() + 1}월 {new Date(dailyData[dailyData.length - 1].date).getDate()}일
                <br />
                총 방문자: {dailyData.reduce((sum, day) => sum + day.users, 0).toLocaleString()}명
              </>
            ) : (
              '일별 데이터가 없습니다'
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        마지막 업데이트: {lastUpdate.toLocaleTimeString()}
        <br />
        GA4 속성 ID: 497433231
        {ga4Data?.status === 'fallback_data' && (
          <div className="mt-2 text-yellow-600">
            ⚠️ GA4 API 연결 실패로 폴백 데이터를 표시합니다.
          </div>
        )}
      </div>
    </div>
  );
}
