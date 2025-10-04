// Updated Content Calendar Admin Page with Campaign Manager
// /pages/admin/content-calendar.tsx

import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { 
  ContentCalendarItem,
  ContentType,
  ContentStatus,
  FilterParams,
  PaginationParams 
} from '@/types';
import ContentGenerator from '@/components/admin/content-calendar/ContentGenerator';
import ContentCalendarDashboard from '@/components/admin/content-calendar/ContentCalendarDashboard';
import ContentList from '@/components/admin/content-calendar/ContentList';
import ContentEditor from '@/components/admin/content-calendar/ContentEditor';
import PerformanceAnalytics from '@/components/admin/content-calendar/PerformanceAnalytics';
import CampaignManager from '@/components/admin/content-calendar/CampaignManager';
import BlogIntegrationBridge from '@/components/admin/content-calendar/BlogIntegrationBridge';
import AnnualScheduler from '@/components/admin/content-calendar/AnnualScheduler';
import KillerContentManager from '@/components/admin/content-calendar/KillerContentManager';
import MessageMarketingManager from '@/components/admin/content-calendar/MessageMarketingManager';

interface ContentCalendarPageProps {
  initialContent: ContentCalendarItem[];
  totalCount: number;
}

const ContentCalendarPage: React.FC<ContentCalendarPageProps> = ({
  initialContent,
  totalCount
}) => {
  // =====================================================
  // State Management
  // =====================================================
  const [activeTab, setActiveTab] = useState<
    'calendar' | 'list' | 'generator' | 'campaigns' | 'killer' | 'messages' | 'annual' | 'integration' | 'analytics'
  >('calendar');
  const [contents, setContents] = useState<ContentCalendarItem[]>(initialContent);
  const [selectedContent, setSelectedContent] = useState<ContentCalendarItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({});
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 20,
    sortBy: 'contentDate',
    sortOrder: 'desc'
  });
  const [isLoading, setIsLoading] = useState(false);

  // =====================================================
  // Data Fetching
  // =====================================================
  const fetchContents = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: pagination.sortBy || 'contentDate',
        sortOrder: pagination.sortOrder || 'desc',
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, JSON.stringify(value)])
        )
      });

      const response = await fetch(`/api/content-calendar?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setContents(data.data);
      }
    } catch (error) {
      console.error('콘텐츠 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [filters, pagination]);

  // =====================================================
  // Event Handlers
  // =====================================================
  const handleContentGenerated = (newContents: ContentCalendarItem[]) => {
    setContents(prev => [...newContents, ...prev]);
    setActiveTab('list');
  };

  const handleCampaignActivate = (campaignContents: ContentCalendarItem[]) => {
    setContents(prev => [...campaignContents, ...prev]);
    setActiveTab('calendar');
  };

  const handleContentImport = (importedContent: ContentCalendarItem) => {
    setContents(prev => [importedContent, ...prev]);
  };

  const handleContentEdit = (content: ContentCalendarItem) => {
    setSelectedContent(content);
    setIsEditorOpen(true);
  };

  const handleContentSave = async (content: ContentCalendarItem) => {
    try {
      const response = await fetch('/api/content-calendar', {
        method: content.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(content)
      });

      if (response.ok) {
        const savedContent = await response.json();
        
        if (content.id) {
          setContents(prev => prev.map(c => c.id === content.id ? savedContent.data : c));
        } else {
          setContents(prev => [savedContent.data, ...prev]);
        }
        
        setIsEditorOpen(false);
        setSelectedContent(null);
      }
    } catch (error) {
      console.error('콘텐츠 저장 실패:', error);
    }
  };

  const handleContentDelete = async (contentId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/content-calendar/${contentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setContents(prev => prev.filter(c => c.id !== contentId));
      }
    } catch (error) {
      console.error('콘텐츠 삭제 실패:', error);
    }
  };

  const handlePublish = async (content: ContentCalendarItem) => {
    try {
      const response = await fetch('/api/content-calendar/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contentId: content.id })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`발행 완료: ${result.publishedChannels.join(', ')}`);
        fetchContents();
      }
    } catch (error) {
      console.error('발행 실패:', error);
    }
  };

  // =====================================================
  // Render
  // =====================================================
  return (
    <>
      <Head>
        <title>콘텐츠 캘린더 | MASGOLF Admin</title>
        <meta name="description" content="MASGOLF 콘텐츠 캘린더 관리 시스템" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  콘텐츠 캘린더
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  MASGOLF 콘텐츠 관리 및 자동화 시스템
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  총 {contents.length}개 콘텐츠
                </span>
                <button
                  onClick={() => setIsEditorOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + 새 콘텐츠
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <TabButton
                active={activeTab === 'calendar'}
                onClick={() => setActiveTab('calendar')}
                icon="📅"
                label="캘린더"
              />
              <TabButton
                active={activeTab === 'list'}
                onClick={() => setActiveTab('list')}
                icon="📝"
                label="콘텐츠 목록"
                badge={contents.length}
              />
              <TabButton
                active={activeTab === 'generator'}
                onClick={() => setActiveTab('generator')}
                icon="🤖"
                label="AI 생성"
              />
              <TabButton
                active={activeTab === 'campaigns'}
                onClick={() => setActiveTab('campaigns')}
                icon="🎯"
                label="캠페인 관리"
                isNew={true}
              />
              <TabButton
                active={activeTab === 'killer'}
                onClick={() => setActiveTab('killer')}
                icon="💥"
                label="킬러 콘텐츠"
                isNew={true}
              />
              <TabButton
                active={activeTab === 'messages'}
                onClick={() => setActiveTab('messages')}
                icon="📱"
                label="메시지 마케팅"
                isNew={true}
              />
              <TabButton
                active={activeTab === 'annual'}
                onClick={() => setActiveTab('annual')}
                icon="📅"
                label="연간 일정"
                isNew={true}
              />
              <TabButton
                active={activeTab === 'integration'}
                onClick={() => setActiveTab('integration')}
                icon="🔄"
                label="블로그 연동"
              />
              <TabButton
                active={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}
                icon="📊"
                label="성과 분석"
              />
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Calendar View */}
          {activeTab === 'calendar' && !isLoading && (
            <ContentCalendarDashboard
              contents={contents}
              onContentClick={handleContentEdit}
              onDateClick={(date) => {
                setSelectedContent({
                  contentDate: date,
                  contentType: 'blog',
                  status: 'planned'
                } as ContentCalendarItem);
                setIsEditorOpen(true);
              }}
            />
          )}

          {/* List View */}
          {activeTab === 'list' && !isLoading && (
            <ContentList
              contents={contents}
              filters={filters}
              onFiltersChange={setFilters}
              pagination={pagination}
              onPaginationChange={setPagination}
              onEdit={handleContentEdit}
              onDelete={handleContentDelete}
              onPublish={handlePublish}
            />
          )}

          {/* Generator View */}
          {activeTab === 'generator' && (
            <ContentGenerator
              onContentGenerated={handleContentGenerated}
              defaultMonth={new Date().getMonth() + 1}
              defaultYear={new Date().getFullYear()}
            />
          )}

          {/* Campaign Manager View */}
          {activeTab === 'campaigns' && (
            <CampaignManager
              onCampaignActivate={handleCampaignActivate}
            />
          )}

          {/* Killer Content Manager View */}
          {activeTab === 'killer' && (
            <KillerContentManager
              onContentGenerate={handleContentGenerated}
              onLeadCapture={(lead) => {
                console.log('Lead captured:', lead);
                // 리드 처리 로직
              }}
            />
          )}

          {/* Message Marketing Manager View */}
          {activeTab === 'messages' && (
            <MessageMarketingManager
              onMessageSend={(message) => {
                console.log('Message sent:', message);
                // 메시지 발송 처리
              }}
              onScheduleCreate={(schedule) => {
                console.log('Schedule created:', schedule);
                // 스케줄 처리
              }}
            />
          )}

          {/* Annual Scheduler View */}
          {activeTab === 'annual' && (
            <AnnualScheduler
              onScheduleGenerate={(schedule) => {
                console.log('Annual schedule generated:', schedule);
                fetchContents();
              }}
            />
          )}

          {/* Integration View */}
          {activeTab === 'integration' && (
            <BlogIntegrationBridge
              onImport={handleContentImport}
            />
          )}

          {/* Analytics View */}
          {activeTab === 'analytics' && (
            <PerformanceAnalytics
              contents={contents}
            />
          )}
        </main>

        {/* Content Editor Modal */}
        {isEditorOpen && (
          <ContentEditor
            content={selectedContent}
            onSave={handleContentSave}
            onClose={() => {
              setIsEditorOpen(false);
              setSelectedContent(null);
            }}
          />
        )}
      </div>
    </>
  );
};

// =====================================================
// Tab Button Component
// =====================================================
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  badge?: number;
  isNew?: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  icon,
  label,
  badge,
  isNew
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm relative
        ${active 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
      `}
    >
      <span className="mr-2">{icon}</span>
      {label}
      {badge !== undefined && (
        <span className="ml-2 bg-gray-100 text-gray-900 px-2 py-1 rounded-full text-xs">
          {badge}
        </span>
      )}
      {isNew && (
        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
          NEW
        </span>
      )}
    </button>
  );
};

// =====================================================
// Server Side Props
// =====================================================
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // 초기 데이터 로드
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/content-calendar?page=1&limit=20`);
    const data = await response.json();

    return {
      props: {
        initialContent: data.data || [],
        totalCount: data.metadata?.total || 0
      }
    };
  } catch (error) {
    console.error('초기 데이터 로드 실패:', error);
    
    return {
      props: {
        initialContent: [],
        totalCount: 0
      }
    };
  }
};

export default ContentCalendarPage;
