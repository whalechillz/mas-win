'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface MonthlyData {
  month: string;
  year: number;
  users: number;
  pageViews: number;
  events: number;
  tagStatus: 'working' | 'not_installed' | 'partial' | 'unknown';
  workingDays: number;
  totalDays: number;
}

interface FunnelData {
  id: string;
  name: string;
  url: string;
  visitors: number;
  pageViews: number;
  events: number;
  conversionRate: number;
}

export default function MonthlyCampaignAnalytics() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [loading, setLoading] = useState(true);

  // 퍼널 데이터 정의
  const funnels = [
    {
      id: '2025-08',
      name: '2025년 8월 메인 퍼널',
      url: 'https://win.masgolf.co.kr/25-08',
      path: '/25-08'
    },
    {
      id: '2025-07',
      name: '2025년 7월 메인 퍼널', 
      url: 'https://win.masgolf.co.kr/25-07',
      path: '/25-07'
    },
    {
      id: '2025-06',
      name: '2025년 6월 메인 퍼널',
      url: 'https://win.masgolf.co.kr/25-06', 
      path: '/25-06'
    },
    {
      id: '2025-05',
      name: '2025년 5월 메인 퍼널',
      url: 'https://win.masgolf.co.kr/25-05',
      path: '/25-05'
    }
  ];

  const fetchFunnelData = async () => {
    try {
      const funnelResults: FunnelData[] = [];
      
      for (const funnel of funnels) {
        try {
          const response = await fetch(`/api/ga4-funnel?path=${funnel.path}&month=${getCurrentMonth()}`);
          if (response.ok) {
            const data = await response.json();
            funnelResults.push({
              id: funnel.id,
              name: funnel.name,
              url: funnel.url,
              visitors: data.visitors || 0,
              pageViews: data.pageViews || 0,
              events: data.events || 0,
              conversionRate: data.conversionRate || 0
            });
          } else {
            funnelResults.push({
              id: funnel.id,
              name: funnel.name,
              url: funnel.url,
              visitors: 0,
              pageViews: 0,
              events: 0,
              conversionRate: 0
            });
          }
        } catch (error) {
          console.error(`Error fetching funnel data for ${funnel.id}:`, error);
          funnelResults.push({
            id: funnel.id,
            name: funnel.name,
            url: funnel.url,
            visitors: 0,
            pageViews: 0,
            events: 0,
            conversionRate: 0
          });
        }
      }
      
      setFunnelData(funnelResults);
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    }
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchMonthlyData();
    fetchFunnelData();
  }, []);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      
      // 5월부터 현재까지의 월별 데이터 요청
      const months = [];
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      // 5월부터 현재까지
      for (let month = 5; month <= currentMonth; month++) {
        months.push(`${currentYear}-${String(month).padStart(2, '0')}`);
      }

      const allData: MonthlyData[] = [];
      
      for (const monthStr of months) {
        try {
          const response = await fetch(`/api/ga4-monthly?month=${monthStr}`);
          if (response.ok) {
            const data = await response.json();
            allData.push(data);
          } else {
            // 데이터가 없는 경우 (태그 미설치)
            const [year, month] = monthStr.split('-');
            allData.push({
              month: monthStr,
              year: parseInt(year),
              users: 0,
              pageViews: 0,
              events: 0,
              tagStatus: 'not_installed',
              workingDays: 0,
              totalDays: new Date(parseInt(year), parseInt(month), 0).getDate()
            });
          }
        } catch (error) {
          console.error(`Error fetching data for ${monthStr}:`, error);
        }
      }
      
      setMonthlyData(allData);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTagStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'not_installed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTagStatusText = (status: string) => {
    switch (status) {
      case 'working':
        return '정상 작동';
      case 'not_installed':
        return '태그 미설치';
      case 'partial':
        return '부분 작동';
      default:
        return '상태 불명';
    }
  };

  const getTagStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-green-100 text-green-800';
      case 'not_installed':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center space-x-2">
          <i data-feather="refresh-cw" className="w-5 h-5 animate-spin text-purple-600"></i>
          <span className="text-gray-600">월별 데이터 로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 기존 월별 캠페인 분석 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">월별 캠페인 분석 (5월 ~ 현재)</h2>
          <button
            onClick={() => {
              fetchMonthlyData();
              fetchFunnelData();
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            새로고침
          </button>
        </div>
        
        {/* 기존 월별 데이터 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {monthlyData.map((data, index) => (
            <div key={data.month} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-gray-900">
                  {data.year}년 {data.month.split('-')[1]}월
                </h4>
                <div className="flex items-center space-x-2">
                  {getTagStatusIcon(data.tagStatus)}
                  <span className={`px-2 py-1 text-xs rounded-full ${getTagStatusColor(data.tagStatus)}`}>
                    {getTagStatusText(data.tagStatus)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">방문자</span>
                  <span className="font-semibold">{data.users.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">페이지뷰</span>
                  <span className="font-semibold">{data.pageViews.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">이벤트</span>
                  <span className="font-semibold">{data.events.toLocaleString()}</span>
                </div>

                {data.tagStatus === 'partial' && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded-md">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-yellow-700">작동일수</span>
                      <span className="font-medium text-yellow-800">
                        {data.workingDays}일 / {data.totalDays}일
                      </span>
                    </div>
                    <div className="mt-1 w-full bg-yellow-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${(data.workingDays / data.totalDays) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {data.tagStatus === 'not_installed' && (
                  <div className="mt-3 p-2 bg-red-50 rounded-md">
                    <div className="text-sm text-red-700">
                      ⚠️ GA4 태그가 설치되지 않았습니다.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 새로운 퍼널별 데이터 섹션 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">퍼널별 성과 분석</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {funnelData.map((funnel) => (
            <div key={funnel.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-900">{funnel.name}</h4>
                <a 
                  href={funnel.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  퍼널 보기 →
                </a>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">방문자</p>
                  <p className="text-xl font-bold text-gray-900">{funnel.visitors.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">페이지뷰</p>
                  <p className="text-xl font-bold text-gray-900">{funnel.pageViews.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">이벤트</p>
                  <p className="text-xl font-bold text-gray-900">{funnel.events.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">전환율</p>
                  <p className="text-xl font-bold text-green-600">{funnel.conversionRate.toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                퍼널 URL: {funnel.url}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 데이터 상태 안내 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">데이터 상태 안내</h4>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>정상 작동: GA4 태그가 정상적으로 작동하여 데이터 수집 중</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span>부분 작동: 일부 기간에만 데이터가 수집됨</span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span>태그 미설치: GA4 태그가 설치되지 않아 데이터 없음</span>
          </div>
        </div>
      </div>
    </div>
  );
} 