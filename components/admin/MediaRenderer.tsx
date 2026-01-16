'use client';

import { useState } from 'react';

interface MediaRendererProps {
  url: string;
  alt: string;
  className?: string;
  showControls?: boolean;
  onVideoClick?: () => void;
  onClick?: () => void;
}

/**
 * 파일 타입 감지 (이미지/비디오/GIF)
 */
function getFileType(url: string): 'image' | 'video' | 'gif' {
  if (!url) return 'image';
  const ext = url.toLowerCase().split('.').pop()?.split('?')[0] || '';
  if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'video';
  if (ext === 'gif') return 'gif';
  return 'image';
}

/**
 * 미디어 렌더러 컴포넌트
 * 이미지, GIF, 비디오를 자동으로 감지하여 적절한 태그로 렌더링
 */
export default function MediaRenderer({ 
  url, 
  alt, 
  className = '', 
  showControls = false,
  onVideoClick,
  onClick
}: MediaRendererProps) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const fileType = getFileType(url);

  // 비디오 파일
  if (fileType === 'video') {
    if (videoError) {
      return (
        <div className={`${className} bg-gray-200 flex items-center justify-center text-gray-500 text-xs`}>
          비디오 로드 실패
        </div>
      );
    }

    return (
      <video
        src={url}
        className={className}
        controls={showControls}
        preload="metadata"
        onClick={onVideoClick}
        onError={() => {
          console.error('❌ 비디오 로드 실패:', url);
          setVideoError(true);
        }}
        style={{ cursor: onVideoClick ? 'pointer' : 'default' }}
      >
        비디오를 재생할 수 없습니다.
      </video>
    );
  }

  // 이미지 파일 (GIF 포함)
  if (imageError) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center text-gray-500 text-xs`}>
        이미지 로드 실패
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={(e) => {
        console.error('❌ 이미지 로드 실패:', url);
        setImageError(true);
        // placeholder 이미지가 있으면 사용
        if ((e.target as HTMLImageElement).src !== '/placeholder-image.png') {
          (e.target as HTMLImageElement).src = '/placeholder-image.png';
        }
      }}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
}
