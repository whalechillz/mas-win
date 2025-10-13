// UTM 파라미터 처리 및 저장을 위한 유틸리티 함수

export function saveUTMParams() {
  if (typeof window === 'undefined') return;
  
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams = {
    utm_source: urlParams.get('utm_source') || '',
    utm_medium: urlParams.get('utm_medium') || '',
    utm_campaign: urlParams.get('utm_campaign') || '',
    utm_term: urlParams.get('utm_term') || '',
    utm_content: urlParams.get('utm_content') || ''
  };
  
  // sessionStorage에 저장
  sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
  
  // 개별 저장 (호환성)
  Object.entries(utmParams).forEach(([key, value]) => {
    if (value) sessionStorage.setItem(key, value);
  });
  
  return utmParams;
}

export function getUTMParams() {
  if (typeof window === 'undefined') return {};
  
  try {
    return JSON.parse(sessionStorage.getItem('utm_params') || '{}');
  } catch {
    return {};
  }
}

export function getSessionId() {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  
  return sessionId;
}

// 페이지 로드 시 자동 실행
if (typeof window !== 'undefined') {
  saveUTMParams();
  getSessionId();
}
