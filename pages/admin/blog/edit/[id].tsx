import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import AdminNav from '../../../../components/admin/AdminNav';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { CONTENT_STRATEGY, CUSTOMER_PERSONAS, CUSTOMER_CHANNELS } from '../../../../lib/masgolf-brand-data';
import BrandStrategySelector from '../../../../components/admin/BrandStrategySelector';
import VariationRecommendationModal from '../../../../components/admin/VariationRecommendationModal';

// 동적 임포트
const TipTapEditor = dynamic(() => import('../../../../components/admin/TipTapEditor'), { ssr: false });
const GalleryPicker = dynamic(() => import('../../../../components/admin/GalleryPicker'), { ssr: false });

export default function EditBlogPost() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;

  // 편집 관련 상태
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 허브 연동 상태
  const [hubData, setHubData] = useState(null);
  const [isHubMode, setIsHubMode] = useState(false);
  
  // 허브 동기화 관련 상태
  const [syncModalData, setSyncModalData] = useState({
    isOpen: false,
    blogPost: null,
    hubId: null
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // 이미지 관리 관련 상태
  const [postImages, setPostImages] = useState([]);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // 편집 모드 감지 함수
  const isEditMode = () => {
    return post !== null;
  };

  // 허브 데이터 로드 함수
  const loadHubData = async (hubId: string) => {
    try {
      console.log('🔍 허브 데이터 로드 중...', hubId);
      
      // 허브 상태 초기화
      setHubData(null);
      setIsHubMode(false);
      
      const response = await fetch(`/api/admin/content-calendar-hub?id=${hubId}`);
      const data = await response.json();
      
      if (response.ok && data.data && data.data.length > 0) {
        const hubContent = data.data[0]; // 첫 번째 항목이 해당 허브 콘텐츠
        console.log('✅ 허브 데이터 로드 성공:', hubContent);
        setHubData({
          id: hubContent.id,
          hubId: hubContent.id,
          title: hubContent.title,
          summary: hubContent.summary
        });
        setIsHubMode(true);
      } else {
        console.log('❌ 허브 데이터 없음, 일반 편집 모드');
        setIsHubMode(false);
        setHubData(null);
      }
    } catch (error) {
      console.error('❌ 허브 데이터 로드 오류:', error);
      setIsHubMode(false);
      setHubData(null);
    }
  };

  // 포스트 데이터 로드 함수
  const loadPostForEdit = useCallback(async (postId: string) => {
    try {
      console.log('🔍 포스트 로드 중:', postId);
      const response = await fetch(`/api/admin/blog/${postId}`);
      
      if (response.ok) {
        const data = await response.json();
        const postData = data.post;
        console.log('✅ 포스트 로드 성공:', postData);
        
        // 포스트 데이터 설정
        setPost(postData);
        
        // 게시물 이미지 로드
        await loadPostImages(postId);
        
        // 🔄 허브 데이터 로드 (개선된 로직)
        console.log('🔍 post.calendar_id:', postData.calendar_id);
        
        if (postData.calendar_id) {
          console.log('🔗 허브 모드 감지, 허브 데이터 로드 중...', postData.calendar_id);
          await loadHubData(postData.calendar_id);
        } else {
          console.log('❌ 허브 연결 없음, 일반 편집 모드');
          setIsHubMode(false);
          setHubData(null);
        }
        
      } else {
        throw new Error('포스트 로드 실패');
      }
    } catch (error) {
      console.error('❌ 포스트 로드 오류:', error);
      alert('포스트 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 게시물 이미지 로드 함수
  const loadPostImages = async (postId: string) => {
    try {
      const response = await fetch(`/api/images?postId=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setPostImages(data.images || []);
      }
    } catch (error) {
      console.error('이미지 로드 오류:', error);
    }
  };

  // 이미지 삭제 함수
  const handleImageDelete = async (imageId: string) => {
    if (!confirm('이미지를 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setPostImages(prev => prev.filter(img => img.id !== imageId));
        alert('이미지가 삭제되었습니다.');
      } else {
        alert('이미지 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      alert('이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 대표 이미지 설정 함수
  const handleSetFeaturedImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured_image_id: imageId })
      });
      
      if (response.ok) {
        alert('대표 이미지가 설정되었습니다.');
        // 게시물 데이터 새로고침
        await loadPostForEdit(id as string);
      } else {
        alert('대표 이미지 설정에 실패했습니다.');
      }
    } catch (error) {
      console.error('대표 이미지 설정 오류:', error);
      alert('대표 이미지 설정 중 오류가 발생했습니다.');
    }
  };

  // 허브 동기화 함수
  const handleHubSync = async (post) => {
    try {
      // 동기화 모달 표시
      setSyncModalData({
        isOpen: true,
        blogPost: post,
        hubId: post.calendar_id
      });
    } catch (error) {
      console.error('동기화 모달 오류:', error);
      alert('동기화 모달을 열 수 없습니다.');
    }
  };

  // AI 동기화 함수
  const handleHubSyncWithAI = async (blogPost, hubId) => {
    try {
      setIsSyncing(true);
      
      const response = await fetch('/api/blog/sync-to-hub-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogPostId: blogPost.id,
          hubContentId: hubId,
          title: blogPost.title,
          content: blogPost.content,
          excerpt: blogPost.excerpt
        })
      });
      
      if (response.ok) {
        alert('🤖 AI로 허브 콘텐츠가 최적화되어 동기화되었습니다!');
        setSyncModalData({ isOpen: false, blogPost: null, hubId: null });
        // 포스트 데이터 새로고침
        await loadPostForEdit(blogPost.id);
      } else {
        throw new Error('AI 동기화 실패');
      }
    } catch (error) {
      console.error('AI 동기화 오류:', error);
      alert('AI 동기화에 실패했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 직접 동기화 함수
  const handleHubSyncDirect = async (blogPost, hubId) => {
    try {
      setIsSyncing(true);
      
      const response = await fetch('/api/blog/sync-to-hub-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogPostId: blogPost.id,
          hubContentId: hubId,
          title: blogPost.title,
          content: blogPost.content,
          excerpt: blogPost.excerpt
        })
      });
      
      if (response.ok) {
        alert('⚡ 직접 허브 콘텐츠가 동기화되었습니다!');
        setSyncModalData({ isOpen: false, blogPost: null, hubId: null });
        // 포스트 데이터 새로고침
        await loadPostForEdit(blogPost.id);
      } else {
        throw new Error('직접 동기화 실패');
      }
    } catch (error) {
      console.error('직접 동기화 오류:', error);
      alert('직접 동기화에 실패했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 편집 폼 제출 함수
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          status: post.status
        })
      });

      if (response.ok) {
        alert('게시물이 수정되었습니다.');
        router.push('/admin/blog');
      } else {
        throw new Error('게시물 수정 실패');
      }
    } catch (error) {
      console.error('게시물 수정 오류:', error);
      alert('게시물 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 포스트 데이터 로드
  useEffect(() => {
    if (id && typeof id === 'string') {
      loadPostForEdit(id);
    }
  }, [id, loadPostForEdit]);

  // 로딩 중
  if (loading) {
    return (
      <>
        <Head>
          <title>게시물 편집 - MASGOLF</title>
        </Head>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">게시물을 불러오는 중...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 포스트가 없는 경우
  if (!post) {
    return (
      <>
        <Head>
          <title>게시물을 찾을 수 없음 - MASGOLF</title>
        </Head>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">게시물을 찾을 수 없습니다</h1>
              <p className="text-gray-600 mb-8">요청하신 게시물이 존재하지 않거나 삭제되었습니다.</p>
              <Link href="/admin/blog" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                블로그 목록으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>게시물 편집 - {post.title} - MASGOLF</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">게시물 편집</h1>
                <p className="mt-2 text-gray-600">게시물을 수정하세요</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/admin/blog"
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  ← 목록으로 돌아가기
                </Link>
              </div>
            </div>
          </div>

          {/* 허브 연동 정보 표시 */}
          {(() => {
            console.log('🔍 허브 연동 정보 표시 조건:', {
              isEditMode: isEditMode(),
              isHubMode,
              hubData,
              post,
              activeTab: 'edit'
            });
            return isEditMode() && isHubMode && hubData;
          })() && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg">🎯</span>
                <h3 className="text-lg font-semibold text-blue-800">허브 콘텐츠 연동</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="text-sm font-medium text-gray-700 w-16">허브 ID:</span>
                  <span className="text-sm text-gray-900 font-mono">{hubData.id}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-sm font-medium text-gray-700 w-16">제목:</span>
                  <span className="text-sm text-gray-900">{hubData.title}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-sm font-medium text-gray-700 w-16">요약:</span>
                  <span className="text-sm text-gray-900">{hubData.summary}</span>
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={() => handleHubSync(post)}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    🔄 허브 동기화
                  </button>
                  <span className="text-xs text-gray-500">
                    초안 저장 시 자동으로 허브 상태가 동기화됩니다.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 편집 폼 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
                <input
                  type="text"
                  value={post.title || ''}
                  onChange={(e) => setPost({...post, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="게시물 제목을 입력하세요"
                  required
                />
              </div>

              {/* 요약 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">요약</label>
                <textarea
                  value={post.excerpt || ''}
                  onChange={(e) => setPost({...post, excerpt: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="게시물 요약을 입력하세요"
                  rows={3}
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">내용 *</label>
                <div className="border border-gray-300 rounded-md">
                  <TipTapEditor
                    content={post.content || ''}
                    onChange={(content) => setPost({...post, content})}
                    placeholder="게시물 내용을 입력하세요"
                  />
                </div>
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <select
                  value={post.category || 'blog'}
                  onChange={(e) => setPost({...post, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="blog">블로그</option>
                  <option value="고객 후기">고객 후기</option>
                  <option value="골프 정보">골프 정보</option>
                  <option value="제품 소개">제품 소개</option>
                </select>
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select
                  value={post.status || 'draft'}
                  onChange={(e) => setPost({...post, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">초안</option>
                  <option value="published">발행</option>
                  <option value="archived">보관</option>
                </select>
              </div>

              {/* 이미지 관리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이미지 관리</label>
                <div className="border border-gray-300 rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-700">게시물 이미지</h4>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowImageGallery(true)}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        📁 갤러리에서 추가
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowImageUpload(true)}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        📤 새 이미지 업로드
                      </button>
                    </div>
                  </div>
                  
                  {postImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {postImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url || image.original_url}
                            alt={image.alt_text || '게시물 이미지'}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                              <button
                                onClick={() => handleSetFeaturedImage(image.id)}
                                className="bg-white text-gray-800 px-2 py-1 rounded text-xs"
                                title="대표 이미지로 설정"
                              >
                                ⭐
                              </button>
                              <button
                                onClick={() => handleImageDelete(image.id)}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                                title="이미지 삭제"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>등록된 이미지가 없습니다.</p>
                      <p className="text-sm">갤러리에서 추가하거나 새로 업로드하세요.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-3">
                <Link
                  href="/admin/blog"
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  취소
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 허브 동기화 모달 */}
      {syncModalData.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">허브 콘텐츠 동기화</h3>
              <button
                onClick={() => setSyncModalData({ isOpen: false, blogPost: null, hubId: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>블로그:</strong> {syncModalData.blogPost?.title}
              </p>
              <p className="text-sm text-gray-600">
                <strong>허브 ID:</strong> {syncModalData.hubId}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleHubSyncWithAI(syncModalData.blogPost, syncModalData.hubId)}
                disabled={isSyncing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSyncing ? '🔄 동기화 중...' : '🤖 AI 동기화'}
              </button>
              
              <button
                onClick={() => handleHubSyncDirect(syncModalData.blogPost, syncModalData.hubId)}
                disabled={isSyncing}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSyncing ? '🔄 동기화 중...' : '⚡ 직접 동기화'}
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <p><strong>AI 동기화:</strong> 허브용으로 최적화된 요약/개요 생성</p>
              <p><strong>직접 동기화:</strong> 현재 블로그 내용을 그대로 복사</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
