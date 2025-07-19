import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Tag, Calendar, User, CheckCircle, AlertCircle, Clock, Settings, Palette, Zap, Filter, RefreshCw, Search } from 'lucide-react';
import { AIGenerationSettings } from './AIGenerationSettingsNew';
import { NaverSEOValidator } from './NaverSEOValidator';

// 통합 멀티채널 매니저 - 심플한 UI + 테마/AI 기능 + SEO 검증
export const UnifiedMultiChannelManager = ({ supabase }) => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [deletedCount, setDeletedCount] = useState(0);
  const [showSEOValidator, setShowSEOValidator] = useState(false);
  const [selectedContentForSEO, setSelectedContentForSEO] = useState(null);
  
  // 월별 테마 관련
  const [showThemeBar, setShowThemeBar] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // AI 설정
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    useAI: false,
    model: 'gpt-3.5-turbo',
    settings: {
      contentModel: 'gpt-3.5-turbo',
      usePerplexity: false,
      useImageGen: true,
      imageCount: 3
    }
  });

  // 플랫폼 정의 (틱톡 포함)
  const platforms = [
    { id: 'all', name: '전체', icon: '📊', color: 'gray' },
    { id: 'blog', name: '자사 블로그', icon: '🏠', color: 'blue' },
    { id: 'naver', name: '네이버블로그', icon: '🟢', color: 'green' },
    { id: 'kakao', name: '카카오채널', icon: '💬', color: 'yellow' },
    { id: 'instagram', name: '인스타그램', icon: '📷', color: 'pink' },
    { id: 'youtube', name: '유튜브', icon: '📺', color: 'red' },
    { id: 'tiktok', name: '틱톡', icon: '🎵', color: 'black' }
  ];

  // 새 콘텐츠 양식
  const [newContent, setNewContent] = useState({
    title: '',
    content: '',
    platform: 'blog',
    status: 'idea',
    assignee: '제이',
    scheduled_date: '',
    tags: '',
    monthly_theme_id: null
  });

  // 데이터 로드
  useEffect(() => {
    loadContents();
    loadDeletedCount();
    loadCurrentTheme();
  }, [selectedPlatform, selectedMonth, selectedYear]);

  const loadCurrentTheme = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_themes')
        .select('*')
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .single();
      
      if (!error && data) {
        setCurrentTheme(data);
      } else {
        setCurrentTheme(null);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const loadDeletedCount = async () => {
    try {
      const { count, error } = await supabase
        .from('content_ideas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'deleted');
      
      if (!error && count !== null) {
        setDeletedCount(count);
      }
    } catch (error) {
      console.error('Error loading deleted count:', error);
    }
  };

  const loadContents = async () => {
    try {
      let query = supabase
        .from('content_ideas')
        .select('*')
        .neq('status', 'deleted')
        .order('scheduled_date', { ascending: false });

      if (selectedPlatform !== 'all') {
        query = query.eq('platform', selectedPlatform);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setContents(data || []);
    } catch (error) {
      console.error('Error loading contents:', error);
      alert('데이터 로드 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 콘텐츠 추가
  const addContent = async () => {
    try {
      const contentData = {
        ...newContent,
        monthly_theme_id: currentTheme?.id || null
      };
      
      const { error } = await supabase
        .from('content_ideas')
        .insert([contentData]);

      if (error) throw error;

      await loadContents();
      setShowAddForm(false);
      setNewContent({
        title: '',
        content: '',
        platform: 'blog',
        status: 'idea',
        assignee: '제이',
        scheduled_date: '',
        tags: '',
        monthly_theme_id: null
      });
      alert('콘텐츠가 추가되었습니다.');
    } catch (error) {
      console.error('Error adding content:', error);
      alert('추가 실패: ' + error.message);
    }
  };

  // 콘텐츠 수정
  const updateContent = async (updatedContent) => {
    try {
      const { error } = await supabase
        .from('content_ideas')
        .update(updatedContent)
        .eq('id', updatedContent.id);

      if (error) throw error;

      await loadContents();
      setEditingContent(null);
      alert('콘텐츠가 수정되었습니다.');
    } catch (error) {
      console.error('Error updating content:', error);
      alert('수정 실패: ' + error.message);
    }
  };

  // 콘텐츠 삭제 - 소프트 삭제 방식
  const deleteContent = async (content) => {
    if (!confirm(`"${content.title}"을(를) 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('content_ideas')
        .update({ status: 'deleted' })
        .eq('id', content.id);

      if (error) {
        console.error('Delete error:', error);
        alert(`삭제 실패: ${error.message}`);
        return;
      }

      alert('삭제되었습니다.');
      await loadContents();
      await loadDeletedCount();
    } catch (error) {
      console.error('Error deleting:', error);
      alert(`삭제 중 오류 발생: ${error.message}`);
    }
  };

  // AI 자동 생성
  const generateWithAI = async () => {
    if (!currentTheme) {
      alert('먼저 월별 테마를 설정해주세요.');
      return;
    }
    
    if (!confirm(`${selectedYear}년 ${selectedMonth}월의 모든 멀티채널 콘텐츠를 AI로 자동 생성하시겠습니까?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/generate-multichannel-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          aiSettings: aiSettings,
          selectedChannels: {
            blog: true,
            naver: true,
            kakao: true,
            instagram: true,
            youtube: true,
            tiktok: true
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('콘텐츠 생성 실패');
      }
      
      const result = await response.json();
      
      if (result.success) {
        alert(`${result.contentCount}개의 콘텐츠가 생성되었습니다!`);
        await loadContents();
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('콘텐츠 생성 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // SEO 검증
  const validateSEO = (content) => {
    setSelectedContentForSEO(content);
    setShowSEOValidator(true);
  };

  // 상태별 색상
  const getStatusColor = (status) => {
    switch (status) {
      case 'idea': return 'bg-gray-100 text-gray-700';
      case 'writing': return 'bg-yellow-100 text-yellow-700';
      case 'ready': return 'bg-blue-100 text-blue-700';
      case 'published': return 'bg-green-100 text-green-700';
      case 'deleted': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 플랫폼별 색상
  const getPlatformColor = (platform) => {
    const p = platforms.find(p => p.id === platform);
    return p ? `bg-${p.color}-100 text-${p.color}-700` : 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="p-6">로딩중...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">통합 멀티채널 관리</h2>
          <p className="text-gray-600">심플한 UI로 모든 채널을 효율적으로 관리하세요</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowThemeBar(!showThemeBar)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              showThemeBar ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Palette className="w-4 h-4" />
            테마
          </button>
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              aiSettings.useAI ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            AI
          </button>
          <button
            onClick={() => setShowSEOValidator(!showSEOValidator)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            SEO
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            새 콘텐츠
          </button>
        </div>
      </div>

      {/* 월별 테마 바 (토글) */}
      {showThemeBar && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-lg bg-white"
              >
                {[2025, 2026, 2027].map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-lg bg-white"
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
              
              {currentTheme ? (
                <div className="flex-1">
                  <h3 className="font-semibold">{currentTheme.theme}</h3>
                  <p className="text-sm text-gray-600">{currentTheme.description}</p>
                </div>
              ) : (
                <p className="text-gray-500">테마가 설정되지 않았습니다</p>
              )}
            </div>
            
            {aiSettings.useAI && currentTheme && (
              <button
                onClick={generateWithAI}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                AI 생성
              </button>
            )}
          </div>
        </div>
      )}

      {/* AI 설정 패널 (토글) */}
      {showAIPanel && (
        <div className="mb-6">
          <AIGenerationSettings 
            onSettingsChange={(settings) => setAiSettings(settings)}
          />
        </div>
      )}

      {/* SEO 검증 패널 (토글) */}
      {showSEOValidator && (
        <div className="mb-6">
          <NaverSEOValidator 
            content={selectedContentForSEO}
            onValidationComplete={(result) => {
              console.log('SEO 검증 결과:', result);
            }}
          />
        </div>
      )}

      {/* 플랫폼 필터 */}
      <div className="mb-6 flex gap-2">
        {platforms.map(platform => (
          <button
            key={platform.id}
            onClick={() => setSelectedPlatform(platform.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedPlatform === platform.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {platform.icon} {platform.name}
          </button>
        ))}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600">아이디어</div>
          <div className="text-2xl font-bold text-gray-900">
            {contents.filter(c => c.status === 'idea').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600">작성중</div>
          <div className="text-2xl font-bold text-yellow-600">
            {contents.filter(c => c.status === 'writing').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600">발행준비</div>
          <div className="text-2xl font-bold text-blue-600">
            {contents.filter(c => c.status === 'ready').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600">발행완료</div>
          <div className="text-2xl font-bold text-green-600">
            {contents.filter(c => c.status === 'published').length}
          </div>
        </div>
        {deletedCount > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-4 border-red-200">
            <div className="text-sm text-gray-600">휴지통</div>
            <div className="text-2xl font-bold text-red-600">
              {deletedCount}
            </div>
          </div>
        )}
      </div>

      {/* 콘텐츠 목록 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">제목</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">플랫폼</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">담당자</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">예정일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">테마</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">액션</th>
              </tr>
            </thead>
            <tbody>
              {contents.map((content) => (
                <tr key={content.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{content.title}</div>
                    {content.tags && (
                      <div className="flex gap-1 mt-1">
                        {content.tags.split(',').map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${getPlatformColor(content.platform)}`}>
                      {platforms.find(p => p.id === content.platform)?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={content.status}
                      onChange={async (e) => {
                        try {
                          const { error } = await supabase
                            .from('content_ideas')
                            .update({ status: e.target.value })
                            .eq('id', content.id);
                          if (error) throw error;
                          await loadContents();
                        } catch (error) {
                          console.error('Error updating status:', error);
                          alert('상태 업데이트 실패: ' + error.message);
                        }
                      }}
                      className={`px-3 py-1 text-sm border rounded ${getStatusColor(content.status)}`}
                    >
                      <option value="idea">아이디어</option>
                      <option value="writing">작성중</option>
                      <option value="ready">발행준비</option>
                      <option value="published">발행완료</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{content.assignee}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {content.scheduled_date ? new Date(content.scheduled_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {content.monthly_theme_id && currentTheme && content.monthly_theme_id === currentTheme.id ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                        {currentTheme.theme.substring(0, 10)}...
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {(content.platform === 'naver' || content.platform === 'blog') && (
                        <button
                          onClick={() => validateSEO(content)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="SEO 검증"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingContent(content)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteContent(content)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 콘텐츠 추가/수정 폼 */}
      {(showAddForm || editingContent) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">
              {editingContent ? '콘텐츠 수정' : '새 콘텐츠 추가'}
            </h3>
            
            {/* 테마 연결 표시 */}
            {currentTheme && !editingContent && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-700">
                  <strong>{selectedMonth}월 테마:</strong> {currentTheme.theme}
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">제목</label>
                <input
                  type="text"
                  value={editingContent ? editingContent.title : newContent.title}
                  onChange={(e) => {
                    if (editingContent) {
                      setEditingContent({...editingContent, title: e.target.value});
                    } else {
                      setNewContent({...newContent, title: e.target.value});
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">내용/설명</label>
                <textarea
                  value={editingContent ? editingContent.content : newContent.content}
                  onChange={(e) => {
                    if (editingContent) {
                      setEditingContent({...editingContent, content: e.target.value});
                    } else {
                      setNewContent({...newContent, content: e.target.value});
                    }
                  }}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">플랫폼</label>
                  <select
                    value={editingContent ? editingContent.platform : newContent.platform}
                    onChange={(e) => {
                      if (editingContent) {
                        setEditingContent({...editingContent, platform: e.target.value});
                      } else {
                        setNewContent({...newContent, platform: e.target.value});
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {platforms.filter(p => p.id !== 'all').map(platform => (
                      <option key={platform.id} value={platform.id}>
                        {platform.icon} {platform.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">담당자</label>
                  <select
                    value={editingContent ? editingContent.assignee : newContent.assignee}
                    onChange={(e) => {
                      if (editingContent) {
                        setEditingContent({...editingContent, assignee: e.target.value});
                      } else {
                        setNewContent({...newContent, assignee: e.target.value});
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="제이">제이</option>
                    <option value="스테피">스테피</option>
                    <option value="나과장">나과장</option>
                    <option value="허상원">허상원</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">예정일</label>
                  <input
                    type="date"
                    value={editingContent ? editingContent.scheduled_date : newContent.scheduled_date}
                    onChange={(e) => {
                      if (editingContent) {
                        setEditingContent({...editingContent, scheduled_date: e.target.value});
                      } else {
                        setNewContent({...newContent, scheduled_date: e.target.value});
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">태그 (쉼표로 구분)</label>
                  <input
                    type="text"
                    value={editingContent ? editingContent.tags : newContent.tags}
                    onChange={(e) => {
                      if (editingContent) {
                        setEditingContent({...editingContent, tags: e.target.value});
                      } else {
                        setNewContent({...newContent, tags: e.target.value});
                      }
                    }}
                    placeholder="예: 프로모션, 이벤트, 신제품"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  if (editingContent) {
                    updateContent(editingContent);
                  } else {
                    addContent();
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingContent ? '수정' : '추가'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingContent(null);
                }}
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