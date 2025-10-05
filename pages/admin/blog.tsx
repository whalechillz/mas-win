import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import PostList from '../../components/admin/PostList';
import PostGrid from '../../components/admin/PostGrid';

export default function BlogAdmin() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('published_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category: '고객 후기',
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

  // 게시물 목록 불러오기
  const fetchPosts = useCallback(async (currentSortBy = sortBy, currentSortOrder = sortOrder) => {
    try {
      setLoading(true);
      console.log('🔍 게시물 목록 불러오는 중...');
      
      const sortParams = new URLSearchParams({
        sortBy: currentSortBy,
        sortOrder: currentSortOrder
      });
      
      const response = await fetch(`/api/admin/blog?${sortParams}`);
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
  }, [sortBy, sortOrder]);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      category: '고객 후기',
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
    
    if (!isSubmitting) {
      setIsSubmitting(true);
    
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
      } finally {
        setIsSubmitting(false);
      }
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

  // 체크박스 선택/해제
  const handlePostSelect = (postId) => {
    const id = Array.isArray(postId) ? postId[0] : postId;
    setSelectedPosts(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  // 모두 선택/해제
  const handleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map(post => post.id));
    }
  };

  // 선택된 게시물 삭제
  const handleSelectedDelete = async () => {
    if (selectedPosts.length === 0) {
      alert('삭제할 게시물을 선택해주세요.');
      return;
    }

    const selectedPostTitles = selectedPosts
      .map(id => posts.find(post => post.id === id)?.title)
      .filter(Boolean)
      .slice(0, 5);

    const confirmMessage = `선택된 ${selectedPosts.length}개의 게시물을 삭제하시겠습니까?\n\n삭제될 게시물:\n${selectedPostTitles.join('\n')}${selectedPosts.length > 5 ? '\n...' : ''}\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      console.log('🗑️ 선택된 게시물 삭제 중...', selectedPosts);
      
      const deletePromises = selectedPosts.map(id => 
        fetch(`/api/admin/blog/${id}`, {
          method: 'DELETE'
        })
      );
      
      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(response => !response.ok);
      
      if (failedDeletes.length === 0) {
        alert(`${selectedPosts.length}개 게시물이 삭제되었습니다!`);
        setSelectedPosts([]);
        fetchPosts();
      } else {
        alert(`${selectedPosts.length - failedDeletes.length}개 삭제 성공, ${failedDeletes.length}개 삭제 실패`);
        setSelectedPosts([]);
        fetchPosts();
      }
    } catch (error) {
      console.error('선택된 게시물 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 게시물 수정 모드로 전환
  const handleEdit = useCallback(async (post) => {
    try {
      console.log('📝 게시물 수정 모드 시작:', post.id);
      
    setEditingPost(post);
    setFormData({
        title: post.title || '',
        slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
        featured_image: post.featured_image || '',
        category: post.category || '고객 후기',
        tags: Array.isArray(post.tags) ? post.tags : [],
        status: post.status || 'draft',
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
        meta_keywords: post.meta_keywords || '',
        view_count: post.view_count || 0,
        is_featured: post.is_featured || false,
        is_scheduled: post.is_scheduled || false,
        scheduled_at: post.scheduled_at || null,
        author: post.author || '마쓰구골프'
      });
          
          setShowForm(true);
          setActiveTab('create');
    } catch (error) {
      console.error('❌ 게시물 수정 모드 오류:', error);
      alert('게시물 수정 모드 진입 중 오류가 발생했습니다.');
    }
  }, []);

  // 제목에서 슬러그 자동 생성
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // 필터링된 게시물 목록
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filterCategory || post.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // 카테고리 목록
  const categories = Array.from(new Set(posts.map(post => post.category))).filter(Boolean);

  // 초기 로드
  useEffect(() => {
    fetchPosts();
  }, []);

  // 정렬 옵션 변경 시 새로고침
  useEffect(() => {
    if (posts.length > 0) {
      fetchPosts(sortBy, sortOrder);
    }
  }, [sortBy, sortOrder]);

  return (
    <>
      <Head>
        <title>블로그 관리자 - MAS Golf</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">블로그 관리</h1>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mb-8">
            <nav className="flex space-x-8">
            <button
                onClick={() => {
                  setActiveTab('list');
                  setShowForm(false);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 블로그 목록
            </button>
              <button
                onClick={() => {
                  setActiveTab('create');
                  setShowForm(true);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ✍️ 새 게시물 작성
              </button>
              <button
                onClick={() => {
                  window.open('/admin/ai-dashboard', '_blank');
                }}
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                🤖 AI 관리
              </button>
            </nav>
          </div>

          {/* 탭별 콘텐츠 */}
          {activeTab === 'list' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* 검색 및 필터 */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                  <input
                    type="text"
                    placeholder="게시물 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="sm:w-48">
                      <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">모든 카테고리</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                      </select>
                    </div>
                    </div>

              {/* 정렬 및 뷰 모드 */}
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                      <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="published_at">발행일</option>
                    <option value="title">제목</option>
                    <option value="category">카테고리</option>
                    <option value="view_count">조회수</option>
                      </select>
                      <select 
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="desc">내림차순</option>
                    <option value="asc">오름차순</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      viewMode === 'list'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                    📋 목록
                        </button>
                      <button 
                    onClick={() => setViewMode('card')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      viewMode === 'card'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    🎴 카드
                                  </button>
                                </div>
                            </div>

              {/* 일괄 작업 */}
              {selectedPosts.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center justify-between">
                    <span className="text-blue-800 font-medium">
                      {selectedPosts.length}개 게시물 선택됨
                                      </span>
                                    <button 
                      onClick={handleSelectedDelete}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
                    >
                      🗑️ 선택된 게시물 삭제
                                    </button>
                                  </div>
                                      </div>
              )}

              {/* 게시물 목록 */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-500">게시물을 불러오는 중...</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">게시물이 없습니다.</p>
              </div>
            ) : (
                <>
                  {viewMode === 'list' ? (
                    <PostList
                      posts={filteredPosts}
                      selectedPosts={selectedPosts}
                      onPostSelect={handlePostSelect}
                      onSelectAll={handleSelectAll}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ) : (
                    <PostGrid
                      posts={filteredPosts}
                      selectedPosts={selectedPosts}
                      onPostSelect={handlePostSelect}
                      onSelectAll={handleSelectAll}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  )}
                </>
              )}
            </div>
          )}
          
          {/* 새 게시물 작성/수정 폼 */}
          {activeTab === 'create' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingPost ? '게시물 수정' : '새 게시물 작성'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {editingPost ? '게시물을 수정하세요.' : '새로운 게시물을 작성하세요.'}
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 제목 */}
        <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목 *
          </label>
                                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({
                      ...formData,
                      title: e.target.value,
                      slug: generateSlug(e.target.value)
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="게시물 제목을 입력하세요"
                    required
                                    />
                                  </div>
                                  
                {/* 슬러그 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    슬러그
                  </label>
                      <input
                        type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="url-friendly-slug"
                  />
              </div>
              
                {/* 요약 */}
                          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    요약
            </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="게시물 요약을 입력하세요"
            />
          </div>

                {/* 내용 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용 *
            </label>
                          <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="게시물 내용을 입력하세요"
                            required
            />
        </div>

                {/* 카테고리 */}
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      카테고리
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="고객 후기">고객 후기</option>
                    <option value="제품 정보">제품 정보</option>
                    <option value="골프 팁">골프 팁</option>
                    <option value="이벤트">이벤트</option>
                    <option value="공지사항">공지사항</option>
                    </select>
                  </div>

                {/* 상태 */}
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      상태
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">초안</option>
                    <option value="published">발행</option>
                    <option value="archived">보관</option>
                    </select>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    취소
                  </button>
                    <button
                      type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                    {isSubmitting && (
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                      {editingPost ? '수정' : '저장'}
                    </button>
                </div>
              </form>
            </div>
          )}
              </div>
                  </div>
    </>
  );
}