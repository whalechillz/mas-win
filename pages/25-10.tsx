import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Funnel202510() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // iframe 메시지 처리 (단순)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'tel-link') {
        window.location.href = `tel:${event.data.phoneNumber}`;
      }
      if (event.data?.type === 'iframe-loaded') {
        setIsLoading(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <>
      <Head>
        <title>🍂 MASGOLF 가을 마무리 특가! 겨울 준비 드라이버 + 위스키 증정</title>
        <meta name="description" content="10월 한정 특별 혜택! 시크릿포스/웨폰 시리즈 최대 25% 할인 + Royal Salute 위스키 + 겨울 장갑 세트 증정. 10월 31일까지!" />
        <meta name="keywords" content="골프드라이버,비거리향상,시니어골퍼,맞춤피팅,마쓰구프,MUZIIK,가을특가" />
        
        {/* Open Graph */}
        <meta property="og:title" content="🍂 MASGOLF 가을 마무리 특가! 겨울 준비 드라이버 + 위스키 증정" />
        <meta property="og:description" content="10월 한정 특별 혜택! 시크릿포스/웨폰 시리즈 최대 25% 할인 + Royal Salute 위스키 + 겨울 장갑 세트 증정. 10월 31일까지!" />
        <meta property="og:image" content="https://win.masgolf.co.kr/images/25-10-funnel-og.jpg" />
        <meta property="og:url" content="https://win.masgolf.co.kr/25-10" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="🍂 MASGOLF 가을 마무리 특가! 겨울 준비 드라이버 + 위스키 증정" />
        <meta name="twitter:description" content="10월 한정 특별 혜택! 시크릿포스/웨폰 시리즈 최대 25% 할인 + Royal Salute 위스키 + 겨울 장갑 세트 증정. 10월 31일까지!" />
        <meta name="twitter:image" content="https://win.masgolf.co.kr/images/25-10-funnel-og.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://win.masgolf.co.kr/25-10" />
      </Head>
      
      {/* 로딩 스피너 (25-07 스타일) */}
      {isLoading && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <div className="text-gray-600 text-lg font-medium">MASGOLF 로딩 중...</div>
            <div className="text-gray-400 text-sm mt-2">잠시만 기다려주세요</div>
          </div>
        </div>
      )}
      
      {/* 단순 iframe (25-05, 25-06 스타일) */}
      <iframe
        src="/versions/funnel-2025-10-live.html"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0,
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
        title="MASGOLF 10월 퍼널"
        onLoad={() => setTimeout(() => setIsLoading(false), 1000)}
      />
    </>
  );
}
