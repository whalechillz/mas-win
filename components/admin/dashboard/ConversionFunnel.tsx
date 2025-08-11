import React from 'react';

interface FunnelData {
  stage: string;
  count: number;
  conversionRate: number;
}

export const ConversionFunnel: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">전환 퍼널</h2>
      <p className="text-gray-600">전환 퍼널 기능이 여기에 표시됩니다.</p>
    </div>
  );
};

export const useRealtimeFunnel = () => {
  return {
    funnelData: [] as FunnelData[]
  };
};
