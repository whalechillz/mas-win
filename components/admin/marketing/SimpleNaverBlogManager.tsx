import React, { useState, useEffect } from 'react';

// 심플한 네이버 블로그 관리자
export const SimpleNaverBlogManager = ({ supabase }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewCount, setViewCount] = useState('');

  // 데이터 로드
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts_simple') // 위에서 만든 뷰 사용
        .select('*');
      
      if (!error && data) {
        setPosts(data);
      }
    } finally {
      setLoading(false);
    }
  };

  // 조회수 업데이트 (심플 버전)
  const updateViewCount = async (postId) => {
    if (!viewCount || isNaN(viewCount)) {
      alert('올바른 조회수를 입력하세요');
      return;
    }

    try {
      const { error } = await supabase.rpc('update_blog_view_count', {
        p_content_id: postId,
        p_view_count: parseInt(viewCount)
      });

      if (!error) {
        alert('조회수 업데이트 완료!');
        setViewCount('');
        setSelectedPost(null);
        loadPosts();
      }
    } catch (err) {
      console.error('업데이트 오류:', err);
      alert('업데이트 실패');
    }
  };

  // CSV 내보내기 (심플 버전)
  const exportToCSV = () => {
    const csv = [
      ['제목', '작성자', '발행일', 'URL', '조회수', '마지막확인'],
      ...posts.map(p => [
        p.title,
        p.author_name || '',
        p.published_date || '',
        p.naver_url || '',
        p.view_count || 0,
        p.last_view_check ? new Date(p.last_view_check).toLocaleDateString() : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `네이버블로그_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">네이버 블로그 조회수 관리</h2>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          CSV 내보내기
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-2xl font-bold">{posts.length}</div>
          <div className="text-sm text-gray-600">총 게시물</div>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <div className="text-2xl font-bold">
            {posts.reduce((sum, p) => sum + (p.view_count || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">총 조회수</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded">
          <div className="text-2xl font-bold">
            {posts.length > 0 
              ? Math.round(posts.reduce((sum, p) => sum + (p.view_count || 0), 0) / posts.length)
              : 0}
          </div>
          <div className="text-sm text-gray-600">평균 조회수</div>
        </div>
      </div>

      {/* 게시물 리스트 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">제목</th>
              <th className="px-4 py-3 text-left">작성자</th>
              <th className="px-4 py-3 text-left">발행일</th>
              <th className="px-4 py-3 text-center">조회수</th>
              <th className="px-4 py-3 text-center">작업</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium">{post.title}</div>
                    {post.naver_url && (
                      <a 
                        href={post.naver_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        블로그 보기 →
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{post.author_name || '-'}</td>
                <td className="px-4 py-3">
                  {post.published_date 
                    ? new Date(post.published_date).toLocaleDateString() 
                    : '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="font-bold">{(post.view_count || 0).toLocaleString()}</div>
                  {post.last_view_check && (
                    <div className="text-xs text-gray-500">
                      {new Date(post.last_view_check).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    업데이트
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 조회수 업데이트 모달 */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">조회수 업데이트</h3>
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-1">제목</div>
              <div className="font-medium">{selectedPost.title}</div>
            </div>
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-1">현재 조회수</div>
              <div className="font-medium">{selectedPost.view_count || 0}</div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">새 조회수</label>
              <input
                type="number"
                value={viewCount}
                onChange={(e) => setViewCount(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="조회수 입력"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateViewCount(selectedPost.id)}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setSelectedPost(null);
                  setViewCount('');
                }}
                className="flex-1 border py-2 rounded hover:bg-gray-50"
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