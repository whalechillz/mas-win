import { useEffect } from 'react';
import { useRouter } from 'next/router';

interface PageViewTrackerProps {
  campaignId?: string;
  supabase: any;
}

export function PageViewTracker({ campaignId, supabase }: PageViewTrackerProps) {
  const router = useRouter();
  
  useEffect(() => {
    if (!supabase) return;
    
    const trackPageView = async () => {
      try {
        // UTM 파라미터 추출
        const utm_source = router.query.utm_source as string || '';
        const utm_medium = router.query.utm_medium as string || '';
        const utm_campaign = router.query.utm_campaign as string || '';
        const utm_term = router.query.utm_term as string || '';
        const utm_content = router.query.utm_content as string || '';
        
        // 세션 ID 생성 또는 가져오기
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
          sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          sessionStorage.setItem('session_id', sessionId);
        }
        
        // 디바이스 타입 감지
        const getDeviceType = () => {
          const width = window.innerWidth;
          if (width < 768) return 'mobile';
          if (width < 1024) return 'tablet';
          return 'desktop';
        };
        
        // 브라우저 정보
        const getBrowserInfo = () => {
          const ua = navigator.userAgent;
          if (ua.includes('Chrome')) return 'Chrome';
          if (ua.includes('Safari')) return 'Safari';
          if (ua.includes('Firefox')) return 'Firefox';
          if (ua.includes('Edge')) return 'Edge';
          return 'Other';
        };
        
        // OS 정보
        const getOSInfo = () => {
          const ua = navigator.userAgent;
          if (ua.includes('Windows')) return 'Windows';
          if (ua.includes('Mac')) return 'macOS';
          if (ua.includes('Linux')) return 'Linux';
          if (ua.includes('Android')) return 'Android';
          if (ua.includes('iOS')) return 'iOS';
          return 'Other';
        };
        
        // 페이지뷰 데이터
        const pageViewData = {
          page_url: window.location.pathname,
          campaign_id: campaignId || utm_campaign || 'direct',
          session_id: sessionId,
          user_agent: navigator.userAgent,
          referrer: document.referrer || 'direct',
          utm_source,
          utm_medium,
          utm_campaign,
          utm_term,
          utm_content,
          device_type: getDeviceType(),
          browser: getBrowserInfo(),
          os: getOSInfo()
        };
        
        // Supabase에 저장
        const { error } = await supabase
          .from('page_views')
          .insert(pageViewData);
          
        if (error) {
          console.error('페이지뷰 추적 오류:', error);
        } else {
          console.log('페이지뷰 추적 성공');
        }
        
        // Google Analytics 이벤트 (있다면)
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'page_view', {
            page_path: window.location.pathname,
            page_title: document.title,
            campaign_id: campaignId
          });
        }
        
      } catch (error) {
        console.error('페이지뷰 추적 중 오류:', error);
      }
    };
    
    // 페이지 로드 시 추적
    trackPageView();
    
    // 페이지 머문 시간 추적 (선택사항)
    const startTime = Date.now();
    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      // 페이지 이탈 시 머문 시간 기록 (필요시 구현)
    };
  }, [router.query, campaignId, supabase]);
  
  return null; // 화면에 렌더링하지 않음
}
