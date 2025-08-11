// 개발 환경과 프로덕션 환경을 구분하는 헬퍼 함수
function getApiBaseUrl() {
    // 로컬 개발 환경인지 확인
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    // 프로덕션 환경
    return 'https://win.masgolf.co.kr';
}

// API 호출 시 사용
const apiBaseUrl = getApiBaseUrl();

// 예시:
// fetch(apiBaseUrl + '/api/contact', {...})
