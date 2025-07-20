'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Target, Brain, Search, FileText, Upload, BarChart3, 
  Moon, Sun, Menu, X, ChevronRight, Settings, Sparkles, Layers
} from 'lucide-react';
import BlogCalendarSimple from './BlogCalendarSimple';
import MarketingFunnelPlanSimple from './MarketingFunnelPlanSimple';
import AIGenerationSettingsSimple from './AIGenerationSettingsSimple';
import NaverSEOValidatorSimple from './NaverSEOValidatorSimple';
// 동적 import로 IntegratedMarketingHub 로드
import dynamic from 'next/dynamic';

const IntegratedMarketingHub = dynamic(
  () => import('./integrated/IntegratedMarketingHub'),
  { 
    ssr: false,
    loading: () => <div className="p-8 text-center">통합 마케팅 관리 로딩 중...</div>
  }
);

interface DashboardSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export default function MarketingDashboardComplete() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('calendar');
  const [sections] = useState<DashboardSection[]>([
    {
      id: 'calendar',
      title: '콘텐츠 캘린더',
      icon: <Calendar className="w-5 h-5" />,
      component: <BlogCalendarSimple />
    },
    {
      id: 'funnel',
      title: '마케팅 퍼널',
      icon: <Target className="w-5 h-5" />,
      component: <MarketingFunnelPlanSimple />
    },
    {
      id: 'ai',
      title: 'AI 콘텐츠 생성',
      icon: <Brain className="w-5 h-5" />,
      component: <AIGenerationSettingsSimple />
    },
    {
      id: 'seo',
      title: 'SEO 검증',
      icon: <Search className="w-5 h-5" />,
      component: <NaverSEOValidatorSimple />
    },
    {
      id: 'integrated',
      title: '통합 마케팅 관리',
      icon: <Layers className="w-5 h-5" />,
      component: <IntegratedMarketingHub />
    }
  ]);

  // 테마 설정
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="ml-4 text-2xl font-bold text-gray-900 dark:text-white">
                마케팅 대시보드
              </h1>
              <Sparkles className="ml-2 w-6 h-6 text-yellow-500" />
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {theme === 'light' ? 
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : 
                  <Sun className="w-5 h-5 text-yellow-500" />
                }
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* 사이드바 - 데스크톱에서는 항상 표시, 모바일에서는 토글 */}
        <aside className={`${
          sidebarOpen ? 'block' : 'hidden'
        } lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}>
          <nav className="p-4">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  // 모바일에서는 섹션 선택 후 사이드바 닫기
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-2 ${
                  activeSection === section.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {section.icon}
                <span className="font-medium">{section.title}</span>
                <ChevronRight className={`ml-auto w-4 h-4 transition-transform ${
                  activeSection === section.id ? 'rotate-90' : ''
                }`} />
              </button>
            ))}
          </nav>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* 활성 섹션 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              {sections.find(s => s.id === activeSection)?.component}
            </div>

            {/* 하단 정보 */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 이 대시보드는 마케팅 콘텐츠 관리를 위한 통합 플랫폼입니다.
                각 섹션을 활용하여 효율적인 마케팅 전략을 수립하세요.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}