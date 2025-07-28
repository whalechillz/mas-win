import { useEffect, useState } from 'react';
import { YouTubePopup } from '../components/common/YouTubePopup';

export default function Funnel202507() {
  const [showYouTube, setShowYouTube] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false);

  useEffect(() => {
    // API fix 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = '/api-fix.js';
    script.async = true;
    document.head.appendChild(script);
    
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
      window.removeEventListener('message', handleMessage);
      if (timer) clearTimeout(timer);
    };
  }, [hasSeenPopup]);

  // 캐시 방지를 위한 타임스탬프 추가
  const timestamp = new Date().getTime();

  return (
    <>
      <iframe
        src={`/versions/funnel-2025-07-complete.html?v=${timestamp}&ui=updated`}
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0
        }}
        title="MAS Golf 7월 퍼널"
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
