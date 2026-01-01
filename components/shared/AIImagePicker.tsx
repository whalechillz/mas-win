import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 갤러리 피커는 동적 로드
const GalleryPicker = dynamic(() => import('../admin/GalleryPicker'), { ssr: false });

interface AIImagePickerProps {
  selectedImage: string;
  onImageSelect: (imageUrl: string) => void;
  channelType: 'blog' | 'sms' | 'kakao' | 'naver';
  className?: string;
  autoFilterFolder?: string; // 자동 필터링할 폴더 경로
  initialSolapiId?: string; // Solapi ID 입력란 초기값 (sms 전용)
}

export const AIImagePicker: React.FC<AIImagePickerProps> = ({
  selectedImage,
  onImageSelect,
  channelType,
  className = '',
  autoFilterFolder,
  initialSolapiId
}) => {
  const [showGallery, setShowGallery] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [showSolapiInput, setShowSolapiInput] = useState(false);
  const [solapiImageId, setSolapiImageId] = useState(initialSolapiId || '');

  // 외부에서 현재 Solapi ID(formData.imageUrl)가 바뀌면 입력란도 동기화
  useEffect(() => {
    if (initialSolapiId && initialSolapiId.startsWith('ST01FZ')) {
      setSolapiImageId(initialSolapiId);
    }
  }, [initialSolapiId]);

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
      // 카카오 채널일 때 targetFolder 설정
      const today = new Date().toISOString().split('T')[0];
      const targetFolder = channelType === 'kakao' 
        ? `originals/daily-branding/kakao-ch/${today}`
        : undefined;

      const requestBody: any = {
        prompt: imagePrompt,
        width: imageInfo.width,
        height: imageInfo.height,
        channel: channelType
      };

      if (targetFolder) {
        requestBody.targetFolder = targetFolder;
      }

      const response = await fetch('/api/generate-blog-image-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
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
            {imageLoadError ? (
              // 이미지 로드 실패 시 플레이스홀더
              <div className="w-full h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                <div className="text-gray-400 text-4xl mb-2">🖼️</div>
                <div className="text-sm text-gray-500 text-center px-4">
                  <div className="font-medium mb-1">이미지를 불러올 수 없습니다</div>
                  <div className="text-xs break-all mt-2 max-w-full overflow-hidden text-ellipsis">
                    {selectedImage.length > 60 
                      ? `${selectedImage.substring(0, 60)}...` 
                      : selectedImage}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {selectedImage.startsWith('http://') || selectedImage.startsWith('https://') 
                      ? '이미지 URL이 유효하지 않거나 접근할 수 없습니다'
                      : selectedImage.startsWith('data:')
                      ? '이미지 데이터가 손상되었을 수 있습니다'
                      : '이미지 ID 또는 경로가 올바르지 않습니다'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setImageLoadError(false);
                    setIsImageLoading(true);
                    // 이미지 재로드 시도
                    const img = document.createElement('img');
                    img.onload = () => {
                      setImageLoadError(false);
                      setIsImageLoading(false);
                    };
                    img.onerror = () => {
                      setImageLoadError(true);
                      setIsImageLoading(false);
                    };
                    img.src = selectedImage;
                  }}
                  className="mt-3 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <>
                {isImageLoading && (
                  <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                )}
                <img
                  src={selectedImage}
                  alt="선택된 이미지"
                  className="w-full max-h-96 h-auto object-contain rounded-lg border border-gray-200"
                  onLoad={() => {
                    console.log('✅ AIImagePicker: 이미지 로드 성공');
                    console.log('   전체 URL:', selectedImage);
                    setIsImageLoading(false);
                    setImageLoadError(false);
                  }}
                  onError={(e) => {
                    const img = e.currentTarget;
                    const imgUrl = img.src || selectedImage;
                    console.error('❌ AIImagePicker: 이미지 로드 실패');
                    console.error('   img.src:', img.src);
                    console.error('   selectedImage:', selectedImage);
                    console.error('   imgUrl (사용된 URL):', imgUrl);
                    console.error('   URL 길이:', imgUrl.length);
                    console.error('   selectedImage 길이:', selectedImage.length);
                    console.error('   URL 타입:', 
                      imgUrl.startsWith('http://') || imgUrl.startsWith('https://') ? 'HTTP URL' :
                      imgUrl.startsWith('data:') ? 'Data URL' :
                      imgUrl.startsWith('/') ? '상대 경로' :
                      '알 수 없음'
                    );
                    
                    // 실제로 URL이 잘렸는지 확인
                    if (img.src !== selectedImage) {
                      console.error('   ⚠️ img.src와 selectedImage가 다릅니다!');
                      console.error('   img.src 길이:', img.src.length);
                      console.error('   selectedImage 길이:', selectedImage.length);
                    }
                    
                    // Supabase Storage URL이 올바른 형식인지 확인
                    if (imgUrl.includes('supabase.co/storage/v') && !imgUrl.includes('/object/public/')) {
                      console.error('   ⚠️ Supabase Storage URL 형식이 잘못되었습니다!');
                      console.error('   예상 형식: .../storage/v1/object/public/[bucket]/[path]');
                      console.error('   실제 URL:', imgUrl);
                    }
                    
                    // URL이 잘렸는지 확인
                    if (imgUrl.length < 100 && imgUrl.includes('supabase.co/storage/v')) {
                      console.error('   ⚠️ URL이 잘린 것 같습니다!');
                      console.error('   원본 selectedImage:', selectedImage);
                    }
                    
                    setIsImageLoading(false);
                    setImageLoadError(true);
                    
                    // 이미지 URL이 상대 경로인 경우 절대 경로로 변환 시도
                    if (typeof window !== 'undefined' && 
                        !imgUrl.startsWith('http://') && 
                        !imgUrl.startsWith('https://') && 
                        !imgUrl.startsWith('data:')) {
                      console.log('🔄 상대 경로 감지, 절대 경로로 변환 시도');
                      const absoluteUrl = imgUrl.startsWith('/') 
                        ? `${window.location.origin}${imgUrl}`
                        : `${window.location.origin}/${imgUrl}`;
                      console.log('   변환된 URL:', absoluteUrl);
                      // 한 번만 시도
                      if (!imgUrl.includes(window.location.origin)) {
                        setTimeout(() => {
                          img.src = absoluteUrl;
                        }, 500);
                      }
                    }
                  }}
                  onLoadStart={() => {
                    setIsImageLoading(true);
                    setImageLoadError(false);
                  }}
                />
              </>
            )}
            <button
              onClick={() => {
                onImageSelect('');
                setImageLoadError(false);
                setIsImageLoading(false);
              }}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 z-20"
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

      {/* Solapi imageId 직접 입력 (SMS만) */}
      {channelType === 'sms' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowSolapiInput(!showSolapiInput)}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
          >
            <span>📦</span>
            <span>Solapi ID 입력</span>
          </button>
          
          {showSolapiInput && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-purple-800">Solapi ImageId</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowSolapiInput(false);
                    setSolapiImageId('');
                  }}
                  className="ml-auto text-purple-600 hover:text-purple-800 text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={solapiImageId}
                  onChange={(e) => setSolapiImageId(e.target.value)}
                  placeholder="ST01FZ..."
                  className="flex-1 px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (solapiImageId && solapiImageId.startsWith('ST01FZ')) {
                      onImageSelect(solapiImageId);
                      setShowSolapiInput(false);
                      setSolapiImageId('');
                      alert('✅ Solapi imageId가 선택되었습니다. (업로드 불필요)');
                    } else {
                      alert('❌ 올바른 Solapi imageId를 입력해주세요. (ST01FZ로 시작)');
                    }
                  }}
                  className="px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  적용
                </button>
              </div>
              <p className="mt-2 text-xs text-purple-600">
                💡 Solapi에 이미 업로드된 imageId를 입력하면 즉시 사용할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      )}

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
              autoFilterFolder={autoFilterFolder || (channelType === 'sms' ? 'originals/mms' : undefined)}
              sourceFilter={channelType === 'sms' ? 'mms' : undefined}
              channelFilter={channelType === 'sms' ? 'sms' : undefined}
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
