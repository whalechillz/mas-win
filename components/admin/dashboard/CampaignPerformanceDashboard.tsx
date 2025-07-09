import React from 'react';
import { Campaign } from '../../../lib/campaign-types';
import { InsightGenerator } from './InsightGenerator';

interface CampaignDashboardProps {
  campaigns: Campaign[];
  bookings: any[];
  contacts: any[];
}

const TrendingUp = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendingDown = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const Target = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11V9a3 3 0 016 0v2M9 11h6m-3-3v3m0 0v3m0 3v2m0-2h2m-2 0h-2m-1 7h8a2 2 0 002-2V11a2 2 0 00-2-2H8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const DollarSign = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export function CampaignPerformanceDashboard({ campaigns, bookings, contacts }: CampaignDashboardProps) {
  // 활성 캠페인 필터링
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const recentCampaigns = campaigns.slice(0, 5);

  // 전체 성과 계산
  const totalViews = campaigns.reduce((sum, c) => sum + c.metrics.views, 0);
  const totalBookings = campaigns.reduce((sum, c) => sum + c.metrics.bookings, 0);
  const totalInquiries = campaigns.reduce((sum, c) => sum + c.metrics.inquiries, 0);
  const avgConversionRate = campaigns.length > 0 
    ? campaigns.reduce((sum, c) => sum + c.metrics.conversionRate, 0) / campaigns.length 
    : 0;

  // ROI 계산
  const calculateROI = (campaign: Campaign) => {
    const revenue = campaign.metrics.bookings * 1000000; // 예약당 100만원
    const cost = campaign.metrics.costPerAcquisition * campaign.metrics.bookings;
    return cost > 0 ? ((revenue - cost) / cost * 100).toFixed(1) : '0';
  };

  return (
    <div className="space-y-6">
      {/* 전체 성과 요약 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-6">캠페인 성과 대시보드</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100">총 조회수</span>
              <TrendingUp className="w-5 h-5 text-green-300" />
            </div>
            <p className="text-3xl font-bold">{totalViews.toLocaleString()}</p>
            <p className="text-sm text-purple-100 mt-1">+23.5% 전월 대비</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100">총 예약</span>
              <Target className="w-5 h-5 text-yellow-300" />
            </div>
            <p className="text-3xl font-bold">{totalBookings.toLocaleString()}</p>
            <p className="text-sm text-purple-100 mt-1">목표 달성률 87%</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100">평균 전환율</span>
              <TrendingUp className="w-5 h-5 text-green-300" />
            </div>
            <p className="text-3xl font-bold">{avgConversionRate.toFixed(1)}%</p>
            <p className="text-sm text-purple-100 mt-1">업계 평균 2.5%</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100">예상 매출</span>
              <DollarSign className="w-5 h-5 text-green-300" />
            </div>
            <p className="text-3xl font-bold">{(totalBookings * 1).toFixed(0)}억</p>
            <p className="text-sm text-purple-100 mt-1">예약당 100만원</p>
          </div>
        </div>
      </div>

      {/* 캠페인별 성과 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">캠페인별 상세 성과</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">캠페인</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">조회수</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">예약</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">문의</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">전환율</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROI</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-sm text-gray-500">
                        {campaign.period.start} ~ {campaign.period.end}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      campaign.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : campaign.status === 'ended'
                        ? 'bg-gray-100 text-gray-800'
                        : campaign.status === 'planned'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {campaign.status === 'active' ? '진행중' 
                        : campaign.status === 'ended' ? '종료'
                        : campaign.status === 'planned' ? '예정'
                        : '초안'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {campaign.metrics.views.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {campaign.metrics.bookings}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {campaign.metrics.inquiries}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-medium">{campaign.metrics.conversionRate}%</span>
                      {campaign.metrics.conversionRate > avgConversionRate ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium text-green-600">
                      +{calculateROI(campaign)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ₩{campaign.metrics.costPerAcquisition.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 실시간 활동 & 인사이트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 활동 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">최근 캠페인 활동</h3>
          <div className="space-y-3">
            {recentCampaigns.map((campaign, index) => (
              <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    campaign.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-500">
                      {campaign.metrics.bookings}건 예약 | {campaign.metrics.views} 조회
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-purple-600">
                  {campaign.metrics.conversionRate}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI 인사이트 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">AI 캠페인 인사이트 💡</h3>
          <InsightGenerator 
            campaigns={campaigns}
            bookings={bookings}
            contacts={contacts}
          />
        </div>
      </div>
    </div>
  );
}
