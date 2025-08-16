import { useEffect, useState } from 'react';
import { AdvancedUserTracker } from '../components/tracking/AdvancedUserTracker';
import { PerformanceTracker } from '../components/tracking/PerformanceTracker';
import Script from 'next/script';

export default function Funnel202508() {
  const [iframeSrc, setIframeSrc] = useState('/versions/funnel-2025-08-live-a.html');
  const [isClient, setIsClient] = useState(false);
  const [assignedVersion, setAssignedVersion] = useState<string>('A');

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

  // A/B 테스트 버전 결정 및 이벤트 전송
  useEffect(() => {
    if (isClient) {
      const getTestVersion = () => {
        const cookieName = 'ab_test_funnel-2025-08';
        let version = getCookie(cookieName);
        
        if (!version) {
          // 2개 버전만 지원 (A, B)
          const random = Math.random();
          if (random < 0.5) {
            version = 'A';
          } else {
            version = 'B';
          }
          setCookie(cookieName, version, 30);
        }
        
        return version;
      };

      const getCookie = (name: string) => {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) === ' ') c = c.substring(1, c.length);
          if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
      };

      const setCookie = (name: string, value: string, days: number) => {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
      };

      const version = getTestVersion();
      setAssignedVersion(version);
      
      // 버전에 따른 iframe src 설정
      const newSrc = `/versions/funnel-2025-08-live-${version.toLowerCase()}.html`;
      
      setIframeSrc(newSrc);
      console.log(`A/B 테스트: 버전 ${version} 로드됨`);
      
      // GA4 이벤트 전송 (즉시 실행)
      const sendGA4Events = () => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          // A/B 테스트 할당 이벤트
          (window as any).gtag('event', 'ab_test_assignment', {
            test_name: 'funnel-2025-08',
            version: version,
            page_id: 'funnel-2025-08',
            timestamp: Date.now()
          });
          
          console.log(`A/B 테스트 이벤트 전송: 버전 ${version}`);
          
          // 전환 이벤트 추적 함수
          const trackConversion = (eventName: string, parameters: any = {}) => {
            (window as any).gtag('event', eventName, {
              ...parameters,
              custom_parameter_version: version,
              custom_parameter_test_name: 'funnel-2025-08'
            });
            console.log(`전환 이벤트 전송: ${eventName} (버전 ${version})`);
          };
          
          // 전화 클릭 이벤트 리스너
          const handlePhoneClick = (event: Event) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'A' && target.href && target.href.includes('tel:')) {
              trackConversion('phone_click', {
                phone_number: target.href.replace('tel:', ''),
                page_id: 'funnel-2025-08'
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
          
          console.log(`A/B 테스트 이벤트 설정 완료: 버전 ${version}`);
        } else {
          console.warn('GA4 gtag가 로드되지 않았습니다. 1초 후 재시도...');
          setTimeout(sendGA4Events, 1000);
        }
      };
      
      // 즉시 실행
      sendGA4Events();
    }
  }, [isClient]);

  return (
    <>
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
          gtag('config', 'G-${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}');
        `}
      </Script>
      
      {/* 고급 사용자 추적 (버전 정보 포함) */}
      <AdvancedUserTracker 
        campaignId="2025-08-vacation" 
        pageId={`funnel-2025-08-${assignedVersion.toLowerCase()}`}
        version={assignedVersion}
      />
      
      {/* 성능 추적 (버전 정보 포함) */}
      <PerformanceTracker 
        campaignId="2025-08-vacation"
        version={assignedVersion}
      />
      
      {/* iframe - 클라이언트 사이드에서만 렌더링 */}
      {isClient && (
        <iframe
          src={iframeSrc}
          style={{
            width: '100%',
            height: '100vh',
            border: 'none',
            margin: 0,
            padding: 0
          }}
          title="MAS Golf 8월 휴가철 퍼널"
        />
      )}
    </>
  );
}
