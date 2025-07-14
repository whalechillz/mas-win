import React, { useState } from 'react';
import { Calendar, Target, Brain, Send, BarChart3, Settings, Archive, TrendingUp } from 'lucide-react';

export const EnhancedMarketingDashboard = ({ supabase }) => {
  const [activeTab, setActiveTab] = useState('planning');

  const menuItems = [
    {
      id: 'planning',
      name: '📋 마케팅 계획',
      icon: <Calendar className="w-4 h-4" />,
      description: '월별 테마 및 캠페인 전략'
    },
    {
      id: 'ideas',
      name: '💡 글감 관리',
      icon: <Archive className="w-4 h-4" />,
      description: '콘텐츠 아이디어 뱅크'
    },
    {
      id: 'ai-support',
      name: '🤖 AI 서포트',
      icon: <Brain className="w-4 h-4" />,
      description: 'AI 콘텐츠 생성 및 최적화'
    },
    {
      id: 'manual-publish',
      name: '✍️ 수동 배포',
      icon: <Send className="w-4 h-4" />,
      description: '네이버 블로그 수동 발행'
    },
    {
      id: 'auto-publish',
      name: '🚀 자동 배포',
      icon: <Send className="w-4 h-4" />,
      description: '멀티채널 자동 발행'
    },
    {
      id: 'statistics',
      name: '📊 통계',
      icon: <BarChart3 className="w-4 h-4" />,
      description: '채널별 성과 분석'
    },
    {
      id: 'kpi',
      name: '🎯 KPI 관리',
      icon: <Target className="w-4 h-4" />,
      description: '목표 대비 성과 추적'
    },
    {
      id: 'settings',
      name: '⚙️ 설정',
      icon: <Settings className="w-4 h-4" />,
      description: '시스템 설정'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">마케팅 통합 관리 시스템</h1>
          <p className="text-sm text-gray-600 mt-1">캠페인 기획부터 성과 분석까지 한 곳에서</p>
        </div>
      </div>

      {/* 메뉴 탭 */}
      <div className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="px-6 py-6">
        {activeTab === 'planning' && <MarketingPlanningView supabase={supabase} />}
        {activeTab === 'ideas' && <ContentIdeasBank supabase={supabase} />}
        {activeTab === 'ai-support' && <AIContentSupport supabase={supabase} />}
        {activeTab === 'manual-publish' && <ManualPublishManager supabase={supabase} />}
        {activeTab === 'auto-publish' && <AutoPublishManager supabase={supabase} />}
        {activeTab === 'statistics' && <MarketingStatistics supabase={supabase} />}
        {activeTab === 'kpi' && <KPIManager supabase={supabase} />}
        {activeTab === 'settings' && <SystemSettings supabase={supabase} />}
      </div>
    </div>
  );
};

// 마케팅 계획 뷰
const MarketingPlanningView = ({ supabase }) => {
  const [monthlyThemes, setMonthlyThemes] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  React.useEffect(() => {
    loadMonthlyThemes();
  }, []);

  const loadMonthlyThemes = async () => {
    const { data, error } = await supabase
      .from('monthly_themes')
      .select('*')
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    if (!error && data) {
      setMonthlyThemes(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">월별 마케팅 테마</h2>
        
        <div className="grid gap-4">
          {monthlyThemes.map((theme) => (
            <div key={theme.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {theme.year}년 {theme.month}월: {theme.theme}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">목표: {theme.objective}</p>
                  <p className="text-sm text-gray-500 mt-2">프로모션: {theme.promotion_detail}</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm">
                  편집
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 주간 발행 일정 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">주간 네이버 블로그 발행 일정</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium">월요일</h3>
            <p className="text-sm text-gray-600 mt-1">mas9golf</p>
            <p className="text-xs text-gray-500">담당: 제이</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium">수요일</h3>
            <p className="text-sm text-gray-600 mt-1">massgoogolf</p>
            <p className="text-xs text-gray-500">담당: 스테피</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium">금요일</h3>
            <p className="text-sm text-gray-600 mt-1">massgoogolfkorea</p>
            <p className="text-xs text-gray-500">담당: 허상원</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 콘텐츠 아이디어 뱅크
const ContentIdeasBank = ({ supabase }) => {
  const [ideas, setIdeas] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    keywords: '',
    target_audience: '',
    content_type: 'blog',
    priority: 0
  });

  React.useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    const { data, error } = await supabase
      .from('content_ideas')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setIdeas(data);
    }
  };

  const addIdea = async () => {
    const { error } = await supabase
      .from('content_ideas')
      .insert([{
        ...newIdea,
        keywords: newIdea.keywords.split(',').map(k => k.trim()),
        created_by: 'admin'
      }]);

    if (!error) {
      await loadIdeas();
      setShowAddForm(false);
      setNewIdea({
        title: '',
        description: '',
        keywords: '',
        target_audience: '',
        content_type: 'blog',
        priority: 0
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">콘텐츠 아이디어 뱅크</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 새 아이디어 추가
        </button>
      </div>

      {/* 아이디어 목록 */}
      <div className="grid gap-4">
        {ideas.map((idea) => (
          <div key={idea.id} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium">{idea.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{idea.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>타겟: {idea.target_audience}</span>
                  <span>유형: {idea.content_type}</span>
                  <span>우선순위: {idea.priority}</span>
                </div>
                {idea.keywords && (
                  <div className="flex gap-2 mt-2">
                    {idea.keywords.map((keyword, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button className="text-blue-600 hover:text-blue-700 text-sm">
                  사용하기
                </button>
                <select
                  value={idea.status}
                  onChange={async (e) => {
                    await supabase
                      .from('content_ideas')
                      .update({ status: e.target.value })
                      .eq('id', idea.id);
                    await loadIdeas();
                  }}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="idea">아이디어</option>
                  <option value="planned">계획됨</option>
                  <option value="in_progress">작성중</option>
                  <option value="published">발행됨</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 새 아이디어 추가 폼 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">새 콘텐츠 아이디어</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">제목</label>
                <input
                  type="text"
                  value={newIdea.title}
                  onChange={(e) => setNewIdea({...newIdea, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">설명</label>
                <textarea
                  value={newIdea.description}
                  onChange={(e) => setNewIdea({...newIdea, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">키워드 (쉼표로 구분)</label>
                  <input
                    type="text"
                    value={newIdea.keywords}
                    onChange={(e) => setNewIdea({...newIdea, keywords: e.target.value})}
                    placeholder="골프, 여름, 드라이버"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">타겟 고객</label>
                  <input
                    type="text"
                    value={newIdea.target_audience}
                    onChange={(e) => setNewIdea({...newIdea, target_audience: e.target.value})}
                    placeholder="4060 시니어 골퍼"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">콘텐츠 유형</label>
                  <select
                    value={newIdea.content_type}
                    onChange={(e) => setNewIdea({...newIdea, content_type: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="blog">블로그</option>
                    <option value="social">소셜미디어</option>
                    <option value="video">동영상</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">우선순위 (0-10)</label>
                  <input
                    type="number"
                    value={newIdea.priority}
                    onChange={(e) => setNewIdea({...newIdea, priority: parseInt(e.target.value) || 0})}
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <button
                onClick={addIdea}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                추가
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// AI 콘텐츠 서포트
const AIContentSupport = ({ supabase }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  React.useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from('ai_content_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setHistory(data);
    }
  };

  const generateContent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-blog-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      if (data.content) {
        setGeneratedContent(data.content);
        
        // 이력 저장
        await supabase
          .from('ai_content_history')
          .insert([{
            content_type: 'blog',
            prompt: prompt,
            generated_content: data.content,
            status: 'generated'
          }]);
        
        await loadHistory();
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI 콘텐츠 생성 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">AI 콘텐츠 생성</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">콘텐츠 요청사항</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 여름철 골프 드라이버 관리법에 대한 블로그 포스트를 작성해주세요. 시니어 골퍼를 대상으로 하며, 실용적인 팁 위주로 작성해주세요."
              rows={4}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          
          <button
            onClick={generateContent}
            disabled={loading || !prompt}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '생성 중...' : 'AI 콘텐츠 생성'}
          </button>
          
          {generatedContent && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">생성된 콘텐츠</h3>
              <div className="whitespace-pre-wrap text-sm">{generatedContent}</div>
              <div className="mt-4 flex gap-2">
                <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                  블로그에 사용
                </button>
                <button className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                  수정하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 생성 이력 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">최근 생성 이력</h2>
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="border-b pb-3">
              <p className="text-sm font-medium">{item.prompt}</p>
              <div className="flex gap-4 mt-1 text-xs text-gray-500">
                <span>{new Date(item.created_at).toLocaleString()}</span>
                <span className={`px-2 py-1 rounded ${
                  item.status === 'published' ? 'bg-green-100 text-green-700' : 
                  item.status === 'edited' ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  {item.status === 'published' ? '발행됨' : 
                   item.status === 'edited' ? '수정됨' : '생성됨'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 수동 발행 관리
const ManualPublishManager = ({ supabase }) => {
  const [pendingPosts, setPendingPosts] = useState([]);
  const [publishHistory, setPublishHistory] = useState([]);

  React.useEffect(() => {
    loadPendingPosts();
    loadPublishHistory();
  }, []);

  const loadPendingPosts = async () => {
    const { data, error } = await supabase
      .from('blog_schedule')
      .select('*')
      .in('status', ['ready', 'writing'])
      .order('date', { ascending: true });

    if (!error && data) {
      setPendingPosts(data);
    }
  };

  const loadPublishHistory = async () => {
    const { data, error } = await supabase
      .from('content_distribution')
      .select('*')
      .eq('platform', 'naver')
      .eq('auto_publish', false)
      .order('published_time', { ascending: false })
      .limit(20);

    if (!error && data) {
      setPublishHistory(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* 발행 대기 목록 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">네이버 블로그 발행 대기</h2>
        
        <div className="space-y-3">
          {pendingPosts.map((post) => (
            <div key={post.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
              <div>
                <h3 className="font-medium">{post.title || post.topic}</h3>
                <div className="flex gap-4 mt-1 text-sm text-gray-600">
                  <span>계정: {post.account}</span>
                  <span>담당: {post.assignee}</span>
                  <span>예정일: {new Date(post.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  발행하기
                </button>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
                  미리보기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 발행 이력 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">수동 발행 이력</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">발행일시</th>
                <th className="px-4 py-2 text-left">제목</th>
                <th className="px-4 py-2 text-left">플랫폼</th>
                <th className="px-4 py-2 text-left">URL</th>
                <th className="px-4 py-2 text-left">상태</th>
              </tr>
            </thead>
            <tbody>
              {publishHistory.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="px-4 py-2">
                    {new Date(item.published_time).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{item.title}</td>
                  <td className="px-4 py-2">네이버 블로그</td>
                  <td className="px-4 py-2">
                    {item.publish_url && (
                      <a href={item.publish_url} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline">
                        링크
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      발행완료
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 통계 대시보드
const MarketingStatistics = ({ supabase }) => {
  const [stats, setStats] = useState({
    daily: [],
    weekly: [],
    monthly: []
  });
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  React.useEffect(() => {
    loadStatistics();
  }, [selectedPeriod]);

  const loadStatistics = async () => {
    const { data, error } = await supabase
      .from('marketing_statistics')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    if (!error && data) {
      setStats({ ...stats, [selectedPeriod]: data });
    }
  };

  return (
    <div className="space-y-6">
      {/* 기간 선택 */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedPeriod('daily')}
          className={`px-4 py-2 rounded-lg ${
            selectedPeriod === 'daily' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          일별
        </button>
        <button
          onClick={() => setSelectedPeriod('weekly')}
          className={`px-4 py-2 rounded-lg ${
            selectedPeriod === 'weekly' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          주별
        </button>
        <button
          onClick={() => setSelectedPeriod('monthly')}
          className={`px-4 py-2 rounded-lg ${
            selectedPeriod === 'monthly' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          월별
        </button>
      </div>

      {/* 채널별 요약 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-600">네이버 블로그</h3>
          <p className="text-2xl font-bold mt-2">1,234</p>
          <p className="text-sm text-gray-500">총 조회수</p>
          <p className="text-sm text-green-600 mt-2">↑ 23.5%</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-600">카카오톡</h3>
          <p className="text-2xl font-bold mt-2">89</p>
          <p className="text-sm text-gray-500">클릭수</p>
          <p className="text-sm text-green-600 mt-2">↑ 12.3%</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-600">문자</h3>
          <p className="text-2xl font-bold mt-2">156</p>
          <p className="text-sm text-gray-500">클릭수</p>
          <p className="text-sm text-red-600 mt-2">↓ 5.2%</p>
        </div>
      </div>

      {/* 상세 통계 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">상세 통계</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">날짜</th>
                <th className="px-4 py-2 text-left">채널</th>
                <th className="px-4 py-2 text-right">노출수</th>
                <th className="px-4 py-2 text-right">클릭수</th>
                <th className="px-4 py-2 text-right">전환수</th>
                <th className="px-4 py-2 text-right">매출</th>
                <th className="px-4 py-2 text-right">비용</th>
                <th className="px-4 py-2 text-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {stats[selectedPeriod].map((stat) => (
                <tr key={stat.id} className="border-b">
                  <td className="px-4 py-2">
                    {new Date(stat.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{stat.channel}</td>
                  <td className="px-4 py-2 text-right">{stat.impressions.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{stat.clicks}</td>
                  <td className="px-4 py-2 text-right">{stat.conversions}</td>
                  <td className="px-4 py-2 text-right">₩{stat.revenue.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">₩{stat.cost.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-medium">
                    <span className={stat.roi > 0 ? 'text-green-600' : 'text-red-600'}>
                      {stat.roi.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// KPI 관리
const KPIManager = ({ supabase }) => {
  const [kpis, setKpis] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');

  React.useEffect(() => {
    loadCampaigns();
  }, []);

  React.useEffect(() => {
    if (selectedCampaign) {
      loadKPIs();
    }
  }, [selectedCampaign]);

  const loadCampaigns = async () => {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data) {
      setCampaigns(data);
      if (data.length > 0) {
        setSelectedCampaign(data[0].id);
      }
    }
  };

  const loadKPIs = async () => {
    const { data, error } = await supabase
      .from('campaign_kpis')
      .select('*')
      .eq('campaign_id', selectedCampaign);

    if (!error && data) {
      setKpis(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* 캠페인 선택 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">캠페인 KPI 관리</h2>
        
        <select
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
          className="w-full max-w-md px-3 py-2 border rounded-lg"
        >
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.topic} ({new Date(campaign.date).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {/* KPI 목록 */}
      <div className="grid grid-cols-2 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-medium text-gray-700">{kpi.metric_name}</h3>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">목표</span>
                <span className="font-medium">{kpi.target_value}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">실적</span>
                <span className="font-medium">{kpi.actual_value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(kpi.achievement_rate, 100)}%` }}
                />
              </div>
              <p className="text-right text-sm font-medium mt-1">
                {kpi.achievement_rate.toFixed(1)}% 달성
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* KPI 추가 버튼 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + 새 KPI 추가
        </button>
      </div>
    </div>
  );
};

// 시스템 설정
const SystemSettings = ({ supabase }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">시스템 설정</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">자동 발행 설정</h3>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>네이버 블로그 자동 발행 활성화</span>
            </label>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">알림 설정</h3>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>발행 완료 시 이메일 알림</span>
            </label>
            <label className="flex items-center space-x-2 mt-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>KPI 목표 달성 시 알림</span>
            </label>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">API 연동</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded">
                <span>네이버 API</span>
                <span className="text-green-600">연동됨</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span>카카오 API</span>
                <span className="text-gray-400">미연동</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 자동 발행 관리자
const AutoPublishManager = ({ supabase }) => {
  const [schedules, setSchedules] = useState([]);
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(false);

  React.useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    const { data, error } = await supabase
      .from('content_distribution')
      .select('*')
      .eq('auto_publish', true)
      .order('scheduled_time', { ascending: true });

    if (!error && data) {
      setSchedules(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* 자동 발행 설정 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">자동 발행 설정</h2>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoPublishEnabled}
              onChange={(e) => setAutoPublishEnabled(e.target.checked)}
              className="rounded"
            />
            <span>자동 발행 활성화</span>
          </label>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">네이버 블로그</h3>
            <p className="text-sm text-gray-600">매주 월, 수, 금 오전 10시 자동 발행</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">카카오채널</h3>
            <p className="text-sm text-gray-600">매주 화, 목 오후 2시 자동 발행</p>
          </div>
        </div>
      </div>

      {/* 예약된 발행 목록 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">예약된 자동 발행</h2>
        
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">{schedule.title}</h3>
                <div className="flex gap-4 mt-1 text-sm text-gray-600">
                  <span>플랫폼: {schedule.platform}</span>
                  <span>예약: {new Date(schedule.scheduled_time).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="text-blue-600 hover:text-blue-700 text-sm">
                  수정
                </button>
                <button className="text-red-600 hover:text-red-700 text-sm">
                  취소
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};