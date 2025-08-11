import React from 'react';

interface Metrics {
  views: number;
  uniqueVisitors: number;
  phoneClicks: number;
  conversionRate: number;
}

export const MetricCards: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">메트릭 카드</h2>
      <p className="text-gray-600">메트릭 카드 기능이 여기에 표시됩니다.</p>
    </div>
  );
};

export const useRealtimeMetrics = () => {
  return {
    metrics: {
      views: 0,
      uniqueVisitors: 0,
      phoneClicks: 0,
      conversionRate: 0
    } as Metrics
  };
};
