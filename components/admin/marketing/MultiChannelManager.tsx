import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Tag, Calendar, User, CheckCircle, AlertCircle, Clock } from 'lucide-react';

// 멀티채널 콘텐츠 관리자
export const MultiChannelManager = ({ supabase }) => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  // 플랫폼 정의
  const platforms = [
    { id: 'all', name: '전체', icon: '📊', color: 'gray' },
    { id: 'blog', name: '자사 블로그', icon: '🏠', color: 'blue' },
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
    tags: ''
  });

  // 데이터 로드
  useEffect(() => {
    loadContents();
  }, [selectedPlatform]);

  const loadContents = async () => {
    try {
      let query = supabase
        .from('content_ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedPlatform !== 'all') {
        query = query.eq('platform', selectedPlatform);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setContents(data || []);
    } catch (error) {
      console.error('Error loading contents:', error);
    } finally {
      setLoading(false);
    }
  };

  // 콘텐츠 추가
  const addContent = async () => {
    try {
      const { error } = await supabase
        .from('content_ideas')
        .insert([newContent]);

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
        tags: ''
      });
    } catch (error) {
      console.error('Error adding content:', error);
      alert('추가 실패: ' + error.message);
    }
  };

  // 상태별 색상
  const getStatusColor = (status) => {
    switch (status) {
      case 'idea': return 'bg-gray-100 text-gray-700';
      case 'writing': return 'bg-yellow-100 text-yellow-700';
      case 'ready': return 'bg-blue-100 text-blue-700';
      case 'published': return 'bg-green-100 text-green-700';
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">멀티채널 콘텐츠 관리</h2>
          <p className="text-gray-600">자사 블로그, 카카오채널, 인스타그램 등 통합 관리</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 새 콘텐츠
        </button>
      </div>

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
      <div className="grid grid-cols-4 gap-4 mb-6">
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingContent(content)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('삭제하시겠습니까?')) {
                            try {
                              const { error } = await supabase
                                .from('content_ideas')
                                .delete()
                                .eq('id', content.id);
                              if (error) throw error;
                              await loadContents();
                            } catch (error) {
                              console.error('Error deleting:', error);
                            }
                          }
                        }}
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

      {/* 새 콘텐츠 추가 폼 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">새 콘텐츠 추가</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">제목</label>
                <input
                  type="text"
                  value={newContent.title}
                  onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">내용/설명</label>
                <textarea
                  value={newContent.content}
                  onChange={(e) => setNewContent({...newContent, content: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">플랫폼</label>
                  <select
                    value={newContent.platform}
                    onChange={(e) => setNewContent({...newContent, platform: e.target.value})}
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
                    value={newContent.assignee}
                    onChange={(e) => setNewContent({...newContent, assignee: e.target.value})}
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
                    value={newContent.scheduled_date}
                    onChange={(e) => setNewContent({...newContent, scheduled_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">태그 (쉼표로 구분)</label>
                  <input
                    type="text"
                    value={newContent.tags}
                    onChange={(e) => setNewContent({...newContent, tags: e.target.value})}
                    placeholder="예: 프로모션, 이벤트, 신제품"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <button
                onClick={addContent}
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