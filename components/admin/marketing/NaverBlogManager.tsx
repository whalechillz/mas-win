import React, { useState, useEffect } from 'react';

// SVG 아이콘 컴포넌트들
const Link = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const Eye = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const RefreshCw = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const Upload = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const FileText = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const Calendar = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TrendingUp = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const AlertCircle = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircle = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface NaverBlogPost {
  id: string;
  blog_content_id?: string;
  naver_blog_url?: string;
  view_count: number;
  last_view_check?: string;
  comment_count: number;
  like_count: number;
  published_at?: string;
  published_by?: string;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  content?: {
    title: string;
    scheduled_date: string;
    status: string;
  };
}

interface NaverBlogManagerProps {
  supabase: any;
}

export const NaverBlogManager: React.FC<NaverBlogManagerProps> = ({ supabase }) => {
  const [naverPosts, setNaverPosts] = useState<NaverBlogPost[]>([]);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [viewHistory, setViewHistory] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<NaverBlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'published' | 'pending' | 'analytics'>('published');
  
  // 입력 상태
  const [urlInput, setUrlInput] = useState('');
  const [viewCountInput, setViewCountInput] = useState('');
  const [bulkUpdateMode, setBulkUpdateMode] = useState(false);
  const [bulkData, setBulkData] = useState<any[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadNaverPosts(),
        loadPendingPosts(),
        loadViewHistory()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadNaverPosts = async () => {
    const { data, error } = await supabase
      .from('naver_blog_posts')
      .select(`
        *,
        content:blog_contents(title, scheduled_date, status)
      `)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setNaverPosts(data);
    }
  };

  const loadPendingPosts = async () => {
    // 네이버 플랫폼으로 예정된 콘텐츠 중 아직 URL이 등록되지 않은 것들
    const { data: platforms } = await supabase
      .from('blog_platforms')
      .select('id')
      .eq('type', 'naver')
      .single();
    
    if (platforms) {
      const { data, error } = await supabase
        .from('blog_contents')
        .select('*')
        .eq('platform_id', platforms.id)
        .eq('status', 'scheduled')
        .not('id', 'in', `(select blog_content_id from naver_blog_posts where blog_content_id is not null)`)
        .order('scheduled_date', { ascending: true });
      
      if (!error && data) {
        setPendingPosts(data);
      }
    }
  };

  const loadViewHistory = async () => {
    const { data, error } = await supabase
      .from('blog_view_history')
      .select('*')
      .order('recorded_date', { ascending: false })
      .limit(100);
    
    if (!error && data) {
      setViewHistory(data);
    }
  };

  const handleRegisterPost = async (contentId: string) => {
    if (!urlInput) {
      alert('네이버 블로그 URL을 입력해주세요.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('naver_blog_posts')
        .insert({
          blog_content_id: contentId,
          naver_blog_url: urlInput,
          published_at: new Date(),
          view_count: 0
        });

      if (!error) {
        // blog_contents 상태도 업데이트
        await supabase
          .from('blog_contents')
          .update({ status: 'published' })
          .eq('id', contentId);

        setUrlInput('');
        await loadAllData();
        alert('네이버 블로그 발행이 등록되었습니다.');
      }
    } catch (error) {
      console.error('등록 오류:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateViewCount = async (postId: string) => {
    if (!viewCountInput) {
      alert('조회수를 입력해주세요.');
      return;
    }

    try {
      const viewCount = parseInt(viewCountInput);
      
      // naver_blog_posts 업데이트
      const { error: updateError } = await supabase
        .from('naver_blog_posts')
        .update({
          view_count: viewCount,
          last_view_check: new Date()
        })
        .eq('id', postId);

      if (!updateError) {
        // 히스토리 기록
        await supabase
          .from('blog_view_history')
          .insert({
            naver_blog_post_id: postId,
            recorded_date: new Date().toISOString().split('T')[0],
            view_count: viewCount
          });

        setViewCountInput('');
        await loadAllData();
        alert('조회수가 업데이트되었습니다.');
      }
    } catch (error) {
      console.error('업데이트 오류:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleBulkUpdate = async () => {
    try {
      // 여러 포스트의 조회수를 한 번에 업데이트
      for (const item of bulkData) {
        if (item.viewCount) {
          await supabase
            .from('naver_blog_posts')
            .update({
              view_count: item.viewCount,
              last_view_check: new Date()
            })
            .eq('id', item.id);

          await supabase
            .from('blog_view_history')
            .insert({
              naver_blog_post_id: item.id,
              recorded_date: new Date().toISOString().split('T')[0],
              view_count: item.viewCount
            });
        }
      }
      
      setBulkUpdateMode(false);
      setBulkData([]);
      await loadAllData();
      alert('일괄 업데이트가 완료되었습니다.');
    } catch (error) {
      console.error('일괄 업데이트 오류:', error);
      alert('일괄 업데이트 중 오류가 발생했습니다.');
    }
  };

  // AI 글감 생성 예시 함수 (실제로는 OpenAI API 등을 사용)
  const generateAIContent = async (topic: string) => {
    // TODO: OpenAI API 연동
    const suggestions = {
      title: `${topic}에 대한 시니어 골퍼를 위한 완벽 가이드`,
      content: `${topic}은 시니어 골퍼에게 매우 중요한 주제입니다. 오늘은 이에 대해 자세히 알아보겠습니다...`,
      keywords: [topic, '시니어골프', 'MASGOLF', '드라이버추천']
    };
    return suggestions;
  };

  // 조회수 스크래핑 함수 (예시)
  const scrapeViewCount = async (url: string) => {
    // 주의: 실제 구현 시 네이버 이용약관 확인 필요
    // 1. 서버사이드 프록시 사용 권장
    // 2. 적절한 딜레이와 User-Agent 설정
    // 3. robots.txt 준수
    
    // 예시 코드:
    // const response = await fetch('/api/scrape-naver', {
    //   method: 'POST',
    //   body: JSON.stringify({ url })
    // });
    // const data = await response.json();
    // return data.viewCount;
    
    console.log('조회수 스크래핑은 서버사이드에서 구현 필요');
  };

  const exportToExcel = () => {
    // CSV 형식으로 내보내기
    const headers = ['제목', 'URL', '조회수', '마지막 확인', '발행일'];
    const rows = naverPosts.map(post => [
      post.content?.title || '',
      post.naver_blog_url || '',
      post.view_count,
      post.last_view_check ? new Date(post.last_view_check).toLocaleDateString() : '',
      post.published_at ? new Date(post.published_at).toLocaleDateString() : ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `네이버블로그_조회수_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (post: NaverBlogPost) => {
    if (!post.naver_blog_url) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">URL 미등록</span>;
    }
    if (!post.last_view_check) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-600 text-xs rounded-full">조회수 미확인</span>;
    }
    const daysSinceCheck = Math.floor((Date.now() - new Date(post.last_view_check).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCheck > 7) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">업데이트 필요</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">최신</span>;
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">N</span>
              네이버 블로그 관리
            </h3>
            <p className="text-gray-600 mt-1">네이버 블로그 발행 및 조회수를 관리합니다</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              데이터 가져오기
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              엑셀 내보내기
            </button>
            <button
              onClick={() => setBulkUpdateMode(!bulkUpdateMode)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              일괄 업데이트
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm">총 발행 수</p>
                <p className="text-2xl font-bold text-blue-900">
                  {naverPosts.filter(p => p.naver_blog_url).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm">총 조회수</p>
                <p className="text-2xl font-bold text-green-900">
                  {naverPosts.reduce((sum, p) => sum + p.view_count, 0).toLocaleString()}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm">평균 조회수</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {naverPosts.length > 0 
                    ? Math.round(naverPosts.reduce((sum, p) => sum + p.view_count, 0) / naverPosts.length)
                    : 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm">대기 중</p>
                <p className="text-2xl font-bold text-purple-900">{pendingPosts.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('published')}
            className={`pb-3 px-1 font-medium text-sm transition-all ${
              activeTab === 'published'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            발행된 콘텐츠
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-1 font-medium text-sm transition-all ${
              activeTab === 'pending'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            발행 대기
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 px-1 font-medium text-sm transition-all ${
              activeTab === 'analytics'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            성과 분석
          </button>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      {activeTab === 'published' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {bulkUpdateMode ? (
            <div className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">일괄 조회수 업데이트</h4>
              <div className="space-y-3">
                {naverPosts.map(post => (
                  <div key={post.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{post.content?.title || 'N/A'}</p>
                      <p className="text-sm text-gray-500">현재 조회수: {post.view_count}</p>
                    </div>
                    <input
                      type="number"
                      placeholder="새 조회수"
                      className="w-32 px-3 py-2 border rounded-lg"
                      onChange={(e) => {
                        const newData = [...bulkData];
                        const index = newData.findIndex(item => item.id === post.id);
                        if (index >= 0) {
                          newData[index].viewCount = parseInt(e.target.value);
                        } else {
                          newData.push({ id: post.id, viewCount: parseInt(e.target.value) });
                        }
                        setBulkData(newData);
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={handleBulkUpdate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  일괄 저장
                </button>
                <button
                  onClick={() => {
                    setBulkUpdateMode(false);
                    setBulkData([]);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">상태</th>
                    <th className="text-left p-4 font-medium text-gray-700">제목</th>
                    <th className="text-left p-4 font-medium text-gray-700">조회수</th>
                    <th className="text-left p-4 font-medium text-gray-700">마지막 확인</th>
                    <th className="text-left p-4 font-medium text-gray-700">발행일</th>
                    <th className="text-left p-4 font-medium text-gray-700">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {naverPosts.map((post) => (
                    <tr key={post.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{getStatusBadge(post)}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {post.content?.title || 'N/A'}
                          </p>
                          {post.naver_blog_url && (
                            <a
                              href={post.naver_blog_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              <Link className="w-3 h-3" />
                              블로그 보기
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{post.view_count.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {post.last_view_check 
                          ? new Date(post.last_view_check).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          업데이트
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 mb-4">발행 대기 중인 콘텐츠</h4>
            <div className="space-y-4">
              {pendingPosts.map(post => (
                <div key={post.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{post.title}</h5>
                      <p className="text-sm text-gray-600 mt-1">
                        예정일: {new Date(post.scheduled_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="네이버 블로그 URL"
                        className="w-64 px-3 py-2 border rounded-lg text-sm"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                      />
                      <button
                        onClick={() => handleRegisterPost(post.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        발행 완료
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingPosts.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  발행 대기 중인 네이버 블로그 콘텐츠가 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">조회수 추이 분석</h4>
          <div className="h-64 flex items-center justify-center text-gray-500">
            차트 구현 예정 (조회수 히스토리 기반)
          </div>
        </div>
      )}

      {/* 업데이트 모달 */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">조회수 업데이트</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">제목</p>
                <p className="font-medium">{selectedPost.content?.title || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">현재 조회수</p>
                <p className="font-medium">{selectedPost.view_count.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 조회수
                </label>
                <input
                  type="number"
                  value={viewCountInput}
                  onChange={(e) => setViewCountInput(e.target.value)}
                  placeholder="조회수 입력"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {selectedPost.naver_blog_url && (
                <a
                  href={selectedPost.naver_blog_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-blue-600 hover:underline"
                >
                  <Link className="w-4 h-4" />
                  네이버 블로그에서 확인
                </a>
              )}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => handleUpdateViewCount(selectedPost.id)}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
              >
                업데이트
              </button>
              <button
                onClick={() => {
                  setSelectedPost(null);
                  setViewCountInput('');
                }}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 데이터 임포트 모달 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">네이버 블로그 데이터 가져오기</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                엑셀에서 복사한 데이터를 아래에 붙여넣기 하세요. 
                (탭으로 구분된 형식: 계정명, 작성자, 게시일, 제목, 글감, 링크, 조회수)
              </p>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="계정명	작성자	게시일	포스팅 제목	글감	링크	조회수
mas9golf	J	2025-05-30(금)	[사용자 리뷰]...	박영구 후기	https://blog.naver.com/...	9"
                className="w-full h-64 px-3 py-2 border rounded-lg font-mono text-sm"
              />
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={async () => {
                  try {
                    console.log('임포트 시작...');
                    console.log('입력된 데이터:', importData);
                    
                    const lines = importData.trim().split('\n');
                    console.log('총 라인 수:', lines.length);
                    
                    const headers = lines[0].split('\t');
                    console.log('헤더:', headers);
                    console.log('헤더 개수:', headers.length);
                    
                    // 헤더 확인
                    if (headers.length < 7) {
                      alert(`데이터 형식이 올바르지 않습니다. 탭으로 구분된 7개 컬럼이 필요합니다. (현재: ${headers.length}개)`);
                      return;
                    }

                    // 네이버 플랫폼 ID 가져오기 (계정명에 따라 매핑)
                    const platformMapping = {
                      'mas9golf': '네이버 블로그 - 조',
                      'massgoogolf': '네이버 블로그 - 미',
                      'massgoogolfkorea': '네이버 블로그 - 싸'
                    };
                    
                    console.log('플랫폼 매핑:', platformMapping);

                    const dataRows = lines.slice(1).filter(line => line.trim());
                    console.log('데이터 행 수:', dataRows.length);
                    
                    let successCount = 0;
                    let errorCount = 0;
                    const errors = [];

                    for (let i = 0; i < dataRows.length; i++) {
                      const line = dataRows[i];
                      const cols = line.split('\t');
                      
                      console.log(`행 ${i + 1}: 컬럼 수 = ${cols.length}`);
                      
                      if (cols.length < 7) {
                        console.error(`행 ${i + 1}: 컬럼 수 부족 (${cols.length}개)`);
                        errorCount++;
                        continue;
                      }

                      const [계정명, 작성자, 게시일, 제목, 글감, 링크, 조회수] = cols;
                      
                      // 계정명에 따른 플랫폼 찾기
                      const platformName = platformMapping[계정명.trim()];
                      if (!platformName) {
                        console.error(`행 ${i + 1}: 알 수 없는 계정명: ${계정명}`);
                        errors.push(`행 ${i + 1}: 알 수 없는 계정명 (${계정명})`);
                        errorCount++;
                        continue;
                      }
                      
                      // 해당 플랫폼 ID 가져오기
                      const { data: platformData, error: platformError } = await supabase
                        .from('blog_platforms')
                        .select('id')
                        .eq('name', platformName)
                        .single();
                      
                      if (platformError || !platformData) {
                        console.error(`행 ${i + 1}: 플랫폼 조회 실패 (${platformName}):`, platformError);
                        errors.push(`행 ${i + 1}: 플랫폼을 찾을 수 없음 (${platformName})`);
                        errorCount++;
                        continue;
                      }
                      
                      console.log(`행 ${i + 1}: 계정명 ${계정명} -> 플랫폼 ${platformName}`);
                      
                      try {
                        // 날짜 파싱 (2025-05-30(금) -> 2025-05-30)
                        const dateMatch = 게시일.match(/(\d{4}-\d{2}-\d{2})/);
                        const publishDate = dateMatch ? dateMatch[1] : null;
                        
                        if (!publishDate) {
                          console.error(`행 ${i + 1}: 날짜 파싱 실패:`, 게시일);
                          errors.push(`행 ${i + 1}: 날짜 형식 오류`);
                          errorCount++;
                          continue;
                        }

                        console.log(`행 ${i + 1}: 처리 중... 제목: ${제목}`);

                        // 1. blog_contents에 데이터 추가
                        const { data: contentData, error: contentError } = await supabase
                          .from('blog_contents')
                          .insert({
                            title: 제목.trim(),
                            content_type: 'blog',
                            platform_id: platformData.id,
                            scheduled_date: publishDate,
                            status: 'published',
                            content: 글감.trim()
                          })
                          .select()
                          .single();

                        if (contentError) {
                          console.error(`행 ${i + 1}: 콘텐츠 추가 오류:`, contentError);
                          errors.push(`행 ${i + 1}: ${contentError.message}`);
                          errorCount++;
                          continue;
                        }

                        console.log(`행 ${i + 1}: blog_contents 추가 성공, ID:`, contentData.id);

                        // 2. naver_blog_posts에 데이터 추가
                        const { error: postError } = await supabase
                          .from('naver_blog_posts')
                          .insert({
                            blog_content_id: contentData.id,
                            naver_blog_url: 링크.trim(),
                            view_count: parseInt(조회수) || 0,
                            published_at: publishDate,
                            last_view_check: new Date()
                          });

                        if (postError) {
                          console.error(`행 ${i + 1}: 네이버 포스트 추가 오류:`, postError);
                          errors.push(`행 ${i + 1}: ${postError.message}`);
                          
                          // blog_contents 롤백
                          await supabase
                            .from('blog_contents')
                            .delete()
                            .eq('id', contentData.id);
                          
                          errorCount++;
                          continue;
                        }

                        console.log(`행 ${i + 1}: 성공적으로 임포트됨`);
                        successCount++;
                      } catch (err) {
                        console.error(`행 ${i + 1}: 처리 중 예외 발생:`, err);
                        errors.push(`행 ${i + 1}: ${err.message}`);
                        errorCount++;
                      }
                    }

                    console.log('임포트 완료:', { successCount, errorCount });
                    
                    if (errors.length > 0) {
                      console.error('오류 목록:', errors);
                    }

                    await loadAllData();
                    setShowImportModal(false);
                    setImportData('');
                    
                    if (errorCount > 0) {
                      alert(`임포트 완료!\n성공: ${successCount}개\n실패: ${errorCount}개\n\n자세한 오류는 콘솔을 확인하세요.`);
                    } else {
                      alert(`임포트 완료! 모든 ${successCount}개 항목이 성공적으로 추가되었습니다.`);
                    }
                  } catch (error) {
                    console.error('임포트 전체 오류:', error);
                    alert('데이터 임포트 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                가져오기
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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