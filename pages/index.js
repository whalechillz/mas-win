import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // win.masgolf.co.kr에서 접속 시 /25-08로 리다이렉트
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'win.masgolf.co.kr') {
        router.replace('/25-08');
      }
    }
  }, [router]);

  // 로딩 중 표시
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-600 text-lg font-medium">MAS Golf 로딩 중...</div>
        <div className="text-gray-400 text-sm mt-2">잠시만 기다려주세요</div>
      </div>
    </div>
  );
}
