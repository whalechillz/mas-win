import React from 'react';
import dynamic from 'next/dynamic';

// MarketingDashboardFixed를 동적으로 로드
const MarketingDashboard = dynamic(
  () => import('../components/admin/marketing/MarketingDashboardFixed'),
  {
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">마케팅 대시보드 로딩 중...</p>
        </div>
      </div>
    ),
    ssr: false
  }
);

export default function MarketingWorkingPage() {
  return <MarketingDashboard />;
}