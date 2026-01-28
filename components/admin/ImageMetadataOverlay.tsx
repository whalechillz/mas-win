/**
 * 이미지 메타데이터 오버레이 컴포넌트
 * 이미지 위에 메타데이터를 배경처럼 오버레이하여 표시
 */

import React from 'react';

interface ImageMetadataOverlayProps {
  metadata: {
    title?: string | null;
    alt_text?: string | null;
    ai_tags?: string[] | null;
    filename?: string | null;
    original_filename?: string | null;
    description?: string | null;
    visit_date?: string | null;
    story_scene?: number | null;
    image_type?: string | null;
  } | null;
  show?: boolean;
}

const ImageMetadataOverlay: React.FC<ImageMetadataOverlayProps> = ({ 
  metadata, 
  show = true 
}) => {
  if (!show || !metadata) return null;

  // 키워드 간소화 (주요 태그만 추출)
  const mainTags = metadata.ai_tags?.filter(tag => 
    !tag.startsWith('customer-') && 
    !tag.startsWith('visit-') && 
    !tag.startsWith('scene-') && 
    !tag.startsWith('type-')
  ).slice(0, 5) || [];

  // 방문일자 추출
  const visitDate = metadata.visit_date || 
    metadata.ai_tags?.find(tag => tag.startsWith('visit-'))?.replace('visit-', '') || 
    '';

  // ALT 텍스트 간소화 (100자 제한)
  const altText = metadata.alt_text 
    ? (metadata.alt_text.length > 100 
        ? metadata.alt_text.substring(0, 100) + '...' 
        : metadata.alt_text)
    : null;

  // 제목 간소화
  const title = metadata.title || null;

  // 파일명
  const filename = metadata.filename || metadata.original_filename || '';

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 하단 그라데이션 오버레이 배경 (투명도 27%로 감소) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/27 via-black/15 to-transparent h-56" />
      
      {/* 메타데이터 텍스트 컨테이너 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
        {/* 제목 */}
        {title && (
          <div className="bg-black/27 backdrop-blur-sm rounded-lg px-4 py-2.5 shadow-xl">
            <h3 
              className="text-xl font-bold text-white"
              style={{
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(0, 0, 0, 0.8)'
              }}
            >
              {title}
            </h3>
          </div>
        )}
        
        {/* ALT 텍스트 */}
        {altText && (
          <div className="bg-black/27 backdrop-blur-sm rounded-lg px-4 py-2 shadow-xl">
            <p 
              className="text-sm text-white/95 leading-relaxed line-clamp-2"
              style={{
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.9), 0 1px 2px rgba(0, 0, 0, 0.8)'
              }}
            >
              {altText}
            </p>
          </div>
        )}
        
        {/* 키워드 태그 */}
        {mainTags.length > 0 && (
          <div className="bg-black/27 backdrop-blur-sm rounded-lg px-4 py-2 shadow-xl">
            <p 
              className="text-xs text-white/90"
              style={{
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.9), 0 1px 2px rgba(0, 0, 0, 0.8)'
              }}
            >
              <span className="font-semibold">태그:</span>{' '}
              <span className="text-white/80">{mainTags.join(', ')}</span>
            </p>
          </div>
        )}
        
        {/* 파일명 및 방문일자 */}
        <div className="bg-black/27 backdrop-blur-sm rounded-lg px-4 py-2 shadow-xl flex items-center justify-between gap-4">
          <span 
            className="text-xs text-white/80 truncate flex-1"
            style={{
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.9), 0 1px 2px rgba(0, 0, 0, 0.8)'
            }}
            title={filename}
          >
            {filename}
          </span>
          {visitDate && (
            <span 
              className="text-xs text-white/80 whitespace-nowrap"
              style={{
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.9), 0 1px 2px rgba(0, 0, 0, 0.8)'
              }}
            >
              {visitDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageMetadataOverlay;
