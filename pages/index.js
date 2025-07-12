import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // 7월 퍼널 페이지로 직접 리다이렉트
    router.push('/funnel-2025-07');
  }, [router]);

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