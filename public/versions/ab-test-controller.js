/**
 * MASGOLF 자동 A/B 테스트 컨트롤러
 * 버전: 2.0.0
 * 날짜: 2025-01-13
 * 
 * 기능:
 * 1. 자동으로 감지된 모든 퍼널 버전 지원
 * 2. 동적 트래픽 분할
 * 3. 실시간 성능 모니터링
 */

(function() {
  'use strict';
  
  // A/B 테스트 설정
  const AB_TEST_CONFIG = {
    testName: 'funnel-2025-08',
    cookieExpiry: 30, // 30일
    defaultVersion: 'live-a' // 기본 버전
  };
  
  // 자동으로 감지된 퍼널 버전들 (서버에서 동적 생성)
  let DETECTED_VERSIONS = ['live-a', 'live-b', 'staging']; // 기본값
  
  // 서버에서 감지된 버전 목록 가져오기
  async function fetchDetectedVersions() {
    try {
      const response = await fetch('/api/funnel-management');
      const data = await response.json();
      
      if (data.success && data.data.groupedFunnels) {
        const currentMonth = '2025-08'; // 현재 월
        const currentFunnels = data.data.groupedFunnels[currentMonth] || [];
        const versions = currentFunnels.map(funnel => funnel.version);
        
        if (versions.length > 0) {
          DETECTED_VERSIONS = versions;
          console.log('감지된 퍼널 버전들:', DETECTED_VERSIONS);
        }
      }
    } catch (error) {
      console.error('퍼널 버전 감지 실패:', error);
    }
  }
  
  // 버전 선택 함수 (동적 분할)
  function getTestVersion() {
    const cookieName = `ab_test_${AB_TEST_CONFIG.testName}`;
    let version = getCookie(cookieName);
    
    if (!version) {
      // 새로운 사용자: 동적 랜덤 할당
      const randomIndex = Math.floor(Math.random() * DETECTED_VERSIONS.length);
      version = DETECTED_VERSIONS[randomIndex];
      setCookie(cookieName, version, AB_TEST_CONFIG.cookieExpiry);
    }
    
    return version;
  }
  
  // 쿠키 관리 함수들
  function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }
  
  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
  
  // iframe src 변경 (동적 버전 지원)
  function updateIframeSource() {
    const iframe = document.querySelector('iframe[src*="funnel-2025-08"]');
    if (iframe) {
      const version = getTestVersion();
      const newSrc = `/versions/funnel-2025-08-${version}.html`;
      
      if (iframe.src !== newSrc) {
        iframe.src = newSrc;
        console.log(`A/B 테스트: 버전 ${version} 로드됨 (총 ${DETECTED_VERSIONS.length}개 버전)`);
        
        // GA4 이벤트 전송
        if (typeof gtag !== 'undefined') {
          gtag('event', 'ab_test_assignment', {
            test_name: AB_TEST_CONFIG.testName,
            version: version,
            total_versions: DETECTED_VERSIONS.length,
            page_id: 'funnel-2025-08'
          });
        }
      }
    }
  }
  
  // 초기화 함수
  async function initializeABTest() {
    // 1. 감지된 버전 목록 가져오기
    await fetchDetectedVersions();
    
    // 2. iframe src 업데이트
    updateIframeSource();
    
    // 3. 실시간 성능 모니터링 시작
    startPerformanceMonitoring();
  }
  
  // 성능 모니터링
  function startPerformanceMonitoring() {
    // 페이지 로드 시간 추적
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_load_time', {
          test_name: AB_TEST_CONFIG.testName,
          version: getTestVersion(),
          load_time: Math.round(loadTime),
          page_id: 'funnel-2025-08'
        });
      }
    });
    
    // 사용자 상호작용 추적
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'user_interaction', {
            test_name: AB_TEST_CONFIG.testName,
            version: getTestVersion(),
            interaction_type: 'click',
            element_text: target.textContent?.substring(0, 50) || 'unknown',
            page_id: 'funnel-2025-08'
          });
        }
      }
    });
  }
  
  // 페이지 로드 시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeABTest);
  } else {
    initializeABTest();
  }
})();
