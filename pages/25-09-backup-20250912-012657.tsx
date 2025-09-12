import { useEffect, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';

export default function Funnel202509Production() {
  const [isClient, setIsClient] = useState(false);
  const [assignedVersion] = useState<string>("A");
  const [isLoading, setIsLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackTimer, setFallbackTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 동적 카운터 상태 (제거됨 - 거짓 정보 방지)

  useEffect(() => {
    setIsClient(true);
    
    // 카카오톡 인앱 브라우저 감지
    const isKakaoInApp = /KAKAOTALK/i.test(navigator.userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('브라우저 정보:', {
      userAgent: navigator.userAgent,
      isKakaoInApp,
      isMobile
    });
    
    // 동적 카운터 업데이트 제거 (거짓 정보 방지)
    
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
    
    // 카카오톡 인앱 브라우저에서는 더 빠른 타이머 적용
    const loadingTimeout = isKakaoInApp ? 2000 : 5000;
    const fallbackTimeout = isKakaoInApp ? 5000 : 15000;
    
    // 백업 타이머
    const loadingTimer = setTimeout(() => {
      console.log(`백업 타이머: 로딩 완료 (${isKakaoInApp ? '카카오톡' : '일반'} 브라우저)`);
      setIsLoading(false);
    }, loadingTimeout);
    
    // 대체 콘텐츠 타이머
    const timer = setTimeout(() => {
      console.log(`대체 콘텐츠 표시 (iframe 로드 실패) - ${isKakaoInApp ? '카카오톡' : '일반'} 브라우저`);
      setShowFallback(true);
    }, fallbackTimeout);
    setFallbackTimer(timer);
    
    // 카카오톡 인앱 브라우저에서는 즉시 대체 콘텐츠 표시 옵션
    if (isKakaoInApp) {
      const immediateFallbackTimer = setTimeout(() => {
        console.log('카카오톡 인앱 브라우저: 즉시 대체 콘텐츠 표시');
        setShowFallback(true);
        setIsLoading(false);
      }, 3000);
      
      return () => {
        window.removeEventListener('message', handleMessage);
        clearTimeout(loadingTimer);
        clearTimeout(timer);
        clearTimeout(immediateFallbackTimer);
        // clearInterval(counterInterval); // 카운터 관련 타이머 제거
      };
    }
    
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(loadingTimer);
      clearTimeout(timer);
      // clearInterval(counterInterval); // 카운터 관련 타이머 제거
    };
  }, []);

  // GA4 이벤트 전송 (즉시 실행)
  useEffect(() => {
    if (isClient && assignedVersion) {
      const sendGA4Events = () => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          // A/B 테스트 할당 이벤트
          (window as any).gtag('event', 'ab_test_assignment', {
            test_name: 'funnel-2025-09',
            version: assignedVersion,
            page_id: 'funnel-2025-09',
            timestamp: Date.now()
          });
          
          console.log(`A/B 테스트 이벤트 전송: 버전 ${assignedVersion}`);
          
          // 전환 이벤트 추적 함수
          const trackConversion = (eventName: string, parameters: any = {}) => {
            (window as any).gtag('event', eventName, {
              ...parameters,
              custom_parameter_version: assignedVersion,
              custom_parameter_test_name: 'funnel-2025-09'
            });
            console.log(`전환 이벤트 전송: ${eventName} (버전 ${assignedVersion})`);
          };
          
          // 전화 클릭 이벤트 리스너
          const handlePhoneClick = (event: Event) => {
            const target = event.target as HTMLAnchorElement;
            if (target.tagName === 'A' && target.href && target.href.includes('tel:')) {
              trackConversion('phone_click', {
                phone_number: target.href.replace('tel:', ''),
                page_id: 'funnel-2025-09'
              });
            }
          };
          
          // 페이지 레벨 이벤트 리스너
          document.addEventListener('click', handlePhoneClick);
          
          // iframe 로드 완료 후 이벤트 리스너 추가
          const iframe = document.querySelector('iframe');
          if (iframe) {
            iframe.addEventListener('load', () => {
              try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc) {
                  iframeDoc.addEventListener('click', handlePhoneClick);
                }
              } catch (error) {
                console.log('iframe 이벤트 리스너 추가 실패 (CORS 정책)');
              }
            });
          }
          
          console.log(`A/B 테스트 이벤트 설정 완료: 버전 ${assignedVersion}`);
        } else {
          console.warn('GA4 gtag가 로드되지 않았습니다. 1초 후 재시도...');
          setTimeout(sendGA4Events, 1000);
        }
      };
      
      // 즉시 실행
      sendGA4Events();
    }
  }, [isClient, assignedVersion]);

  return (
    <>
      <Head>
        <title>🔥 MASGOLF 가을 특가! 비거리 25m↑ 골프드라이버 + 위스키 증정 | 9월 한정</title>
        <meta name="description" content="🎯 가을 골프 시즌 특별 혜택! 시크릿포스/웨폰 시리즈 최대 20% 할인 + Royal Salute 21 위스키 증정. 10년 보증, 전문 피터 상담 무료. 9월 30일까지 한정!" />
        <link rel="canonical" href="https://win.masgolf.co.kr/25-09" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      {/* Google Analytics 스크립트 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=G-${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}', {
            page_title: 'MASGOLF 9월 퍼널 (${assignedVersion} 버전)',
            page_location: window.location.href,
            custom_map: {
              'custom_parameter_version': 'version',
              'custom_parameter_test_name': 'test_name'
            }
          });
        `}
      </Script>

      <div style={{ 
        width: '100%', 
        height: '100vh', 
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 상단 신뢰도 바 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#f59e0b',
          color: 'white',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              backgroundColor: '#dc2626', 
              borderRadius: '50%', 
              width: '8px', 
              height: '8px',
              animation: 'pulse 2s infinite'
            }}></span>
            <span>가을 시즌 혜택 마감 임박!</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
            <a 
              href="https://www.mas9golf.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <span>🌐</span>
              <span>공식홈페이지</span>
            </a>
          </div>
        </div>

        {/* 로딩 스피너 */}
        {isLoading && (
          <div 
            style={{
              position: 'absolute',
              top: '40px', // 상단 바 높이만큼 아래로
              left: 0,
              width: '100%',
              height: 'calc(100% - 80px)', // 하단 네비게이션 바 높이도 고려
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
              height: 'calc(100% - 80px)', // 하단 네비게이션 바 높이만큼 빼기
              border: 'none',
              margin: 0,
              padding: 0,
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.5s ease-in-out',
              position: 'absolute',
              top: '40px', // 상단바 높이만큼 아래로
              left: 0,
              backgroundColor: '#ffffff'
            }}
            title="MAS Golf 9월 퍼널"
            onLoad={() => {
              console.log('iframe onLoad 이벤트 발생');
              setTimeout(() => {
                setIsLoading(false);
                // iframe이 정상 로드되면 대체 콘텐츠 타이머 취소
                if (fallbackTimer) {
                  clearTimeout(fallbackTimer);
                  setFallbackTimer(null);
                }
                setShowFallback(false); // iframe 로드 성공 시 대체 콘텐츠 숨김
              }, 1000);
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
              top: '40px', // 상단 바 높이만큼 아래로
              left: 0,
              width: '100%',
              height: 'calc(100% - 80px)', // 하단 네비게이션 바 높이도 고려
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
            {/* 신뢰도 요소들 */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              opacity: 0.9
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📞</span>
                <a href="tel:080-028-8888" style={{ color: 'white', textDecoration: 'none' }}>
                  080-028-8888
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🌐</span>
                <a 
                  href="https://www.mas9golf.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'white', textDecoration: 'none' }}
                >
                  마쓰구 골프 공식홈페이지
                </a>
              </div>
            </div>

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
             
             {/* 하단 네비게이션 바 */}
             <div style={{
               position: 'fixed',
               bottom: 0,
               left: 0,
               right: 0,
               backgroundColor: '#ffffff',
               borderTop: '1px solid #e5e7eb',
               padding: '12px 8px',
               display: 'flex',
               justifyContent: 'space-around',
               alignItems: 'center',
               zIndex: 10001,
               boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
             }}>
               <a 
                 href="tel:080-028-8888"
                 style={{
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   textDecoration: 'none',
                   color: '#374151',
                   padding: '8px 4px',
                   borderRadius: '8px',
                   transition: 'background-color 0.2s ease',
                   minWidth: '60px'
                 }}
                 onMouseOver={(e) => {
                   e.currentTarget.style.backgroundColor = '#f3f4f6';
                 }}
                 onMouseOut={(e) => {
                   e.currentTarget.style.backgroundColor = 'transparent';
                 }}
               >
                 <div style={{ fontSize: '20px', marginBottom: '4px' }}>📞</div>
                 <div style={{ fontSize: '11px', fontWeight: '500', textAlign: 'center' }}>전화 상담</div>
               </a>
               
               <a 
                 href="https://www.mas9golf.com/try-a-massgoo"
                 target="_blank"
                 rel="noopener noreferrer"
                 style={{
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   textDecoration: 'none',
                   color: '#374151',
                   padding: '8px 4px',
                   borderRadius: '8px',
                   transition: 'background-color 0.2s ease',
                   minWidth: '60px'
                 }}
                 onMouseOver={(e) => {
                   e.currentTarget.style.backgroundColor = '#f3f4f6';
                 }}
                 onMouseOut={(e) => {
                   e.currentTarget.style.backgroundColor = 'transparent';
                 }}
               >
                 <div style={{ fontSize: '20px', marginBottom: '4px' }}>📅</div>
                 <div style={{ fontSize: '11px', fontWeight: '500', textAlign: 'center' }}>시타 예약</div>
               </a>
               
               <a 
                 href="tel:080-028-8888"
                 style={{
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   textDecoration: 'none',
                   color: '#374151',
                   padding: '8px 4px',
                   borderRadius: '8px',
                   transition: 'background-color 0.2s ease',
                   minWidth: '60px'
                 }}
                 onMouseOver={(e) => {
                   e.currentTarget.style.backgroundColor = '#f3f4f6';
                 }}
                 onMouseOut={(e) => {
                   e.currentTarget.style.backgroundColor = 'transparent';
                 }}
               >
                 <div style={{ fontSize: '20px', marginBottom: '4px' }}>👤</div>
                 <div style={{ fontSize: '11px', fontWeight: '500', textAlign: 'center' }}>바로 주문</div>
               </a>
               
               <a 
                 href="https://pf.kakao.com/_vSVuV/chat"
                 target="_blank"
                 rel="noopener noreferrer"
                 style={{
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   textDecoration: 'none',
                   color: '#374151',
                   padding: '8px 4px',
                   borderRadius: '8px',
                   transition: 'background-color 0.2s ease',
                   minWidth: '60px'
                 }}
                 onMouseOver={(e) => {
                   e.currentTarget.style.backgroundColor = '#f3f4f6';
                 }}
                 onMouseOut={(e) => {
                   e.currentTarget.style.backgroundColor = 'transparent';
                 }}
               >
                 <div style={{ fontSize: '20px', marginBottom: '4px' }}>🛒</div>
                 <div style={{ fontSize: '11px', fontWeight: '500', textAlign: 'center' }}>카톡 상담</div>
               </a>
             </div>
             
             <style jsx>{`
               @keyframes spin {
                 0% { transform: rotate(0deg); }
                 100% { transform: rotate(360deg); }
               }
               @keyframes pulse {
                 0%, 100% { opacity: 1; }
                 50% { opacity: 0.5; }
               }
             `}</style>
           </>
         );
       }
