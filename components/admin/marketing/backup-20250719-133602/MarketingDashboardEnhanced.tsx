'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Target, Brain, Search, FileText, Upload, BarChart3, 
  Moon, Sun, Menu, X, ChevronRight, Settings, Sparkles
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  FadeIn, SlideIn, ScaleIn, HoverScale, StaggerContainer, 
  StaggerItem, LoadingSpinner, ProgressBar 
} from './AnimationComponents';
import { DraggableList, DropZone, KanbanBoard } from './DragDropComponents';
import { useTheme } from './ThemeProvider';
import BlogCalendarFixed from './BlogCalendarFixed';
import MarketingFunnelPlanFixed from './MarketingFunnelPlanFixed';
import AIGenerationSettingsNew from './AIGenerationSettingsNew';
import AIContentAssistant from './AIContentAssistant';
import NaverSEOValidator from './NaverSEOValidator';

interface DashboardSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  visible: boolean;
}

export default function MarketingDashboardEnhanced() {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('calendar');
  const [sections, setSections] = useState<DashboardSection[]>([
    {
      id: 'calendar',
      title: '콘텐츠 캘린더',
      icon: <Calendar className="w-5 h-5" />,
      component: <BlogCalendarFixed />,
      visible: true
    },
    {
      id: 'funnel',
      title: '마케팅 퍼널',
      icon: <Target className="w-5 h-5" />,
      component: <MarketingFunnelPlanFixed />,
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

  // 섹션 순서 변경
  const handleSectionReorder = (newSections: DashboardSection[]) => {
    setSections(newSections);
  };

  // 칸반 보드 데이터
  const [kanbanColumns, setKanbanColumns] = useState([
    {
      id: 'ideas',
      title: '아이디어',
      items: [
        { id: '1', content: '봄 시즌 골프 팁' },
        { id: '2', content: '초보자를 위한 그립 가이드' }
      ]
    },
    {
      id: 'writing',
      title: '작성 중',
      items: [
        { id: '3', content: '드라이버 비거리 늘리기' }
      ]
    },
    {
      id: 'review',
      title: '검토',
      items: [
        { id: '4', content: '퍼팅 정확도 향상법' }
      ]
    },
    {
      id: 'published',
      title: '게시됨',
      items: [
        { id: '5', content: '겨울철 골프 준비사항' }
      ]
    }
  ]);

  const handleItemMove = (itemId: string, fromColumn: string, toColumn: string) => {
    setKanbanColumns(prev => {
      const newColumns = [...prev];
      const fromCol = newColumns.find(col => col.id === fromColumn);
      const toCol = newColumns.find(col => col.id === toColumn);
      
      if (fromCol && toCol) {
        const item = fromCol.items.find(i => i.id === itemId);
        if (item) {
          fromCol.items = fromCol.items.filter(i => i.id !== itemId);
          toCol.items = [...toCol.items, item];
        }
      }
      
      return newColumns;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* 헤더 */}
      <motion.header 
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
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
              <HoverScale>
                <button
                  onClick={() => setShowAIAssistant(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                >
                  <Brain className="w-5 h-5" />
                  AI 어시스턴트
                </button>
              </HoverScale>
              
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
      </motion.header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* 사이드바 */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
            >
              <nav className="p-4">
                <StaggerContainer>
                  {sections.filter(s => s.visible).map((section, index) => (
                    <StaggerItem key={section.id}>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
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
                    </StaggerItem>
                  ))}
                </StaggerContainer>

                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="px-4 text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                    섹션 관리
                  </h3>
                  <DraggableList
                    items={sections.map(s => ({
                      id: s.id,
                      content: (
                        <div className="flex items-center gap-3">
                          {s.icon}
                          <span className="text-sm">{s.title}</span>
                          <input
                            type="checkbox"
                            checked={s.visible}
                            onChange={(e) => {
                              setSections(prev => prev.map(sec => 
                                sec.id === s.id ? { ...sec, visible: e.target.checked } : sec
                              ));
                            }}
                            className="ml-auto"
                          />
                        </div>
                      )
                    }))}
                    onReorder={(items) => {
                      const newOrder = items.map(item => 
                        sections.find(s => s.id === item.id)!
                      );
                      setSections(newOrder);
                    }}
                  />
                </div>
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* 파일 업로드 영역 */}
            <FadeIn>
              <DropZone 
                onDrop={handleFileDrop}
                className="mb-6"
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
              </DropZone>
            </FadeIn>

            {loading && (
              <div className="mb-6">
                <ProgressBar progress={progress} />
              </div>
            )}

            {/* 칸반 보드 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                콘텐츠 워크플로우
              </h2>
              <ScaleIn>
                <KanbanBoard 
                  columns={kanbanColumns}
                  onItemMove={handleItemMove}
                />
              </ScaleIn>
            </div>

            {/* 활성 섹션 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {sections.find(s => s.id === activeSection)?.component}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* AI 어시스턴트 팝업 */}
      <AnimatePresence>
        {showAIAssistant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowAIAssistant(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl"
            >
              <AIContentAssistant />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}