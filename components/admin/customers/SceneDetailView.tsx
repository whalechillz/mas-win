/**
 * 장면별 상세 뷰 컴포넌트
 * 왼쪽: 장면 목록, 오른쪽: 선택된 장면 상세 (사진/장면 설명/후기 탭)
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

interface SceneDetailViewProps {
  customerId: number;
}

interface ImageMetadata {
  id: number;
  image_url: string;
  alt_text?: string;
  story_scene?: number;
  display_order?: number;
  image_type?: string;
  english_filename?: string;
}

interface SceneDescription {
  scene_number: number;
  description: string;
}

interface Review {
  id: string;
  consultation_date: string;
  content: string;
  review_type: string | null;
}

const SCENE_NAMES: Record<number, string> = {
  1: '행복한 주인공',
  2: '행복+불안 전조',
  3: '문제 발생',
  4: '가이드 만남',
  5: '가이드 장소',
  6: '성공 회복',
  7: '여운 정적'
};

export default function SceneDetailView({ customerId }: SceneDetailViewProps) {
  const [activeScene, setActiveScene] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'images' | 'description' | 'reviews'>('images');
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [sceneDescriptions, setSceneDescriptions] = useState<Record<number, string>>({});
  const [editingDescription, setEditingDescription] = useState<string>('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 이미지 로드
      const imagesResponse = await fetch(`/api/admin/upload-customer-image?customerId=${customerId}`);
      const imagesResult = await imagesResponse.json();
      if (imagesResult.success) {
        setImages(imagesResult.images || []);
      }

      // 장면 설명 로드
      const descriptionsResponse = await fetch(`/api/admin/customer-story-scenes?customerId=${customerId}`);
      const descriptionsResult = await descriptionsResponse.json();
      if (descriptionsResult.success) {
        const descriptions: Record<number, string> = {};
        (descriptionsResult.scenes || []).forEach((scene: any) => {
          descriptions[scene.scene_number] = scene.description || '';
        });
        setSceneDescriptions(descriptions);
      }

      // 후기 로드
      const reviewsResponse = await fetch(`/api/admin/customer-reviews?customerId=${customerId}`);
      const reviewsResult = await reviewsResponse.json();
      if (reviewsResult.success) {
        setReviews(reviewsResult.reviews || []);
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 장면별 이미지
  const sceneImages = useMemo(() => {
    return images
      .filter(img => img.story_scene === activeScene)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [images, activeScene]);

  // 현재 장면 설명
  const currentDescription = sceneDescriptions[activeScene] || '';

  // 장면 설명 저장
  const handleSaveDescription = async () => {
    try {
      const response = await fetch('/api/admin/customer-story-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          sceneNumber: activeScene,
          description: editingDescription
        })
      });

      const result = await response.json();
      if (result.success) {
        setSceneDescriptions(prev => ({
          ...prev,
          [activeScene]: editingDescription
        }));
        alert('장면 설명이 저장되었습니다.');
      }
    } catch (error) {
      console.error('장면 설명 저장 오류:', error);
      alert('장면 설명 저장 실패');
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
    <div className="grid grid-cols-3 gap-4">
      {/* 왼쪽: 장면 목록 */}
      <div className="col-span-1 space-y-2">
        <h3 className="font-semibold text-gray-900 mb-3">장면 목록</h3>
        {[1, 2, 3, 4, 5, 6, 7].map(sceneNum => {
          const sceneImagesCount = images.filter(img => img.story_scene === sceneNum).length;
          return (
            <button
              key={sceneNum}
              onClick={() => {
                setActiveScene(sceneNum);
                setEditingDescription(sceneDescriptions[sceneNum] || '');
              }}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                activeScene === sceneNum
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">장면 {sceneNum}</div>
              <div className="text-sm text-gray-600">{SCENE_NAMES[sceneNum]}</div>
              <div className="text-xs text-gray-500 mt-1">
                이미지: {sceneImagesCount}개
              </div>
            </button>
          );
        })}
      </div>

      {/* 오른쪽: 선택된 장면 상세 */}
      <div className="col-span-2">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {/* 장면 헤더 */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              장면 {activeScene}: {SCENE_NAMES[activeScene]}
            </h3>
          </div>

          {/* 탭 메뉴 */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('images')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'images'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                사진 ({sceneImages.length})
              </button>
              <button
                onClick={() => setActiveTab('description')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'description'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                장면 설명
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                후기 ({reviews.length})
              </button>
            </nav>
          </div>

          {/* 탭 내용 */}
          {activeTab === 'images' && (
            <div>
              {sceneImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {sceneImages.map(img => (
                    <div key={img.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={img.image_url}
                        alt={img.alt_text || img.english_filename || ''}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  이 장면에 할당된 이미지가 없습니다.
                </div>
              )}
            </div>
          )}

          {activeTab === 'description' && (
            <div className="space-y-4">
              <textarea
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                placeholder="장면 설명을 추가하세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={6}
              />
              <button
                onClick={handleSaveDescription}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-2">
                      {new Date(review.consultation_date).toLocaleDateString('ko-KR')}
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {review.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  연결된 후기가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
