import { useEffect } from 'react';

export default function Funnel202507() {
  useEffect(() => {
    // API fix 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = '/api-fix.js';
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // 캐시 방지를 위한 타임스탬프 추가
  const timestamp = new Date().getTime();

  return (
    <iframe
      src={`/versions/funnel-2025-07-complete.html?v=${timestamp}`}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0
      }}
      title="MAS Golf 7월 퍼널"
    />
  );
}
