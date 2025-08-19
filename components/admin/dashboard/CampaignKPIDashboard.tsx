'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, MousePointer, Eye, AlertTriangle } from 'lucide-react';

interface CampaignData {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number;
  ctr: string;
  cpc: string;
}

interface ApiResponse {
  campaigns: CampaignData[];
  dataSource: string;
  period: string;
  error?: string;
  timestamp: string;
}

export default function CampaignKPIDashboard() {
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaignData();
  }, []);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/google-ads/campaigns');
      if (!response.ok) {
        throw new Error('Google Ads 데이터를 가져올 수 없습니다.');
      }
      
      const data = await response.json();
      setApiResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const campaigns = apiResponse?.campaigns || [];
  const isRealData = apiResponse?.dataSource === 'google_ads_api';

  // 값 포맷터: 실데이터가 아니면 'NA' 표시
  const formatValue = (value: number, opts?: { prefix?: string; suffix?: string }) => {
    if (!isRealData) return 'NA';
    const prefix = opts?.prefix ?? '';
    const suffix = opts?.suffix ?? '';
    return `${prefix}${value.toLocaleString()}${suffix}`;
  };

  // 전체 KPI 계산 (계산은 하되, 표시 시 포맷터 사용)
  const totalImpressions = campaigns.reduce((sum, campaign) => sum + campaign.impressions, 0);
  const totalClicks = campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
  const totalCost = campaigns.reduce((sum, campaign) => sum + campaign.cost, 0);
  const totalConversions = campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
  const totalConversionValue = campaigns.reduce((sum, campaign) => sum + campaign.conversionValue, 0);
  
  const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0.00';
  const overallCPC = totalClicks > 0 ? (totalCost / totalClicks).toFixed(2) : '0.00';
  const overallROAS = totalCost > 0 ? (totalConversionValue / totalCost).toFixed(2) : '0.00';

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center space-x-2">
          <i data-feather="refresh-cw" className="w-5 h-5 animate-spin text-purple-600"></i>
          <span className="text-gray-600">Google Ads 데이터 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️ Google Ads 연결 오류</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button
            onClick={fetchCampaignData}
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
          Google Ads 캠페인 KPI (현재 월)
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            isRealData 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isRealData ? '실제 데이터' : '모의 데이터'}
          </span>
          <button
            onClick={fetchCampaignData}
            className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors"
          >
            <i data-feather="refresh-cw" className="w-4 h-4"></i>
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {/* 데이터 출처 안내 */}
      {!isRealData && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div className="text-sm text-yellow-800">
              <strong>모의 데이터 표시 중</strong>
              <br />
              실제 Google Ads 데이터를 보려면 API 연결을 완료하세요. NA는 Not Available(현재 수집 불가)을 의미합니다.
              <br />
              기간: {apiResponse?.period}
            </div>
          </div>
        </div>
      )}

      {/* 전체 KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">총 노출수</p>
              <p className="text-2xl font-bold">{formatValue(totalImpressions)}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">총 클릭수</p>
              <p className="text-2xl font-bold">{formatValue(totalClicks)}</p>
            </div>
            <MousePointer className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">총 비용</p>
              <p className="text-2xl font-bold">{formatValue(totalCost, { prefix: '$' })}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">총 전환</p>
              <p className="text-2xl font-bold">{formatValue(totalConversions)}</p>
            </div>
            <Target className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* 성과 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">전체 CTR</p>
              <p className="text-xl font-bold text-gray-900">{isRealData ? `${overallCTR}%` : 'NA'}</p>
            </div>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">전체 CPC</p>
              <p className="text-xl font-bold text-gray-900">{isRealData ? `$${overallCPC}` : 'NA'}</p>
            </div>
            <DollarSign className="w-6 h-6 text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">전체 ROAS</p>
              <p className="text-xl font-bold text-gray-900">{isRealData ? `${overallROAS}x` : 'NA'}</p>
            </div>
            <TrendingUp className="w-6 h-6 text-purple-500" />
          </div>
        </div>
      </div>

      {/* 활성 캠페인 목록 */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900">현재 월 활성 캠페인</h4>
        {campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900">{campaign.name}</h5>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  campaign.status === 'ENABLED' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {campaign.status === 'ENABLED' ? '활성' : '일시정지'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">노출수</p>
                  <p className="font-semibold">{formatValue(campaign.impressions)}</p>
                </div>
                <div>
                  <p className="text-gray-600">클릭수</p>
                  <p className="font-semibold">{formatValue(campaign.clicks)}</p>
                </div>
                <div>
                  <p className="text-gray-600">비용</p>
                  <p className="font-semibold">{formatValue(campaign.cost, { prefix: '$' })}</p>
                </div>
                <div>
                  <p className="text-gray-600">CTR</p>
                  <p className="font-semibold">{isRealData ? `${campaign.ctr}%` : 'NA'}</p>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-500">
                {campaign.startDate} ~ {campaign.endDate}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            현재 월에 활성 캠페인이 없습니다.
          </div>
        )}
      </div>

      {/* 데이터 정보 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        마지막 업데이트: {apiResponse?.timestamp ? new Date(apiResponse.timestamp).toLocaleTimeString() : 'N/A'}
        {apiResponse?.period && (
          <>
            <br />
            데이터 기간: {apiResponse.period}
          </>
        )}
      </div>
    </div>
  );
}