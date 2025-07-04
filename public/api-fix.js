// API Base URL 설정
window.API_BASE_URL = window.location.origin;

// 기존 fetch 함수 오버라이드
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    // 상대 경로로 변환
    if (url.includes('vercel.app') && url.includes('/api/')) {
        const apiPath = url.substring(url.indexOf('/api/'));
        url = window.location.origin + apiPath;
    }
    
    return originalFetch(url, options);
};