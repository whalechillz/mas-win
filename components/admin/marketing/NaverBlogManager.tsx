import React, { useState, useEffect } from 'react';
import { Link, Eye, RefreshCw, Upload, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

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
    </div>
  );
};