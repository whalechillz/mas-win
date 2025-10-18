import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AdminNav from '../../components/admin/AdminNav';

export default function ContentCalendarNew() {
  const { data: session, status } = useSession();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 새 콘텐츠 생성 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContent, setNewContent] = useState({
    title: '',
    summary: '',
    content_body: '',
    content_type: 'hub',
    content_date: new Date().toISOString().split('T')[0],
    is_hub_content: true,
    hub_priority: 1,
    auto_derive_channels: ['blog', 'sms', 'naver_blog']
  });
  
  // 편집 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);

  // 콘텐츠 목록 조회
  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/content-calendar-simple');
      const data = await response.json();
      if (data.success) {
        setContents(data.data || data.contents || []);
      }
    } catch (error) {
      console.error('콘텐츠 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 새 콘텐츠 생성
  const createContent = async () => {
    if (!newContent.title.trim() || !newContent.summary.trim() || !newContent.content_body.trim()) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/admin/content-calendar-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContent)
      });

      const result = await response.json();
      if (result.success) {
        alert('콘텐츠가 생성되었습니다!');
        setShowCreateModal(false);
        setNewContent({
          title: '',
          summary: '',
          content_body: '',
          content_type: 'hub',
          content_date: new Date().toISOString().split('T')[0],
          is_hub_content: true,
          hub_priority: 1,
          auto_derive_channels: ['blog', 'sms', 'naver_blog']
        });
        fetchContents();
      } else {
        alert(`생성 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('콘텐츠 생성 오류:', error);
      alert('생성 중 오류가 발생했습니다.');
    }
  };

  // 콘텐츠 편집
  const editContent = (content) => {
    setEditingContent(content);
    setShowEditModal(true);
  };

  // 콘텐츠 수정
  const updateContent = async () => {
    if (!editingContent.title.trim() || !editingContent.summary.trim() || !editingContent.content_body.trim()) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/admin/content-calendar-simple', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingContent.id,
          title: editingContent.title,
          summary: editingContent.summary,
          content_body: editingContent.content_body,
          content_type: editingContent.content_type,
          content_date: editingContent.content_date,
          status: editingContent.status
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('콘텐츠가 수정되었습니다!');
        setShowEditModal(false);
        setEditingContent(null);
        fetchContents();
      } else {
        alert(`수정 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('콘텐츠 수정 오류:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  // 콘텐츠 삭제
  const deleteContent = async (contentId) => {
    if (!confirm('정말로 이 콘텐츠를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/content-calendar-simple', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contentId })
      });

      const result = await response.json();
      if (result.success) {
        alert('콘텐츠가 삭제되었습니다!');
        fetchContents();
      } else {
        alert(`삭제 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('콘텐츠 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (session) {
      fetchContents();
    }
  }, [session]);

  if (status === 'loading') return <div>로딩 중...</div>;
  if (!session) return <div>로그인이 필요합니다.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">콘텐츠 캘린더 (새 버전)</h1>
              <p className="mt-2 text-gray-600">멀티 채널 콘텐츠 허브 관리 - 핵심 필드만</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              새 콘텐츠 생성
            </button>
          </div>
        </div>

        {/* 콘텐츠 목록 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">콘텐츠 목록</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요약</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">타입</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">로딩 중...</td>
                  </tr>
                ) : contents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">콘텐츠가 없습니다.</td>
                  </tr>
                ) : (
                  contents.map((content) => (
                    <tr key={content.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{content.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{content.summary || '요약 없음'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {content.content_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {content.content_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          content.status === 'published' ? 'bg-green-100 text-green-800' :
                          content.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {content.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => editContent(content)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => deleteContent(content.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 새 콘텐츠 생성 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">새 콘텐츠 생성</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                    <input
                      type="text"
                      value={newContent.title}
                      onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="콘텐츠 제목을 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">요약 (다른 채널 활용용)</label>
                    <textarea
                      value={newContent.summary}
                      onChange={(e) => setNewContent({...newContent, summary: e.target.value})}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="SMS, 네이버 블로그 등에서 활용할 요약 내용을 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">간단한 개요</label>
                    <textarea
                      value={newContent.content_body}
                      onChange={(e) => setNewContent({...newContent, content_body: e.target.value})}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="허브 콘텐츠의 간단한 개요를 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">콘텐츠 날짜</label>
                    <input
                      type="date"
                      value={newContent.content_date}
                      onChange={(e) => setNewContent({...newContent, content_date: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={createContent}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    생성
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 편집 모달 */}
        {showEditModal && editingContent && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">콘텐츠 편집</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                    <input
                      type="text"
                      value={editingContent.title}
                      onChange={(e) => setEditingContent({...editingContent, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">요약 (다른 채널 활용용)</label>
                    <textarea
                      value={editingContent.summary || ''}
                      onChange={(e) => setEditingContent({...editingContent, summary: e.target.value})}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">간단한 개요</label>
                    <textarea
                      value={editingContent.content_body || ''}
                      onChange={(e) => setEditingContent({...editingContent, content_body: e.target.value})}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">콘텐츠 날짜</label>
                    <input
                      type="date"
                      value={editingContent.content_date}
                      onChange={(e) => setEditingContent({...editingContent, content_date: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                    <select
                      value={editingContent.status}
                      onChange={(e) => setEditingContent({...editingContent, status: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="draft">초안</option>
                      <option value="published">발행</option>
                      <option value="archived">보관</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={updateContent}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
