import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function BlogAdmin() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    publishedAt: new Date().toISOString(),
    category: '골프',
    tags: []
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // 현재는 로컬 JSON 파일에서 데이터를 가져옴
      const response = await fetch('/api/blog/posts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('API 응답 데이터:', data);
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('게시물 로드 실패:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPost) {
        // 수정
        const response = await fetch(`/api/admin/blog/${editingPost.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          alert('게시물이 수정되었습니다!');
          fetchPosts();
          resetForm();
        }
      } else {
        // 새 게시물 생성
        const response = await fetch('/api/admin/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          alert('새 게시물이 생성되었습니다!');
          fetchPosts();
          resetForm();
        }
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featured_image: post.featured_image,
      publishedAt: post.publishedAt,
      category: post.category,
      tags: post.tags || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/admin/blog/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          alert('게시물이 삭제되었습니다!');
          fetchPosts();
        }
      } catch (error) {
        console.error('삭제 실패:', error);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setShowForm(false);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      publishedAt: new Date().toISOString(),
      category: '골프',
      tags: []
    });
  };

  const generateSlug = (title) => {
    if (!title) return '';
    
    // 한글을 영문으로 변환하는 매핑 테이블
    const koreanToEnglish = {
      '뜨거운': 'hot',
      '여름': 'summer',
      '완벽한': 'perfect',
      '스윙': 'swing',
      '로얄살루트': 'royal-salute',
      '증정': 'gift',
      '행사': 'event',
      '골프': 'golf',
      '드라이버': 'driver',
      '고반발': 'high-rebound',
      '비거리': 'distance',
      '증가': 'increase',
      '맞춤': 'custom',
      '제작': 'manufacturing',
      '서비스': 'service',
      '프리미엄': 'premium',
      '기술': 'technology',
      '디자인': 'design',
      '클럽': 'club',
      '헤드': 'head',
      '정밀한': 'precise',
      '세심하게': 'carefully',
      '설계된': 'designed',
      '최신': 'latest',
      '적용된': 'applied',
      '특별한': 'special',
      '경험': 'experience',
      '선사': 'provide',
      '품격': 'class',
      '있는': 'with',
      '퍼포먼스': 'performance',
      '준비': 'preparation',
      '한정': 'limited',
      '썸머': 'summer',
      '스페셜': 'special',
      '최대': 'maximum',
      '년': 'year',
      'ml': 'ml',
      '평균': 'average',
      'm': 'm',
      '대': 'age',
      '골퍼': 'golfer',
      '맞춤': 'custom',
      '설계': 'design',
      '전문적인': 'professional',
      '제작': 'manufacturing',
      '무료': 'free',
      '전문': 'professional',
      '상담': 'consultation',
      '선착순': 'first-come-first-served',
      '한정': 'limited',
      '예약': 'reservation',
      '카카오톡': 'kakao-talk',
      '갤러리': 'gallery',
      '제품': 'product',
      '이미지': 'image',
      '메인': 'main',
      '디테일': 'detail',
      '증정품': 'gift'
    };

    let slug = title;
    
    // 한글을 영문으로 변환
    Object.keys(koreanToEnglish).forEach(korean => {
      const english = koreanToEnglish[korean];
      slug = slug.replace(new RegExp(korean, 'g'), english);
    });
    
    // SEO 최적화: 소문자 변환, 특수문자 제거, 공백을 하이픈으로 변환
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // 영문, 숫자, 공백, 하이픈만 유지
      .replace(/\s+/g, '-') // 공백을 하이픈으로 변환
      .replace(/-+/g, '-') // 연속된 하이픈을 하나로 변환
      .replace(/^-|-$/g, '') // 앞뒤 하이픈 제거
      .trim();
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title)
    });
  };

  const generateAISlug = async () => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/generate-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.title })
      });

      if (response.ok) {
        const { slug } = await response.json();
        setFormData({
          ...formData,
          slug
        });
      } else {
        console.error('AI 슬러그 생성 실패');
        alert('AI 슬러그 생성에 실패했습니다. 기본 슬러그를 사용합니다.');
      }
    } catch (error) {
      console.error('AI 슬러그 생성 에러:', error);
      alert('AI 슬러그 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>블로그 관리자 - MAS Golf</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">블로그 관리</h1>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                새 게시물 작성
              </button>
            </div>
          </div>

          {showForm && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold mb-4">
                {editingPost ? '게시물 수정' : '새 게시물 작성'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      제목
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={handleTitleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      슬러그
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={generateAISlug}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        title="AI로 SEO 최적화된 슬러그 생성"
                      >
                        🤖 AI
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      제목 입력 시 자동 생성되며, AI 버튼으로 더 정교한 슬러그를 생성할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    요약
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    대표 이미지 URL
                  </label>
                  <input
                    type="url"
                    value={formData.featured_image}
                    onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    내용 (HTML)
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingPost ? '수정' : '저장'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">로딩 중...</p>
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
                        <button
                          onClick={() => handleEdit(post)}
                          className="px-3 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50"
                        >
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
