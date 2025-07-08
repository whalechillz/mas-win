// Parent 페이지 (iframe을 포함하는 페이지)에 추가할 코드
// 예: app/campaign/[id]/page.tsx 또는 components/IframeContainer.tsx

import { useEffect } from 'react';

export default function IframeContainer() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 메시지 타입 확인
      if (event.data && event.data.type === 'tel-link') {
        console.log('전화번호 링크 메시지 수신:', event.data.phoneNumber);
        
        // 전화 앱 열기
        window.location.href = `tel:${event.data.phoneNumber}`;
      }
    };
    
    // 메시지 이벤트 리스너 추가
    window.addEventListener('message', handleMessage);
    
    // 클린업
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  return (
    <iframe 
      src="/versions/funnel-2025-07-complete.html"
      style={{ width: '100%', height: '100vh', border: 'none' }}
      // sandbox 속성에 allow-top-navigation 추가 (중요!)
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
    />
  );
}

// 또는 기존 컴포넌트에 useEffect만 추가:
/*
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'tel-link') {
      window.location.href = `tel:${event.data.phoneNumber}`;
    }
  };
  
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
*/