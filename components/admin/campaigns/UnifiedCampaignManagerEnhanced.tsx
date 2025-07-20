import React, { useState, useEffect } from 'react';
import { Campaign, CampaignMetrics, calculateCampaignMetrics, updateCampaignStatus } from '../../../lib/campaign-types';
import { InsightGenerator } from '../dashboard/InsightGenerator';

// 아이콘 컴포넌트들
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

const Calendar = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DollarSign = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Lightning = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ExternalLink = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const ChartBar = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const Target = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11V9a3 3 0 016 0v2M9 11h6m-3-3v3m0 0v3m0 3v2m0-2h2m-2 0h-2m-1 7h8a2 2 0 002-2V11a2 2 0 00-2-2H8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const Activity = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

interface UnifiedCampaignManagerProps {
  campaigns: Campaign[];
  bookings: any[];
  contacts: any[];
  onCampaignUpdate?: (campaign: Campaign) => void;
  onCreateCampaign?: () => void;
}

export const UnifiedCampaignManagerEnhanced: React.FC<UnifiedCampaignManagerProps> = ({
  campaigns: initialCampaigns,
  bookings,
  contacts,
  onCampaignUpdate,
  onCreateCampaign
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // 캠페인 상태 업데이트
    const updatedCampaigns = updateCampaignStatus(initialCampaigns);
    setCampaigns(updatedCampaigns);
    
    // 메트릭스 계산
    const calculatedMetrics = calculateCampaignMetrics(updatedCampaigns);
    setMetrics(calculatedMetrics);
  }, [initialCampaigns]);

  // 전체 성과 계산 (7월 캠페인만)
  const activeCampaignsData = campaigns.filter(c => c.id !== '2025-05' && c.id !== '2025-06');
  const totalViews = activeCampaignsData.reduce((sum, c) => sum + c.metrics.views, 0);
  const totalBookings = activeCampaignsData.reduce((sum, c) => sum + c.metrics.bookings, 0);
  const totalInquiries = activeCampaignsData.reduce((sum, c) => sum + c.metrics.inquiries, 0);
  const avgConversionRate = activeCampaignsData.length > 0 
    ? activeCampaignsData.reduce((sum, c) => sum + c.metrics.conversionRate, 0) / activeCampaignsData.length 
    : 0;

  // 예상 매출 계산 (예약당 100만원 가정)
  const estimatedRevenue = totalBookings * 1000000;

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filterStatus === 'all') return true;
    return campaign.status === filterStatus;
  });

  const getStatusColor = (status: Campaign['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      ended: 'bg-gray-100 text-gray-800 border-gray-200',
      planned: 'bg-blue-100 text-blue-800 border-blue-200',
      draft: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[status];
  };

  const getStatusText = (status: Campaign['status']) => {
    const texts = {
      active: '진행중',
      ended: '종료',
      planned: '예정',
      draft: '초안'
    };
    return texts[status];
  };

  // ROI 계산
  const calculateROI = (campaign: Campaign) => {
    const revenue = campaign.metrics.bookings * 1000000;
    const cost = 500000; // 캠페인 비용 가정
    return ((revenue - cost) / cost * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* 캠페인 성과 대시보드 섹션 (기존 CampaignPerformanceDashboard 통합) */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">캠페인 성과 대시보드</h1>
            <p className="text-purple-100">7월 캠페인 중심으로 확인하는 실시간 성과</p>
          </div>
          <button
            onClick={onCreateCampaign}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-all"
          >
            <Lightning className="w-5 h-5" />
            <span>새 캠페인 만들기</span>
          </button>
        </div>

        {/* 주요 메트릭 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100 text-sm">총 조회수</span>
              <TrendingUp className="w-4 h-4 text-green-300" />
            </div>
            <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
            <p className="text-xs text-purple-200 mt-1">7월 캠페인</p>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100 text-sm">예약</span>
              <Calendar className="w-4 h-4 text-blue-300" />
            </div>
            <p className="text-2xl font-bold">{totalBookings}</p>
            <p className="text-xs text-purple-200 mt-1">목표 달성률 87%</p>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100 text-sm">문의</span>
              <Target className="w-4 h-4 text-yellow-300" />
            </div>
            <p className="text-2xl font-bold">{totalInquiries}</p>
            <p className="text-xs text-purple-200 mt-1">전환율 {avgConversionRate.toFixed(1)}%</p>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100 text-sm">평균 전환율</span>
              <Activity className="w-4 h-4 text-purple-300" />
            </div>
            <p className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</p>
            <p className="text-xs text-purple-200 mt-1">업계 평균 2.5%</p>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100 text-sm">예상 매출</span>
              <DollarSign className="w-4 h-4 text-green-300" />
            </div>
            <p className="text-2xl font-bold">₩{(estimatedRevenue / 10000).toLocaleString()}만</p>
            <p className="text-xs text-purple-200 mt-1">예약당 100만원</p>
          </div>
        </div>
      </div>

      {/* 캠페인별 상세 성과 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">캠페인별 상세 성과</h2>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">전체</option>
              <option value="active">진행중</option>
              <option value="ended">종료</option>
              <option value="planned">예정</option>
            </select>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                격자
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                목록
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedCampaign(campaign)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                    {getStatusText(campaign.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">조회수</span>
                    <span className="font-medium">{campaign.metrics.views.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">예약</span>
                    <span className="font-medium">{campaign.metrics.bookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">전환율</span>
                    <span className="font-medium">{campaign.metrics.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ROI</span>
                    <span className="font-medium text-green-600">+{calculateROI(campaign)}%</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {new Date(campaign.period.start).toLocaleDateString('ko-KR')} - 
                      {new Date(campaign.period.end).toLocaleDateString('ko-KR')}
                    </span>
                    <a
                      href={campaign.files.landingPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    캠페인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    조회수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예약
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전환율
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기간
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCampaign(campaign)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                        {getStatusText(campaign.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.metrics.views.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.metrics.bookings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.metrics.conversionRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      +{calculateROI(campaign)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(campaign.period.start).toLocaleDateString('ko-KR')} - 
                      {new Date(campaign.period.end).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI 캠페인 인사이트 */}
      <InsightGenerator
        campaigns={campaigns}
        bookings={bookings}
        contacts={contacts}
      />

      {/* 캠페인 상세 모달 */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{selectedCampaign.name}</h3>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">총 조회수</p>
                  <p className="text-2xl font-bold">{selectedCampaign.metrics.views.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">예약 수</p>
                  <p className="text-2xl font-bold">{selectedCampaign.metrics.bookings}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">문의 수</p>
                  <p className="text-2xl font-bold">{selectedCampaign.metrics.inquiries}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">전환율</p>
                  <p className="text-2xl font-bold">{selectedCampaign.metrics.conversionRate}%</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">캠페인 링크</h4>
                <div className="space-y-2">
                  <a
                    href={selectedCampaign.files.landingPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    랜딩 페이지 보기
                  </a>
                  {selectedCampaign.files.opManual && (
                    <a
                      href={selectedCampaign.files.opManual}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      OP 매뉴얼 보기
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
