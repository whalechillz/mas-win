import React, { useState, useEffect } from 'react';
import { BlogCalendarFixed } from './BlogCalendarFixed';
import { ContentEditor } from './ContentEditor';
import { MarketingFunnelPlanFixed } from './MarketingFunnelPlanFixed';
import { PlatformManager } from './PlatformManager';
import { SimpleBlogManager } from './SimpleBlogManager';
import { MultiChannelManager } from './MultiChannelManager';
import { IntegratedCampaignManagerFixed } from './IntegratedCampaignManagerFixed';
import { UnifiedMultiChannelManagerFixed } from './UnifiedMultiChannelManagerFixed';
import { TrashManager } from './TrashManager';
import { NaverSEOValidator } from './NaverSEOValidator';
import { AIContentAssistant } from './AIContentAssistant';
import { Sparkles } from 'lucide-react';

interface MarketingDashboardProps {
  supabase: any;
}

export const MarketingDashboardRenewed: React.FC<MarketingDashboardProps> = ({ supabase }) => {
  const [activeView, setActiveView] = useState<'unified' | 'campaign' | 'simple' | 'multichannel' | 'calendar' | 'funnel' | 'trash' | 'settings'>('unified');
  const [showEditor, setShowEditor] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiContext, setAIContext] = useState<any>(null);
  
  // SEO 검증용 상태
  const [seoContent, setSeoContent] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    images: [] as any[]
  });
  
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
    try {
      // simple_blog_contents 테이블 사용
      const { data, error } = await supabase
        .from('simple_blog_contents')
        .select('*')
        .order('scheduled_date', { ascending: true });
      
      if (!error && data) {
        setBlogPosts(data);
      } else {
        // blog_contents 테이블 시도
        const { data: blogData, error: blogError } = await supabase
          .from('blog_contents')
          .select(`
            *,
            platform:blog_platforms(id, name, type),
            category:content_categories(id, name, color)
          `)
          .order('scheduled_date', { ascending: true });
        
        if (!blogError && blogData) {
          setBlogPosts(blogData.map(post => ({
            ...post,
            platform_name: post.platform?.name,
            platform_type: post.platform?.type,
            category_name: post.category?.name,
            category_color: post.category?.color
          })));
        }
      }
    } catch (error) {
      console.error('Error loading blog posts:', error);
      setBlogPosts([]);
    }
  };

  const loadPlatforms = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_platforms')
        .select('*')
        .order('name');
      
      if (!error && data) {
        setPlatforms(data);
      }
    } catch (error) {
      console.error('Error loading platforms:', error);
      setPlatforms([]);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('content_categories')
        .select('*')
        .order('name');
      
      if (!error && data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (!error && data) {
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
      setTeamMembers([]);
    }
  };

  const loadFunnelStages = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_funnel_stages')
        .select('*')
        .order('stage_order');
      
      if (!error && data) {
        setFunnelStages(data);
      }
    } catch (error) {
      console.error('Error loading funnel stages:', error);
      setFunnelStages([]);
    }
  };

  const loadMarketingPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('annual_marketing_plans')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (!error && data) {
        setMarketingPlans(data);
      }
    } catch (error) {
      console.error('Error loading marketing plans:', error);
      setMarketingPlans([]);
    }
  };

  // AI 어시스턴트 열기
  const openAIAssistant = (context?: any) => {
    setAIContext(context);
    setShowAIAssistant(true);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">마케팅 콘텐츠 관리</h2>
          
          {/* AI 어시스턴트 버튼 */}
          <button
            onClick={() => openAIAssistant()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            AI 어시스턴트
          </button>
        </div>
        
        {/* 탭 메뉴 */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 -mb-6 pb-4">
          <button
            onClick={() => setActiveView('unified')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all ${
              activeView === 'unified'
                ? 'bg-purple-100 text-purple-700 border border-gray-200 border-b-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✨ 통합 멀티채널 (신규)
          </button>
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
            onClick={() => setActiveView('multichannel')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all ${
              activeView === 'multichannel'
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
            🔧 시스템 설정
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
            {activeView === 'unified' && <UnifiedMultiChannelManagerFixed supabase={supabase} />}
            {activeView === 'campaign' && <IntegratedCampaignManagerFixed supabase={supabase} />}
            {activeView === 'simple' && (
              <div className="space-y-6">
                <SimpleBlogManager supabase={supabase} />
                
                {/* SEO 검증 섹션 */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold mb-4">네이버 SEO 검증 시스템</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        포스트 제목
                      </label>
                      <input
                        type="text"
                        value={seoContent.title}
                        onChange={(e) => setSeoContent({...seoContent, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="SEO 최적화된 제목을 입력하세요"
                      />
                      
                      <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                        본문 내용
                      </label>
                      <textarea
                        value={seoContent.content}
                        onChange={(e) => setSeoContent({...seoContent, content: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={6}
                        placeholder="포스트 내용을 입력하세요"
                      />
                      
                      <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                        해시태그
                      </label>
                      <input
                        type="text"
                        placeholder="#태그1 #태그2 형식으로 입력"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const tags = e.currentTarget.value.split(' ').filter(t => t.startsWith('#')).map(t => t.substring(1));
                            setSeoContent({...seoContent, tags: [...seoContent.tags, ...tags]});
                            e.currentTarget.value = '';
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {seoContent.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                            #{tag}
                            <button
                              onClick={() => setSeoContent({
                                ...seoContent, 
                                tags: seoContent.tags.filter((_, i) => i !== idx)
                              })}
                              className="ml-1 text-purple-500"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <NaverSEOValidator
                        title={seoContent.title}
                        content={seoContent.content}
                        tags={seoContent.tags}
                        images={seoContent.images}
                        onScoreChange={(score) => console.log('SEO Score:', score)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeView === 'multichannel' && <MultiChannelManager supabase={supabase} />}
            {activeView === 'calendar' && (
              <BlogCalendarFixed
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
              <MarketingFunnelPlanFixed
                funnelStages={funnelStages}
                marketingPlans={marketingPlans}
                onRefresh={loadMarketingPlans}
                supabase={supabase}
              />
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

      {/* AI 어시스턴트 */}
      <AIContentAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        context={aiContext}
        onContentGenerated={(content) => {
          // 생성된 콘텐츠 처리
          console.log('Generated content:', content);
          if (activeView === 'simple') {
            setSeoContent({
              ...seoContent,
              content: content
            });
          }
        }}
      />
    </div>
  );
};