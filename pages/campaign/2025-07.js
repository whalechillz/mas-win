import { useEffect } from 'react';

export default function Campaign202507() {
  useEffect(() => {
    // API fix 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = '/api-fix.js';
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <iframe
      src="/versions/funnel-2025-07-complete.html"  // 원래대로 complete 버전 사용
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0
      }}
      title="MAS Golf 7월 캠페인"
    />
  );
}