import React, { useState, useEffect } from 'react';
import { BlogCalendar } from './BlogCalendar';
import { ContentEditor } from './ContentEditor';
import { MarketingFunnelPlan } from './MarketingFunnelPlan';
import { PlatformManager } from './PlatformManager';
import { NaverBlogManager } from './NaverBlogManager';
import { BlogContentManager } from './BlogContentManager'; // 새로 추가
import { SimpleNaverBlogManager } from './SimpleNaverBlogManager'; // 단순화 버전
import { SimpleBlogManager } from './SimpleBlogManager'; // 초간단 버전
import { MultiChannelManager } from './MultiChannelManager'; // 멀티채널 관리
import { IntegratedCampaignManager } from './IntegratedCampaignManager'; // 통합 캠페인
import { TrashManager } from './TrashManager'; // 휴지통 관리

interface MarketingDashboardProps {
  supabase: any;
}

export const MarketingDashboard: React.FC<MarketingDashboardProps> = ({ supabase }) => {
  const [activeView, setActiveView] = useState<'campaign' | 'simple' | 'blog' | 'calendar' | 'funnel' | 'naver' | 'settings' | 'trash'>('campaign');
  const [showEditor, setShowEditor] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  
  // 데이터 상태
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [funnelStages, setFunnelStages] = useState<any[]>([]);
  const [marketingPlans, setMarketingPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    if (supabase) {
      loadAllData();
    }
  }, [supabase]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBlogPosts(),
        loadPlatforms(),
        loadCategories(),
        loadTeamMembers(),
        loadFunnelStages(),
        loadMarketingPlans()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadBlogPosts = async () => {
    const { data, error } = await supabase
      .from('blog_contents')
      .select(`
        *,
        platform:blog_platforms(id, name, type),
        category:content_categories(id, name, color)
      `)
      .order('scheduled_date', { ascending: true });
    
    if (!error && data) {
      setBlogPosts(data.map(post => ({
        ...post,
        platform_name: post.platform?.name,
        platform_type: post.platform?.type,
        category_name: post.category?.name,
        category_color: post.category?.color
      })));
    }
  };

  const loadPlatforms = async () => {
    const { data, error } = await supabase
      .from('blog_platforms')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setPlatforms(data);
    }
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('content_categories')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const loadTeamMembers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (!error && data) {
      setTeamMembers(data);
    }
  };

  const loadFunnelStages = async () => {
    const { data, error } = await supabase
      .from('marketing_funnel_stages')
      .select('*')
      .order('stage_order');
    
    if (!error && data) {
      setFunnelStages(data);
    }
  };

  const loadMarketingPlans = async () => {
    const { data, error } = await supabase
      .from('annual_marketing_plans')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    
    if (!error && data) {
      setMarketingPlans(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">마케팅 콘텐츠 관리</h2>
        
        {/* 탭 메뉴 */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 -mb-6 pb-4">
          <button
            onClick={() => setActiveView('campaign')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all ${
              activeView === 'campaign'
                ? 'bg-purple-100 text-purple-700 border border-gray-200 border-b-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 통합 캠페인
          </button>
          <button
            onClick={() => setActiveView('simple')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all ${
              activeView === 'simple'
                ? 'bg-purple-100 text-purple-700 border border-gray-200 border-b-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🟢 블로그 관리 (네이버)
          </button>
          <button
            onClick={() => setActiveView('blog')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all ${
              activeView === 'blog'
                ? 'bg-purple-100 text-purple-700 border border-gray-200 border-b-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📱 멀티채널 관리
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all ${
              activeView === 'calendar'
                ? 'bg-purple-100 text-purple-700 border border-gray-200 border-b-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📅 콘텐츠 캘린더
          </button>
          <button
            onClick={() => setActiveView('funnel')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all ${
              activeView === 'funnel'
                ? 'bg-purple-100 text-purple-700 border border-gray-200 border-b-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 퍼널 계획
          </button>
          <button
            onClick={() => setActiveView('naver')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all ${
              activeView === 'naver'
                ? 'bg-purple-100 text-purple-700 border border-gray-200 border-b-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{display: 'none'}}
          >
            🟢 네이버 블로그 (구버전)
          </button>
          <button
            onClick={() => setActiveView('trash')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all ${
              activeView === 'trash'
                ? 'bg-purple-100 text-purple-700 border border-gray-200 border-b-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🗑️ 휴지통
          </button>
          <button
            onClick={() => setActiveView('settings')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all ${
              activeView === 'settings'
                ? 'bg-purple-100 text-purple-700 border border-gray-200 border-b-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚙️ 설정
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="p-6">
            {activeView === 'campaign' && <IntegratedCampaignManager supabase={supabase} />}
            {activeView === 'simple' && <SimpleBlogManager supabase={supabase} />}
            {activeView === 'blog' && <MultiChannelManager supabase={supabase} />}
            {activeView === 'calendar' && (
              <BlogCalendar
                blogPosts={blogPosts}
                platforms={platforms}
                categories={categories}
                onEdit={(post) => {
                  setSelectedContent(post);
                  setShowEditor(true);
                }}
                onRefresh={loadBlogPosts}
              />
            )}
            {activeView === 'funnel' && (
              <MarketingFunnelPlan
                funnelStages={funnelStages}
                marketingPlans={marketingPlans}
                onRefresh={loadMarketingPlans}
              />
            )}
            {activeView === 'naver' && (
              <SimpleNaverBlogManager supabase={supabase} />
            )}
            {activeView === 'trash' && <TrashManager supabase={supabase} />}
            {activeView === 'settings' && (
              <PlatformManager
                platforms={platforms}
                categories={categories}
                teamMembers={teamMembers}
                onRefresh={loadAllData}
              />
            )}
          </div>
        )}
      </div>

      {/* 콘텐츠 에디터 모달 */}
      {showEditor && (
        <ContentEditor
          content={selectedContent}
          platforms={platforms}
          categories={categories}
          onClose={() => {
            setShowEditor(false);
            setSelectedContent(null);
          }}
          onSave={async (updatedContent) => {
            // 저장 로직
            await loadBlogPosts();
            setShowEditor(false);
            setSelectedContent(null);
          }}
        />
      )}
    </div>
  );
};