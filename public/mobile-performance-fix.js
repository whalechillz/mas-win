/**
 * 모바일 성능 최적화 스크립트
 * 회색 화면 문제 해결 및 로딩 속도 개선
 */

(function() {
    'use strict';
    
    // 모바일 감지
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 터치 디바이스 감지
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // 성능 최적화 설정
    if (isMobile || isTouchDevice) {
        // 1. 스크롤 성능 최적화
        document.documentElement.style.webkitOverflowScrolling = 'touch';
        
        // 2. 터치 이벤트 최적화
        document.addEventListener('touchstart', function() {}, { passive: true });
        document.addEventListener('touchmove', function() {}, { passive: true });
        
        // 3. 이미지 지연 로딩
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
        });
        
        // 4. 폰트 로딩 최적화
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Montserrat:wght@300;400;500;600;700;800&display=swap';
        fontLink.as = 'style';
        document.head.appendChild(fontLink);
        
        // 5. CSS 최적화
        const style = document.createElement('style');
        style.textContent = `
            /* 모바일 성능 최적화 */
            * {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
            }
            
            body {
                -webkit-overflow-scrolling: touch;
                -webkit-text-size-adjust: 100%;
            }
            
            /* 하드웨어 가속 활성화 */
            .cta-button, .flip-card, .benefit-card {
                transform: translateZ(0);
                -webkit-transform: translateZ(0);
            }
            
            /* 스크롤 성능 개선 */
            .scroll-container {
                will-change: transform;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 로딩 상태 관리
    let loadingComplete = false;
    
    // DOM 로드 완료 감지
    function checkLoadingComplete() {
        if (document.readyState === 'complete' && !loadingComplete) {
            loadingComplete = true;
            
            // 로딩 완료 이벤트 전송
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'iframe-loaded',
                    timestamp: Date.now()
                }, '*');
            }
            
            // 성능 메트릭 수집
            if (window.performance && window.performance.timing) {
                const timing = window.performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                
                console.log('페이지 로드 시간:', loadTime + 'ms');
                
                // 느린 로딩 경고
                if (loadTime > 3000) {
                    console.warn('페이지 로딩이 느립니다:', loadTime + 'ms');
                }
            }
        }
    }
    
    // 로딩 상태 체크
    if (document.readyState === 'complete') {
        checkLoadingComplete();
    } else {
        window.addEventListener('load', checkLoadingComplete);
    }
    
    // 에러 핸들링
    window.addEventListener('error', function(e) {
        console.error('페이지 에러:', e.error);
        
        // 에러 발생 시 부모에게 알림
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'iframe-error',
                error: e.error?.message || 'Unknown error'
            }, '*');
        }
    });
    
    // 네트워크 상태 모니터링
    if ('connection' in navigator) {
        const connection = navigator.connection;
        
        function updateConnectionStatus() {
            const status = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
            };
            
            console.log('네트워크 상태:', status);
            
            // 느린 연결 감지
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                console.warn('느린 네트워크 연결 감지');
                
                // 이미지 품질 조정
                const images = document.querySelectorAll('img');
                images.forEach(img => {
                    if (img.src.includes('w_2000')) {
                        img.src = img.src.replace('w_2000', 'w_800');
                    }
                });
            }
        }
        
        connection.addEventListener('change', updateConnectionStatus);
        updateConnectionStatus();
    }
    
    console.log('모바일 성능 최적화 스크립트 로드 완료');
})();
