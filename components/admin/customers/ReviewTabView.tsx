/**
 * 후기 탭 뷰 컴포넌트
 * 왼쪽: 후기 목록, 오른쪽: 선택된 후기 상세 (후기 내용/연결된 이미지/블로그 생성)
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';

// TipTap 에디터 동적 import (SSR 방지)
const TipTapEditor = dynamic(() => import('../TipTapEditor'), {
  ssr: false,
  loading: () => <div className="text-center py-4 text-gray-500">에디터 로딩 중...</div>
});

// FolderImagePicker 동적 import (SSR 방지)
const FolderImagePicker = dynamic(() => import('../FolderImagePicker'), {
  ssr: false
});

interface ReviewTabViewProps {
  customerId: number;
}

interface Review {
  id: string;
  consultation_date: string;
  consultation_type: string;
  review_type: string | null;
  topic: string | null;
  content: string;
  review_rating: number | null;
  review_images: number[] | null;
  is_blog_ready: boolean;
  generated_blog_id: number | null;
  generated_hub_id: string | null;
  image_count: number | null;
  blog_draft_content: string | null;
  blog_draft_title: string | null;
  blog_draft_summary: string | null;
  blog_draft_type: string | null;
  blog_draft_created_at: string | null;
}

interface ImageMetadata {
  id: number;
  image_url: string;
  alt_text?: string;
  english_filename?: string;
}

export default function ReviewTabView({ customerId }: ReviewTabViewProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [activeTab, setActiveTab] = useState<'content'>('content');
  const [showGallery, setShowGallery] = useState(false);
  const [customerFolderPath, setCustomerFolderPath] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [editContentMarkdown, setEditContentMarkdown] = useState<string>('');
  const [editTitle, setEditTitle] = useState<string>('');
  const [editConsultationType, setEditConsultationType] = useState<string>('review');
  const [editReviewType, setEditReviewType] = useState<string | null>(null);
  const [reviewImages, setReviewImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNewPost, setIsNewPost] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blogType, setBlogType] = useState<'storyboard' | 'integrated' | 'review-only'>('storyboard');
  const [referencedReviews, setReferencedReviews] = useState<Review[]>([]);
  const [showReferenceSelector, setShowReferenceSelector] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [customerId]);

  // 외부에서 새로고침 트리거 이벤트 리스너
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 ReviewTabView 새로고침 이벤트 수신');
      loadReviews();
    };
    
    window.addEventListener('refreshReviewList', handleRefresh);
    return () => {
      window.removeEventListener('refreshReviewList', handleRefresh);
    };
  }, []);

  useEffect(() => {
    if (selectedReview) {
      // 제목 초기화 (blog_draft_title 우선, 없으면 topic)
      const title = selectedReview.blog_draft_title || selectedReview.topic || '';
      setEditTitle(title);
      
      // 분류 초기화
      setEditConsultationType(selectedReview.consultation_type || 'review');
      setEditReviewType(selectedReview.review_type);
      
      // 블로그 초안이 있으면 초안 내용을, 없으면 후기 내용을 표시
      const content = selectedReview.blog_draft_content || selectedReview.content || '';
      setEditContent(content);
      setEditContentMarkdown(content);
      loadReviewImages();
    }
  }, [selectedReview]);

  // 고객 폴더 경로 조회
  useEffect(() => {
    if (customerId) {
      fetch(`/api/admin/customers?id=${customerId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data && data.data.length > 0) {
            const customer = data.data[0];
            if (customer.folder_name) {
              setCustomerFolderPath(`originals/customers/${customer.folder_name}`);
            }
          }
        })
        .catch(err => console.error('고객 정보 조회 실패:', err));
    }
  }, [customerId]);

  // TipTapEditor의 갤러리 열기 이벤트 리스너
  useEffect(() => {
    const handler = (e: Event) => {
      setShowGallery(true);
    };
    window.addEventListener('tiptap:open-gallery', handler);
    return () => window.removeEventListener('tiptap:open-gallery', handler);
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/customer-reviews?customerId=${customerId}`);
      const result = await response.json();
      
      if (result.success) {
        setReviews(result.reviews || []);
        if (result.reviews && result.reviews.length > 0 && !selectedReview) {
          setSelectedReview(result.reviews[0]);
        }
      }
    } catch (error) {
      console.error('후기 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewImages = async () => {
    if (!selectedReview || !selectedReview.review_images || selectedReview.review_images.length === 0) {
      setReviewImages([]);
      return;
    }

    try {
      // 이미지 ID 배열로 이미지 메타데이터 조회
      const imageIds = selectedReview.review_images.join(',');
      const response = await fetch(`/api/admin/image-metadata?ids=${imageIds}`);
      const result = await response.json();
      
      if (result.success) {
        setReviewImages(result.images || []);
      }
    } catch (error) {
      console.error('이미지 로드 오류:', error);
    }
  };

  // 후기 저장 (블로그 초안이 있으면 초안도 함께 저장)
  const handleSaveReview = async () => {
    if (!selectedReview) return;

    try {
      // 마크다운 내용을 일반 텍스트로 변환 (HTML 태그 제거)
      const contentToSave = editContentMarkdown || editContent;

      // 업데이트 데이터 구성
      const updateData: any = {
        reviewId: selectedReview.id,
        content: contentToSave,
        topic: editTitle, // 제목 업데이트 (topic으로 통합)
        consultationType: editConsultationType, // 분류 업데이트
        reviewType: editReviewType // 후기 유형 업데이트
      };

      // 블로그 초안이 있으면 초안 내용과 제목도 함께 저장
      if (selectedReview.blog_draft_content) {
        updateData.blogDraftContent = contentToSave;
        updateData.blogDraftTitle = editTitle; // blog_draft_title도 동기화
      }

      const response = await fetch('/api/admin/customer-reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      
      if (result.success) {
        await loadReviews();
        alert(selectedReview.blog_draft_content ? '블로그 초안이 저장되었습니다.' : '후기가 저장되었습니다.');
      } else {
        throw new Error(result.error || '저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 실패: ' + (error as Error).message);
    }
  };

  // 글 삭제
  const handleDeleteReview = async () => {
    if (!selectedReview) return;

    if (!confirm(`정말로 이 글을 삭제하시겠습니까?\n\n"${editTitle || selectedReview.topic || '제목 없음'}"\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/customer-reviews?reviewId=${selectedReview.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ 글이 삭제되었습니다.');
        setSelectedReview(null);
        await loadReviews();
      } else {
        throw new Error(result.error || '삭제 실패');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 실패: ' + (error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  // 새 글 작성 시작
  const handleCreateNewPost = () => {
    setIsNewPost(true);
    setSelectedReview(null);
    setEditTitle('');
    setEditContent('');
    setEditContentMarkdown('');
    setEditConsultationType('review');
    setEditReviewType(null);
  };

  // 새 글 저장
  const handleSaveNewPost = async () => {
    // 제목 검증
    if (!editTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    // 내용 검증 (editContentMarkdown 또는 editContent 확인)
    const contentToSave = (editContentMarkdown || editContent || '').trim();
    if (!contentToSave) {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/customer-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId,
          consultationDate: new Date().toISOString(),
          consultationType: editConsultationType,
          reviewType: editReviewType,
          topic: editTitle,
          content: contentToSave
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ 글이 저장되었습니다.');
        setIsNewPost(false);
        await loadReviews();
        // 새로 생성된 글 선택
        if (result.review) {
          setSelectedReview(result.review);
        }
      } else {
        throw new Error(result.error || '저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 실패: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // 블로그 생성
  const handleGenerateBlog = async () => {
    if (!customerId) return;

    // reviewId가 없으면 스토리보드 중심 생성
    const isStoryboardOnly = !selectedReview;
    
    const confirmMessage = isStoryboardOnly
      ? '스토리보드와 장면 설명을 기준으로 블로그 초안을 생성하시겠습니까?'
      : '이 후기로 블로그 초안을 생성하시겠습니까?';

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/admin/generate-blog-from-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId,
          reviewId: selectedReview?.id || null, // 선택사항
          reviewContent: selectedReview?.content || '', // 선택사항
          reviewImages: selectedReview?.review_images || [],
          referencedReviewIds: referencedReviews.map(r => r.id), // 참조 글 ID 배열
          blogType: blogType, // 'storyboard' | 'integrated' | 'review-only'
          framework: 'storybrand'
        })
      });

      const result = await response.json();

      if (result.success) {
        const message = result.referencedCount > 0
          ? `✅ 블로그 초안이 생성되었습니다!\n\n참조한 글: ${result.referencedCount}개\n글 목록에서 확인하실 수 있습니다.`
          : '✅ 블로그 초안이 생성되었습니다!\n\n글 목록에서 확인하실 수 있습니다.';
        
        alert(message);
        
        // 글 목록 새로고침
        await loadReviews();
        
        // 생성된 초안 항목 자동 선택 (가장 최근에 생성된 것)
        const updatedReviews = await fetch(`/api/admin/customer-reviews?customerId=${customerId}`)
          .then(res => res.json())
          .then(data => data.reviews || []);
        
        const newDraft = updatedReviews.find((r: Review) => 
          r.blog_draft_content && 
          r.blog_draft_created_at && 
          new Date(r.blog_draft_created_at).getTime() > Date.now() - 10000 // 10초 이내 생성된 것
        );
        
        if (newDraft) {
          setSelectedReview(newDraft);
          setActiveTab('content'); // 후기 내용 탭으로 이동하여 초안 확인
        }
        
        // 참조 선택 초기화
        setReferencedReviews([]);
      } else {
        throw new Error(result.error || '블로그 생성 실패');
      }
    } catch (error) {
      console.error('블로그 생성 오류:', error);
      alert('블로그 생성 실패: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 블로그로 복사
  const handleCopyToBlog = async () => {
    if (!selectedReview) return;
    
    // blog_draft_content 또는 content가 있어야 함
    if (!selectedReview.blog_draft_content && !selectedReview.content) {
      alert('블로그로 복사할 내용이 없습니다.');
      return;
    }

    const confirmMessage = selectedReview.blog_draft_content
      ? '블로그 초안을 블로그 관리로 복사하시겠습니까?\n\n복사 후 블로그 관리 페이지에서 확인하실 수 있습니다.'
      : '이 글을 블로그 관리로 복사하시겠습니까?\n\n복사 후 블로그 관리 페이지에서 확인하실 수 있습니다.';

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsCopying(true);

    try {
      const response = await fetch('/api/admin/copy-draft-to-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReview.id
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ 블로그 초안이 블로그 관리로 복사되었습니다!');
        
        // 글 목록 새로고침
        await loadReviews();
        
        // 블로그 관리 페이지로 이동
        if (confirm('블로그 관리 페이지에서 확인하시겠습니까?')) {
          window.open(`/admin/blog?id=${result.blogPost.id}`, '_blank');
        }
      } else {
        throw new Error(result.error || '블로그 복사 실패');
      }
    } catch (error) {
      console.error('블로그 복사 오류:', error);
      alert('블로그 복사 실패: ' + (error as Error).message);
    } finally {
      setIsCopying(false);
    }
  };

  // 글 타입 라벨 (후기 타입 + consultation_type)
  const getReviewTypeLabel = (review: Review) => {
    // 블로그 초안이 있으면 우선 표시
    if (review.blog_draft_content) {
      return '📝 초안';
    }
    
    // consultation_type에 따라 표시
    const consultationTypeLabels: Record<string, string> = {
      'review': '📝 후기',
      'phone': '📞 전화',
      'visit': '🏢 방문',
      'blog_draft': '✍️ 블로그 초안',
      'fitting': '⛳ 피팅',
      'online': '💻 온라인',
      'survey': '📋 설문',
      'booking': '📅 예약'
    };
    
    // consultation_type이 있으면 해당 라벨 반환
    if (review.consultation_type && consultationTypeLabels[review.consultation_type]) {
      const baseLabel = consultationTypeLabels[review.consultation_type];
      
      // review_type이 있고 consultation_type이 'review'인 경우 세부 유형 추가
      if (review.consultation_type === 'review' && review.review_type) {
        const reviewTypeLabels: Record<string, string> = {
          'kakao': '💬 카카오톡',
          'phone': '📞 전화',
          'visit': '🏢 방문',
          'blog': '📝 블로그'
        };
        return reviewTypeLabels[review.review_type] || baseLabel;
      }
      
      return baseLabel;
    }
    
    // review_type에 따라 표시 (하위 호환성)
    const reviewTypeLabels: Record<string, string> = {
      'kakao': '💬 카카오톡',
      'phone': '📞 전화',
      'visit': '🏢 방문',
      'blog': '📝 블로그'
    };
    
    return reviewTypeLabels[review.review_type || ''] || '기타';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 왼쪽: 글 목록 */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 mb-3">글 목록 ({reviews.length}개)</h3>
        <button
          onClick={handleCreateNewPost}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2 mb-3"
        >
          ➕ 새 글 작성
        </button>
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            저장된 글이 없습니다.
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {reviews.map(review => (
              <button
                key={review.id}
                onClick={() => setSelectedReview(review)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedReview?.id === review.id
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {getReviewTypeLabel(review)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(review.consultation_date).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="text-sm text-gray-700 line-clamp-2">
                  {(() => {
                    const title = review.blog_draft_title || review.topic;
                    if (title) {
                      return title; // 제목이 있으면 그대로 표시
                    }
                    // content를 표시할 때만 substring + "..."
                    const content = review.content || '';
                    return content.length > 100 ? content.substring(0, 100) + '...' : content;
                  })()}
                </div>
                <div className="flex items-center justify-between mt-1">
                  {review.is_blog_ready && review.generated_blog_id && review.generated_blog_id > 0 ? (
                    <div className="text-xs text-green-600">
                      ✓ 블로그 #{review.generated_blog_id}
                    </div>
                  ) : review.blog_draft_content ? (
                    <div className="text-xs text-purple-600">
                      📝 블로그 초안
                    </div>
                  ) : review.consultation_type === 'blog' ? (
                    <div className="text-xs text-gray-500">
                      📝 기존 블로그
                    </div>
                  ) : null}
                  {review.image_count != null && Number(review.image_count) > 0 && (
                    <div className="text-xs text-gray-500">
                      📷 {review.image_count}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 오른쪽: 선택된 후기 상세 또는 새 글 작성 */}
      <div>
        {isNewPost ? (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            {/* 새 글 작성 헤더 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-lg font-semibold text-gray-900 border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 flex-1"
                  placeholder="제목을 입력하세요"
                />
              </div>
              
              {/* 분류 선택 */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600">분류:</label>
                  <select
                    value={editConsultationType}
                    onChange={(e) => setEditConsultationType(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="review">📝 고객 후기</option>
                    <option value="phone">📞 전화 통화</option>
                    <option value="visit">🏢 방문 상담</option>
                    <option value="blog_draft">✍️ 블로그 초안</option>
                    <option value="fitting">⛳ 피팅 데이터</option>
                    <option value="online">💻 온라인 상담</option>
                    <option value="survey">📋 설문 조사</option>
                    <option value="booking">📅 예약 내역</option>
                  </select>
                </div>
                
                {/* review_type은 consultation_type이 'review'일 때만 표시 */}
                {editConsultationType === 'review' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">후기 유형:</label>
                    <select
                      value={editReviewType || ''}
                      onChange={(e) => setEditReviewType(e.target.value || null)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">선택 안 함</option>
                      <option value="kakao">💬 카카오톡</option>
                      <option value="phone">📞 전화</option>
                      <option value="visit">🏢 방문</option>
                      <option value="blog">📝 블로그</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* 에디터 */}
            <TipTapEditor
              valueMarkdown={editContentMarkdown}
              onChangeMarkdown={(md) => {
                setEditContentMarkdown(md);
                setEditContent(md);
              }}
            />
            
            {/* 하단 버튼 */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveNewPost}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? '⏳ 저장 중...' : '저장'}
              </button>
              <button
                onClick={() => {
                  setIsNewPost(false);
                  setEditTitle('');
                  setEditContent('');
                  setEditContentMarkdown('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        ) : selectedReview ? (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            {/* 후기 헤더 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-lg font-semibold text-gray-900 border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 flex-1"
                  placeholder="제목을 입력하세요"
                />
                <span className="text-sm text-gray-500 ml-2">
                  {new Date(selectedReview.consultation_date).toLocaleDateString('ko-KR')}
                </span>
              </div>
              
              {/* 분류 선택 */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600">분류:</label>
                  <select
                    value={editConsultationType}
                    onChange={(e) => setEditConsultationType(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="review">📝 고객 후기</option>
                    <option value="phone">📞 전화 통화</option>
                    <option value="visit">🏢 방문 상담</option>
                    <option value="blog_draft">✍️ 블로그 초안</option>
                    <option value="fitting">⛳ 피팅 데이터</option>
                    <option value="online">💻 온라인 상담</option>
                    <option value="survey">📋 설문 조사</option>
                    <option value="booking">📅 예약 내역</option>
                  </select>
                </div>
                
                {/* review_type은 consultation_type이 'review'일 때만 표시 */}
                {editConsultationType === 'review' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">후기 유형:</label>
                    <select
                      value={editReviewType || ''}
                      onChange={(e) => setEditReviewType(e.target.value || null)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">선택 안 함</option>
                      <option value="kakao">💬 카카오톡</option>
                      <option value="phone">📞 전화</option>
                      <option value="visit">🏢 방문</option>
                      <option value="blog">📝 블로그</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {getReviewTypeLabel(selectedReview)}
                </span>
                {selectedReview.review_rating && (
                  <span className="text-sm text-yellow-600">
                    ⭐ {selectedReview.review_rating}
                  </span>
                )}
                {selectedReview.image_count && selectedReview.image_count > 0 && (
                  <span className="text-sm text-gray-500">
                    📷 {selectedReview.image_count}개
                  </span>
                )}
              </div>
            </div>

            {/* 탭 메뉴 제거 (단일 뷰로 변경) */}

            {/* 후기 내용 편집 */}
            <div className="space-y-4">
              {selectedReview.blog_draft_content && (
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 text-sm text-purple-900">
                    <span className="font-semibold">📝 블로그 초안 편집 중</span>
                    {selectedReview.blog_draft_title && (
                      <span className="text-xs text-purple-700">
                        ({selectedReview.blog_draft_title})
                      </span>
                    )}
                  </div>
                </div>
              )}
              <TipTapEditor
                valueMarkdown={editContentMarkdown}
                onChangeMarkdown={(md) => {
                  setEditContentMarkdown(md);
                  setEditContent(md); // 일반 텍스트도 업데이트
                }}
              />
              {/* 하단 버튼 */}
              <div className="flex gap-2 justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveReview}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {selectedReview.blog_draft_content ? '초안 저장' : '저장'}
                  </button>
                  
                  {/* 블로그로 복사 버튼 (초안이 있거나 기존 블로그 글인 경우) */}
                  {(selectedReview.blog_draft_content || 
                    (selectedReview.consultation_type === 'blog' && selectedReview.content) ||
                    (selectedReview.review_type === 'blog' && selectedReview.content)) &&
                    (!selectedReview.generated_blog_id || selectedReview.generated_blog_id <= 0) && (
                    <button
                      onClick={handleCopyToBlog}
                      disabled={isCopying}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isCopying ? '⏳ 복사 중...' : '📋 블로그로 복사'}
                    </button>
                  )}
                </div>
                
                {/* 삭제 버튼 (오른쪽 정렬) */}
                <button
                  onClick={handleDeleteReview}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? '⏳ 삭제 중...' : '🗑️ 삭제'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 글 선택 안 함 */
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4 text-lg">글을 선택하거나 새 글을 작성해주세요.</p>
            <p className="text-sm mb-2">블로그 초안 생성은 상단 탭의 "🚀 블로그 초안 생성" 버튼을 사용하세요.</p>
            <button
              onClick={handleCreateNewPost}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              ➕ 새 글 작성하기
            </button>
          </div>
        )}
      </div>

      {/* 참조 선택 모달 */}
      {showReferenceSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">참조할 글 선택</h3>
            <div className="space-y-2 mb-4">
              {reviews
                .filter(r => r.id !== selectedReview?.id) // 현재 선택한 글 제외
                .map(review => (
                  <label key={review.id} className="flex items-start cursor-pointer p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={referencedReviews.some(r => r.id === review.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReferencedReviews([...referencedReviews, review]);
                        } else {
                          setReferencedReviews(referencedReviews.filter(r => r.id !== review.id));
                        }
                      }}
                      className="mt-1 mr-2"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {review.blog_draft_title || review.topic || '제목 없음'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(review.consultation_date).toLocaleDateString('ko-KR')}
                        {review.blog_draft_content && ' • 📝 초안'}
                      </div>
                    </div>
                  </label>
                ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowReferenceSelector(false);
                  setReferencedReviews([]);
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={() => setShowReferenceSelector(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                확인 ({referencedReviews.length}개 선택)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FolderImagePicker 모달 */}
      {customerFolderPath && (
        <FolderImagePicker
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          onSelect={(url) => {
            // TipTapEditor에 이미지 삽입
            window.dispatchEvent(new CustomEvent('tiptap:insert-image', {
              detail: { url, alt: '' }
            }));
            setShowGallery(false);
          }}
          folderPath={customerFolderPath}
          title="갤러리에서 이미지 선택"
          enableUpload={true}
          enableDelete={false}
          onUpload={async (file, folderPath, uploadMode) => {
            // 이미지 업로드 API 호출
            const formData = new FormData();
            formData.append('file', file);
            formData.append('customerId', customerId.toString());
            formData.append('uploadMode', uploadMode || 'optimize-filename');
            
            const response = await fetch('/api/admin/upload-customer-image', {
              method: 'POST',
              body: formData
            });
            
            const result = await response.json();
            if (!result.success) {
              throw new Error(result.error || '이미지 업로드 실패');
            }
          }}
        />
      )}
    </div>
  );
}
