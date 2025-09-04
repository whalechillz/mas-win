import { useEffect, useState } from 'react';
import Head from 'next/head';
import { AdvancedUserTracker } from '../components/tracking/AdvancedUserTracker';
import { PerformanceTracker } from '../components/tracking/PerformanceTracker';
import Script from 'next/script';

export default function Funnel202509() {
  const [isClient, setIsClient] = useState(false);
  const [assignedVersion] = useState<string>("A"); // 단일 버전

  useEffect(() => {
    setIsClient(true);
    
    // iframe에서 전화번호 클릭 메시지 처리
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'tel-link') {
        console.log('전화번호 메시지 수신:', event.data.phoneNumber);
        window.location.href = `tel:${event.data.phoneNumber}`;
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
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
            const target = event.target as HTMLElement;
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

      {/* 고급 사용자 추적 */}
      <AdvancedUserTracker 
        pageId="funnel-2025-09"
        version={assignedVersion}
        testName="funnel-2025-09"
      />

      {/* 성능 추적 */}
      <PerformanceTracker 
        pageId="funnel-2025-09"
        version={assignedVersion}
        testName="funnel-2025-09"
      />

      {/* 9월 퍼널 iframe */}
      <iframe
        src="/versions/funnel-2025-09-live.html"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0
        }}
        title="MAS Golf 9월 퍼널"
      />
    </>
  );
}
