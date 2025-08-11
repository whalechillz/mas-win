'use client';

import React, { useState, useEffect } from 'react';
// import { TrendingUp, TrendingDown, Users, Eye, Phone, Target } from 'lucide-react'; // 주석 처리

interface CampaignKPIDashboardProps {
  supabase: any;
}

export default function CampaignKPIDashboard({ supabase }: CampaignKPIDashboardProps) {
  const [selectedCampaign, setSelectedCampaign] = useState('2025-07');
  const [campaignData, setCampaignData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const campaigns = [
    { id: '2025-05', name: '2025년 05월 캠페인', period: '2025-05-01 ~ 2025-05-31' },
    { id: '2025-06', name: '2025년 06월 캠페인', period: '2025-06-01 ~ 2025-06-30' },
    { id: '2025-07', name: '2025년 07월 캠페인', period: '2025-07-01 ~ 2025-07-31' },
    { id: '2025-08', name: '2025년 08월 캠페인', period: '2025-08-01 ~ 2025-08-31' }
  ];

  useEffect(() => {
    loadCampaignData();
  }, [selectedCampaign]);

  const loadCampaignData = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('campaign_metrics')
        .select('*')
        .eq('campaign_id', selectedCampaign)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setCampaignData(data || {
        views: 0,
        unique_visitors: 0,
        phone_clicks: 0,
        form_submissions: 0,
        conversion_rate: 0
      });
    } catch (error) {
      console.error('Error loading campaign data:', error);
      setCampaignData({
        views: 0,
        unique_visitors: 0,
        phone_clicks: 0,
        form_submissions: 0,
        conversion_rate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getTrendValue = () => Math.floor(Math.random() * 20) - 10; // 임시 트렌드 값

  if (loading) {
    return <div className="p-6 text-center">로딩 중...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">캠페인별 KPI 대시보드</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">{campaigns.find(c => c.id === selectedCampaign)?.period}</span>
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            진행중
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">총 조회수</p>
              <p className="text-2xl font-bold">{campaignData.views.toLocaleString()}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-200" />
          </div>
          <div className="flex items-center mt-2">
            {getTrendIcon(getTrendValue())}
            <span className="text-sm ml-1">↑ 12%</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">고유 방문자</p>
              <p className="text-2xl font-bold">{campaignData.unique_visitors.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-green-200" />
          </div>
          <div className="flex items-center mt-2">
            {getTrendIcon(getTrendValue())}
            <span className="text-sm ml-1">↑ 8%</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">전화 클릭</p>
              <p className="text-2xl font-bold">{campaignData.phone_clicks.toLocaleString()}</p>
            </div>
            <Phone className="w-8 h-8 text-purple-200" />
          </div>
          <div className="flex items-center mt-2">
            {getTrendIcon(getTrendValue())}
            <span className="text-sm ml-1">↓ 5%</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">전환율</p>
              <p className="text-2xl font-bold">{campaignData.conversion_rate.toFixed(1)}%</p>
            </div>
            <Target className="w-8 h-8 text-orange-200" />
          </div>
          <div className="flex items-center mt-2">
            {getTrendIcon(getTrendValue())}
            <span className="text-sm ml-1">↑ 15%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">전환 퍼널</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">페이지 방문</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <span className="text-sm font-medium">{campaignData.views} (100%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">퀴즈 참여</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
                <span className="text-sm font-medium">0 (0.0%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">전화 문의</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
                <span className="text-sm font-medium">0 (0.0%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">예약 완료</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
                <span className="text-sm font-medium">0 (0.0%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">시간대별 활동</h3>
          <div className="h-48 flex items-end justify-between space-x-1">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div 
                  className="w-3 bg-blue-500 rounded-t"
                  style={{ 
                    height: `${Math.random() * 100}%`,
                    minHeight: '4px'
                  }}
                ></div>
                <span className="text-xs text-gray-500 mt-1">{i}시</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">조회수</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">클릭수</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
