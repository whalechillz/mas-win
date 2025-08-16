import { useEffect } from 'react';

interface PerformanceTrackerProps {
  campaignId?: string;
}

export function PerformanceTracker({ campaignId }: PerformanceTrackerProps) {
  useEffect(() => {
    // 페이지 로딩 성능 추적
    const trackPerformance = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        const performanceData = {
          // 기본 로딩 지표
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          
          // Core Web Vitals
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          largestContentfulPaint: 0, // LCP는 별도 추적 필요
          
          // 리소스 로딩
          totalResources: navigation.transferSize || 0,
          resourceCount: performance.getEntriesByType('resource').length,
          
          // 디바이스 정보
          deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
          connectionType: (navigator as any).connection?.effectiveType || 'unknown'
        };
        
        // GA4 성능 이벤트
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'performance_metrics', {
            ...performanceData,
            campaign_id: campaignId
          });
        }
        
        // LCP 추적
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'largest_contentful_paint', {
              value: Math.round(lastEntry.startTime),
              campaign_id: campaignId
            });
          }
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      }
    };
    
    // 페이지 로드 완료 후 성능 측정
    if (document.readyState === 'complete') {
      trackPerformance();
    } else {
      window.addEventListener('load', trackPerformance);
    }
    
    return () => {
      window.removeEventListener('load', trackPerformance);
    };
  }, [campaignId]);
  
  return null;
}
