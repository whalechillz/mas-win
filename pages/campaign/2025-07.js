import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Campaign202507() {
  const router = useRouter();
  
  useEffect(() => {
    // 정적 HTML 파일로 리다이렉트
    window.location.href = '/versions/funnel-2025-07-complete.html';
  }, []);
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        <p className="mt-4 text-white">페이지 로딩중...</p>
      </div>
    </div>
  );
}