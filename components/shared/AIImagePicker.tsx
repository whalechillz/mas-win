import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// 갤러리 피커는 동적 로드
const GalleryPicker = dynamic(() => import('../admin/GalleryPicker'), { ssr: false });

interface AIImagePickerProps {
  selectedImage: string;
  onImageSelect: (imageUrl: string) => void;
  channelType: 'blog' | 'sms' | 'kakao' | 'naver';
  className?: string;
}

export const AIImagePicker: React.FC<AIImagePickerProps> = ({
  selectedImage,
  onImageSelect,
  channelType,
  className = ''
}) => {
  const [showGallery, setShowGallery] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');

  // 채널별 이미지 크기 정보
  const getChannelImageInfo = () => {
    switch (channelType) {
      case 'sms':
        return { width: 640, height: 480, label: 'MMS 이미지 (640x480)' };
      case 'kakao':
        return { width: 800, height: 600, label: '카카오톡 이미지 (800x600)' };
      case 'naver':
        return { width: 1200, height: 630, label: '네이버 블로그 이미지 (1200x630)' };
      default:
        return { width: 1200, height: 630, label: '블로그 이미지 (1200x630)' };
    }
  };

  const imageInfo = getChannelImageInfo();

  // AI 이미지 생성
  const generateAIImage = async () => {
    if (!imagePrompt.trim()) {
      alert('이미지 설명을 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-blog-image-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          width: imageInfo.width,
          height: imageInfo.height,
          channel: channelType
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.imageUrl) {
          onImageSelect(data.imageUrl);
          setImagePrompt('');
        } else {
          alert('이미지 생성에 실패했습니다.');
        }
      } else {
        alert('이미지 생성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('이미지 생성 오류:', error);
      alert('이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">이미지 선택</h3>
        <span className="text-sm text-gray-500">{imageInfo.label}</span>
      </div>

      {/* 선택된 이미지 미리보기 */}
      {selectedImage && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            선택된 이미지
          </label>
          <div className="relative">
            <img
              src={selectedImage}
              alt="선택된 이미지"
              className="w-full max-h-96 h-auto object-contain rounded-lg border border-gray-200"
            />
            <button
              onClick={() => onImageSelect('')}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 갤러리에서 선택 */}
      <div>
        <button
          onClick={() => setShowGallery(true)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <span>🖼️</span>
          <span>갤러리에서 선택</span>
        </button>
      </div>

      {/* AI 이미지 생성 */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AI 이미지 생성
          </label>
          <textarea
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="생성하고 싶은 이미지를 설명해주세요..."
            rows={3}
          />
        </div>
        <button
          onClick={generateAIImage}
          disabled={isGenerating || !imagePrompt.trim()}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>생성 중...</span>
            </>
          ) : (
            <>
              <span>🎨</span>
              <span>AI 이미지 생성</span>
            </>
          )}
        </button>
      </div>

      {/* 갤러리 모달 */}
      {showGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">이미지 갤러리</h3>
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
                onImageSelect(imageUrl);
                setShowGallery(false);
              }}
              onClose={() => setShowGallery(false)}
            />
          </div>
        </div>
      )}

      {/* 사용 안내 */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        💡 {channelType === 'sms' && 'MMS는 640x480 크기의 이미지를 권장합니다.'}
        {channelType === 'kakao' && '카카오톡은 800x600 크기의 이미지를 권장합니다.'}
        {channelType === 'naver' && '네이버 블로그는 1200x630 크기의 이미지를 권장합니다.'}
        {channelType === 'blog' && '블로그는 1200x630 크기의 이미지를 권장합니다.'}
      </div>
    </div>
  );
};
