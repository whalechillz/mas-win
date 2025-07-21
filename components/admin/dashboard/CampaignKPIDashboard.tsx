import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, Phone, FileText, Target, ChevronDown, Activity, RefreshCw } from 'lucide-react';

interface CampaignKPI {
  campaign_id: string;
  campaign_name?: string;
  views: number;
  unique_visitors: number;
  phone_clicks: number;
  form_submissions: number;
  quiz_completions: number;
  conversion_rate: number;
  status?: string;
  start_date?: string;
  end_date?: string;
}

interface CampaignInfo {
  campaign_id: string;
  campaign_name: string;
  status: string;
  start_date: string;
  end_date: string;
  target_views: number;
  target_conversions: number;
}

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, change, icon, color }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        {change !== undefined && (
          <p className={`text-sm mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

export const CampaignKPIDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignInfo[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [kpiData, setKpiData] = useState<CampaignKPI | null>(null);
  const [allKpiData, setAllKpiData] = useState<CampaignKPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 캠페인 목록 가져오기
  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  // KPI 데이터 가져오기
  const fetchKPIData = async (campaignId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/campaigns/kpi?campaign_id=${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        if (campaignId === 'all') {
          setAllKpiData(data);
          // 전체 합계 계산
          const totals = data.reduce((acc: CampaignKPI, curr: CampaignKPI) => ({
            campaign_id: 'all',
            campaign_name: '전체 캠페인',
            views: acc.views + curr.views,
            unique_visitors: acc.unique_visitors + curr.unique_visitors,
            phone_clicks: acc.phone_clicks + curr.phone_clicks,
            form_submissions: acc.form_submissions + curr.form_submissions,
            quiz_completions: acc.quiz_completions + curr.quiz_completions,
            conversion_rate: 0
          }), {
            campaign_id: 'all',
            views: 0,
            unique_visitors: 0,
            phone_clicks: 0,
            form_submissions: 0,
            quiz_completions: 0,
            conversion_rate: 0
          });
          
          // 평균 전환율 계산
          totals.conversion_rate = totals.views > 0 
            ? Number(((totals.form_submissions / totals.views) * 100).toFixed(2))
            : 0;
          
          setKpiData(totals);
        } else {
          setKpiData(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch KPI data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchKPIData('all');
  }, []);

  useEffect(() => {
    fetchKPIData(selectedCampaign);
  }, [selectedCampaign]);

  const getCurrentCampaign = () => {
    if (selectedCampaign === 'all') {
      return { campaign_name: '전체 캠페인', status: 'active' };
    }
    return campaigns.find(c => c.campaign_id === selectedCampaign) || { campaign_name: '선택된 캠페인', status: 'active' };
  };

  const currentCampaign = getCurrentCampaign();

  if (isLoading && !kpiData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 캠페인 선택 헤더 */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">캠페인별 성과</h2>
            
            {/* 캠페인 선택 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{currentCampaign.campaign_name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setSelectedCampaign('all');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 ${
                      selectedCampaign === 'all' ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-medium">전체 캠페인</div>
                    <div className="text-sm text-gray-500">모든 캠페인 통합 데이터</div>
                  </button>
                  
                  {campaigns.map(campaign => (
                    <button
                      key={campaign.campaign_id}
                      onClick={() => {
                        setSelectedCampaign(campaign.campaign_id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 border-t ${
                        selectedCampaign === campaign.campaign_id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{campaign.campaign_name}</p>
                          <p className="text-sm text-gray-500">{campaign.campaign_id}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                          campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {campaign.status === 'active' ? '진행중' :
                           campaign.status === 'scheduled' ? '예정' : '종료'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => fetchKPIData(selectedCampaign)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI 메트릭 카드 */}
      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="총 조회수"
            value={kpiData.views}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            color="bg-blue-100"
          />
          <MetricCard
            title="고유 방문자"
            value={kpiData.unique_visitors}
            icon={<Activity className="w-6 h-6 text-green-600" />}
            color="bg-green-100"
          />
          <MetricCard
            title="전화 클릭"
            value={kpiData.phone_clicks}
            icon={<Phone className="w-6 h-6 text-purple-600" />}
            color="bg-purple-100"
          />
          <MetricCard
            title="전환율"
            value={`${kpiData.conversion_rate}%`}
            icon={<Target className="w-6 h-6 text-orange-600" />}
            color="bg-orange-100"
          />
        </div>
      )}

      {/* 캠페인 비교 테이블 (전체 선택 시) */}
      {selectedCampaign === 'all' && allKpiData.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">캠페인별 상세 비교</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    캠페인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    조회수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    방문자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전화
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예약
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전환율
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allKpiData.map((data) => {
                  const campaign = campaigns.find(c => c.campaign_id === data.campaign_id);
                  return (
                    <tr key={data.campaign_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {campaign?.campaign_name || data.campaign_id}
                          </div>
                          <div className="text-sm text-gray-500">{data.campaign_id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.views.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.unique_visitors.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.phone_clicks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.form_submissions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          data.conversion_rate > 3 ? 'bg-green-100 text-green-800' :
                          data.conversion_rate > 1 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {data.conversion_rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignKPIDashboard;
