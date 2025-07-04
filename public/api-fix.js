// API URL 자동 수정 스크립트
(function() {
    // 현재 도메인 기반으로 API URL 설정
    const API_BASE = window.location.origin;
    
    // 원래 fetch 함수 저장
    const originalFetch = window.fetch;
    
    // fetch 함수 오버라이드
    window.fetch = function(url, options) {
        // 잘못된 Vercel URL을 현재 도메인으로 변경
        if (typeof url === 'string' && url.includes('vercel.app') && url.includes('/api/')) {
            const apiPath = url.substring(url.indexOf('/api/'));
            url = API_BASE + apiPath;
            console.log('API URL 수정됨:', url);
        }
        
        return originalFetch.call(this, url, options);
    };
})();