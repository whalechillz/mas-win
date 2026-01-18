/**
 * 고객 후기 타임라인 뷰 컴포넌트
 * 날짜별로 후기를 그룹화하여 타임라인 형태로 표시
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';

// TipTap 에디터 동적 import (SSR 방지)
const TipTapEditor = dynamic(() => import('../TipTapEditor'), {
  ssr: false,
  loading: () => <div className="text-center py-4 text-gray-500">에디터 로딩 중...</div>
});

interface ReviewTimelineViewProps {
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
  created_at: string;
  updated_at: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function ReviewTimelineView({ customerId }: ReviewTimelineViewProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [editContentMarkdown, setEditContentMarkdown] = useState<string>('');

  // 후기 목록 로드
  useEffect(() => {
    loadReviews();
  }, [customerId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      // API를 통해 후기 조회
      const response = await fetch(`/api/admin/customer-reviews?customerId=${customerId}`);
      const result = await response.json();
      
      if (result.success) {
        setReviews(result.reviews || []);
      } else {
        console.error('후기 로드 실패:', result.error);
      }
    } catch (error) {
      console.error('후기 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 날짜별 후기 그룹화
  const reviewsByDate = useMemo(() => {
    const grouped: Record<string, Review[]> = {};
    reviews.forEach(review => {
      const date = new Date(review.consultation_date).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(review);
    });
    return grouped;
  }, [reviews]);

  // 날짜 목록 (정렬)
  const dates = useMemo(() => {
    return Object.keys(reviewsByDate).sort((a, b) => b.localeCompare(a));
  }, [reviewsByDate]);

  // 필터링된 날짜 목록
  const filteredDates = useMemo(() => {
    if (!selectedDate) return dates;
    return dates.filter(date => date === selectedDate);
  }, [dates, selectedDate]);

  // 후기 타입 라벨
  const getReviewTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      'kakao': '카카오톡',
      'phone': '전화',
      'visit': '방문',
      'blog': '블로그'
    };
    return labels[type || ''] || '기타';
  };

  // 후기 수정
  const handleEditReview = (review: Review) => {
    setEditingReview(review.id);
    const content = review.content || '';
    setEditContent(content);
    setEditContentMarkdown(content);
  };

  // 후기 저장
  const handleSaveReview = async (reviewId: string) => {
    try {
      const contentToSave = editContentMarkdown || editContent;

      const response = await fetch('/api/admin/customer-reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          content: contentToSave
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setEditingReview(null);
        setEditContent('');
        setEditContentMarkdown('');
        await loadReviews();
      } else {
        throw new Error(result.error || '후기 저장 실패');
      }
    } catch (error) {
      console.error('후기 저장 오류:', error);
      alert('후기 저장 실패: ' + (error as Error).message);
    }
  };

  // 후기 삭제
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('이 후기를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/customer-reviews?reviewId=${reviewId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        await loadReviews();
      } else {
        throw new Error(result.error || '후기 삭제 실패');
      }
    } catch (error) {
      console.error('후기 삭제 오류:', error);
      alert('후기 삭제 실패: ' + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          후기 타임라인 ({reviews.length}개)
        </h3>
        <div className="flex gap-2">
          {/* 날짜 필터 */}
          <select
            value={selectedDate || ''}
            onChange={(e) => setSelectedDate(e.target.value || null)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">전체</option>
            {dates.map(date => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 타임라인 */}
      {filteredDates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          저장된 후기가 없습니다.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredDates.map(date => {
            const dateReviews = reviewsByDate[date];
            return (
              <div key={date} className="border-l-2 border-blue-500 pl-4 relative">
                {/* 날짜 헤더 */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full -ml-[18px] absolute"></div>
                  <h4 className="font-semibold text-gray-900">
                    {new Date(date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </h4>
                  <span className="text-sm text-gray-500">
                    ({dateReviews.length}개)
                  </span>
                </div>

                {/* 후기 목록 */}
                <div className="space-y-4 ml-4">
                  {dateReviews.map(review => (
                    <div
                      key={review.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {/* 후기 헤더 */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {getReviewTypeLabel(review.review_type)}
                          </span>
                          {review.topic && (
                            <span className="text-sm text-gray-600">
                              {review.topic}
                            </span>
                          )}
                          {review.review_rating && (
                            <span className="text-sm text-yellow-600">
                              ⭐ {review.review_rating}
                            </span>
                          )}
                          {review.image_count && review.image_count > 0 && (
                            <span className="text-sm text-gray-500">
                              📷 {review.image_count}개
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {review.is_blog_ready && review.generated_blog_id && (
                            <a
                              href={`/admin/blog?id=${review.generated_blog_id}`}
                              target="_blank"
                              className="text-xs text-green-600 hover:underline"
                            >
                              블로그 #{review.generated_blog_id}
                            </a>
                          )}
                          <button
                            onClick={() => handleEditReview(review)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            삭제
                          </button>
                        </div>
                      </div>

                      {/* 후기 내용 */}
                      {editingReview === review.id ? (
                        <div className="space-y-2">
                          <TipTapEditor
                            valueMarkdown={editContentMarkdown}
                            onChangeMarkdown={(md) => {
                              setEditContentMarkdown(md);
                              setEditContent(md);
                            }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveReview(review.id)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => {
                                setEditingReview(null);
                                setEditContent('');
                                setEditContentMarkdown('');
                              }}
                              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {review.content}
                        </div>
                      )}

                      {/* 연결된 이미지 */}
                      {review.review_images && review.review_images.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-2">
                            연결된 이미지: {review.review_images.length}개
                          </div>
                          {/* 이미지 목록은 추후 구현 */}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
