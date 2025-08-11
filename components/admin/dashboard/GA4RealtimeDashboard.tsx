import { Activity, Users, Eye, TrendingUp } from 'lucide-react';
'use client';

import React, { useState, useEffect } from 'react';

interface GA4RealtimeDashboardProps {
  campaignId?: string;
}

interface GA4Data {
  activeUsers: string;
  pageViews: string;
  events: string;
  timestamp: string;
  campaign_id: string;
}

export default function GA4RealtimeDashboard({ campaignId }: GA4RealtimeDashboardProps) {
  const [ga4Data, setGa4Data] = useState<GA4Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchGA4Data = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = campaignId 
        ? `/api/ga4-realtime?campaign_id=${campaignId}`
        : '/api/ga4-realtime';
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('GA4 데이터를 가져올 수 없습니다');
      }
      
      const data = await response.json();
      setGa4Data(data);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('GA4 데이터 가져오기 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGA4Data();
    
    // 30초마다 자동 새로고침
    const interval = setInterval(fetchGA4Data, 30000);
    
    return () => clearInterval(interval);
  }, [campaignId]);

  if (loading && !ga4Data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center space-x-2">
          <i data-feather="refresh-cw" className="w-5 h-5 animate-spin text-purple-600"> />
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
        <button
          onClick={fetchGA4Data}
          className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors"
        >
          <i data-feather="refresh-cw" className="w-4 h-4"> />
          <span>새로고침</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">실시간 사용자</p>
              <p className="text-2xl font-bold">{ga4Data?.activeUsers || '0'}</p>
            </div>
            <Users className="w-8 h-8 text-blue-200"> />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">페이지뷰</p>
              <p className="text-2xl font-bold">{ga4Data?.pageViews || '0'}</p>
            </div>
            <Eye className="w-8 h-8 text-green-200"> />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">이벤트</p>
              <p className="text-2xl font-bold">{ga4Data?.events || '0'}</p>
            </div>
            <Activity className="w-8 h-8 text-purple-200"> />
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        마지막 업데이트: {lastUpdate.toLocaleTimeString()}
        <br />
        GA4 속성 ID: 497433231
      </div>
    </div>
  );
}
