import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // 7월 퍼널 페이지로 리다이렉트
    window.location.href = '/25-08';
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#000'
    }}>
      <p style={{ color: '#fff' }}>로딩 중...</p>
    </div>
  );
}