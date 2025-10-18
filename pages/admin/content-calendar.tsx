import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import { useSession } from 'next-auth/react';

// 채널 상태 컴포넌트
const ChannelStatus = ({ channel, status, postId, onAction }: {
  channel: string;
  status: string;
  postId?: string;
  onAction: (action: string) => void;
}) => {
  const getStatusInfo = (status: string) => {
    switch(status) {
      case '미발행': 
        return { 
          color: 'bg-gray-100 text-gray-600', 
          action: '초안생성',
          actionColor: 'bg-blue-500 hover:bg-blue-600'
        };
      case '수정중': 
        return { 
          color: 'bg-yellow-100 text-yellow-600', 
          action: '편집',
          actionColor: 'bg-yellow-500 hover:bg-yellow-600'
        };
      case '발행': 
        return { 
          color: 'bg-green-100 text-green-600', 
          action: '보기',
          actionColor: 'bg-green-500 hover:bg-green-600'
        };
      default: 
        return { 
          color: 'bg-gray-100 text-gray-600', 
          action: '초안생성',
          actionColor: 'bg-blue-500 hover:bg-blue-600'
        };
    }
  };

  const { color, action, actionColor } = getStatusInfo(status);
  
  return (
    <div className="flex flex-col items-center space-y-2 min-w-[80px]">
      <span className="text-xs font-medium text-gray-700">{channel}</span>
      <span className={`px-2 py-1 text-xs rounded-full ${color}`}>
        {status}
      </span>
      <button 
        onClick={() => onAction(action)}
        className={`px-2 py-1 text-xs text-white rounded ${actionColor}`}
      >
        {action}
      </button>
    </div>
  );
};

export default function ContentCalendarSimple() {
  const { data: session, status } = useSession();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 허브 기능 상태
  const [showHubSection, setShowHubSection] = useState(false);
  const [hubTitle, setHubTitle] = useState('');
  const [hubSummary, setHubSummary] = useState('');
  const [hubOverview, setHubOverview] = useState('');
  const [isCreatingHub, setIsCreatingHub] = useState(false);
  
  // 편집 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editOverview, setEditOverview] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (session) {
      fetchContents();
    }
  }, [session]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/content-calendar?page=1&limit=50');
      if (response.ok) {
        const data = await response.json();
        setContents(data.contents || []);
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 허브 콘텐츠 생성
  const createHubContent = async () => {
    if (!hubTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!hubSummary.trim()) {
      alert('요약을 입력해주세요.');
      return;
    }

    if (!hubOverview.trim()) {
      alert('간단한 개요를 입력해주세요.');
      return;
    }

    setIsCreatingHub(true);
    try {
      const response = await fetch('/api/admin/content-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: hubTitle,
          summary: hubSummary,
          content_body: hubOverview,
          content_type: 'hub',
          is_hub_content: true,
          hub_priority: 1,
          auto_derive_channels: ['blog', 'naver_blog', 'sms']
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('허브 콘텐츠가 생성되었습니다!');
        setHubTitle('');
        setHubSummary('');
        setHubOverview('');
        setShowHubSection(false);
        fetchContents(); // 목록 새로고침
      } else {
        alert('허브 콘텐츠 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('허브 콘텐츠 생성 오류:', error);
      alert('허브 콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreatingHub(false);
    }
  };

  // 콘텐츠 편집 함수
  const editContent = (contentId: string) => {
    const content = contents.find(c => c.id === contentId);
    if (content) {
      setEditingContent(content);
      setEditTitle(content.title);
      setEditSummary(content.summary || '');
      setEditOverview(content.content_body || '');
      setShowEditModal(true);
    }
  };

  // 블로그 동기화 함수
  const syncToBlog = async (contentId: string) => {
    try {
      const response = await fetch('/api/admin/content-calendar', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync_calendar_to_blog',
          contentId: contentId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('블로그로 동기화되었습니다!');
        fetchContents(); // 데이터 새로고침
      } else {
        alert(`동기화 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('블로그 동기화 오류:', error);
      alert('동기화 중 오류가 발생했습니다.');
    }
  };

  // 채널별 상태 가져오기
  const getChannelStatus = (content: any, channel: string) => {
    const channelData = content.channel_status?.[channel];
    if (!channelData || !channelData.post_id) {
      return '미발행';
    }
    return channelData.status || '미발행';
  };

  // 채널별 액션 처리
  const handleChannelAction = async (contentId: string, channel: string, action: string) => {
    try {
      switch(action) {
        case '초안생성':
          if (channel === 'homepage_blog') {
            await createBlogDraft(contentId);
          } else {
            await createChannelDraft(contentId, channel);
          }
          break;
        case '편집':
          await openChannelEditor(contentId, channel);
          break;
        case '보기':
          await openChannelView(contentId, channel);
          break;
      }
    } catch (error) {
      console.error('채널 액션 오류:', error);
      alert('작업 중 오류가 발생했습니다.');
    }
  };

  // 채널 초안 생성
  const createChannelDraft = async (contentId: string, channel: string) => {
    try {
      const response = await fetch('/api/admin/content-calendar', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_channel_draft',
          contentId: contentId,
          channel: channel
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`${channel} 초안이 생성되었습니다!`);
        fetchContents();
      } else {
        alert(`초안 생성 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('채널 초안 생성 오류:', error);
      alert('초안 생성 중 오류가 발생했습니다.');
    }
  };

  // 채널 편집기 열기
  const openChannelEditor = async (contentId: string, channel: string) => {
    const content = contents.find(c => c.id === contentId);
    const channelData = content?.channel_status?.[channel];
    
    if (!channelData?.post_id) {
      alert('먼저 초안을 생성해주세요.');
      return;
    }

    // 채널별 편집 페이지로 이동
    switch(channel) {
      case 'homepage_blog':
        window.open(`/admin/blog?edit=${channelData.post_id}`);
        break;
      case 'sms':
        window.open(`/admin/sms?edit=${channelData.post_id}`);
        break;
      case 'naver_blog':
        window.open(`/admin/naver-blog?edit=${channelData.post_id}`);
        break;
      case 'kakao':
        window.open(`/admin/kakao?edit=${channelData.post_id}`);
        break;
    }
  };

  // 채널 보기
  const openChannelView = async (contentId: string, channel: string) => {
    const content = contents.find(c => c.id === contentId);
    const channelData = content?.channel_status?.[channel];
    
    if (!channelData?.post_id) {
      alert('게시된 콘텐츠가 없습니다.');
      return;
    }

    // 채널별 보기 페이지로 이동
    switch(channel) {
      case 'homepage_blog':
        window.open(`/blog/${channelData.post_id}`);
        break;
      case 'sms':
        window.open(`/admin/sms/view/${channelData.post_id}`);
        break;
      case 'naver_blog':
        window.open(`/admin/naver-blog/view/${channelData.post_id}`);
        break;
      case 'kakao':
        window.open(`/admin/kakao/view/${channelData.post_id}`);
        break;
    }
  };

  // 블로그 초안 생성 함수
  const createBlogDraft = async (contentId: string) => {
    try {
      const response = await fetch('/api/admin/content-calendar', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_blog_draft',
          contentId: contentId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('블로그 초안이 생성되었습니다!');
        fetchContents(); // 데이터 새로고침
      } else {
        alert(`초안 생성 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('블로그 초안 생성 오류:', error);
      alert('초안 생성 중 오류가 발생했습니다.');
    }
  };

  // 콘텐츠 업데이트
  const updateContent = async () => {
    if (!editingContent || !editTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!editSummary.trim()) {
      alert('요약을 입력해주세요.');
      return;
    }

    if (!editOverview.trim()) {
      alert('간단한 개요를 입력해주세요.');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/content-calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingContent.id,
          title: editTitle,
          summary: editSummary,
          content_body: editOverview,
          status: editingContent.status
        })
      });

      if (response.ok) {
        alert('콘텐츠가 수정되었습니다!');
        setShowEditModal(false);
        setEditingContent(null);
        setEditTitle('');
        setEditSummary('');
        setEditOverview('');
        fetchContents(); // 목록 새로고침
      } else {
        alert('콘텐츠 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('콘텐츠 수정 오류:', error);
      alert('콘텐츠 수정 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 콘텐츠 삭제
  const deleteContent = async (contentId: string) => {
    if (!confirm('정말로 이 콘텐츠를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/content-calendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contentId })
      });

      if (response.ok) {
        alert('콘텐츠가 삭제되었습니다!');
        fetchContents(); // 목록 새로고침
      } else {
        alert('콘텐츠 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('콘텐츠 삭제 오류:', error);
      alert('콘텐츠 삭제 중 오류가 발생했습니다.');
    }
  };

  // 채널 파생 함수
  const deriveToChannel = async (contentId: string, channel: string) => {
    try {
      const response = await fetch('/api/admin/content-hub/derive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          channel,
          action: 'create'
        })
      });

      if (response.ok) {
        alert(`${channel} 채널로 파생되었습니다!`);
        fetchContents();
      } else {
        alert(`${channel} 채널 파생에 실패했습니다.`);
      }
    } catch (error) {
      console.error('채널 파생 오류:', error);
      alert('채널 파생 중 오류가 발생했습니다.');
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">인증 확인 중...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>콘텐츠 캘린더 (심플) - 관리자</title>
      </Head>
      
      <AdminNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">콘텐츠 캘린더 (허브 시스템)</h1>
          <p className="mt-2 text-gray-600">총 {contents.length}개 콘텐츠</p>
        </div>

        {/* 허브 기능 섹션 */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-800">🎯 허브 콘텐츠 관리</h2>
            <button
              onClick={() => setShowHubSection(!showHubSection)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showHubSection ? '접기' : '허브 콘텐츠 생성'}
            </button>
          </div>
          
          {showHubSection && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  허브 콘텐츠 제목
                </label>
                <input
                  type="text"
                  value={hubTitle}
                  onChange={(e) => setHubTitle(e.target.value)}
                  placeholder="허브 콘텐츠 제목을 입력하세요"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  요약 (다른 채널 활용용)
                </label>
                <textarea
                  value={hubSummary}
                  onChange={(e) => setHubSummary(e.target.value)}
                  placeholder="SMS, 네이버 블로그 등에서 활용할 요약 내용을 입력하세요"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  이 요약은 SMS, 네이버 블로그 등 다른 채널에서 활용됩니다.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  간단한 개요
                </label>
                <textarea
                  value={hubOverview}
                  onChange={(e) => setHubOverview(e.target.value)}
                  placeholder="허브 콘텐츠의 간단한 개요를 입력하세요"
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={createHubContent}
                  disabled={isCreatingHub}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreatingHub ? '생성 중...' : '허브 콘텐츠 생성'}
                </button>
                <button
                  onClick={() => {
                    setHubTitle('');
                    setHubContent('');
                    setShowHubSection(false);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">편집</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">채널별 상태</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contents.map((content: any) => (
                  <tr key={content.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{content.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{content.content_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{content.content_date}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => editContent(content.id)}
                        className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        편집
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4">
                        <ChannelStatus 
                          channel="홈피블로그" 
                          status={getChannelStatus(content, 'homepage_blog')}
                          postId={content.channel_status?.homepage_blog?.post_id}
                          onAction={(action) => handleChannelAction(content.id, 'homepage_blog', action)}
                        />
                        <ChannelStatus 
                          channel="SMS" 
                          status={getChannelStatus(content, 'sms')}
                          postId={content.channel_status?.sms?.campaign_id}
                          onAction={(action) => handleChannelAction(content.id, 'sms', action)}
                        />
                        <ChannelStatus 
                          channel="네이버" 
                          status={getChannelStatus(content, 'naver_blog')}
                          postId={content.channel_status?.naver_blog?.post_id}
                          onAction={(action) => handleChannelAction(content.id, 'naver_blog', action)}
                        />
                        <ChannelStatus 
                          channel="카카오톡" 
                          status={getChannelStatus(content, 'kakao')}
                          postId={content.channel_status?.kakao?.post_id}
                          onAction={(action) => handleChannelAction(content.id, 'kakao', action)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 편집 모달 */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
              <h3 className="text-lg font-semibold mb-4">콘텐츠 편집</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="허브 콘텐츠 제목을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    요약 (다른 채널 활용용)
                  </label>
                  <textarea
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="SMS, 네이버 블로그 등에서 활용할 요약 내용을 입력하세요"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    이 요약은 SMS, 네이버 블로그 등 다른 채널에서 활용됩니다.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    간단한 개요
                  </label>
                  <textarea
                    value={editOverview}
                    onChange={(e) => setEditOverview(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="허브 콘텐츠의 간단한 개요를 입력하세요"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={updateContent}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? '수정 중...' : '수정'}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingContent(null);
                    setEditTitle('');
                    setEditContentBody('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (editingContent) {
                      deleteContent(editingContent.id);
                      setShowEditModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

