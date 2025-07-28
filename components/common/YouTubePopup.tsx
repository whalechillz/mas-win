import { useEffect, useState } from 'react';

interface YouTubePopupProps {
  videoId: string;
  onClose: () => void;
  showCloseAfter?: number; // 몇 초 후에 닫기 버튼 표시
}

export const YouTubePopup = ({ videoId, onClose, showCloseAfter = 0 }: YouTubePopupProps) => {
  const [showCloseButton, setShowCloseButton] = useState(showCloseAfter === 0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ESC 키로 닫기
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCloseButton) onClose();
    };
    window.addEventListener('keydown', handleEsc);

    // 닫기 버튼 지연 표시
    let timer: NodeJS.Timeout;
    if (showCloseAfter > 0) {
      timer = setTimeout(() => {
        setShowCloseButton(true);
      }, showCloseAfter * 1000);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      if (timer) clearTimeout(timer);
    };
  }, [onClose, showCloseButton, showCloseAfter]);

  // 모바일 감지
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  // 모바일에서 안전한 높이 계산 (URL 바와 하단 네비게이션 고려)
  const safeHeight = isMobile ? 'calc(100vw * 9 / 16)' : '80vh'; // 모바일에서 16:9 비율 유지

  return (
    <div 
      className="youtube-popup-overlay"
      onClick={showCloseButton ? onClose : undefined}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        cursor: showCloseButton ? 'pointer' : 'default',
          padding: isMobile ? '20px 0' : '0', // 모바일에서 상하 패딩 추가
        }}
    >
      <div 
        className="youtube-popup-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: isMobile ? '90%' : '90%',
          maxWidth: isMobile ? '100%' : '900px',
          height: isMobile ? safeHeight : 'auto',
          aspectRatio: isMobile ? '' : '16/9', // 모바일에서는 비율 고정 안함
          backgroundColor: '#000',
          borderRadius: isMobile ? '4px' : '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          margin: isMobile ? '20px 0' : '0', // 모바일에서 상하 여백
        }}
      >
        {/* 로딩 표시 */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            fontSize: '18px',
          }}>
            동영상 로딩중...
          </div>
        )}

        {/* 닫기 버튼 */}
        {showCloseButton && (
          <button
            onClick={onClose}
            aria-label="팝업 닫기"
            style={{
              position: 'absolute',
              top: isMobile ? '15px' : '-45px',
              right: isMobile ? '15px' : '0',
              background: isMobile ? 'rgba(0, 0, 0, 0.6)' : 'none',
              border: 'none',
              color: '#fff',
              fontSize: isMobile ? '24px' : '32px',
              cursor: 'pointer',
              padding: isMobile ? '5px 10px' : '0',
              borderRadius: '50%',
              width: isMobile ? '40px' : 'auto',
              height: isMobile ? '40px' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.3s ease',
              zIndex: 10, // 더 높은 z-index로 변경
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            ✕
          </button>
        )}

        {/* 스킵 메시지 */}
        {!showCloseButton && showCloseAfter > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            zIndex: 1,
          }}>
            {showCloseAfter}초 후 닫기 가능
          </div>
        )}

        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="MAS Golf 프로모션 동영상"
        />
      </div>
    </div>
  );
};
