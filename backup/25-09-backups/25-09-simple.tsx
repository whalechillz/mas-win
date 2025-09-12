import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Funnel202509Simple() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // iframe에서 전화번호 클릭 메시지 처리
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'tel-link') {
        console.log('전화번호 메시지 수신:', event.data.phoneNumber);
        window.location.href = `tel:${event.data.phoneNumber}`;
      }
      
      // iframe 로드 완료 메시지
      if (event.data?.type === 'iframe-loaded') {
        setIsLoading(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <>
      <Head>
        <title>🔥 MASGOLF 가을 특가! 비거리 25m↑ 골프드라이버 + 위스키 증정 | 9월 한정</title>
        <meta name="description" content="🎯 가을 골프 시즌 특별 혜택! 시크릿포스/웨폰 시리즈 최대 20% 할인 + Royal Salute 21 위스키 증정. 10년 보증, 전문 피터 상담 무료. 9월 30일까지 한정!" />
        <link rel="canonical" href="https://win.masgolf.co.kr/25-09" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      {/* 로딩 스피너 */}
      {isLoading && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <div className="text-gray-600 text-lg font-medium">MAS Golf 로딩 중...</div>
            <div className="text-gray-400 text-sm mt-2">잠시만 기다려주세요</div>
          </div>
        </div>
      )}
      
      {/* 9월 퍼널 iframe */}
      <iframe
        src="/versions/funnel-2025-09-live.html"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0,
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
        title="MAS Golf 9월 퍼널"
        onLoad={() => {
          // iframe 로드 완료 후 1초 뒤에 로딩 스피너 숨김
          setTimeout(() => setIsLoading(false), 1000);
        }}
      />
    </>
  );
}
