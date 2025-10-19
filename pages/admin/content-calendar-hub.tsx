import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AdminNav from '../../components/admin/AdminNav';

interface HubContent {
  id: string;
  title: string;
  summary: string;
  content_body: string;
  content_date: string;
  blog_post_id?: number;
  sms_id?: string;
  naver_blog_id?: string;
  kakao_id?: string;
  channel_status: {
    blog: { status: string; post_id: any; created_at: string | null };
    sms: { status: string; post_id: any; created_at: string | null };
    naver_blog: { status: string; post_id: any; created_at: string | null };
    kakao: { status: string; post_id: any; created_at: string | null };
  };
  is_hub_content: boolean;
  hub_priority: number;
  auto_derive_channels: string[];
  created_at: string;
  updated_at: string;
}

interface ChannelStats {
  total: number;
  blog: { connected: number; total: number };
  sms: { connected: number; total: number };
  naver_blog: { connected: number; total: number };
  kakao: { connected: number; total: number };
}

export default function ContentCalendarHub() {
  const { data: session, status } = useSession();
  const [contents, setContents] = useState<HubContent[]>([]);
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 페이지네이션 상태
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  
  // 새 허브 콘텐츠 생성 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContent, setNewContent] = useState({
    title: '',
    summary: '',
    content_body: '',
    content_date: new Date().toISOString().split('T')[0]
  });
  
  // 편집 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContent, setEditingContent] = useState<HubContent | null>(null);

  // 연간 콘텐츠 자동생성 상태
  const [showAnnualModal, setShowAnnualModal] = useState(false);
  const [isGeneratingAnnual, setIsGeneratingAnnual] = useState(false);
  const [generatedContents, setGeneratedContents] = useState<any[]>([]);
  const [selectedContents, setSelectedContents] = useState<Set<number>>(new Set());
  const [annualSettings, setAnnualSettings] = useState({
    campaignType: '퍼널 캠페인',
    targetAudience: '시니어 골퍼',
    contentGoal: '인지',
    season: 'autumn',
    count: 12
  });

  // SMS 미리보기 상태
  const [showSMSPreview, setShowSMSPreview] = useState(false);
  const [smsPreviewContent, setSMSPreviewContent] = useState(null);

  // 허브 콘텐츠 목록 조회
  const fetchContents = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/content-calendar-hub?page=${page}&limit=20`);
      const data = await response.json();
      if (data.success) {
        setContents(data.data || []);
        setStats(data.stats || null);
        setPagination(data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasMore: false
        });
      }
    } catch (error) {
      console.error('허브 콘텐츠 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 새 허브 콘텐츠 생성
  const createContent = async () => {
    if (!newContent.title.trim() || !newContent.content_body.trim()) {
      alert('제목과 내용은 필수입니다.');
      return;
    }

    try {
      const response = await fetch('/api/admin/content-calendar-hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContent)
      });

      const result = await response.json();
      if (result.success) {
        alert('허브 콘텐츠가 생성되었습니다!');
        setShowCreateModal(false);
        setNewContent({
          title: '',
          summary: '',
          content_body: '',
          content_date: new Date().toISOString().split('T')[0]
        });
        fetchContents(1);
      } else {
        alert(`생성 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('허브 콘텐츠 생성 오류:', error);
      alert('생성 중 오류가 발생했습니다.');
    }
  };

  // 허브 콘텐츠 편집
  const editContent = (content: HubContent) => {
    setEditingContent(content);
    setShowEditModal(true);
  };

  // 연간 콘텐츠 자동생성
  const generateAnnualContent = async () => {
    setIsGeneratingAnnual(true);
    setGeneratedContents([]);
    setSelectedContents(new Set());

    try {
      const response = await fetch('/api/content-calendar/generate-hub-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annualSettings)
      });

      const result = await response.json();
      if (result.success) {
        setGeneratedContents(result.hubContents);
        alert(`✅ ${result.hubContents.length}개의 허브 콘텐츠가 생성되었습니다!`);
      } else {
        alert(`생성 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('연간 콘텐츠 생성 오류:', error);
      alert('생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingAnnual(false);
    }
  };

  // 선택된 콘텐츠를 허브에 추가
  const addSelectedContents = async () => {
    if (selectedContents.size === 0) {
      alert('추가할 콘텐츠를 선택해주세요.');
      return;
    }

    try {
      const contentsToAdd = Array.from(selectedContents).map(index => generatedContents[index]);
      
      for (const content of contentsToAdd) {
        const response = await fetch('/api/admin/content-calendar-hub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: content.title,
            summary: content.summary,
            content_body: content.overview,
            content_date: new Date().toISOString().split('T')[0]
          })
        });

        if (!response.ok) {
          throw new Error(`콘텐츠 추가 실패: ${content.title}`);
        }
      }

      alert(`✅ ${selectedContents.size}개의 콘텐츠가 허브에 추가되었습니다!`);
      setShowAnnualModal(false);
      setGeneratedContents([]);
      setSelectedContents(new Set());
      fetchContents(1);
    } catch (error) {
      console.error('콘텐츠 추가 오류:', error);
      alert('콘텐츠 추가 중 오류가 발생했습니다.');
    }
  };

  // 허브 콘텐츠 수정
  const updateContent = async () => {
    if (!editingContent?.title.trim() || !editingContent?.content_body.trim()) {
      alert('제목과 내용은 필수입니다.');
      return;
    }

    try {
      const response = await fetch('/api/admin/content-calendar-hub', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingContent.id,
          title: editingContent.title,
          summary: editingContent.summary,
          content_body: editingContent.content_body,
          content_date: editingContent.content_date
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('허브 콘텐츠가 수정되었습니다!');
        setShowEditModal(false);
        setEditingContent(null);
        fetchContents(pagination.page);
      } else {
        alert(`수정 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('허브 콘텐츠 수정 오류:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  // 허브 콘텐츠 삭제
  const deleteContent = async (contentId: string) => {
    if (!confirm('정말로 이 허브 콘텐츠를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/content-calendar-hub', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contentId })
      });

      const result = await response.json();
      if (result.success) {
        alert('허브 콘텐츠가 삭제되었습니다!');
        fetchContents(pagination.page);
      } else {
        alert(`삭제 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('허브 콘텐츠 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 채널별 초안 생성
  const createChannelDraft = async (contentId: string, channel: string) => {
    try {
      const response = await fetch('/api/admin/content-calendar-hub', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_channel_draft',
          contentId,
          channel
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`${channel} 초안이 생성되었습니다!`);
        fetchContents(pagination.page);
      } else {
        alert(`초안 생성 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('채널 초안 생성 오류:', error);
      alert('초안 생성 중 오류가 발생했습니다.');
    }
  };

  // 채널 상태 가져오기
  const getChannelStatus = (content: HubContent, channel: string) => {
    const status = content.channel_status?.[channel]?.status;
    // "미연결" 상태를 "미발행"으로 통일
    if (status === '미연결') {
      return '미발행';
    }
    return status || '미발행';
  };

  // 채널 상태 색상
  const getChannelStatusColor = (status: string) => {
    switch (status) {
      case '연결됨': return 'bg-green-100 text-green-800';
      case '수정중': return 'bg-yellow-100 text-yellow-800';
      case '미발행': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 채널별 액션 버튼 렌더링
  const getChannelActionButton = (content: HubContent, channel: string) => {
    const status = getChannelStatus(content, channel);
    
    switch (status) {
      case '미발행':
        return (
          <button
            onClick={() => handleChannelAction(content, channel, 'create')}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            초안 생성
          </button>
        );
      case '수정중':
        return (
          <div className="flex space-x-1">
            <button
              onClick={() => handleChannelAction(content, channel, 'edit')}
              className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              편집
            </button>
            <button
              onClick={() => handleChannelAction(content, channel, 'view')}
              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            >
              보기
            </button>
          </div>
        );
      case '연결됨':
        return (
          <div className="flex space-x-1">
            <button
              onClick={() => handleChannelAction(content, channel, 'view')}
              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            >
              보기
            </button>
            <button
              onClick={() => handleChannelAction(content, channel, 'edit')}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              편집
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  // 채널별 액션 처리
  const handleChannelAction = async (content: HubContent, channel: string, action: string) => {
    try {
      switch (action) {
        case 'create':
          await createChannelContent(content, channel);
          break;
        case 'edit':
          await openChannelEditor(content, channel);
          break;
        case 'view':
          await openChannelView(content, channel);
          break;
      }
    } catch (error) {
      console.error('채널 액션 오류:', error);
      alert('작업 중 오류가 발생했습니다.');
    }
  };

  // 채널별 콘텐츠 생성
  const createChannelContent = async (content: HubContent, channel: string) => {
    try {
      const response = await fetch('/api/content-calendar/generate-channel-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hubContentId: content.id,
          targetChannel: channel,
          hubContent: {
            title: content.title,
            summary: content.summary,
            overview: content.content_body
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        // SMS인 경우 실제 SMS 테이블에 저장
        if (channel === 'sms') {
          await saveSMSContent(result.channelContent, content.id);
        }
        
        alert(`✅ ${channel} 채널 콘텐츠가 생성되었습니다!`);
        // 허브 콘텐츠 목록 새로고침
        fetchContents(pagination.page);
        // 채널별 편집기 열기
        await openChannelEditor(content, channel, result.channelContent);
      } else {
        alert(`생성 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('채널 콘텐츠 생성 오류:', error);
      alert('생성 중 오류가 발생했습니다.');
    }
  };

  // SMS 콘텐츠 저장
  const saveSMSContent = async (smsContent, hubContentId) => {
    try {
      console.log('📱 SMS 콘텐츠 저장 시작:', { smsContent, hubContentId });
      
      const response = await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: smsContent.message,
          type: 'SMS300',
          status: 'draft',
          hub_content_id: hubContentId
        })
      });

      const result = await response.json();
      console.log('📱 SMS 저장 결과:', result);
      
      if (result.success) {
        // 허브 상태 동기화
        console.log('🔄 허브 상태 동기화 시작:', {
          hubContentId,
          channel: 'sms',
          channelContentId: result.smsId,
          status: '수정중'
        });
        
        const syncResponse = await fetch('/api/admin/sync-channel-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hubContentId: hubContentId,
            channel: 'sms',
            channelContentId: result.smsId,
            status: '수정중'
          })
        });

        const syncResult = await syncResponse.json();
        console.log('🔄 허브 상태 동기화 결과:', syncResult);
        
        if (syncResponse.ok) {
          console.log('✅ SMS 저장 및 허브 상태 동기화 완료');
          // 허브 콘텐츠 목록 새로고침
          fetchContents(pagination.page);
        } else {
          console.error('❌ 허브 상태 동기화 실패:', syncResult);
        }
      } else {
        console.error('❌ SMS 저장 실패:', result);
      }
    } catch (error) {
      console.error('❌ SMS 저장 오류:', error);
    }
  };

  // 채널별 편집기 열기
  const openChannelEditor = async (content: HubContent, channel: string, generatedContent?: any) => {
    // 기존 채널 콘텐츠가 있는 경우 해당 ID로 편집기 열기
    const channelContentId = getChannelContentId(content, channel);
    
    console.log('🔧 채널 편집기 열기:', {
      contentId: content.id,
      channel,
      channelContentId,
      channelStatus: content.channel_status?.[channel],
      blogPostId: content.blog_post_id,
      smsId: content.sms_id
    });
    
    const channelUrls = {
      blog: channelContentId ? `/admin/blog?id=${channelContentId}` : `/admin/blog?hub=${content.id}&title=${encodeURIComponent(content.title)}&summary=${encodeURIComponent(content.summary)}`,
      sms: channelContentId ? `/admin/sms?id=${channelContentId}&hub=${content.id}` : `/admin/sms?hub=${content.id}&title=${encodeURIComponent(content.title)}&summary=${encodeURIComponent(content.summary)}`,
      naver_blog: channelContentId ? `/admin/naver-blog?id=${channelContentId}` : `/admin/naver-blog?hub=${content.id}&title=${encodeURIComponent(content.title)}&summary=${encodeURIComponent(content.summary)}`,
      kakao: channelContentId ? `/admin/kakao?id=${channelContentId}` : `/admin/kakao?hub=${content.id}&title=${encodeURIComponent(content.title)}&summary=${encodeURIComponent(content.summary)}`
    };

    const url = channelUrls[channel];
    console.log('🔧 생성된 URL:', url);
    
    if (url) {
      window.open(url, '_blank');
    } else {
      alert(`${channel} 채널 편집기는 준비 중입니다.`);
    }
  };

  // 채널별 콘텐츠 ID 가져오기
  const getChannelContentId = (content: HubContent, channel: string) => {
    // channel_status JSONB에서 post_id 가져오기
    const channelStatus = content.channel_status?.[channel];
    if (channelStatus?.post_id) {
      return channelStatus.post_id;
    }
    
    // 기존 방식도 유지 (fallback)
    switch (channel) {
      case 'blog': return content.blog_post_id;
      case 'sms': return content.sms_id;
      case 'naver_blog': return content.naver_blog_id;
      case 'kakao': return content.kakao_id;
      default: return null;
    }
  };

  // 채널별 콘텐츠 보기
  const openChannelView = async (content: HubContent, channel: string) => {
    if (channel === 'sms') {
      // SMS의 경우 모바일 미리보기 팝업 표시
      await showSMSMobilePreview(content);
      return;
    }

    const channelUrls = {
      blog: content.blog_post_id ? `/blog/${content.blog_post_id}` : null,
      sms: content.sms_id ? `/sms/${content.sms_id}` : null,
      naver_blog: content.naver_blog_id ? `/naver-blog/${content.naver_blog_id}` : null,
      kakao: content.kakao_id ? `/kakao/${content.kakao_id}` : null
    };

    const url = channelUrls[channel];
    if (url) {
      window.open(url, '_blank');
    } else {
      alert(`${channel} 채널 콘텐츠를 찾을 수 없습니다.`);
    }
  };

  // SMS 모바일 미리보기 표시
  const showSMSMobilePreview = async (content: HubContent) => {
    try {
      // channel_status에서 SMS ID 가져오기
      const smsId = content.channel_status?.sms?.post_id;
      
      console.log('📱 SMS 미리보기 요청:', { contentId: content.id, smsId, channelStatus: content.channel_status });
      
      if (!smsId) {
        alert('SMS 콘텐츠를 찾을 수 없습니다.');
        return;
      }
      
      // SMS ID로 직접 조회
      const response = await fetch(`/api/admin/sms?id=${smsId}`);
      const result = await response.json();
      
      console.log('📱 SMS 조회 결과:', result);
      console.log('📱 SMS 콘텐츠 상세:', result.smsContent);
      
      if (result.success && result.smsContent) {
        // 모바일 미리보기 모달 표시
        setShowSMSPreview(true);
        setSMSPreviewContent(result.smsContent);
        console.log('📱 SMS 미리보기 모달 표시됨');
      } else {
        console.error('📱 SMS 콘텐츠 조회 실패:', result);
        alert('SMS 콘텐츠를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('SMS 미리보기 오류:', error);
      alert('SMS 미리보기를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    fetchContents(newPage);
  };

  useEffect(() => {
    if (session) {
      fetchContents(1);
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
              <h1 className="text-3xl font-bold text-gray-900">콘텐츠 허브</h1>
              <p className="mt-2 text-gray-600">멀티 채널 콘텐츠 허브 관리 시스템</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAnnualModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                📅 연간 콘텐츠 자동생성
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                새 허브 콘텐츠 생성
              </button>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">총 허브 콘텐츠</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{stats.blog.connected}</div>
              <div className="text-sm text-gray-600">홈피블로그 연결</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{stats.sms.connected}</div>
              <div className="text-sm text-gray-600">SMS 연결</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{stats.naver_blog.connected}</div>
              <div className="text-sm text-gray-600">네이버 블로그 연결</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-yellow-600">{stats.kakao.connected}</div>
              <div className="text-sm text-gray-600">카카오 연결</div>
            </div>
          </div>
        )}

        {/* 허브 콘텐츠 목록 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">허브 콘텐츠 목록</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요약</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">채널별 상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">로딩 중...</td>
                  </tr>
                ) : contents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">허브 콘텐츠가 없습니다.</td>
                  </tr>
                ) : (
                  contents.map((content) => (
                    <tr key={content.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{content.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {content.summary || content.content_body?.substring(0, 50) + '...' || '내용 없음'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {content.content_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          {/* 블로그 채널 */}
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChannelStatusColor(getChannelStatus(content, 'blog'))}`}>
                              홈피: {getChannelStatus(content, 'blog')}
                            </span>
                            {getChannelActionButton(content, 'blog')}
                          </div>
                          
                          {/* SMS 채널 */}
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChannelStatusColor(getChannelStatus(content, 'sms'))}`}>
                              SMS: {getChannelStatus(content, 'sms')}
                            </span>
                            {getChannelActionButton(content, 'sms')}
                          </div>
                          
                          {/* 네이버 채널 */}
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChannelStatusColor(getChannelStatus(content, 'naver_blog'))}`}>
                              네이버: {getChannelStatus(content, 'naver_blog')}
                            </span>
                            {getChannelActionButton(content, 'naver_blog')}
                          </div>
                          
                          {/* 카카오 채널 */}
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChannelStatusColor(getChannelStatus(content, 'kakao'))}`}>
                              카카오: {getChannelStatus(content, 'kakao')}
                            </span>
                            {getChannelActionButton(content, 'kakao')}
                          </div>
                        </div>
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
          
          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasMore}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    총 <span className="font-medium">{pagination.total}</span>개 중{' '}
                    <span className="font-medium">
                      {((pagination.page - 1) * pagination.limit) + 1}
                    </span>
                    -
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>
                    개 표시
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">이전</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* 페이지 번호들 */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const startPage = Math.max(1, pagination.page - 2);
                      const pageNum = startPage + i;
                      if (pageNum > pagination.totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasMore}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">다음</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 새 허브 콘텐츠 생성 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">새 허브 콘텐츠 생성</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                    <input
                      type="text"
                      value={newContent.title}
                      onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="허브 콘텐츠 제목을 입력하세요"
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">허브 콘텐츠 편집</h3>
                
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

        {/* 연간 콘텐츠 자동생성 모달 */}
        {showAnnualModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📅 연간 콘텐츠 자동생성</h2>
                <button
                  onClick={() => setShowAnnualModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* 생성 설정 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">캠페인 유형</label>
                  <select
                    value={annualSettings.campaignType}
                    onChange={(e) => setAnnualSettings({...annualSettings, campaignType: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="퍼널 캠페인">퍼널 캠페인</option>
                    <option value="스토리텔링 캠페인">스토리텔링 캠페인</option>
                    <option value="계절별 캠페인">계절별 캠페인</option>
                    <option value="혼합">혼합 (퍼널 + 스토리 + 계절)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">타겟 오디언스</label>
                  <select
                    value={annualSettings.targetAudience}
                    onChange={(e) => setAnnualSettings({...annualSettings, targetAudience: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="시니어 골퍼">시니어 골퍼</option>
                    <option value="중급자 골퍼">중급자 골퍼</option>
                    <option value="초보자 골퍼">초보자 골퍼</option>
                    <option value="전체">전체</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">콘텐츠 목표</label>
                  <select
                    value={annualSettings.contentGoal}
                    onChange={(e) => setAnnualSettings({...annualSettings, contentGoal: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="인지">인지</option>
                    <option value="고려">고려</option>
                    <option value="전환">전환</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">계절</label>
                  <select
                    value={annualSettings.season}
                    onChange={(e) => setAnnualSettings({...annualSettings, season: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="spring">봄</option>
                    <option value="summer">여름</option>
                    <option value="autumn">가을</option>
                    <option value="winter">겨울</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">생성 개수</label>
                  <select
                    value={annualSettings.count}
                    onChange={(e) => setAnnualSettings({...annualSettings, count: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={6}>6개</option>
                    <option value={12}>12개</option>
                    <option value={24}>24개</option>
                    <option value={36}>36개</option>
                  </select>
                </div>
              </div>

              {/* 생성 버튼 */}
              <div className="mb-6">
                <button
                  onClick={generateAnnualContent}
                  disabled={isGeneratingAnnual}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingAnnual ? '🤖 AI 생성 중...' : '🚀 허브 콘텐츠 생성하기'}
                </button>
              </div>

              {/* 생성된 콘텐츠 목록 */}
              {generatedContents.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    생성된 콘텐츠 ({generatedContents.length}개)
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {generatedContents.map((content, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedContents.has(index)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedContents);
                              if (e.target.checked) {
                                newSelected.add(index);
                              } else {
                                newSelected.delete(index);
                              }
                              setSelectedContents(newSelected);
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">{content.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{content.summary}</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {content.blogCategory}
                              </span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {content.seasonalTheme}
                              </span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                {content.storyFramework}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex justify-between">
                <button
                  onClick={() => setShowAnnualModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  취소
                </button>
                {generatedContents.length > 0 && (
                  <button
                    onClick={addSelectedContents}
                    disabled={selectedContents.size === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    선택된 {selectedContents.size}개 콘텐츠 허브에 추가
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SMS 모바일 미리보기 모달 */}
        {showSMSPreview && smsPreviewContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">📱 SMS 모바일 미리보기</h2>
                <button
                  onClick={() => setShowSMSPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* 심플한 모바일 미리보기 (편집기와 동일) */}
              <div className="bg-blue-600 rounded-lg p-4 mb-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">M</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">마쓰구골프</div>
                      <div className="text-xs text-gray-500">031-215-3990</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-800">
                    {smsPreviewContent.message_text && (
                      <div className="whitespace-pre-wrap">{smsPreviewContent.message_text}</div>
                    )}
                    {!smsPreviewContent.message_text && smsPreviewContent.message && (
                      <div className="whitespace-pre-wrap">{smsPreviewContent.message}</div>
                    )}
                    {!smsPreviewContent.message_text && !smsPreviewContent.message && (
                      <div className="text-gray-400">메시지 내용이 없습니다.</div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-3">
                    {new Date().toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowSMSPreview(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    window.open(`/admin/sms?id=${smsPreviewContent.id}`, '_blank');
                    setShowSMSPreview(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  편집하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
