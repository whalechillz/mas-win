import { useEffect, useState } from 'react';
import { YouTubePopup } from '../components/common/YouTubePopup';

export default function Funnel202507() {
  const [showYouTube, setShowYouTube] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // API fix 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = '/api-fix.js';
    script.async = true;
    document.head.appendChild(script);
    
    // 예약 폼 수정 스크립트 추가
    const bookingFixScript = document.createElement('script');
    bookingFixScript.src = '/booking-fix.js';
    bookingFixScript.async = true;
    document.head.appendChild(bookingFixScript);
    
    // iframe에서 오는 메시지 처리
    const handleMessage = (event: MessageEvent) => {
      // 전화번호 클릭
      if (event.data?.type === 'tel-link') {
        console.log('전화번호 메시지 수신:', event.data.phoneNumber);
        window.location.href = `tel:${event.data.phoneNumber}`;
      }
      
      // YouTube 팝업 열기 (HTML에서 트리거)
      if (event.data?.type === 'open-youtube') {
        setShowYouTube(true);
      }
      
      // iframe 로드 완료 메시지
      if (event.data?.type === 'iframe-loaded') {
        setIsLoading(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // 로컬스토리지에서 팝업 표시 여부 확인
    const lastPopupTime = localStorage.getItem('youtubePopupLastShown');
    const now = new Date().getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    // 24시간이 지났거나 처음 방문인 경우
    const shouldShowPopup = !lastPopupTime || (now - parseInt(lastPopupTime)) > oneDayInMs;
    
    // 페이지 로드 후 자동 팝업 (3초 후)
    let timer: NodeJS.Timeout;
    if (shouldShowPopup && !hasSeenPopup) {
      timer = setTimeout(() => {
        setShowYouTube(true);
        setHasSeenPopup(true);
        localStorage.setItem('youtubePopupLastShown', now.toString());
      }, 3000);
    }
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      if (document.head.contains(bookingFixScript)) {
        document.head.removeChild(bookingFixScript);
      }
      window.removeEventListener('message', handleMessage);
      if (timer) clearTimeout(timer);
    };
  }, [hasSeenPopup]);

  return (
    <>
      {/* 로딩 스피너 */}
      {isLoading && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600 text-lg font-medium">MAS Golf 로딩 중...</div>
            <div className="text-gray-400 text-sm mt-2">잠시만 기다려주세요</div>
          </div>
        </div>
      )}
      
      <iframe
        src="/versions/funnel-2025-07-live.html"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0,
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
        title="MAS Golf 7월 퍼널"
        onLoad={() => {
          // iframe 로드 완료 후 1초 뒤에 로딩 스피너 숨김
          setTimeout(() => setIsLoading(false), 1000);
        }}
      />
      
      {showYouTube && (
        <YouTubePopup 
          videoId="WXyJdmPp9eE"
          onClose={() => setShowYouTube(false)}
          showCloseAfter={5} // 5초 후 닫기 버튼 표시
        />
      )}
    </>
  );
}
