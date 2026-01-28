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
    // URL이 없거나 유효하지 않으면 빈 div 반환
    if (!url || url.trim() === '') {
      return (
        <div className={`${className} bg-gray-200 flex items-center justify-center text-gray-500 text-xs`}>
          비디오 없음
        </div>
      );
    }
    
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
        playsInline
        crossOrigin="anonymous"
        muted
        onClick={onVideoClick}
        onError={(e) => {
          const target = e.target as HTMLVideoElement;
          const error = target.error;
          console.error('❌ 비디오 로드 실패:', {
            url,
            errorCode: error?.code,
            errorMessage: error?.message,
            networkState: target.networkState,
            readyState: target.readyState
          });
          setVideoError(true);
          // 비디오 요소 숨기기
          target.style.display = 'none';
          // 부모 요소에 placeholder 추가
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.video-error-placeholder')) {
            const placeholder = document.createElement('div');
            placeholder.className = `${className} bg-gray-200 flex items-center justify-center text-gray-500 text-xs video-error-placeholder`;
            placeholder.textContent = '비디오 로드 실패';
            parent.appendChild(placeholder);
          }
        }}
        onLoadedMetadata={() => {
          // 비디오 메타데이터 로드 성공
          console.log('✅ 비디오 메타데이터 로드 성공:', url);
        }}
        onLoadedData={() => {
          // 비디오 첫 프레임 로드 완료 (썸네일 표시)
          console.log('✅ 비디오 첫 프레임 로드 완료 (썸네일):', url);
        }}
        onCanPlay={() => {
          // 비디오 재생 가능
          console.log('✅ 비디오 재생 가능:', url);
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

  // URL이 없거나 유효하지 않으면 빈 div 반환
  if (!url || url.trim() === '') {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center text-gray-500 text-xs`}>
        이미지 없음
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
        // placeholder 이미지가 있으면 사용 (하지만 404 오류를 피하기 위해 빈 div로 대체)
        const target = e.target as HTMLImageElement;
        if (target.src && !target.src.includes('data:image')) {
          // placeholder 이미지 대신 빈 div로 대체
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.image-error-placeholder')) {
            const placeholder = document.createElement('div');
            placeholder.className = `${className} bg-gray-200 flex items-center justify-center text-gray-500 text-xs image-error-placeholder`;
            placeholder.textContent = '이미지 로드 실패';
            parent.appendChild(placeholder);
          }
        }
      }}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
}
