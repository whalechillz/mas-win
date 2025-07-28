import { useEffect, useState } from 'react';

export default function Funnel202507() {
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeVideoId] = useState('YOUR_VIDEO_ID'); // 여기에 실제 비디오 ID 입력
  
  useEffect(() => {
    // API fix 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = '/api-fix.js';
    script.async = true;
    document.head.appendChild(script);
    
    // iframe에서 전화번호 클릭 메시지 처리
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'tel-link') {
        console.log('전화번호 메시지 수신:', event.data.phoneNumber);
        window.location.href = `tel:${event.data.phoneNumber}`;
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // ESC 키로 모달 닫기
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showYoutubeModal) {
        setShowYoutubeModal(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showYoutubeModal]);

  // 캐시 방지를 위한 타임스탬프 추가
  const timestamp = new Date().getTime();

  return (
    <>
      {/* 메인 iframe */}
      <iframe
        src={`/versions/funnel-2025-07-supabase.html?v=${timestamp}&ui=updated`}
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0
        }}
        title="MAS Golf 7월 퍼널"
      />
      
      {/* 유튜브 플로팅 버튼 */}
      <button
        onClick={() => setShowYoutubeModal(true)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: 'linear-gradient(45deg, #ff0000, #cc0000)',
          color: 'white',
          border: 'none',
          padding: '15px 30px',
          borderRadius: '50px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 5px 15px rgba(255,0,0,0.3)',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          animation: 'pulse 2s infinite',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 7px 20px rgba(255,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 5px 15px rgba(255,0,0,0.3)';
        }}
      >
        🎥 7월 피팅 영상 보기
      </button>
      
      {/* 유튜브 모달 */}
      {showYoutubeModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowYoutubeModal(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '800px',
              backgroundColor: '#000',
              borderRadius: '10px',
              padding: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowYoutubeModal(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '30px',
                cursor: 'pointer',
                zIndex: 10000,
              }}
            >
              ×
            </button>
            
            <h3 style={{
              color: '#fff',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '24px',
            }}>
              7월 피팅 특별 영상
            </h3>
            
            <div style={{
              position: 'relative',
              paddingBottom: '56.25%',
              height: 0,
            }}>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '5px',
                }}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  );
}