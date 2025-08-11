import React, { useState, useEffect } from 'react';
import { IntegratedBlogManager } from './IntegratedBlogManager';

// 실제 사용을 위한 완성된 통합 블로그 관리자
export const BlogContentManager = ({ supabase }) => {
  const [activeTab, setActiveTab] = useState('pool');
  const [contentPool, setContentPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewContentModal, setShowNewContentModal] = useState(false);
  
  // 새 글감 입력 상태
  const [newContent, setNewContent] = useState({
    title: '',
    topic: '',
    keywords: '',
    forNaver: true,
    forWebsite: false,
    assignedTo: ''
  });

  useEffect(() => {
    loadContentPool();
  }, []);

  const loadContentPool = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setContentPool(data);
      }
    } finally {
      setLoading(false);
    }
  };

  // 편집 모드 상태
  const [editingContent, setEditingContent] = useState(null);

  // 편집 함수
  const handleEdit = (content) => {
    setEditingContent(content);
    setNewContent({
      title: content.title,
      topic: content.topic || '',
      keywords: content.target_keywords?.join(', ') || '',
      forNaver: content.for_naver || false,
      forWebsite: content.for_website || false,
      assignedTo: content.assigned_to || ''
    });
    setShowNewContentModal(true);
  };

  // 새 글감 저장
  const saveNewContent = async () => {
    try {
      let data, error;
      
      if (editingContent) {
        // 수정 모드
        const result = await supabase
          .from('content_ideas')
          .update({
            title: newContent.title,
            topic: newContent.topic,
            target_keywords: newContent.keywords.split(',').map(k => k.trim()),
            for_naver: newContent.forNaver,
            for_website: newContent.forWebsite,
            assigned_to: newContent.assignedTo || null
          })
          .eq('id', editingContent.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // 새 글감 추가
        const result = await supabase
          .from('content_ideas')
          .insert({
            title: newContent.title,
            topic: newContent.topic,
            target_keywords: newContent.keywords.split(',').map(k => k.trim()),
            for_naver: newContent.forNaver,
            for_website: newContent.forWebsite,
            status: 'idea',
            assigned_to: newContent.assignedTo || null
          })
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (!error) {
        alert(editingContent ? '글감이 수정되었습니다!' : '새 글감이 추가되었습니다!');
        setShowNewContentModal(false);
        loadContentPool();
        // 초기화
        setNewContent({
          title: '',
          topic: '',
          keywords: '',
          forNaver: true,
          forWebsite: false,
          assignedTo: ''
        });
        setEditingContent(null);
      }
    } catch (err) {
      console.error('저장 오류:', err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 상태 업데이트
  const updateContentStatus = async (contentId, newStatus) => {
    try {
      const { error } = await supabase
        .from('content_ideas')
        .update({ status: newStatus })
        .eq('id', contentId);

      if (!error) {
        loadContentPool();
      }
    } catch (err) {
      console.error('상태 업데이트 오류:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">블로그 콘텐츠 관리</h1>
              <p className="text-gray-600 mt-1">글감 작성부터 발행까지 한 곳에서 관리하세요</p>
            </div>
            <button
              onClick={() => setShowNewContentModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + 새 글감 추가
            </button>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {contentPool.filter(c => c.status === 'idea').length}
            </div>
            <div className="text-sm text-gray-600">아이디어</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">
              {contentPool.filter(c => c.status === 'writing').length}
            </div>
            <div className="text-sm text-gray-600">작성 중</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {contentPool.filter(c => c.status === 'ready').length}
            </div>
            <div className="text-sm text-gray-600">발행 준비</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {contentPool.length}
            </div>
            <div className="text-sm text-gray-600">전체 글감</div>
          </div>
        </div>

        {/* 콘텐츠 리스트 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">글감 목록</h2>
            
            {loading ? (
              <div className="text-center py-8">로딩 중...</div>
            ) : (
              <div className="space-y-4">
                {contentPool.map(content => (
                  <div key={content.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{content.title}</h3>
                        <p className="text-gray-600 mt-1">{content.topic}</p>
                        <div className="flex gap-2 mt-2">
                          {content.target_keywords?.map((keyword, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-sm rounded">
                              {keyword}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-4 mt-3 text-sm">
                          {content.for_naver && (
                            <span className="text-green-600">✓ 네이버</span>
                          )}
                          {content.for_website && (
                            <span className="text-purple-600">✓ 자사몰</span>
                          )}
                          {content.assigned_to && (
                            <span className="text-gray-500">담당: {content.assigned_to}</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <select
                          value={content.status}
                          onChange={(e) => updateContentStatus(content.id, e.target.value)}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            content.status === 'idea' ? 'bg-blue-100 text-blue-700' :
                            content.status === 'writing' ? 'bg-yellow-100 text-yellow-700' :
                            content.status === 'ready' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <option value="idea">아이디어</option>
                          <option value="writing">작성 중</option>
                          <option value="ready">발행 준비</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => handleEdit(content)}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      >
                        편집
                      </button>
                      {content.for_naver && content.status === 'ready' && (
                        <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                          네이버 발행 가이드
                        </button>
                      )}
                      {content.for_website && content.status === 'ready' && (
                        <button className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">
                          자사몰 자동 발행
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 새 글감 추가 모달 */}
      {showNewContentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {editingContent ? '글감 수정' : '새 글감 추가'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">제목 *</label>
                <input
                  type="text"
                  value={newContent.title}
                  onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 시니어 골퍼를 위한 드라이버 선택 가이드"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">주제/내용 *</label>
                <textarea
                  value={newContent.topic}
                  onChange={(e) => setNewContent({...newContent, topic: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="글의 주요 내용이나 아이디어를 적어주세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">키워드 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={newContent.keywords}
                  onChange={(e) => setNewContent({...newContent, keywords: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="시니어골프, 드라이버추천, MASGOLF"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">발행 플랫폼</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newContent.forNaver}
                      onChange={(e) => setNewContent({...newContent, forNaver: e.target.checked})}
                      className="mr-2"
                    />
                    네이버 블로그
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newContent.forWebsite}
                      onChange={(e) => setNewContent({...newContent, forWebsite: e.target.checked})}
                      className="mr-2"
                    />
                    자사몰 블로그
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">담당자</label>
                <select
                  value={newContent.assignedTo}
                  onChange={(e) => setNewContent({...newContent, assignedTo: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택하세요</option>
                  <option value="제이">제이 (J)</option>
                  <option value="미">미</option>
                  <option value="스테피">스테피 (싸)</option>
                  <option value="조">조</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-2 justify-end">
              <button
                onClick={() => setShowNewContentModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={saveNewContent}
                disabled={!newContent.title || !newContent.topic}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};