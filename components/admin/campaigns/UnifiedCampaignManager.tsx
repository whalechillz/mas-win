import React, { useState, useEffect } from 'react';
import { Campaign, CampaignMetrics, calculateCampaignMetrics, updateCampaignStatus } from '../../../lib/campaign-types';

// 아이콘 컴포넌트들
const TrendingUp = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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

interface UnifiedCampaignManagerProps {
  campaigns: Campaign[];
  onCampaignUpdate?: (campaign: Campaign) => void;
  onCreateCampaign?: () => void;
}

export const UnifiedCampaignManager: React.FC<UnifiedCampaignManagerProps> = ({
  campaigns: initialCampaigns,
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

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">캠페인 통합 관리</h1>
            <p className="text-purple-100">모든 캠페인을 한눈에 관리하고 성과를 추적하세요</p>
          </div>
          <button
            onClick={onCreateCampaign}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-all transform hover:scale-105"
          >
            + 새 캠페인 만들기
          </button>
        </div>

        {/* 핵심 메트릭스 */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">전체 캠페인</p>
                  <p className="text-2xl font-bold">{metrics.totalCampaigns}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-200" />
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">활성 캠페인</p>
                  <p className="text-2xl font-bold">{metrics.activeCampaigns}</p>
                </div>
                <Lightning className="w-8 h-8 text-yellow-300" />
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">총 예약</p>
                  <p className="text-2xl font-bold">{metrics.totalBookings.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-300" />
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">평균 전환율</p>
                  <p className="text-2xl font-bold">{metrics.averageConversionRate.toFixed(1)}%</p>
                </div>
                <ChartBar className="w-8 h-8 text-blue-300" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 필터 및 뷰 옵션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'active' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              진행중
            </button>
            <button
              onClick={() => setFilterStatus('planned')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'planned' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              예정
            </button>
            <button
              onClick={() => setFilterStatus('ended')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'ended' 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              종료
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 캠페인 그리드 */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1"
              onClick={() => setSelectedCampaign(campaign)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {campaign.period.start} ~ {campaign.period.end}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(campaign.status)}`}>
                    {getStatusText(campaign.status)}
                  </span>
                </div>

                {/* 성과 지표 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">예약</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {campaign.id === '2025-05' || campaign.id === '2025-06' ? '-' : campaign.metrics.bookings}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">문의</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {campaign.id === '2025-05' || campaign.id === '2025-06' ? '-' : campaign.metrics.inquiries}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">조회수</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {campaign.id === '2025-05' || campaign.id === '2025-06' ? '-' : campaign.metrics.views.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">전환율</p>
                    <p className="text-xl font-semibold text-purple-600">
                      {campaign.id === '2025-05' || campaign.id === '2025-06' ? '-' : `${campaign.metrics.conversionRate.toFixed(1)}%`}
                    </p>
                  </div>
                </div>

                {/* 빠른 작업 */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <a
                    href={campaign.files?.landingPageUrl || campaign.assets?.landingPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm font-medium">페이지 보기</span>
                  </a>
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // 성과 분석 모달 열기
                    }}
                  >
                    <ChartBar className="w-4 h-4" />
                    <span className="text-sm font-medium">분석</span>
                  </button>
                </div>
              </div>

              {/* 하단 자산 상태 */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {campaign.files?.opManual ? (
                      <a
                        href={campaign.files.opManual}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h2a1 1 0 100-2 2 2 0 00-2 2v11a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H6z" clipRule="evenodd" />
                        </svg>
                        OP 메뉴얼
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h2a1 1 0 100-2 2 2 0 00-2 2v11a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H6z" clipRule="evenodd" />
                        </svg>
                        OP 메뉴얼
                      </span>
                    )}
                    {campaign.files?.googleAds ? (
                      <a
                        href={campaign.files.googleAds}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Google Ads
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Google Ads
                      </span>
                    )}
                  </div>
                  {campaign.settings.remainingSlots > 0 && campaign.status === 'active' && (
                    <span className="text-orange-600 font-medium">
                      {campaign.settings.remainingSlots}명 남음
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 캠페인 리스트 뷰 */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">캠페인</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성과</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전환율</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                    <div className="text-sm text-gray-500">{campaign.settings.targetAudience}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {campaign.period.start} ~ {campaign.period.end}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                      {getStatusText(campaign.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {campaign.id === '2025-05' || campaign.id === '2025-06' ? (
                      <span>데이터 없음</span>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span>예약: {campaign.metrics.bookings}</span>
                        <span>문의: {campaign.metrics.inquiries}</span>
                        <span>조회: {campaign.metrics.views.toLocaleString()}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-purple-600">
                    {campaign.id === '2025-05' || campaign.id === '2025-06' ? '-' : `${campaign.metrics.conversionRate.toFixed(1)}%`}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={campaign.assets.landingPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-900"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button className="text-gray-600 hover:text-gray-900">
                        <ChartBar className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UnifiedCampaignManager;
