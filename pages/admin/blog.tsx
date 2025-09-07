import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function BlogAdmin() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    published_at: new Date().toISOString(),
    category: '골프',
    tags: [],
    status: 'published',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    view_count: 0,
    is_featured: false,
    is_scheduled: false,
    scheduled_at: null,
    author: '마쓰구골프'
  });

  // 마쓰구 브랜드 전략 상태
  const [brandStrategy, setBrandStrategy] = useState({
    contentType: 'information',
    audienceTemp: 'warm',
    brandWeight: 'medium',
    customerChannel: 'local_customers',
    painPoint: '',
    customerPersona: 'competitive_maintainer'
  });

  // 게시물 목록 불러오기
  const fetchPosts = async () => {
    try {
      setLoading(true);
      console.log('🔍 게시물 목록 불러오는 중...');
      
      const response = await fetch('/api/admin/blog');
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ 게시물 목록 로드 성공:', data.posts?.length || 0, '개');
        setPosts(data.posts || []);
      } else {
        console.error('❌ 게시물 목록 로드 실패:', data.error);
        alert('게시물을 불러올 수 없습니다: ' + data.error);
      }
    } catch (error) {
      console.error('❌ 게시물 목록 로드 에러:', error);
      alert('게시물을 불러올 수 없습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      published_at: new Date().toISOString(),
      category: '골프',
      tags: [],
      status: 'published',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      view_count: 0,
      is_featured: false,
      is_scheduled: false,
      scheduled_at: null,
      author: '마쓰구골프'
    });
    setEditingPost(null);
    setShowForm(false);
  };

  // 게시물 저장/수정
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('📝 게시물 저장 중...');
      
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
        } else {
          const error = await response.json();
          alert('수정 실패: ' + error.error);
        }
      } else {
        // 새 게시물 생성
        const response = await fetch('/api/admin/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          alert('게시물이 생성되었습니다!');
          fetchPosts();
          resetForm();
        } else {
          const error = await response.json();
          alert('생성 실패: ' + error.error);
        }
      }
    } catch (error) {
      console.error('❌ 게시물 저장 에러:', error);
      alert('저장 실패: ' + error.message);
    }
  };

  // 게시물 삭제
  const handleDelete = async (id) => {
    if (!confirm('정말로 이 게시물을 삭제하시겠습니까?')) return;
    
    try {
      console.log('🗑️ 게시물 삭제 중...');
      
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('게시물이 삭제되었습니다!');
        fetchPosts();
      } else {
        const error = await response.json();
        alert('삭제 실패: ' + error.error);
      }
    } catch (error) {
      console.error('❌ 게시물 삭제 에러:', error);
      alert('삭제 실패: ' + error.message);
    }
  };

  // 게시물 수정 모드로 전환
  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      ...post,
      tags: Array.isArray(post.tags) ? post.tags : []
    });
    setShowForm(true);
  };

  // 제목에서 슬러그 자동 생성
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // AI 슬러그 생성
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
      }
    } catch (error) {
      console.error('AI 슬러그 생성 에러:', error);
      alert('AI 슬러그 생성 중 오류가 발생했습니다.');
    }
  };

  // AI 콘텐츠 생성 (웹 검색 포함)
  const generateAIContent = async (type) => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/generate-enhanced-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          type: type,
          keywords: formData.tags.join(', '),
          contentType: brandStrategy.contentType,
          audienceTemp: brandStrategy.audienceTemp,
          brandWeight: brandStrategy.brandWeight,
          customerChannel: brandStrategy.customerChannel,
          painPoint: brandStrategy.painPoint || null,
          customerPersona: brandStrategy.customerPersona,
          enableWebSearch: true
        })
      });

      if (response.ok) {
        const { content, webSearchEnabled, webSearchResults } = await response.json();
        
        if (type === 'excerpt') {
          setFormData({ ...formData, excerpt: content });
        } else if (type === 'content') {
          setFormData({ ...formData, content: content });
        } else if (type === 'meta') {
          setFormData({ ...formData, meta_description: content });
        }
        
        // 웹 검색 결과 알림
        if (webSearchEnabled) {
          console.log('✅ 웹 검색 정보가 포함된 콘텐츠 생성 완료');
        }
      } else {
        console.error('AI 콘텐츠 생성 실패');
        alert('AI 콘텐츠 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('AI 콘텐츠 생성 에러:', error);
      alert('AI 콘텐츠 생성 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <>
      <Head>
        <title>블로그 관리자 - MAS Golf</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">블로그 관리</h1>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              새 게시물 작성
            </button>
          </div>

          {/* 게시물 작성/수정 폼 */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {editingPost ? '게시물 수정' : '새 게시물 작성'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData({
                        ...formData,
                        title,
                        slug: generateSlug(title),
                        meta_title: title
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="게시물 제목을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    슬러그 *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="URL 슬러그"
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

                {/* 마쓰구 브랜드 전략 선택 */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">🎯 마쓰구 브랜드 전략</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">콘텐츠 유형</label>
                      <select 
                        value={brandStrategy.contentType}
                        onChange={(e) => setBrandStrategy({...brandStrategy, contentType: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="information">골프 정보</option>
                        <option value="tutorial">튜토리얼</option>
                        <option value="testimonial">고객 후기</option>
                        <option value="event">이벤트</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">오디언스 온도</label>
                      <select 
                        value={brandStrategy.audienceTemp}
                        onChange={(e) => setBrandStrategy({...brandStrategy, audienceTemp: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="cold">차가운 오디언스 (처음 접함)</option>
                        <option value="warm">따뜻한 오디언스 (관심 있음)</option>
                        <option value="hot">뜨거운 오디언스 (구매 의도 높음)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">브랜드 강도</label>
                      <select 
                        value={brandStrategy.brandWeight}
                        onChange={(e) => setBrandStrategy({...brandStrategy, brandWeight: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">낮음 (정보 중심)</option>
                        <option value="medium">중간 (비교 강조)</option>
                        <option value="high">높음 (브랜드 강조)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">고객 채널</label>
                      <select 
                        value={brandStrategy.customerChannel}
                        onChange={(e) => setBrandStrategy({...brandStrategy, customerChannel: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="local_customers">내방고객 (경기 근방)</option>
                        <option value="online_customers">온라인고객 (전국 단위)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">고객 페르소나</label>
                      <select 
                        value={brandStrategy.customerPersona}
                        onChange={(e) => setBrandStrategy({...brandStrategy, customerPersona: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="high_rebound_preferrer">고반발 드라이버 선호 상급 골퍼</option>
                        <option value="health_conscious_senior">건강을 고려한 비거리 증가 시니어 골퍼</option>
                        <option value="competitive_maintainer">경기력을 유지하고 싶은 중상급 골퍼</option>
                        <option value="returning_senior">최근 골프를 다시 시작한 60대 이상 골퍼</option>
                        <option value="beginner_distance">골프 입문자를 위한 비거리 향상 초급 골퍼</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">페인 포인트</label>
                      <select 
                        value={brandStrategy.painPoint}
                        onChange={(e) => setBrandStrategy({...brandStrategy, painPoint: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">선택 안함</option>
                        <option value="distance_decrease">비거리 감소</option>
                        <option value="service_dissatisfaction">서비스 불만족</option>
                        <option value="equipment_durability">장비 내구성</option>
                        <option value="fitting_accuracy">피팅 정확도</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button 
                      type="button"
                      onClick={() => generateAIContent('excerpt')} 
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      🤖 AI 요약
                    </button>
                    <button 
                      type="button"
                      onClick={() => generateAIContent('content')} 
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      🤖 AI 본문
                    </button>
                    <button 
                      type="button"
                      onClick={() => generateAIContent('meta')} 
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                    >
                      🤖 AI 메타
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-2">
                    선택한 전략에 따라 마쓰구 브랜드가 자연스럽게 통합된 콘텐츠를 생성합니다.
                    <br />
                    <span className="text-blue-600 font-medium">🔍 브랜드 정보 검색 기능이 포함되어 정확한 정보를 반영합니다.</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    요약
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="게시물 요약"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    내용 *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="게시물 내용을 입력하세요"
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
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      카테고리
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="골프">골프</option>
                      <option value="드라이버">드라이버</option>
                      <option value="이벤트">이벤트</option>
                      <option value="후기">후기</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상태
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="published">발행</option>
                      <option value="draft">초안</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    작성자
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="작성자명"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700">
                    추천 게시물로 설정
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingPost ? '수정' : '저장'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 게시물 목록 */}
          <div className="bg-white rounded-lg shadow-md">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">로딩 중...</p>
              </div>
            ) : (
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
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>카테고리: {post.category}</span>
                              <span>상태: {post.status}</span>
                              <span>작성자: {post.author}</span>
                              <span>조회수: {post.view_count || 0}</span>
                              {post.is_featured && (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  추천
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(post)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}