import React, { useState } from 'react';

interface ImageGroupThumbnailProps {
  images: any[];
  groupIndex: number;
  onImageSelect: (image: any) => void;
  onSetFeatured: (image: any) => void;
  onCopyImage: (image: any) => void;
}

const ImageGroupThumbnail: React.FC<ImageGroupThumbnailProps> = ({
  images,
  groupIndex,
  onImageSelect,
  onSetFeatured,
  onCopyImage
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const representativeImage = images[0] || null; // 첫 번째 이미지를 대표 이미지로 사용
  const groupSize = images.length;

  // representativeImage가 없는 경우 렌더링하지 않음
  if (!representativeImage || !representativeImage.src) {
    return null;
  }

  const handleThumbnailClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleImageClick = (image: any) => {
    onImageSelect(image);
  };

  const handleSetFeatured = (image: any, e: React.MouseEvent) => {
    e.stopPropagation();
    onSetFeatured(image);
  };

  const handleCopyImage = (image: any, e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyImage(image);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative">
      {/* 그룹 썸네일 */}
      <div 
        className="bg-white border-2 border-blue-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
        onClick={handleThumbnailClick}
      >
        {/* 대표 이미지 */}
        <div className="relative h-32 flex items-center justify-center bg-gray-100">
          <img
            src={representativeImage.src.includes('pstatic.net') 
              ? `/api/image-proxy?url=${encodeURIComponent(representativeImage.src)}`
              : representativeImage.src
            }
            alt={representativeImage.alt || `Group ${groupIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.jpg';
            }}
          />
          
          {/* 그룹 정보 오버레이 */}
          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
            📦 그룹 {groupIndex + 1}
          </div>
          
          <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
            {groupSize}개
          </div>
          
          {/* 확장 아이콘 */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>
        
        {/* 그룹 정보 */}
        <div className="p-3">
          <div className="text-sm font-medium text-gray-800 truncate">
            {representativeImage.fileName || `Group ${groupIndex + 1}`}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            클릭하여 {groupSize}개 이미지 보기
          </div>
        </div>
      </div>

      {/* 확장된 이미지 그룹 */}
      {isExpanded && (
        <div className="absolute top-0 left-0 z-50 bg-white border-2 border-blue-400 rounded-lg shadow-xl p-6 min-w-[600px] max-w-[800px]">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              📦 그룹 {groupIndex + 1} - {groupSize}개 이미지
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>

          {/* 이미지 슬라이더 */}
          <div className="relative mb-4">
            <div className="relative flex items-center justify-center bg-gray-100 min-h-[400px] max-h-[60vh] rounded">
              <img
                src={images[currentImageIndex]?.src?.includes('pstatic.net') 
                  ? `/api/image-proxy?url=${encodeURIComponent(images[currentImageIndex].src)}`
                  : images[currentImageIndex]?.src || '/placeholder-image.jpg'
                }
                alt={images[currentImageIndex].alt || `Image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.jpg';
                }}
              />
              
              {/* 네비게이션 버튼 */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            
            {/* 이미지 인디케이터 */}
            <div className="flex justify-center mt-2 space-x-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full ${
                    index === currentImageIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex space-x-3 mb-4">
            <button
              onClick={(e) => handleSetFeatured(images[currentImageIndex], e)}
              className="flex-1 px-4 py-3 bg-yellow-500 text-white text-base font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
            >
              ◆ 대표
            </button>
            <button
              onClick={(e) => handleCopyImage(images[currentImageIndex], e)}
              className="flex-1 px-4 py-3 bg-blue-500 text-white text-base font-semibold rounded-lg hover:bg-blue-600 transition-colors"
            >
              ■ 복사
            </button>
            <button
              onClick={() => handleImageClick(images[currentImageIndex])}
              className="flex-1 px-4 py-3 bg-green-500 text-white text-base font-semibold rounded-lg hover:bg-green-600 transition-colors"
            >
              삽입
            </button>
          </div>

          {/* 전체 이미지 썸네일 */}
          <div className="grid grid-cols-4 gap-3">
            {images.map((image, index) => (
              <div
                key={index}
                className={`relative cursor-pointer rounded overflow-hidden ${
                  index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <div className="h-20 flex items-center justify-center bg-gray-100">
                  <img
                    src={image?.src?.includes('pstatic.net') 
                      ? `/api/image-proxy?url=${encodeURIComponent(image.src)}`
                      : image?.src || '/placeholder-image.jpg'
                    }
                    alt={image.alt || `Thumbnail ${index + 1}`}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-1">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGroupThumbnail;
