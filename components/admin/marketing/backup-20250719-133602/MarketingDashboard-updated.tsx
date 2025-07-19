import React, { useState, useEffect } from 'react';
// 기존 import들...
import { IntegratedBlogManager } from './IntegratedBlogManager';

interface MarketingDashboardProps {
  supabase: any;
}

export const MarketingDashboard: React.FC<MarketingDashboardProps> = ({ supabase }) => {
  const [activeView, setActiveView] = useState<'integrated' | 'calendar' | 'funnel' | 'settings'>('integrated');
  // ... 기존 상태들

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 탭 네비게이션 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveView('integrated')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeView === 'integrated'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📝 통합 블로그 관리 (NEW)
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeView === 'calendar'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📅 캘린더 (기존)
            </button>
            {/* 기타 탭들... */}
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeView === 'integrated' && <IntegratedBlogManager supabase={supabase} />}
        {/* 기존 뷰들... */}
      </div>
    </div>
  );
};