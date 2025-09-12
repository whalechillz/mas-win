import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Funnel202509Final() {
  const [isLoading, setIsLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);

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
    
    // 3초 후 로딩 완료 처리
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    
    // 8초 후 대체 콘텐츠 표시
    const fallbackTimer = setTimeout(() => {
      setShowFallback(true);
    }, 8000);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
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
      
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 로딩 스피너 */}
        {isLoading && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              zIndex: 9999
            }}
          >
            <div 
              style={{
                width: '64px',
                height: '64px',
                border: '4px solid #f3f4f6',
                borderTop: '4px solid #ea580c',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
              }}
            ></div>
            <div style={{ 
              color: '#374151', 
              fontSize: '18px', 
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              MAS Golf 로딩 중...
            </div>
            <div style={{ 
              color: '#9ca3af', 
              fontSize: '14px'
            }}>
              잠시만 기다려주세요
            </div>
          </div>
        )}
        
        {/* iframe */}
        {!showFallback && (
          <iframe
            src="/versions/funnel-2025-09-live.html"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              margin: 0,
              padding: 0,
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.5s ease-in-out',
              position: 'absolute',
              top: 0,
              left: 0,
              backgroundColor: '#ffffff'
            }}
            title="MAS Golf 9월 퍼널"
            onLoad={() => {
              console.log('iframe onLoad 이벤트 발생');
              setTimeout(() => setIsLoading(false), 1000);
            }}
            onError={(e) => {
              console.error('iframe 로드 에러:', e);
              setTimeout(() => {
                setIsLoading(false);
                setShowFallback(true);
              }, 2000);
            }}
          />
        )}
        
        {/* 대체 콘텐츠 */}
        {showFallback && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              padding: '20px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white'
            }}
          >
            <div style={{ marginBottom: '30px' }}>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: 'bold',
                marginBottom: '10px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                🔥 MASGOLF 가을 특가!
              </h1>
              <p style={{ 
                fontSize: '18px',
                marginBottom: '20px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
              }}>
                비거리 25m↑ 골프드라이버 + 위스키 증정
              </p>
              <p style={{ 
                fontSize: '16px',
                marginBottom: '30px',
                opacity: 0.9
              }}>
                시크릿포스/웨폰 시리즈 최대 20% 할인<br/>
                Royal Salute 21 위스키 증정
              </p>
            </div>
            
            <a 
              href="tel:080-028-8888"
              style={{
                backgroundColor: '#ffffff',
                color: '#d97706',
                padding: '20px 40px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '20px',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s ease',
                display: 'inline-block'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              📞 지금 상담받기
            </a>
            
            <div style={{ 
              marginTop: '30px',
              fontSize: '14px',
              opacity: 0.8
            }}>
              <p>10년 보증 | 전문 피터 상담 무료</p>
              <p>9월 30일까지 한정!</p>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
