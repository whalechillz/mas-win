import React, { useState, useEffect } from 'react';
import { BlogCalendar } from './BlogCalendar';
import { ContentEditor } from './ContentEditor';
import { MarketingFunnelPlan } from './MarketingFunnelPlan';
import { PlatformManager } from './PlatformManager';

interface MarketingDashboardProps {
  supabase: any;
}

export const MarketingDashboard: React.FC<MarketingDashboardProps> = ({ supabase }) => {
  const [activeView, setActiveView] = useState<'calendar' | 'funnel' | 'settings'>('calendar');
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
      .eq('year', new Date().getFullYear());
    
    if (!error && data) {
      setMarketingPlans(data);
    }
  };

  const handleSaveContent = async (data: any) => {
    try {
      if (selectedContent) {
        // 수정
        const { error } = await supabase
          .from('blog_contents')
          .update(data)
          .eq('id', selectedContent.id);
        
        if (!error) {
          await loadBlogPosts();
          setShowEditor(false);
          setSelectedContent(null);
        }
      } else {
        // 신규
        const { error } = await supabase
          .from('blog_contents')
          .insert(data);
        
        if (!error) {
          await loadBlogPosts();
          setShowEditor(false);
        }
      }
    } catch (error) {
      console.error('콘텐츠 저장 오류:', error);
    }
  };

  const handleUpdatePlan = async (plan: any) => {
    try {
      const { error } = await supabase
        .from('annual_marketing_plans')
        .upsert(plan);
      
      if (!error) {
        await loadMarketingPlans();
      }
    } catch (error) {
      console.error('계획 업데이트 오류:', error);
    }
  };

  const handleAISuggest = async (type: string) => {
    // AI 제안 기능 구현 (추후 OpenAI API 연동)
    const suggestions = {
      title: '골프 입문자를 위한 필수 장비 가이드',
      keywords: ['골프입문', '골프장비', '초보골프', '골프클럽추천'],
      outline: '1. 골프 입문자가 알아야 할 기본 장비\n2. 클럽 선택 가이드\n3. 골프공 선택 팁\n4. 의류 및 액세서리\n5. 예산별 추천 세트',
      content: '골프를 시작하려는 분들을 위한 완벽한 가이드...'
    };
    
    return suggestions[type];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">마케팅 콘텐츠 관리</h2>
            <p className="text-gray-600 mt-1">블로그, 광고, SNS 콘텐츠를 한 곳에서 관리하세요</p>
          </div>
          <button
            onClick={() => {
              setSelectedContent(null);
              setShowEditor(true);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 콘텐츠
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mt-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveView('calendar')}
            className={`pb-3 px-1 font-medium text-sm transition-all ${
              activeView === 'calendar'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            콘텐츠 캘린더
          </button>
          <button
            onClick={() => setActiveView('funnel')}
            className={`pb-3 px-1 font-medium text-sm transition-all ${
              activeView === 'funnel'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            마케팅 퍼널 계획
          </button>
          <button
            onClick={() => setActiveView('settings')}
            className={`pb-3 px-1 font-medium text-sm transition-all ${
              activeView === 'settings'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            플랫폼 설정
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      {activeView === 'calendar' ? (
        <BlogCalendar
          posts={blogPosts}
          onDateClick={(date) => {
            // 날짜 클릭 시 새 콘텐츠 생성
            setSelectedContent({
              scheduled_date: date.toISOString().split('T')[0]
            });
            setShowEditor(true);
          }}
          onPostClick={(post) => {
            setSelectedContent(post);
            setShowEditor(true);
          }}
        />
      ) : activeView === 'funnel' ? (
        <MarketingFunnelPlan
          stages={funnelStages}
          plans={marketingPlans}
          currentYear={new Date().getFullYear()}
          onUpdatePlan={handleUpdatePlan}
        />
      ) : (
        <PlatformManager
          platforms={platforms}
          supabase={supabase}
          onUpdate={loadPlatforms}
        />
      )}

      {/* 플랫폼별 통계 */}
      {activeView !== 'settings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">플랫폼별 콘텐츠 현황</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {platforms.filter(p => p.is_active).map(platform => {
            const platformPosts = blogPosts.filter(p => p.platform_id === platform.id);
            const publishedCount = platformPosts.filter(p => p.status === 'published').length;
            
            return (
              <div key={platform.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{platform.name}</h4>
                  <span className="text-2xl">
                    {platform.type === 'website' ? '🌐' :
                     platform.type === 'naver' ? 'N' :
                     platform.type === 'google_ads' ? 'G' :
                     platform.type === 'instagram' ? '📷' :
                     platform.type === 'facebook' ? 'f' :
                     platform.type === 'youtube' ? '▶️' : '📱'}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">총 콘텐츠</span>
                    <span className="font-medium">{platformPosts.length}개</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">발행됨</span>
                    <span className="font-medium text-green-600">{publishedCount}개</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">예정</span>
                    <span className="font-medium text-blue-600">
                      {platformPosts.filter(p => p.status === 'scheduled').length}개
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* 콘텐츠 에디터 모달 */}
      {showEditor && (
        <ContentEditor
          content={selectedContent}
          platforms={platforms.filter(p => p.is_active)}
          categories={categories}
          teamMembers={teamMembers}
          onSave={handleSaveContent}
          onCancel={() => {
            setShowEditor(false);
            setSelectedContent(null);
          }}
          onAISuggest={handleAISuggest}
        />
      )}
    </div>
  );
};