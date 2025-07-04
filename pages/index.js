import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // 기존 funnel-2025-07-complete 페이지로 리다이렉트
    router.replace('/funnel-2025-07');
  }, [router]);
  
  return <div>리다이렉트 중...</div>;
}