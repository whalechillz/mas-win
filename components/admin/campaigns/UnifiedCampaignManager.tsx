import React from 'react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  metrics: {
    views: number;
    phoneClicks: number;
    conversionRate: number;
  };
}

interface UnifiedCampaignManagerProps {
  campaigns: Campaign[];
  onCampaignUpdate: (campaign: Campaign) => void;
  onCreateCampaign: () => void;
}

export const UnifiedCampaignManager: React.FC<UnifiedCampaignManagerProps> = ({ 
  campaigns, 
  onCampaignUpdate, 
  onCreateCampaign 
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">통합 캠페인 관리</h2>
      <p className="text-gray-600">캠페인 관리 기능이 여기에 표시됩니다.</p>
    </div>
  );
};
