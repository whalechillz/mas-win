'use client';

import React, { useState, useEffect } from 'react';
// import { Workflow, Calendar, Brain, Search, Target, BarChart3, Users, TrendingUp } from 'lucide-react'; // 주석 처리
import { AIGenerationSettingsNew } from './AIGenerationSettingsNew';
import { AIContentAssistant } from './AIContentAssistant';

interface MarketingDashboardProps {
  supabase?: any;
}

export default function MarketingDashboardComplete({ supabase }: MarketingDashboardProps) {
  const [activeSection, setActiveSection] = useState('workflow');
  const [aiSettings, setAiSettings] = useState({
    useAI: false,
    model: 'gpt-4',
    settings: {
      contentModel: 'creative',
      usePerplexity: true,
      useClaude: false,
      useFalAI: true
    }
  });

  const sections = [
    {
      id: 'workflow',
      title: '통합 마케팅 관리',
      icon: <i data-feather="workflow" className="w-5 h-5"> />,
      component: <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">마케팅 워크플로우</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-medium mb-2">네이버 SEO 최적화</h4>
            <p className="text-sm text-gray-600">AI 기반 SEO 최적화 워크플로우</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-medium mb-2">Perplexity 트렌드 분석</h4>
            <p className="text-sm text-gray-600">실시간 트렌드 분석 및 키워드 추천</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-medium mb-2">Claude Opus 4 생성</h4>
            <p className="text-sm text-gray-600">고품질 콘텐츠 자동 생성</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-medium mb-2">Fal.ai 이미지 생성</h4>
            <p className="text-sm text-gray-600">AI 기반 이미지 자동 생성</p>
          </div>
        </div>
      </div>
    },
    {
      id: 'calendar',
      title: '콘텐츠 캘린더',
      icon: <Calendar className="w-5 h-5"> />,
      component: <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">콘텐츠 캘린더</h3>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">월별 콘텐츠 계획 및 발행 일정 관리</p>
        </div>
      </div>
    },
    {
      id: 'ai',
      title: 'AI 콘텐츠 생성',
      icon: <i data-feather="brain" className="w-5 h-5"> />,
      component: <AIGenerationSettingsNew />
    },
    {
      id: 'seo',
      title: 'SEO 검증',
      icon: <i data-feather="search" className="w-5 h-5"> />,
      component: <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">SEO 검증 시스템</h3>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">콘텐츠 SEO 점수 자동 검증 및 개선 제안</p>
        </div>
      </div>
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">마케팅 콘텐츠 관리</h1>
          <p className="mt-2 text-gray-600">AI 기반 마케팅 콘텐츠 생성 및 관리</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeSection === section.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {section.icon}
                  <span>{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {sections.find(section => section.id === activeSection)?.component}
          </div>
        </div>
      </div>
    </div>
  );
}
