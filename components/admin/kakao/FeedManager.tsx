'use client';

import React, { useState } from 'react';
import { Image, Sparkles, X, RotateCcw } from 'lucide-react';
import GalleryPicker from '../GalleryPicker';

interface FeedData {
  imageCategory: string;
  imagePrompt: string;
  caption: string;
  imageUrl?: string;
}

interface FeedManagerProps {
  account: {
    number: string;
    name: string;
    persona: string;
    tone: 'gold' | 'black';
  };
  feedData: FeedData;
  onUpdate: (data: FeedData) => void;
  onGenerateImage: (prompt: string) => Promise<{ imageUrls: string[], generatedPrompt?: string }>;
  isGenerating?: boolean;
}

export default function FeedManager({
  account,
  feedData,
  onUpdate,
  onGenerateImage,
  isGenerating = false
}: FeedManagerProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleGenerateImage = async () => {
    try {
      setIsGeneratingImage(true);
      const result = await onGenerateImage(feedData.imagePrompt);
      if (result.imageUrls.length > 0) {
        onUpdate({
          ...feedData,
          imageUrl: result.imageUrls[0],
          imagePrompt: result.generatedPrompt || feedData.imagePrompt // 생성된 프롬프트 저장
        });
      }
    } catch (error: any) {
      alert(`피드 이미지 생성 실패: ${error.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 이미지 카테고리 */}
      <div className="border rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          피드 이미지
        </label>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <strong>카테고리:</strong> {feedData.imageCategory}
          </div>
          <div className="text-xs text-gray-500 max-h-20 overflow-y-auto">
            <strong>프롬프트:</strong> {feedData.imagePrompt}
          </div>
          
          {feedData.imageUrl && (
            <div className="mt-2 relative">
              <img 
                src={feedData.imageUrl} 
                alt="피드 이미지"
                className="w-full aspect-square object-cover rounded-lg"
              />
              <button
                onClick={() => onUpdate({
                  ...feedData,
                  imageUrl: undefined
                })}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                title="이미지 삭제"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowGallery(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              <Image className="w-4 h-4" />
              갤러리에서 선택
            </button>
            <button
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || isGenerating}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm disabled:opacity-50"
            >
              {isGeneratingImage ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  {feedData.imageUrl ? '이미지 재생성' : '⚡ 피드 이미지 생성'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 캡션 */}
      <div className="border rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          피드 캡션
        </label>
        <textarea
          value={feedData.caption}
          onChange={(e) => onUpdate({ ...feedData, caption: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="피드 캡션을 입력하세요"
        />
        <div className="text-xs text-gray-500 mt-1">
          {feedData.caption.length}자
        </div>
      </div>

      {/* 갤러리 모달 */}
      {showGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">피드 이미지 선택</h3>
              <button
                onClick={() => setShowGallery(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <GalleryPicker
              isOpen={showGallery}
              onSelect={(imageUrl) => {
                onUpdate({
                  ...feedData,
                  imageUrl
                });
                setShowGallery(false);
              }}
              onClose={() => setShowGallery(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

