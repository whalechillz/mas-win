import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function BlogAdminSimple() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 직접 로컬 데이터를 가져오는 방식으로 변경
      const response = await fetch('/api/blog/posts');
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('받은 데이터:', data);
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('게시물 로드 실패:', error);
      setError(error.message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>에러 발생:</strong> {error}
          </div>
          <button 
            onClick={fetchPosts}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>블로그 관리자 - MAS Golf</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">블로그 관리</h1>
            <p className="text-gray-600 mt-2">현재 {posts.length}개의 게시물이 있습니다.</p>
          </div>

          <div className="p-6">
            {posts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">게시물이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>슬러그: {post.slug}</span>
                          <span>카테고리: {post.category}</span>
                          <span>작성일: {new Date(post.publishedAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="px-3 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50">
                          수정
                        </button>
                        <button className="px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50">
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
