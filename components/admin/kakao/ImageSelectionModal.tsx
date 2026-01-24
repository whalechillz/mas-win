'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Loader } from 'lucide-react';

interface ImageSelectionModalProps {
  isOpen: boolean;
  imageUrls: string[];
  onSelect: (selectedImageUrl: string) => void;
  onClose: () => void;
  title?: string;
  allowAutoSelect?: boolean; // Playwright 자동 선택 허용 여부
}

export default function ImageSelectionModal({
  isOpen,
  imageUrls,
  onSelect,
  onClose,
  title = '이미지 선택',
  allowAutoSelect = false
}: ImageSelectionModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);

  // 모달이 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // 빈 문자열이면 'auto'로 복구
        document.body.style.overflow = originalOverflow || 'auto';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Playwright 자동 선택 기능
  const handleAutoSelect = async () => {
    if (imageUrls.length < 2) {
      onSelect(imageUrls[0]);
      return;
    }

    setIsAutoSelecting(true);
    
    try {
      // 이미지 품질 평가 API 호출
      const response = await fetch('/api/kakao-content/evaluate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls })
      });

      if (response.ok) {
        const data = await response.json();
        const bestIndex = data.bestImageIndex ?? 0;
        setSelectedIndex(bestIndex);
        onSelect(imageUrls[bestIndex]);
      } else {
        // API 실패 시 첫 번째 이미지 선택
        setSelectedIndex(0);
        onSelect(imageUrls[0]);
      }
    } catch (error) {
      console.error('자동 선택 실패:', error);
      // 오류 시 첫 번째 이미지 선택
      setSelectedIndex(0);
      onSelect(imageUrls[0]);
    } finally {
      setIsAutoSelecting(false);
    }
  };

  const handleManualSelect = (index: number) => {
    setSelectedIndex(index);
    onSelect(imageUrls[index]);
  };

  // 이미지 그리드 레이아웃 (2개: 1행 2열, 4개: 2행 2열)
  const gridCols = imageUrls.length <= 2 ? 'grid-cols-2' : 'grid-cols-2';
  const gridRows = imageUrls.length <= 2 ? '' : 'grid-rows-2';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 안내 메시지 */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">
            {imageUrls.length}개의 이미지가 생성되었습니다. 원하는 이미지를 선택하세요.
          </div>
          <div className="text-xs text-gray-500">
            생성 사이즈: 1080x1350 (4:5 세로형, 카카오톡 피드 최적화) - AI 기반 중요 영역 자동 크롭
          </div>
        </div>

        {/* 자동 선택 버튼 (2개 이상일 때만 표시) */}
        {allowAutoSelect && imageUrls.length >= 2 && (
          <div className="mb-4">
            <button
              onClick={handleAutoSelect}
              disabled={isAutoSelecting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              {isAutoSelecting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  평가 중...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  AI가 가장 좋은 이미지 자동 선택
                </>
              )}
            </button>
          </div>
        )}

        {/* 이미지 그리드 */}
        <div className={`grid ${gridCols} ${gridRows} gap-4 mb-4`}>
          {imageUrls.map((url, index) => (
            <div
              key={index}
              className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                selectedIndex === index
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleManualSelect(index)}
            >
              <img
                src={url}
                alt={`옵션 ${index + 1}`}
                className="w-full aspect-[4/5] object-cover"
              />
              {selectedIndex === index && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center py-1 text-sm">
                옵션 {index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* 확인 버튼 */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
          >
            취소
          </button>
          <button
            onClick={() => {
              if (selectedIndex !== null) {
                onSelect(imageUrls[selectedIndex]);
              } else if (imageUrls.length > 0) {
                // 선택하지 않았으면 첫 번째 이미지 선택
                onSelect(imageUrls[0]);
              }
            }}
            disabled={selectedIndex === null && imageUrls.length === 0}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {selectedIndex !== null ? `옵션 ${selectedIndex + 1} 선택` : '첫 번째 이미지 선택'}
          </button>
        </div>
      </div>
    </div>
  );
}

