import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Head from 'next/head';
import { marked } from 'marked';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import ImageGroupThumbnail from '../../components/ImageGroupThumbnail';
import PostList from '../../components/admin/PostList';
import PostGrid from '../../components/admin/PostGrid';

// React Quill을 동적으로 로드 (SSR 문제 방지 및 성능 최적화)
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="p-4 text-center text-gray-500">에디터 로딩 중...</div>
});
import 'react-quill/dist/quill.snow.css';

// React Quill 설정
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['link', 'image', 'video'],
    ['clean']
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'indent',
  'link', 'image', 'video'
];

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  author: string;
  published_at: string;
  view_count: number;
  is_featured: boolean;
  status: 'published' | 'draft';
  slug: string;
  featured_image?: string;
  tags?: string[];
  meta_description?: string;
}

interface FormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  author: string;
  status: 'published' | 'draft';
  featured_image: string;
  tags: string[];
  meta_description: string;
}

export default function BlogAdmin() {
  const router = useRouter();
  
  // 기본 상태
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  
  // 폼 데이터
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    author: '',
    status: 'draft',
    featured_image: '',
    tags: [],
    meta_description: ''
  });

  // 검색 및 필터링
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'published_at' | 'view_count'>('published_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // AI 이미지 생성 관련 상태
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [showGeneratedImages, setShowGeneratedImages] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageGenerationStep, setImageGenerationStep] = useState('');
  const [selectedGeneratedImage, setSelectedGeneratedImage] = useState<string | null>(null);
  const [showGeneratedImageModal, setShowGeneratedImageModal] = useState(false);

  // 게시물 데이터 로드
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/blog/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('게시물 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 게시물 로드
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 게시물 선택/해제
  const handlePostSelect = useCallback((postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  }, []);

  // 모두 선택/해제
  const handleSelectAll = useCallback(() => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map(post => post.id));
    }
  }, [selectedPosts.length, posts]);

  // 게시물 편집
  const handleEdit = useCallback((post: Post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      category: post.category,
      author: post.author,
      status: post.status,
      featured_image: post.featured_image || '',
      tags: post.tags || [],
      meta_description: post.meta_description || ''
    });
    setIsEditing(true);
  }, []);

  // 새 게시물 작성
  const handleNewPost = useCallback(() => {
    setEditingPost(null);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      author: '',
      status: 'draft',
      featured_image: '',
      tags: [],
      meta_description: ''
    });
    setIsEditing(true);
  }, []);

  // 게시물 저장
  const handleSave = useCallback(async () => {
    try {
      const url = editingPost ? `/api/blog/posts/${editingPost.id}` : '/api/blog/posts';
      const method = editingPost ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchPosts();
        setIsEditing(false);
        setEditingPost(null);
      } else {
        console.error('게시물 저장 실패');
      }
    } catch (error) {
      console.error('게시물 저장 오류:', error);
    }
  }, [editingPost, formData, fetchPosts]);

  // 게시물 삭제
  const handleDelete = useCallback(async (postId: string) => {
    if (!confirm('정말로 이 게시물을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPosts();
      } else {
        console.error('게시물 삭제 실패');
      }
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
    }
  }, [fetchPosts]);

  // 선택된 게시물 삭제
  const handleSelectedDelete = useCallback(async () => {
    if (selectedPosts.length === 0) return;
    if (!confirm(`선택된 ${selectedPosts.length}개 게시물을 삭제하시겠습니까?`)) return;
    
    try {
      const response = await fetch('/api/blog/posts/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postIds: selectedPosts }),
      });

      if (response.ok) {
        await fetchPosts();
        setSelectedPosts([]);
      } else {
        console.error('게시물 일괄 삭제 실패');
      }
    } catch (error) {
      console.error('게시물 일괄 삭제 오류:', error);
    }
  }, [selectedPosts, fetchPosts]);

  // 필터링된 게시물
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 카테고리 필터링
    if (categoryFilter) {
      filtered = filtered.filter(post => post.category === categoryFilter);
    }

    // 상태 필터링
    if (statusFilter) {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'published_at') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [posts, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

  // 고유 카테고리 목록
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(posts.map(post => post.category)));
    return uniqueCategories.filter(Boolean);
  }, [posts]);

  // AI 이미지 생성 함수
  const generateAIImage = useCallback(async (model: string = 'chatgpt') => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      setIsGeneratingImages(true);
      setImageGenerationStep(`${model.toUpperCase()}로 이미지 생성 중...`);
      setShowGeneratedImages(true);

      const response = await fetch('/api/generate-blog-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          model: model
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imageUrls && data.imageUrls.length > 0) {
          setGeneratedImages(prev => [...prev, ...data.imageUrls]);
          setImageGenerationStep('이미지 생성 완료!');
        } else {
          setImageGenerationStep('이미지 생성에 실패했습니다.');
        }
      } else {
        setImageGenerationStep('이미지 생성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('AI 이미지 생성 오류:', error);
      setImageGenerationStep('이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingImages(false);
    }
  }, [formData.title, formData.content]);

  // FAL AI 이미지 생성
  const generateFALAIImage = useCallback(async () => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      setIsGeneratingImages(true);
      setImageGenerationStep('FAL AI로 이미지 생성 중...');
      setShowGeneratedImages(true);

      const response = await fetch('/api/generate-blog-image-fal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imageUrls && data.imageUrls.length > 0) {
          setGeneratedImages(prev => [...prev, ...data.imageUrls]);
          setImageGenerationStep('FAL AI 이미지 생성 완료!');
        } else {
          setImageGenerationStep('FAL AI 이미지 생성에 실패했습니다.');
        }
      } else {
        setImageGenerationStep('FAL AI 이미지 생성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('FAL AI 이미지 생성 오류:', error);
      setImageGenerationStep('FAL AI 이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingImages(false);
    }
  }, [formData.title, formData.content]);

  // Google AI 이미지 생성
  const generateGoogleAIImage = useCallback(async () => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      setIsGeneratingImages(true);
      setImageGenerationStep('Google AI로 이미지 생성 중...');
      setShowGeneratedImages(true);

      const response = await fetch('/api/generate-blog-image-google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imageUrls && data.imageUrls.length > 0) {
          setGeneratedImages(prev => [...prev, ...data.imageUrls]);
          setImageGenerationStep('Google AI 이미지 생성 완료!');
        } else {
          setImageGenerationStep('Google AI 이미지 생성에 실패했습니다.');
        }
      } else {
        setImageGenerationStep('Google AI 이미지 생성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Google AI 이미지 생성 오류:', error);
      setImageGenerationStep('Google AI 이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingImages(false);
    }
  }, [formData.title, formData.content]);

  return (
    <>
      <Head>
        <title>블로그 관리자 - MAS Golf</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">블로그 관리</h1>
            <p className="mt-2 text-gray-600">게시물을 생성, 편집, 관리하세요</p>
          </div>

          {/* 편집 모드 */}
          {isEditing ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {editingPost ? '게시물 편집' : '새 게시물 작성'}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    저장
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="게시물 제목을 입력하세요"
                  />
                </div>

                {/* 요약 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    요약
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="게시물 요약을 입력하세요"
                  />
                </div>

                {/* 카테고리 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="카테고리를 입력하세요"
                  />
                </div>

                {/* 작성자 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    작성자
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="작성자명을 입력하세요"
                  />
                </div>

                {/* 상태 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상태
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'published' | 'draft' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">초안</option>
                    <option value="published">발행</option>
                  </select>
                </div>

                {/* 대표 이미지 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    대표 이미지 URL
                  </label>
                  <input
                    type="url"
                    value={formData.featured_image}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이미지 URL을 입력하세요"
                  />
                </div>

                {/* 메타 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메타 설명
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="SEO를 위한 메타 설명을 입력하세요"
                  />
                </div>

                {/* 내용 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용
                  </label>
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                    modules={quillModules}
                    formats={quillFormats}
                    className="bg-white"
                  />
                </div>

                {/* AI 이미지 생성 섹션 */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 AI 이미지 생성</h3>
                  
                  {/* AI 이미지 생성 버튼들 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <button
                      onClick={() => generateAIImage('chatgpt')}
                      disabled={isGeneratingImages}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isGeneratingImages ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>생성 중...</span>
                        </>
                      ) : (
                        <>
                          <span>🤖</span>
                          <span>ChatGPT + DALL-E</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={generateFALAIImage}
                      disabled={isGeneratingImages}
                      className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isGeneratingImages ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>생성 중...</span>
                        </>
                      ) : (
                        <>
                          <span>🎨</span>
                          <span>FAL AI</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={generateGoogleAIImage}
                      disabled={isGeneratingImages}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isGeneratingImages ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>생성 중...</span>
                        </>
                      ) : (
                        <>
                          <span>🔍</span>
                          <span>Google AI</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 이미지 생성 상태 */}
                  {imageGenerationStep && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-blue-800 text-sm">{imageGenerationStep}</p>
                    </div>
                  )}

                  {/* 생성된 이미지 갤러리 */}
                  {generatedImages.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium text-gray-700 mb-3">생성된 이미지</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {generatedImages.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`생성된 이미지 ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
                              onClick={() => {
                                setSelectedGeneratedImage(imageUrl);
                                setShowGeneratedImageModal(true);
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                              <button
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, featured_image: imageUrl }));
                                }}
                                className="opacity-0 group-hover:opacity-100 bg-blue-500 text-white px-3 py-1 rounded text-sm transition-opacity"
                              >
                                대표 이미지로 설정
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* 목록 모드 */
            <div className="space-y-6">
              {/* 상단 컨트롤 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  {/* 검색 및 필터 */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <input
                      type="text"
                      placeholder="게시물 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">모든 카테고리</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">모든 상태</option>
                      <option value="published">발행됨</option>
                      <option value="draft">초안</option>
                    </select>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1 rounded text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        📋 목록
                      </button>
                      <button
                        onClick={() => setViewMode('card')}
                        className={`px-3 py-1 rounded text-sm ${viewMode === 'card' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        🎴 카드
                      </button>
                    </div>
                    
                    <button
                      onClick={handleNewPost}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      ✏️ 새 게시물
                    </button>
                    
                    {selectedPosts.length > 0 && (
                      <button
                        onClick={handleSelectedDelete}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        🗑️ 선택 삭제 ({selectedPosts.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* 정렬 및 통계 */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      총 {filteredPosts.length}개 게시물
                    </span>
                    {selectedPosts.length > 0 && (
                      <span className="text-sm text-blue-600">
                        {selectedPosts.length}개 선택됨
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'title' | 'published_at' | 'view_count')}
                      className="px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="published_at">작성일</option>
                      <option value="title">제목</option>
                      <option value="view_count">조회수</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 게시물 목록 */}
              <div className="bg-white rounded-lg shadow">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">게시물을 불러오는 중...</p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">게시물이 없습니다.</p>
                    <button
                      onClick={handleNewPost}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      첫 번째 게시물 작성하기
                    </button>
                  </div>
                ) : (
                  <div className="p-6">
                    {viewMode === 'list' ? (
                      <PostList
                        posts={filteredPosts}
                        selectedPosts={selectedPosts}
                        onPostSelect={handlePostSelect}
                        onEdit={handleEdit}
                      />
                    ) : (
                      <PostGrid
                        posts={filteredPosts}
                        selectedPosts={selectedPosts}
                        onPostSelect={handlePostSelect}
                        onEdit={handleEdit}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI 생성 이미지 확대 보기 모달 */}
      {showGeneratedImageModal && selectedGeneratedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl max-h-[95vh] w-full overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-blue-50 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-blue-800">AI 생성 이미지 확대 보기</h3>
                <button
                  onClick={() => setShowGeneratedImageModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="flex justify-center">
                <img
                  src={selectedGeneratedImage}
                  alt="AI 생성 이미지"
                  className="max-w-full max-h-full object-contain"
                  style={{ maxHeight: 'calc(95vh - 200px)' }}
                />
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedGeneratedImage);
                    alert('이미지 URL이 클립보드에 복사되었습니다.');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 whitespace-nowrap"
                >
                  📋 URL 복사
                </button>
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, featured_image: selectedGeneratedImage }));
                    setShowGeneratedImageModal(false);
                    alert('대표 이미지로 설정되었습니다.');
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap"
                >
                  ⭐ 대표 이미지로 설정
                </button>
                <button
                  onClick={() => {
                    const img = document.createElement('img');
                    img.src = selectedGeneratedImage;
                    img.style.display = 'none';
                    document.body.appendChild(img);
                    
                    const range = document.createRange();
                    range.selectNode(img);
                    window.getSelection()?.removeAllRanges();
                    window.getSelection()?.addRange(range);
                    document.execCommand('copy');
                    document.body.removeChild(img);
                    
                    alert('이미지가 클립보드에 복사되었습니다.');
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 whitespace-nowrap"
                >
                  📄 이미지 복사
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}