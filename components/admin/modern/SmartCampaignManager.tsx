import React, { useState, useEffect } from 'react';

interface SmartCampaignManagerProps {
  theme: string;
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  setLoading: (loading: boolean) => void;
}

const SmartCampaignManager: React.FC<SmartCampaignManagerProps> = ({
  theme,
  notifications,
  setNotifications,
  setLoading
}) => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      // 실제 API 호출로 대체
      const mockCampaigns = [
        {
          id: 1,
          name: 'MASGOLF 현재 월 캠페인',
          status: 'active',
          budget: 5000000,
          spent: 2345670,
          impressions: 15420,
          clicks: 892,
          conversions: 45,
          ctr: 5.79,
          cpc: 2629,
          roas: 3.2
        },
        {
          id: 2,
          name: '골프 클럽 특가 캠페인',
          status: 'active',
          budget: 3000000,
          spent: 1890450,
          impressions: 8920,
          clicks: 567,
          conversions: 23,
          ctr: 6.36,
          cpc: 3334,
          roas: 2.8
        }
      ];
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('캠페인 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            스마트 캠페인 관리
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            캠페인 성과 분석 및 최적화
          </p>
        </div>
        <button
          onClick={fetchCampaigns}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* 캠페인 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            활성 캠페인
          </h3>
          <div className="space-y-4">
            {campaigns.map((campaign: any) => (
              <div
                key={campaign.id}
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => setSelectedCampaign(campaign)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {campaign.name}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">CTR:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {campaign.ctr}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">ROAS:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {campaign.roas}x
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 캠페인 성과 요약 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            전체 성과 요약
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {campaigns.reduce((sum, c) => sum + c.impressions, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">총 노출수</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {campaigns.reduce((sum, c) => sum + c.clicks, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">총 클릭수</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {campaigns.reduce((sum, c) => sum + c.conversions, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">총 전환</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  ₩{(campaigns.reduce((sum, c) => sum + c.spent, 0) / 10000).toFixed(0)}만
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">총 비용</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 선택된 캠페인 상세 정보 */}
      {selectedCampaign && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            캠페인 상세 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">기본 정보</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">이름:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCampaign.name}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">상태:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCampaign.status}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">예산:</span>
                  <p className="font-medium text-gray-900 dark:text-white">₩{(selectedCampaign.budget / 10000).toFixed(0)}만</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">성과 지표</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">CTR:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCampaign.ctr}%</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">CPC:</span>
                  <p className="font-medium text-gray-900 dark:text-white">₩{selectedCampaign.cpc.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">ROAS:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCampaign.roas}x</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">수치</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">노출수:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCampaign.impressions.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">클릭수:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCampaign.clicks.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">전환:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCampaign.conversions}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartCampaignManager;
