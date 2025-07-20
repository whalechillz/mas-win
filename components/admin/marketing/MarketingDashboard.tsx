'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Target, Brain, Search, FileText, Upload, BarChart3, 
  Moon, Sun, Menu, X, ChevronRight, Settings, Sparkles, Workflow
} from 'lucide-react';
import BlogCalendar from './BlogCalendar';
import MarketingFunnelPlan from './MarketingFunnelPlan';
import AIGenerationSettingsNew from './AIGenerationSettingsNew';
import AIContentAssistant from './AIContentAssistant';
import NaverSEOValidator from './NaverSEOValidator';
import IntegratedMarketingHub from './integrated/IntegratedMarketingHub';

interface DashboardSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  visible: boolean;
}

export default function MarketingDashboard() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('integrated');
  const [sections, setSections] = useState<DashboardSection[]>([
    {
      id: 'integrated',
      title: '통합 마케팅 관리',
      icon: <Workflow className="w-5 h-5" />,
      component: <IntegratedMarketingHub />,
      visible: true
    },
    {
      id: 'calendar',
      title: '콘텐츠 캘린더',
      icon: <Calendar className="w-5 h-5" />,
      component: <BlogCalendar />,
      visible: true
    },
    {
      id: 'funnel',
      title: '마케팅 퍼널',
      icon: <Target className="w-5 h-5" />,
      component: <MarketingFunnelPlan />,
      visible: true
    },
    {
      id: 'ai',
      title: 'AI 콘텐츠 생성',
      icon: <Brain className="w-5 h-5" />,
      component: <AIGenerationSettingsNew />,
      visible: true
    },
    {
      id: 'seo',
      title: 'SEO 검증',
      icon: <Search className="w-5 h-5" />,
      component: <NaverSEOValidator />,
      visible: true
    }
  ]);

  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // 테마 설정
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // 파일 업로드 처리
  const handleFileDrop = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    // 파일 업로드 시뮬레이션
    setLoading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
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
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="ml-4 text-2xl font-bold text-gray-900 dark:text-white">
                마케팅 대시보드
              </h1>
              <Sparkles className="ml-2 w-6 h-6 text-yellow-500 animate-pulse" />
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAIAssistant(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                <Brain className="w-5 h-5" />
                AI 어시스턴트
              </button>
              
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
        {/* 사이드바 */}
        {sidebarOpen && (
          <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <nav className="p-4">
              {sections.filter(s => s.visible).map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
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
        )}

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* 파일 업로드 영역 */}
            <div 
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                  handleFileDrop(files);
                }
              }}
              className="mb-6 border-2 border-dashed rounded-lg p-6 border-gray-300 dark:border-gray-600"
            >
              <div className="text-center">
                <Upload className="mx-auto w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  파일을 드래그하여 업로드하거나 클릭하여 선택하세요
                </p>
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 text-sm text-gray-500">
                    {uploadedFiles.length}개 파일 업로드됨
                  </div>
                )}
              </div>
            </div>

            {loading && (
              <div className="mb-6">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 활성 섹션 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              {sections.find(s => s.id === activeSection)?.component}
            </div>
          </div>
        </main>
      </div>

      {/* AI 어시스턴트 팝업 */}
      {showAIAssistant && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAIAssistant(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl"
          >
            <AIContentAssistant />
          </div>
        </div>
      )}
    </div>
  );
}