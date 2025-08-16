import { useEffect, useRef, useState } from 'react';

interface AdvancedUserTrackerProps {
  campaignId: string;
  pageId: string;
  version?: string; // 버전 정보 추가
}

export function AdvancedUserTracker({ campaignId, pageId, version }: AdvancedUserTrackerProps) {
  const [sessionData, setSessionData] = useState({
    startTime: Date.now(),
    activeTime: 0,
    isActive: true,
    scrollDepth: 0,
    sectionsReached: new Set<string>(),
    userJourney: [] as any[]
  });
  
  const sessionRef = useRef(sessionData);
  const scrollTimerRef = useRef<NodeJS.Timeout>();
  const activeTimerRef = useRef<NodeJS.Timeout>();
  
  // GA4 이벤트 전송 시 버전 정보 포함
  const sendGA4Event = (eventName: string, parameters: any) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, {
        ...parameters,
        custom_parameter_version: version, // 버전 정보 추가
        custom_parameter_test_name: 'funnel-2025-08'
      });
    }
  };

  // 세션 시작
  useEffect(() => {
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('advanced_session_id', sessionId);
    
    // 초기 세션 데이터 설정
    setSessionData(prev => ({
      ...prev,
      sessionId,
      startTime: Date.now()
    }));
    
    // GA4 세션 시작 이벤트
    sendGA4Event('session_start', {
      session_id: sessionId,
      campaign_id: campaignId,
      page_id: pageId
    });
    
    return () => {
      // 세션 종료 시 데이터 전송
      const finalData = sessionRef.current;
      sendGA4Event('session_end', {
        session_id: sessionId,
        total_time: finalData.activeTime,
        scroll_depth: finalData.scrollDepth,
        sections_reached: Array.from(finalData.sectionsReached),
        user_journey: finalData.userJourney
      });
    };
  }, [campaignId, pageId, version]);
  
  // 활성 시간 추적
  useEffect(() => {
    const updateActiveTime = () => {
      if (sessionRef.current.isActive) {
        setSessionData(prev => ({
          ...prev,
          activeTime: prev.activeTime + 1
        }));
      }
    };
    
    activeTimerRef.current = setInterval(updateActiveTime, 1000);
    
    return () => {
      if (activeTimerRef.current) {
        clearInterval(activeTimerRef.current);
      }
    };
  }, []);
  
  // 탭 포커스/블러 추적
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isActive = !document.hidden;
      setSessionData(prev => ({
        ...prev,
        isActive
      }));
      
      sendGA4Event(isActive ? 'tab_focus' : 'tab_blur', {
        session_id: sessionRef.current.sessionId,
        timestamp: Date.now()
      });
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // 스크롤 깊이 및 정지 시간 추적
  useEffect(() => {
    let lastScrollY = 0;
    let scrollPauseStart = 0;
    let scrollDepthTracked = {25: false, 50: false, 75: false, 100: false};
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDepth = Math.round((currentScrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      
      // 스크롤 깊이 업데이트
      setSessionData(prev => ({
        ...prev,
        scrollDepth: Math.max(prev.scrollDepth, scrollDepth)
      }));
      
      // GA4 스크롤 깊이 이벤트 전송 (25%, 50%, 75%, 100%)
      [25, 50, 75, 100].forEach(depth => {
        if (scrollDepth >= depth && !scrollDepthTracked[depth]) {
          scrollDepthTracked[depth] = true;
          
          // GA4 이벤트 전송
          if (typeof (window as any).gtag !== 'undefined') {
            (window as any).gtag('event', 'scroll_depth', {
              event_category: 'engagement',
              event_label: 'advanced_tracking',
              scroll_percentage: depth,
              page_title: document.title,
              page_location: window.location.href,
              timestamp: new Date().toISOString(),
              session_id: sessionRef.current?.sessionId || 'unknown'
            });
          }
          
          console.log('AdvancedUserTracker 스크롤 깊이:', depth + '%');
        }
      });
      
      // 스크롤 정지 감지
      clearTimeout(scrollTimerRef.current!);
      scrollTimerRef.current = setTimeout(() => {
        const pauseDuration = Date.now() - scrollPauseStart;
        if (pauseDuration > 3000) { // 3초 이상 정지
          sendGA4Event('scroll_pause', {
            scroll_position: scrollDepth,
            pause_duration: pauseDuration,
            session_id: sessionRef.current.sessionId
          });
        }
      }, 3000);
      
      lastScrollY = currentScrollY;
      scrollPauseStart = Date.now();
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);
  
  // 섹션 도달 추적
  useEffect(() => {
    const sections = [
      { id: 'hero', selector: '[data-section="hero"]' },
      { id: 'quiz-start', selector: '[data-section="quiz-start"]' },
      { id: 'quiz-complete', selector: '[data-section="quiz-complete"]' },
      { id: 'booking-form', selector: '[data-section="booking-form"]' }
    ];
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section');
          if (sectionId && !sessionRef.current.sectionsReached.has(sectionId)) {
            setSessionData(prev => ({
              ...prev,
              sectionsReached: new Set([...prev.sectionsReached, sectionId])
            }));
            
            // 섹션 도달 이벤트
            sendGA4Event('section_reached', {
              section_id: sectionId,
              time_to_reach: Date.now() - sessionRef.current.startTime,
              session_id: sessionRef.current.sessionId
            });
          }
        }
      });
    }, { threshold: 0.5 });
    
    sections.forEach(section => {
      const element = document.querySelector(section.selector);
      if (element) {
        observer.observe(element);
      }
    });
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // 사용자 행동 추적
  useEffect(() => {
    const trackUserAction = (action: string, data: any) => {
      const actionData = {
        timestamp: Date.now(),
        action,
        data,
        scrollPosition: window.scrollY,
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
      
      setSessionData(prev => ({
        ...prev,
        userJourney: [...prev.userJourney, actionData]
      }));
    };
    
    // 클릭 추적
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      trackUserAction('click', {
        element: target.tagName,
        text: target.textContent?.substring(0, 50),
        href: (target as HTMLAnchorElement).href
      });
    };
    
    // 마우스 호버 추적
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      trackUserAction('hover', {
        element: target.tagName,
        text: target.textContent?.substring(0, 50)
      });
    };
    
    document.addEventListener('click', handleClick);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);
  
  // sessionRef 업데이트
  useEffect(() => {
    sessionRef.current = sessionData;
  }, [sessionData]);
  
  return null;
}
