import { useEffect } from 'react';

export default function Home() {
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

  return (
    <iframe
      src="/versions/funnel-2025-07-complete.html"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0,
        display: 'block'
      }}
      title="MASGOLF - 뜨거운 여름, 품격 있는 완벽한 스윙을 위한 준비"
    />
  );
}