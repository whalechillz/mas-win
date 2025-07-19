'use client';

import React, { useState } from 'react';
import { Calendar, Target, Brain, Search, FileText, BarChart3 } from 'lucide-react';

// 간단한 탭 컴포넌트
const TabContent = ({ title, description }) => (
  <div className="p-8">
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    <p className="text-gray-600 mb-6">{description}</p>
    <div className="bg-gray-100 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
      <p className="text-gray-500">이 기능은 준비 중입니다.</p>
    </div>
  </div>
);

export default function MarketingDashboardFixed() {
  const [activeTab, setActiveTab] = useState('calendar');

  const tabs = [
    {
      id: 'calendar',
      label: '콘텐츠 캘린더',
      icon: Calendar,
      title: '콘텐츠 캘린더',
      description: '월별 콘텐츠 계획을 관리하고 일정을 조정합니다.'
    },
    {
      id: 'funnel',
      label: '마케팅 퍼널',
      icon: Target,
      title: '마케팅 퍼널 관리',
      description: '고객 여정의 각 단계를 분석하고 최적화합니다.'
    },
    {
      id: 'ai',
      label: 'AI 콘텐츠',
      icon: Brain,
      title: 'AI 콘텐츠 생성',
      description: 'AI를 활용하여 효과적인 마케팅 콘텐츠를 생성합니다.'
    },
    {
      id: 'seo',
      label: 'SEO 분석',
      icon: Search,
      title: 'SEO 검증 도구',
      description: '웹사이트의 SEO 상태를 점검하고 개선점을 찾습니다.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900">마케팅 대시보드</h1>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {tabs.map((tab) => (
            activeTab === tab.id && (
              <TabContent
                key={tab.id}
                title={tab.title}
                description={tab.description}
              />
            )
          ))}
        </div>
      </main>
    </div>
  );
}